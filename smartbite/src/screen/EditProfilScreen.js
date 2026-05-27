import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, Platform, Animated, Easing, Modal } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { api } from '../service/api';
import { customAlert } from '../utils/alerthelper';
import { LinearGradient } from 'expo-linear-gradient';

const COUNTRY_CODES = [{ name: 'Indonesia', code: '+62', flag: '🇮🇩' }];

const FloatingLabelInput = ({ label, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, rightComponent }) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedIsFocused = useRef(new Animated.Value(value === '' ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: (isFocused || value !== '') ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, 
    }).start();
  }, [isFocused, value]);

  const labelTop = animatedIsFocused.interpolate({ inputRange: [0, 1], outputRange: [22, 0] });
  const labelFontSize = animatedIsFocused.interpolate({ inputRange: [0, 1], outputRange: [15, 12] });
  const labelColor = isFocused ? '#1565C0' : (value !== '' ? '#1a1a1a' : '#888888');
  const borderBottomColor = isFocused ? '#1565C0' : '#E0E0E0';

  return (
    <View style={[styles.floatingInputContainer, { borderBottomColor }]}>
      <Animated.Text style={[styles.floatingLabel, { top: labelTop, fontSize: labelFontSize, color: labelColor }]}>
        {label}
      </Animated.Text>
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={styles.textInputStyle}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
        {rightComponent}
      </View>
    </View>
  );
};

