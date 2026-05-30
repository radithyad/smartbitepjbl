import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  FlatList, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Alert, Keyboard, Pressable, ScrollView, Modal,
  ActionSheetIOS 
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../service/api';

export default function RoomChatScreen({ route, navigation }) {
  const { tokoId, tokoNama } = route.params;
  
  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  
  const [selectedImages, setSelectedImages] = useState([]); 
  const [fullImageUrl, setFullImageUrl] = useState('');
  const [fullImageModalVisible, setFullImageModalVisible] = useState(false);
  
  const [replyingTo, setReplyingTo] = useState(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef();

  useEffect(() => {
    let intervalId;
    const initChat = async () => {
      try {
        const checkRes = await api.get(`/chat/check/${tokoId}`);
        if (checkRes.data.room_id) {
          setRoomId(checkRes.data.room_id);
          fetchMessages(checkRes.data.room_id);
          intervalId = setInterval(() => fetchMessages(checkRes.data.room_id, false), 3000);
        } else {
          setLoading(false); 
        }
      } catch (err) { setLoading(false); }
    };

    initChat();
    return () => clearInterval(intervalId);
  }, [tokoId]);

  const fetchMessages = async (rId, showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.get(`/chat/messages/${rId}`);
      setMessages(res.data);
    } catch (err) {}
    if (showLoading) setLoading(false);
  };

  const handleSend = async () => {
    if (!inputText.trim() && selectedImages.length === 0) return;
    
    setSending(true);
    try {
      const res = await api.post('/chat/send', { 
        toko_id: tokoId, 
        text: inputText.trim(), 
        images_base64: selectedImages,
        reply_text: replyingTo ? (replyingTo.text || 'Gambar') : null 
      });
      
      setInputText('');
      setSelectedImages([]); 
      setReplyingTo(null); 
      
      if (!roomId) {
        setRoomId(res.data.room_id);
        fetchMessages(res.data.room_id);
      } else {
        setMessages(prev => [...prev, res.data.message]);
      }
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      Alert.alert("Gagal mengirim", "Periksa koneksi internetmu.");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await api.delete(`/chat/message/${msgId}`);
      setMessages(prev => prev.filter(m => m._id !== msgId)); 
    } catch (err) {
      Alert.alert('Gagal', 'Tidak bisa menghapus pesan ini.');
    }
  };

  const handleAttachImage = async () => {
    if (selectedImages.length >= 4) {
      Alert.alert('Batas Maksimal', 'Cuma bisa kirim maksimal 4 foto sekaligus ya!');
      return;
    }
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Upload Foto', // 🔥 INI DIA TAMBAHAN TITLENYA UNTUK IOS
          options: ['Buka Kamera', 'Dari Galeri', 'Batal'],
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) launchImage(true);
          else if (buttonIndex === 1) launchImage(false);
        }
      );
    } else {
      // 🔥 Dan ini title untuk Android
      Alert.alert("Upload Foto", "Pilih sumber foto", [
        { text: 'Buka Kamera', onPress: () => launchImage(true) },
        { text: 'Dari Galeri', onPress: () => launchImage(false) }
      ], { cancelable: true });
    }
  };

  const launchImage = async (useCamera) => {
    const permissionResult = useCamera 
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Izin Ditolak", "Akses dibutuhkan untuk mengambil foto.");
      return;
    }

    const options = useCamera
      ? { quality: 0.3, base64: true }
      : { quality: 0.3, base64: true, allowsMultipleSelection: true, selectionLimit: 4 - selectedImages.length };

    const result = useCamera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled) {
      if (useCamera) {
        setSelectedImages(prev => [...prev, `data:image/jpeg;base64,${result.assets[0].base64}`]);
      } else {
        const newImages = result.assets.map(asset => `data:image/jpeg;base64,${asset.base64}`);
        setSelectedImages(prev => [...prev, ...newImages].slice(0, 4)); 
      }
    }
  };

  const openFullImage = (url) => { setFullImageUrl(url); setFullImageModalVisible(true); };
  const closeFullImage = () => { setFullImageModalVisible(false); setFullImageUrl(''); };

  const renderMessage = ({ item, index }) => {
    const isMine = String(item.sender_id) !== String(tokoId); 
    
    const currentMsgTime = new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    let showTimeAndMargin = true;

    if (index < messages.length - 1) {
      const nextMsg = messages[index + 1];
      const nextMsgTime = new Date(nextMsg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const isNextMine = String(nextMsg.sender_id) !== String(tokoId);

      if (isMine === isNextMine && currentMsgTime === nextMsgTime) {
        showTimeAndMargin = false;
      }
    }

    const handleLongPress = () => {
      if (Platform.OS === 'ios') {
        const options = ['Balas Pesan'];
        if (isMine) options.push('Hapus Pesan');
        options.push('Batal');

        ActionSheetIOS.showActionSheetWithOptions(
          {
            options,
            cancelButtonIndex: options.length - 1,
            destructiveButtonIndex: isMine ? 1 : undefined,
          },
          (buttonIndex) => {
            if (buttonIndex === 0) setReplyingTo(item);
            else if (buttonIndex === 1 && isMine) handleDeleteMessage(item._id);
          }
        );
      } else {
        const options = [
          { text: 'Balas Pesan', onPress: () => setReplyingTo(item) }
        ];
        if (isMine) {
          options.push({ text: 'Hapus Pesan', onPress: () => handleDeleteMessage(item._id) });
        }
        Alert.alert('', '', options, { cancelable: true });
      }
    };

    return (
      <View style={[
        styles.msgBubbleOuter, 
        isMine ? styles.msgRight : styles.msgLeft,
        { marginBottom: showTimeAndMargin ? 14 : 2 } 
      ]}>
        
        <Pressable 
          onLongPress={handleLongPress} 
          delayLongPress={1000} 
          style={[styles.msgContentContainer, { alignItems: isMine ? 'flex-end' : 'flex-start' }]}
        >

          {item.reply_text && (
            <View style={[styles.repliedMsgBox, isMine ? styles.repliedMsgBoxRight : styles.repliedMsgBoxLeft]}>
              <Text style={styles.repliedMsgText} numberOfLines={1}>{item.reply_text}</Text>
            </View>
          )}

          {item.images && item.images.length > 0 && (
            <View style={[styles.msgImageContainer, { justifyContent: isMine ? 'flex-end' : 'flex-start' }]}>
              {item.images.map((img, idx) => (
                <TouchableOpacity key={idx} onPress={() => openFullImage(img)} activeOpacity={0.9}>
                  <Image source={{ uri: img }} style={styles.msgImage} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {item.text ? (
            <View style={[
              styles.msgTextBubble, 
              isMine ? styles.msgBubbleRight : styles.msgBubbleLeft,
              !showTimeAndMargin && isMine ? { borderBottomRightRadius: 16 } : {},
              !showTimeAndMargin && !isMine ? { borderBottomLeftRadius: 16 } : {}
            ]}>
              <Text style={[styles.msgText, isMine ? styles.msgTextRight : styles.msgTextLeft]}>
                {item.text}
              </Text>
            </View>
          ) : null}

          {showTimeAndMargin && (
            <Text style={styles.msgTime}>
              {currentMsgTime}
            </Text>
          )}
        </Pressable>

      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.roomIconBox}>
          <Ionicons name="storefront" size={20} color="#1565C0" />
        </View>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>{tokoNama}</Text>
          <Text style={styles.onlineText}>● Toko Aktif</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#1565C0" /></View>
      ) : messages.length === 0 ? (
        <Pressable style={styles.center} onPress={Keyboard.dismiss}>
          <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
          <Text style={styles.emptyText}>Mulai percakapan dengan {tokoNama}</Text>
          <Text style={styles.emptySubText}>Percakapan ini akan aman selama 7 hari.</Text>
        </Pressable>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatList}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss} 
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      {/* Area Bawah */}
      <View style={styles.inputContainerOuter}>
        
        {replyingTo && (
          <View style={styles.replyingBoxOuter}>
            <View style={styles.replyingBoxInner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.replyingTitle}>Membalas pesan</Text>
                <Text style={styles.replyingText} numberOfLines={1}>{replyingTo.text || 'Gambar'}</Text>
              </View>
              <TouchableOpacity onPress={() => setReplyingTo(null)} style={{ padding: 4 }}>
                <Ionicons name="close" size={20} color="#888" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {selectedImages.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewContainer}>
            {selectedImages.map((img, idx) => (
              <View key={idx} style={styles.previewBox}>
                <TouchableOpacity onPress={() => openFullImage(img)} activeOpacity={0.9}>
                  <Image source={{ uri: img }} style={styles.previewImage} resizeMode="cover" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.previewRemoveBtn} onPress={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}>
                  <Ionicons name="close-circle" size={24} color="#EF5350" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.inputContainerInner}>
          <TouchableOpacity style={styles.attachBtn} onPress={handleAttachImage}>
            <View style={styles.attachCircle}>
              <Ionicons name="add" size={24} color="#1565C0" />
            </View>
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            placeholder="Ketik pesan..."
            placeholderTextColor="#888"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={sending}>
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={16} color="#fff" style={{ marginLeft: 2 }} />}
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={fullImageModalVisible} transparent={true} animationType="fade" onRequestClose={closeFullImage}>
        <Pressable style={styles.modalBackground} onPress={closeFullImage}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={closeFullImage}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Image source={{ uri: fullImageUrl }} style={styles.fullImage} resizeMode="contain" />
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 55, paddingBottom: 16, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  backIcon: { fontSize: 26, color: '#1a1a1a', lineHeight: 30, marginTop: -2 },
  roomIconBox: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  headerTitleBox: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 2 },
  onlineText: { fontSize: 11, color: '#4CAF50', fontWeight: '600' },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#555', marginTop: 16 },
  emptySubText: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  
  chatList: { padding: 16, paddingBottom: 30 },
  msgBubbleOuter: { flexDirection: 'row' }, 
  msgRight: { justifyContent: 'flex-end' },
  msgLeft: { justifyContent: 'flex-start' },
  msgContentContainer: { maxWidth: '80%' },

  msgImageContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  msgImage: { width: 140, height: 140, borderRadius: 14 },
  
  repliedMsgBox: { padding: 8, paddingHorizontal: 12, borderRadius: 10, marginBottom: -10, zIndex: -1, opacity: 0.8 },
  repliedMsgBoxRight: { backgroundColor: '#104d94', alignSelf: 'flex-end', marginRight: 4 },
  repliedMsgBoxLeft: { backgroundColor: '#E8ECF0', alignSelf: 'flex-start', marginLeft: 4 },
  repliedMsgText: { fontSize: 12, fontStyle: 'italic', color: '#fff' },

  msgTextBubble: { padding: 12, borderRadius: 16, maxWidth: '100%', marginTop: 2 },
  msgBubbleRight: { backgroundColor: '#1565C0', borderBottomRightRadius: 4 },
  msgBubbleLeft: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E8ECF0' },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgTextRight: { color: '#fff' },
  msgTextLeft: { color: '#1a1a1a' },
  msgTime: { fontSize: 10, marginTop: 4, color: '#aaa', alignSelf: 'flex-end' },
  
  inputContainerOuter: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E8ECF0', paddingBottom: Platform.OS === 'ios' ? 24 : 12 },
  
  replyingBoxOuter: { paddingHorizontal: 16, paddingTop: 10 },
  replyingBoxInner: { flexDirection: 'row', backgroundColor: '#F5F7FA', padding: 10, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: '#1565C0', alignItems: 'center' },
  replyingTitle: { fontSize: 12, fontWeight: 'bold', color: '#1565C0', marginBottom: 2 },
  replyingText: { fontSize: 12, color: '#555' },

  previewContainer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  previewBox: { marginRight: 12, position: 'relative', marginTop: 8 },
  previewImage: { width: 75, height: 75, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
  previewRemoveBtn: { position: 'absolute', top: -10, right: -10, backgroundColor: '#fff', borderRadius: 15 },
  inputContainerInner: { flexDirection: 'row', alignItems: 'flex-end', padding: 12 },
  attachBtn: { paddingBottom: 4, marginRight: 6 },
  attachCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
  textInput: { flex: 1, backgroundColor: '#F5F7FA', borderRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, maxHeight: 100, fontSize: 14, marginHorizontal: 6 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1565C0', justifyContent: 'center', alignItems: 'center', marginBottom: 2, marginLeft: 6 },
  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '100%', height: '100%', position: 'relative', justifyContent: 'center', alignItems: 'center' },
  modalCloseBtn: { position: 'absolute', top: 60, right: 20, zIndex: 10, padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  fullImage: { width: '100%', height: '80%' },
});