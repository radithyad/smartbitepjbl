import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../service/api';

// 🔥 FUNGSI FORMAT WAKTU PINTAR
const formatWaktuChat = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Kemarin';
  } else {
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }
};

export default function ChatScreen({ navigation }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInbox = async () => {
      try {
        const res = await api.get('/chat/inbox');
        setRooms(res.data);
      } catch (err) {}
      setLoading(false);
    };
    
    const unsubscribe = navigation.addListener('focus', () => {
      fetchInbox();
    });

    fetchInbox();
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.headerInbox}>
        <Text style={styles.headerTitleInbox}>Chat</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#1565C0" /></View>
      ) : rooms.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={70} color="#D0D5DD" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>Belum ada chat</Text>
          <Text style={styles.emptySubText}>Riwayat obrolanmu dengan toko{'\n'}akan muncul disini.</Text>
        </View>
      ) : (
        <FlatList
          data={rooms}
          contentContainerStyle={{ padding: 20 }}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.roomCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('RoomChat', { tokoId: item.toko_id._id, tokoNama: item.toko_id.nama })}
            >
              <View style={styles.roomInboxIconBox}>
                {item.toko_id.foto_url ? (
                   <Image source={{ uri: item.toko_id.foto_url }} style={styles.roomImage} resizeMode="cover" />
                ) : ( 
                   <Ionicons name="storefront" size={24} color="#1565C0" />
                )}
              </View>
              <View style={styles.roomInfo}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.roomName}>{item.toko_id.nama}</Text>
                  
                  {/* 🔥 TERAPKAN FUNGSI WAKTU DI SINI */}
                  <Text style={styles.roomTime}>
                    {formatWaktuChat(item.updatedAt)}
                  </Text>
                </View>
                <Text style={styles.roomLastMsg} numberOfLines={1}>{item.last_message || 'Pesan gambar'}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  headerInbox: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitleInbox: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  headerSubInbox: { fontSize: 13, color: '#888', marginTop: 2 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8, textAlign: 'center' },
  emptySubText: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  roomCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12, elevation: 1 },
  roomInboxIconBox: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center', marginRight: 14, overflow: 'hidden' },
  roomImage: { width: '100%', height: '100%' },
  roomInfo: { flex: 1 },
  roomName: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  roomLastMsg: { fontSize: 13, color: '#888' },
  roomTime: { fontSize: 11, color: '#aaa', fontWeight: '500' }
});