export default function EditProfilScreen({ route, navigation }) {
  const { profile } = route.params || {};

  // State Data
  const [nama, setNama] = useState(profile?.nama || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [noHp, setNoHp] = useState(profile?.no_hp ? profile.no_hp.replace('+62', '') : '');
  const [fotoUrl, setFotoUrl] = useState(profile?.foto_url || null);
  
  // State untuk nyimpen foto baru biar gak langsung nembak API
  const [newPhotoBase64, setNewPhotoBase64] = useState(null);
  const [isPhotoDeleted, setIsPhotoDeleted] = useState(false);

  // State Password
  const [passwordLama, setPasswordLama] = useState('');
  const [passwordBaru, setPasswordBaru] = useState('');
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('');
  const [secureText, setSecureText] = useState({ old: true, new: true, confirm: true });

  // State Kontrol
  const [saving, setSaving] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false); 

  const initialData = useRef({
    nama: profile?.nama || '',
    username: profile?.username || '',
    email: profile?.email || '',
    noHp: profile?.no_hp ? profile.no_hp.replace('+62', '') : '',
    fotoUrl: profile?.foto_url || null,
  });

  // Cek Perubahan buat nyalain Tombol Simpan Pintar
  useEffect(() => {
    const isDataChanged = (
      nama !== initialData.current.nama ||
      username !== initialData.current.username ||
      email !== initialData.current.email ||
      noHp !== initialData.current.noHp ||
      fotoUrl !== initialData.current.fotoUrl ||
      passwordBaru !== ''
    );
    setIsModified(isDataChanged);
  }, [nama, username, email, noHp, fotoUrl, passwordBaru]);

  // Fungsi Pilih Foto (Kamera / Galeri)
  const ambilFoto = async (source) => {
    setShowPhotoOptions(false); 
    
    let result;
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) { customAlert('Izin Diperlukan', 'Izinkan akses kamera terlebih dahulu.'); return; }
      result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { customAlert('Izin Diperlukan', 'Izinkan akses galeri terlebih dahulu.'); return; }
      result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    }
    
    if (result.canceled) return;
    
    try {
      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const base64data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
      });

      setFotoUrl(uri);
      setNewPhotoBase64(base64data);
      setIsPhotoDeleted(false);
    } catch (err) {
      customAlert('Error', 'Terjadi kesalahan saat memproses foto.');
    }
  };

  // Fungsi Hapus Foto (Balik ke inisial nama)
  const handleHapusFoto = () => {
    setShowPhotoOptions(false);
    setFotoUrl(null);
    setNewPhotoBase64(null);
    setIsPhotoDeleted(true);
  };

  const handleSimpan = async () => {
    if (!nama.trim() || !username.trim() || !email.trim()) { customAlert('Oops!', 'Semua data dasar wajib diisi.'); return; }
    if (username.includes(' ')) { customAlert('Oops!', 'Username tidak boleh mengandung spasi.'); return; }
    
    if (passwordBaru || passwordLama || konfirmasiPassword) {
      if (!passwordLama) { customAlert('Oops!', 'Masukkan password lama.'); return; }
      if (passwordBaru.length < 6) { customAlert('Oops!', 'Password baru minimal 6 karakter.'); return; }
      if (passwordBaru !== konfirmasiPassword) { customAlert('Oops!', 'Konfirmasi password tidak cocok.'); return; }
    }

    setSaving(true);
    try {
      const fullNoHp = noHp ? COUNTRY_CODES[0].code + noHp : '';
      
      let payload = {
        nama: nama.trim(),
        username: username.toLowerCase().trim(),
        email: email.trim(),
        no_hp: fullNoHp,
        password_lama: passwordLama || undefined,
        password_baru: passwordBaru || undefined
      };

      if (newPhotoBase64) payload.foto_base64 = newPhotoBase64;
      if (isPhotoDeleted) payload.foto_base64 = ""; 

      const response = await api.put('/auth/update-profile', payload);

      if (Platform.OS === 'web') localStorage.setItem('userData', JSON.stringify(response.data.user));
      else await SecureStore.setItemAsync('userData', JSON.stringify(response.data.user));

      setSaving(false);
      
      initialData.current = {
        nama: nama.trim(), username: username.toLowerCase().trim(), email: email.trim(),
        noHp: noHp.trim(), fotoUrl: response.data.user.foto_url,
      };
      setIsModified(false); 
      setNewPhotoBase64(null);

      customAlert('Berhasil! 🎉', 'Profil kamu berhasil diperbarui!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      customAlert('Gagal', err.response?.data?.message || 'Terjadi kesalahan di server backend.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      
      {/* 👉 HEADER KEMBALI POLOS TANPA TOMBOL SIMPAN */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButtonHeader} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.backIconHeader}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitleFull}>Ubah profil</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* FOTO PROFIL */}
        <View style={styles.centeredProfileSection}>
          <TouchableOpacity onPress={() => setShowPhotoOptions(true)} activeOpacity={0.8} style={styles.avatarCenteredColumn}>
            {fotoUrl ? (
              <Image source={{ uri: fotoUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {nama ? nama.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
            <Text style={styles.addPhotoText}>
              {fotoUrl ? 'Ubah foto' : 'Tambah foto'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* INFORMASI DASAR */}
        <Text style={styles.sectionHeading}>Informasi Dasar</Text>
        <View style={styles.sectionFields}>
          <FloatingLabelInput label="Nama Lengkap" value={nama} onChangeText={setNama} />
          <FloatingLabelInput label="Username" value={username} onChangeText={(t) => setUsername(t.replace(/\s/g, ''))} autoCapitalize="none" />
          <FloatingLabelInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          
          <View style={styles.manualNoHpWrapper}>
             <Text style={styles.hpLabel}>Nomor HP</Text>
             <View style={styles.hpRow}>
                <View style={styles.hpCountryPill}>
                   <Text style={styles.hpFlag}>{COUNTRY_CODES[0].flag}</Text>
                   <Text style={styles.hpCode}>{COUNTRY_CODES[0].code}</Text>
                </View>
                <TextInput 
                   style={styles.hpInput} 
                   keyboardType="phone-pad" 
                   value={noHp} 
                   onChangeText={(t) => setNoHp(t.replace(/[^0-9]/g, ''))} 
                   placeholder="85819209300" 
                   placeholderTextColor="#aaa" 
                />
             </View>
          </View>
        </View>

        {/* GANTI PASSWORD */}
        <Text style={[styles.sectionHeading, { marginTop: 30 }]}>Ganti Password</Text>
        <View style={styles.sectionFields}>
          <FloatingLabelInput 
            label="Password Lama" value={passwordLama} onChangeText={setPasswordLama} secureTextEntry={secureText.old} 
            
          />
          <FloatingLabelInput 
            label="Password Baru" value={passwordBaru} onChangeText={setPasswordBaru} secureTextEntry={secureText.new} 
        
          />
          <FloatingLabelInput 
            label="Ulangi Password Baru" value={konfirmasiPassword} onChangeText={setKonfirmasiPassword} secureTextEntry={secureText.confirm} 
          />
        </View>

        <View style={{ height: 120 }} /> 
      </ScrollView>

      {/* 👉 TOMBOL SIMPAN PINTAR KEMBALI KE BAWAH */}
      <View style={styles.stickyBottomContainer}>
         {!isModified && !saving ? (
            <View style={styles.saveBtnDisabled}>
               <Text style={styles.saveBtnDisabledText}>Simpan</Text>
            </View>
         ) : (
            <TouchableOpacity style={styles.saveBtnLarge} onPress={handleSimpan} disabled={saving} activeOpacity={0.8}>
               <LinearGradient colors={['#1565C0', '#42A5F5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtnGradient}>
                  {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnLargeText}>Simpan</Text>}
               </LinearGradient>
            </TouchableOpacity>
         )}
      </View>

      {/* 👉 MODAL BOTTOM SHEET (TANPA OVERLAY GELAP / TRANSPARANT) */}
      <Modal visible={showPhotoOptions} transparent animationType="slide" onRequestClose={() => setShowPhotoOptions(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPhotoOptions(false)}>
          <View style={styles.bottomSheet}>
            <View style={styles.bsHandle} />
            
            <TouchableOpacity style={styles.bsItem} onPress={() => ambilFoto('gallery')}>
              <Text style={styles.bsIcon}>🖼️</Text>
              <Text style={styles.bsText}>Pilih dari galeri</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.bsItem} onPress={() => ambilFoto('camera')}>
              <Text style={styles.bsIcon}>📷</Text>
              <Text style={styles.bsText}>Ambil foto</Text>
            </TouchableOpacity>
            
            {fotoUrl && (
              <TouchableOpacity style={styles.bsItem} onPress={handleHapusFoto}>
                <Text style={styles.bsIcon}>🗑️</Text>
                <Text style={styles.bsTextRed}>Hapus foto saat ini</Text>
              </TouchableOpacity>
            )}
            
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

// ============================================
// 👉 STYLING
// ============================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' }, 
  
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingTop: Platform.OS === 'android' ? 45 : 55, paddingBottom: 12, paddingHorizontal: 20, 
    backgroundColor: '#FFFFFF'
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backButtonHeader: { width: 32, height: 32, justifyContent: 'center' },
  backIconHeader: { fontSize: 24, color: '#1a1a1a', fontWeight: 'bold' },
  headerTitleFull: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginLeft: 8 },
  
  scrollContent: { paddingHorizontal: 24, paddingTop: 10 }, 
  
  // 👉 Jarak Section Heading dirapatkan (marginBottom dari 12 jadi 4)
  sectionHeading: { fontSize: 15, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  
  centeredProfileSection: { alignItems: 'center', marginTop: 10, marginBottom: 24 },
  avatarCenteredColumn: { alignItems: 'center' },
  avatar: { width: 85, height: 85, borderRadius: 42.5 }, 
  avatarPlaceholder: { width: 85, height: 85, borderRadius: 42.5, backgroundColor: '#008E28', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 32, color: '#FFF', fontWeight: 'bold' },
  addPhotoText: { fontSize: 13, color: '#1565C0', marginTop: 10, fontWeight: '600' },
  
  sectionFields: { gap: 12 }, 
  floatingInputContainer: { position: 'relative', borderBottomWidth: 1.5, paddingTop: 18, paddingBottom: 8 },
  floatingLabel: { position: 'absolute', left: 0 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  textInputStyle: { flex: 1, fontSize: 15, color: '#1a1a1a', padding: 0, margin: 0 },
  eyeIcon: { fontSize: 18, color: '#888' },
  eyeBtn: { padding: 4, marginLeft: 10 },

  manualNoHpWrapper: { marginTop: 6 },
  hpLabel: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 8 },
  hpRow: { flexDirection: 'row', alignItems: 'center' },
  hpCountryPill: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', 
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 20, 
    paddingHorizontal: 12, paddingVertical: 6, marginRight: 12 
  },
  hpFlag: { fontSize: 16, marginRight: 4 },
  hpCode: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  hpInput: { 
    flex: 1, fontSize: 15, color: '#1a1a1a', padding: 0, margin: 0, 
    borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingBottom: 8 
  },

  // 👉 STICKY BOTTOM BUTTON KEMBALI LAGI
  stickyBottomContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    backgroundColor: '#FFF', 
    paddingVertical: 20, paddingHorizontal: 24,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  saveBtnLarge: { borderRadius: 100, overflow: 'hidden', elevation: 8, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }, 
  saveBtnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  saveBtnLargeText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  saveBtnDisabled: { 
    borderRadius: 100, overflow: 'hidden', 
    backgroundColor: '#F0F0F0', paddingVertical: 16, 
    alignItems: 'center', justifyContent: 'center' 
  },
  saveBtnDisabledText: { color: '#BBBBBB', fontSize: 16, fontWeight: 'bold' },

  // 👉 MODAL TANPA OVERLAY GELAP (Transparent total)
  modalOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  bottomSheet: { 
    backgroundColor: '#1E1E1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, 
    paddingHorizontal: 20, paddingBottom: 40,
    elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.2, shadowRadius: 10
  },
  bsHandle: { width: 40, height: 4, backgroundColor: '#555', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  bsItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  bsIcon: { fontSize: 22, marginRight: 16 },
  bsText: { fontSize: 16, color: '#FFF', fontWeight: '500' },
  bsTextRed: { fontSize: 16, color: '#EF5350', fontWeight: '500' },
});