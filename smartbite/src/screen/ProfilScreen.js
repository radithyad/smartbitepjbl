import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, 
  ActivityIndicator, Image, Platform, Modal, Alert, ActionSheetIOS 
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { api } from '../service/api';
import { customAlert } from '../utils/alerthelper';
import { Ionicons } from '@expo/vector-icons';

// KOMPONEN INPUT GAYA BARU (Super Clean)
const ProfileInput = ({ 
  iconName, placeholder, value, onChangeText, secureTextEntry, 
  keyboardType, autoCapitalize, showEyeToggle 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [passwordShown, setPasswordShown] = useState(!secureTextEntry);

  const iconColor = isFocused ? '#1565C0' : '#888';
  const borderBottomColor = isFocused ? '#1565C0' : '#E8ECF0';

  return (
    <View style={styles.inputRow}>
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>
      <View style={[styles.textInputWrapper, { borderBottomColor }]}>
        <TextInput
          style={styles.textInputStyle}
          placeholder={placeholder}
          placeholderTextColor="#aaa"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={showEyeToggle ? !passwordShown : secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          
          // Anti-Autofill biar OS ga jahil
          autoComplete="off"
          textContentType="none"
          autoCorrect={false}
          importantForAutofill="no"
        />
        {showEyeToggle && (
           <TouchableOpacity onPress={() => setPasswordShown(!passwordShown)} style={styles.eyeIconBtn}>
             <Ionicons name={passwordShown ? "eye-outline" : "eye-off-outline"} size={20} color="#aaa" />
           </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default function ProfilScreen({ navigation, onLogout }) {
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [noHp, setNoHp] = useState('');
  const [fotoUrl, setFotoUrl] = useState(null);
  const [newPhotoBase64, setNewPhotoBase64] = useState(null);
  const [isPhotoDeleted, setIsPhotoDeleted] = useState(false);

  // Password State
  const [passwordLama, setPasswordLama] = useState('');
  const [passwordBaru, setPasswordBaru] = useState('');

  // UI State
  const [saving, setSaving] = useState(false);
  const [isModified, setIsModified] = useState(false);
  
  // Modal State
  const [fullImageModalVisible, setFullImageModalVisible] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);

  const initialData = useRef({ nama: '', email: '', noHp: '', fotoUrl: null });

  useEffect(() => {
    fetchProfileLocal();
    const unsubscribe = navigation.addListener('focus', fetchProfileLocal);
    return unsubscribe;
  }, [navigation]);

  const fetchProfileLocal = async () => {
    try {
      let userData = Platform.OS === 'web' ? localStorage.getItem('userData') : await SecureStore.getItemAsync('userData');
      if (userData) {
        const profile = JSON.parse(userData);
        const hp = profile?.no_hp ? profile.no_hp.replace('+62', '') : (profile?.no_hp || '');
        
        setNama(profile.nama || '');
        setEmail(profile.email || '');
        setNoHp(hp);
        setFotoUrl(profile.foto_url || null);
        
        initialData.current = {
          nama: profile.nama || '',
          email: profile.email || '',
          noHp: hp,
          fotoUrl: profile.foto_url || null,
        };
      }
    } catch (error) {}
    setLoading(false);
  };

  useEffect(() => {
    const isDataChanged = (
      nama !== initialData.current.nama ||
      email !== initialData.current.email ||
      noHp !== initialData.current.noHp ||
      fotoUrl !== initialData.current.fotoUrl ||
      passwordBaru.length > 0 // Cuma nyala kalau beneran ngetik password baru
    );
    setIsModified(isDataChanged);
  }, [nama, email, noHp, fotoUrl, passwordBaru]);

  // 🔥 FIX 1: Logika Buka ActionSheet yang aman di iOS (Tutup Modal Dulu)
  const handleUbahFotoClick = () => {
    // 1. Tutup modal hitamnya dulu
    setFullImageModalVisible(false);

    // 2. Tunggu 0.6 detik biar modal beneran hilang, baru panggil menunya
    setTimeout(() => {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            title: 'Ubah Foto Profil',
            options: fotoUrl ? ['Buka Kamera', 'Dari Galeri', 'Hapus Foto', 'Batal'] : ['Buka Kamera', 'Dari Galeri', 'Batal'],
            cancelButtonIndex: fotoUrl ? 3 : 2,
            destructiveButtonIndex: fotoUrl ? 2 : undefined,
          },
          (buttonIndex) => {
            if (buttonIndex === 0) launchImage(true);
            else if (buttonIndex === 1) launchImage(false);
            else if (buttonIndex === 2 && fotoUrl) handleHapusFoto();
          }
        );
      } else {
        const options = [
          { text: 'Buka Kamera', onPress: () => launchImage(true) },
          { text: 'Dari Galeri', onPress: () => launchImage(false) }
        ];
        if (fotoUrl) {
          options.push({ text: 'Hapus Foto', onPress: handleHapusFoto });
        }
        Alert.alert("Ubah Foto Profil", "Pilih sumber foto", options, { cancelable: true });
      }
    }, 600); 
  };

  const launchImage = async (useCamera) => {
    const permissionResult = useCamera 
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) { 
      Alert.alert('Izin Diperlukan', 'Akses dibutuhkan untuk mengambil foto.'); 
      return; 
    }
    
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true });
    
    if (!result.canceled) {
      setFotoUrl(result.assets[0].uri);
      setNewPhotoBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
      setIsPhotoDeleted(false);
    }
  };

  const handleHapusFoto = () => {
    setFotoUrl(null);
    setNewPhotoBase64(null);
    setIsPhotoDeleted(true);
  };

  // 🔥 FIX 2: Logika Simpan Pintar (Gak maksa ngecek password kalau gak diganti)
  const handleSimpan = async () => {
    if (!nama.trim() || !email.trim()) { customAlert('Oops!', 'Nama dan email wajib diisi.'); return; }

    // CUMA validasi password KALAU ADA TEKS di kolom Password Baru
    if (passwordBaru.trim().length > 0) {
      if (!passwordLama) { customAlert('Oops!', 'Masukkan password lama untuk verifikasi perubahan password.'); return; }
      if (passwordBaru.length < 6) { customAlert('Oops!', 'Password baru minimal 6 karakter.'); return; }
    }

    setSaving(true);
    try {
      let payload = {
        nama: nama.trim(),
        email: email.trim(),
        no_hp: noHp.trim()
      };

      // CUMA kirim data password ke API kalau user beneran ngetik password baru
      if (passwordBaru.trim().length > 0) {
        payload.password_lama = passwordLama;
        payload.password_baru = passwordBaru;
      }

      if (newPhotoBase64) payload.foto_base64 = newPhotoBase64;
      if (isPhotoDeleted) payload.foto_base64 = ""; 

      const response = await api.put('/auth/update-profile', payload);

      if (Platform.OS === 'web') localStorage.setItem('userData', JSON.stringify(response.data.user));
      else await SecureStore.setItemAsync('userData', JSON.stringify(response.data.user));

      initialData.current = {
        nama: nama.trim(), email: email.trim(),
        noHp: noHp.trim(), fotoUrl: response.data.user.foto_url,
      };
      setIsModified(false); 
      setNewPhotoBase64(null);
      setPasswordLama('');
      setPasswordBaru('');

      customAlert('Berhasil! 🎉', 'Profil kamu berhasil diperbarui!');
    } catch (err) {
      customAlert('Gagal', err.response?.data?.message || 'Terjadi kesalahan di server backend.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutAction = () => {
    Alert.alert('Keluar Akun', 'Yakin ingin keluar dari aplikasi?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: () => onLogout && onLogout() }
    ]);
  };

  const handleDeleteAccountAction = () => {
    Alert.alert('Hapus Akun', 'Perhatian! Akun kamu akan dihapus permanen dan tidak dapat dikembalikan.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus Permanen', style: 'destructive', onPress: async () => {
        try {
          await api.delete('/auth/me');
          onLogout();
        } catch (e) { customAlert('Error', 'Gagal hapus akun'); }
      }}
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1565C0" /></View>;

  const phoneIconColor = phoneFocused ? '#1565C0' : '#888';
  const phoneBorderColor = phoneFocused ? '#1565C0' : '#E8ECF0';

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil Sosial</Text>
        <TouchableOpacity 
          onPress={handleSimpan} 
          disabled={!isModified || saving} 
          activeOpacity={0.7} 
          style={[styles.headerSaveBtn, !isModified && styles.headerSaveBtnDisabled]}
        >
          {saving ? (
            <ActivityIndicator size="small" color={isModified ? "#1565C0" : "#A0A0A0"} />
          ) : (
            <Text style={[styles.headerSaveText, !isModified && styles.headerSaveTextDisabled]}>Simpan</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* FOTO PROFIL */}
        <View style={styles.centeredProfileSection}>
          <TouchableOpacity onPress={() => setFullImageModalVisible(true)} activeOpacity={0.9}>
            {fotoUrl ? (
              <Image source={{ uri: fotoUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={50} color="#A0A0A0" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* SECTION 1: INFORMASI DASAR */}
        <Text style={styles.formSectionHeading}>Informasi Dasar</Text>
        <View style={styles.formSectionFields}>
          <ProfileInput iconName="person-outline" placeholder="Nama Lengkap" value={nama} onChangeText={setNama} />
          <ProfileInput iconName="mail-outline" placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          
          <View style={styles.inputRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="call-outline" size={22} color={phoneIconColor} />
            </View>
            <View style={styles.phoneRowWrapper}>
               <View style={styles.phoneInputInner}>
                 <TextInput 
                    style={[styles.phoneInputStyle, { borderBottomColor: phoneBorderColor }]} 
                    keyboardType="phone-pad" 
                    value={noHp} 
                    onChangeText={(t) => setNoHp(t.replace(/[^0-9]/g, ''))} 
                    placeholder="08123..." 
                    placeholderTextColor="#aaa" 
                    onFocus={() => setPhoneFocused(true)}
                    onBlur={() => setPhoneFocused(false)}
                 />
               </View>
            </View>
          </View>
        </View>

        {/* SECTION 2: GANTI PASSWORD */}
        <Text style={[styles.formSectionHeading, { marginTop: 16 }]}>Ganti Password</Text>
        <View style={styles.formSectionFields}>
          <ProfileInput iconName="lock-closed-outline" placeholder="Password Lama" value={passwordLama} onChangeText={setPasswordLama} secureTextEntry={true} showEyeToggle={true} />
          <ProfileInput iconName="key-outline" placeholder="Password Baru" value={passwordBaru} onChangeText={setPasswordBaru} secureTextEntry={true} showEyeToggle={true} />
        </View>

        {/* SECTION 3: ZONA BAHAYA */}
        <Text style={[styles.formSectionHeading, { marginTop: 16, color: '#C62828' }]}>Zona Bahaya</Text>
        <View style={styles.dangerZoneContainer}>
          <TouchableOpacity style={styles.dangerItem} onPress={handleDeleteAccountAction} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={20} color="#D32F2F" style={{ marginRight: 16 }} />
            <Text style={styles.dangerText}>Hapus Akun Permanen</Text>
          </TouchableOpacity>
          <View style={styles.dangerDivider} />
          <TouchableOpacity style={styles.dangerItem} onPress={handleLogoutAction} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color="#D32F2F" style={{ marginRight: 16 }} />
            <Text style={styles.dangerText}>Keluar Akun</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} /> 
      </ScrollView>

      {/* MODAL FOTO DETAIL */}
      <Modal visible={fullImageModalVisible} transparent={true} animationType="fade" onRequestClose={() => setFullImageModalVisible(false)}>
        <View style={styles.modalBackground}>
          <TouchableOpacity style={styles.modalCloseArea} onPress={() => setFullImageModalVisible(false)} activeOpacity={1} />
          
          <View style={styles.modalContent}>
            {fotoUrl ? (
              <Image source={{ uri: fotoUrl }} style={styles.fullImageAvatar} resizeMode="cover" />
            ) : (
              <View style={styles.fullImageAvatarPlaceholder}>
                 <Ionicons name="person" size={120} color="#A0A0A0" />
              </View>
            )}
            
            {/* Tombol Ubah Foto yang MANGGIL ACTIONSHEET */}
            <TouchableOpacity onPress={handleUbahFotoClick} activeOpacity={0.7} style={{ padding: 10 }}>
              <Text style={styles.modalUbahFotoText}>Ubah Foto Profil</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.modalCloseArea} onPress={() => setFullImageModalVisible(false)} activeOpacity={1} />
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' }, 
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingTop: 60, paddingBottom: 16, paddingHorizontal: 24, 
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' 
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  headerSaveBtn: { paddingVertical: 6, paddingHorizontal: 18, backgroundColor: '#F0F4FF', borderRadius: 20 },
  headerSaveBtnDisabled: { backgroundColor: '#F5F5F5' },
  headerSaveText: { fontSize: 14, fontWeight: '700', color: '#1565C0' },
  headerSaveTextDisabled: { color: '#A0A0A0' },
  
  scrollContent: { paddingTop: 20 }, 
  
  centeredProfileSection: { alignItems: 'center', marginBottom: 32, marginTop: 10 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: '#E8ECF0' }, 
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E8ECF0' },
  
  formSectionHeading: { fontSize: 13, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginLeft: 24, marginBottom: 12 },
  formSectionFields: { paddingHorizontal: 24, marginBottom: 8 }, 
  
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  iconContainer: { width: 44, justifyContent: 'center', alignItems: 'flex-start', marginTop: 4 }, 
  
  textInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingVertical: 14 },
  textInputStyle: { flex: 1, fontSize: 16, color: '#1a1a1a', padding: 0, margin: 0 },
  eyeIconBtn: { padding: 4, marginLeft: 8 }, 

  phoneRowWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  phoneInputInner: { flex: 1 },
  phoneInputStyle: { flex: 1, fontSize: 16, color: '#1a1a1a', padding: 0, margin: 0, borderBottomWidth: 1, paddingBottom: 14 },

  dangerZoneContainer: { marginHorizontal: 24, backgroundColor: '#FFEBEE', borderRadius: 16, paddingHorizontal: 16 },
  dangerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  dangerText: { fontSize: 15, fontWeight: '600', color: '#D32F2F' },
  dangerDivider: { height: 1, backgroundColor: '#FFCDD2', marginLeft: 36 },

  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', flexDirection: 'column', justifyContent: 'center' },
  modalCloseArea: { flex: 1 },
  modalContent: { alignItems: 'center', paddingVertical: 20 },
  fullImageAvatar: { width: 220, height: 220, borderRadius: 110, borderWidth: 1, borderColor: '#E8ECF0' }, 
  fullImageAvatarPlaceholder: { width: 220, height: 220, borderRadius: 110, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#555' },
  modalUbahFotoText: { marginTop: 24, fontSize: 15, fontWeight: '700', color: '#fff', textDecorationLine: 'underline' }
});