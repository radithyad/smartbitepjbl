import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  ActivityIndicator, Image, Modal, FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../service/api';
import { customAlert } from '../utils/alerthelper';

const KATEGORI_LIST = ['Nasi', 'Mie', 'Snack', 'Minuman', 'Masakan Rumahan', 'Lainnya'];

const COUNTRY_CODES = [
  { name: 'Indonesia', code: '+62', flag: '🇮🇩' },
  { name: 'Malaysia', code: '+60', flag: '🇲🇾' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'Japan', code: '+81', flag: '🇯🇵' },
  { name: 'South Korea', code: '+82', flag: '🇰🇷' },
  { name: 'China', code: '+86', flag: '🇨🇳' },
  { name: 'India', code: '+91', flag: '🇮🇳' },
];

export default function RegisterVendorScreen({ navigation }) {

  // Step
  const [step, setStep] = useState(1);

  // Akun
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [noHp, setNoHp] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [password, setPassword] = useState('');
  const [konfirmasi, setKonfirmasi] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchCountry, setSearchCountry] = useState('');

  // Toko
  const [namaToko, setNamaToko] = useState('');
  const [kategori, setKategori] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [emoji, setEmoji] = useState('🏪');

  // Dokumen
  const [fotoKtp, setFotoKtp] = useState(null);
  const [fotoDiri, setFotoDiri] = useState(null);
  const [uploadingKtp, setUploadingKtp] = useState(false);
  const [uploadingDiri, setUploadingDiri] = useState(false);

  const [loading, setLoading] = useState(false);

  const filteredCountries = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(searchCountry.toLowerCase()) ||
    c.code.includes(searchCountry)
  );

  // ── Upload foto (Diubah ke Base64) ───────────────────────
  const uploadFoto = async (type) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { customAlert('Izin diperlukan'); return; }

    type === 'ktp' ? setUploadingKtp(true) : setUploadingDiri(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({ 
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, 
        aspect: [4, 3], 
        quality: 0.1, // Kualitas diturunin biar Base64 gak kepanjangan
        base64: true  // Ini kuncinya!
      });
      
      if (!result.canceled) {
        // Format string Base64 biar bisa dibaca elemen <Image> dan disimpan ke MongoDB
        const base64String = `data:image/jpeg;base64,${result.assets[0].base64}`;
        
        if (type === 'ktp') {
          setFotoKtp(base64String);
        } else {
          setFotoDiri(base64String);
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Gagal memproses foto');
    } finally {
      type === 'ktp' ? setUploadingKtp(false) : setUploadingDiri(false);
    }
  };

  // ── Validasi & next step ─────────────────────────────────
  const handleNext = () => {
    if (step === 1) {
      if (!nama || !username || !email || !noHp || !password || !konfirmasi) {
        Alert.alert('Oops!', 'Semua field wajib diisi ya!'); return;
      }
      if (noHp.length < 9) { Alert.alert('Oops!', 'Nomor HP minimal 9 angka ya!'); return; }
      if (password !== konfirmasi) { Alert.alert('Oops!', 'Password dan konfirmasi password tidak sama!'); return; }
      if (password.length < 6) { Alert.alert('Oops!', 'Password minimal 6 karakter ya!'); return; }
      if (username.includes(' ')) { Alert.alert('Oops!', 'Username tidak boleh mengandung spasi!'); return; }
    }
    if (step === 2) {
      if (!namaToko.trim() || !kategori) {
        Alert.alert('Oops!', 'Nama toko dan kategori wajib diisi ya!'); return;
      }
    }
    setStep(step + 1);
  };

  // ── Submit ke API Node.js ────────────────────────────────
  const handleRegisterVendor = async () => {
    if (!fotoKtp || !fotoDiri) {
      Alert.alert('Oops!', 'Foto KTP dan Foto Diri wajib diupload ya!');
      return;
    }

    setLoading(true);
    const fullNoHp = selectedCountry.code + noHp;

    try {
      // 1. Daftarkan User dengan role 'pending_vendor'
      await api.post('/auth/register', {
        nama,
        username: username.toLowerCase(),
        email,
        password,
        no_hp: fullNoHp,
        role: 'pending_vendor'
      });

      // 2. Login otomatis di "background" buat dapetin Token JWT
      const loginRes = await api.post('/auth/login', {
        identifier: email,
        password
      });
      const token = loginRes.data.token;

      // 3. Bikin data Tokonya + Masukin Foto Base64
      await api.post('/toko', {
        nama: namaToko,
        kategori: kategori,
        deskripsi: deskripsi || `Selamat datang di ${namaToko}!`,
        emoji: emoji || '🏪',
        foto_ktp: fotoKtp,   // Kirim string Base64 KTP
        foto_diri: fotoDiri  // Kirim string Base64 Foto Diri
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 4. Sukses! Arahkan ke halaman Login
      customAlert('Berhasil! 🎉', 'Pendaftaran Mitra berhasil! Tim kami akan memverifikasi tokomu.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);

    } catch (error) {
      console.log("ERROR DETAIL:", error.response ? error.response.data : error.message);
      const errorMsg = error.response?.data?.message || 'Gagal mendaftar, cek koneksi internetmu.';
      customAlert('Registrasi Gagal', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ── Step indicator ───────────────────────────────────────
  const StepIndicator = () => (
    <View style={styles.stepRow}>
      {[
        { n: 1, label: 'Akun' },
        { n: 2, label: 'Toko' },
        { n: 3, label: 'Dokumen' },
      ].map(({ n, label }, i) => (
        <View key={n} style={styles.stepItem}>
          <View style={[styles.stepCircle, step >= n && styles.stepCircleActive, step > n && styles.stepCircleDone]}>
            <Text style={[styles.stepNum, step >= n && styles.stepNumActive]}>
              {step > n ? '✓' : n}
            </Text>
          </View>
          <Text style={[styles.stepLabel, step >= n && styles.stepLabelActive]}>{label}</Text>
          {i < 2 && <View style={[styles.stepLine, step > n && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );

  // ── Header config per step ───────────────────────────────
  const headerConfig = {
    1: { emoji: '👤', title: 'Data Akun',    sub: 'Buat akun untuk dashboard penjual' },
    2: { emoji: '🏪', title: 'Info Toko',    sub: 'Tampil di aplikasi customer' },
    3: { emoji: '🪪', title: 'Verifikasi',   sub: 'Dokumen identitas penjual' },
  };
  const hc = headerConfig[step];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={{ flex: 1 }} bounces={false} keyboardShouldPersistTaps="handled">

        {/* ── Header gradient ── */}
        <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}>
            <Text style={styles.backText}>← Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.illustrationEmoji}>{hc.emoji}</Text>
          <Text style={styles.appName}>{hc.title}</Text>
          <Text style={styles.tagline}>{hc.sub}</Text>
        </LinearGradient>

        {/* ── Form container ── */}
        <View style={styles.formContainer}>

          <StepIndicator />

          {/* ────────── STEP 1: AKUN ────────── */}
          {step === 1 && (
            <>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Nama Lengkap</Text>
                <TextInput style={styles.input} placeholder="Sesuai KTP" placeholderTextColor="#aaa" value={nama} onChangeText={setNama} />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput style={styles.input} placeholder="Contoh: toko_bu_sari" placeholderTextColor="#aaa" autoCapitalize="none" value={username} onChangeText={(t) => setUsername(t.toLowerCase().replace(/\s/g, ''))} />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput style={styles.input} placeholder="email@example.com" placeholderTextColor="#aaa" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Nomor HP</Text>
                <View style={styles.phoneRow}>
                  <TouchableOpacity style={styles.countryButton} onPress={() => setShowCountryModal(true)} activeOpacity={0.7}>
                    <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                    <Text style={styles.countryCode}>{selectedCountry.code}</Text>
                    <Text style={styles.countryChevron}>▾</Text>
                  </TouchableOpacity>
                  <TextInput style={styles.phoneInput} placeholder="8123456789" placeholderTextColor="#aaa" keyboardType="phone-pad" value={noHp} onChangeText={(t) => setNoHp(t.replace(/[^0-9]/g, ''))} />
                </View>
                {noHp.length > 0 && noHp.length < 9 && <Text style={styles.errorHint}>⚠️ Minimal 9 angka</Text>}
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput style={styles.passwordInput} placeholder="Minimal 6 karakter" placeholderTextColor="#aaa" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                    <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Konfirmasi Password</Text>
                <View style={styles.passwordRow}>
                  <TextInput style={styles.passwordInput} placeholder="Ulangi password kamu" placeholderTextColor="#aaa" secureTextEntry={!showKonfirmasi} value={konfirmasi} onChangeText={setKonfirmasi} />
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowKonfirmasi(!showKonfirmasi)}>
                    <Text style={styles.eyeIcon}>{showKonfirmasi ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
                {konfirmasi.length > 0 && password !== konfirmasi && <Text style={styles.errorHint}>⚠️ Password tidak sama</Text>}
              </View>
            </>
          )}

          {/* ────────── STEP 2: TOKO ────────── */}
          {step === 2 && (
            <>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Nama Toko</Text>
                <TextInput style={styles.input} placeholder="Contoh: Warung Bu Sari" placeholderTextColor="#aaa" value={namaToko} onChangeText={setNamaToko} />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Kategori</Text>
                <View style={styles.kategoriGrid}>
                  {KATEGORI_LIST.map((kat) => (
                    <TouchableOpacity key={kat} style={[styles.kategoriChip, kategori === kat && styles.kategoriChipActive]} onPress={() => setKategori(kat)} activeOpacity={0.7}>
                      <Text style={[styles.kategoriChipText, kategori === kat && styles.kategoriChipTextActive]}>{kat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Deskripsi Toko</Text>
                <TextInput style={[styles.input, styles.inputMultiline]} placeholder="Ceritakan tokomu secara singkat..." placeholderTextColor="#aaa" value={deskripsi} onChangeText={setDeskripsi} multiline numberOfLines={3} />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Emoji Toko</Text>
                <TextInput style={styles.input} placeholder="🏪" placeholderTextColor="#aaa" value={emoji} onChangeText={setEmoji} />
              </View>
            </>
          )}

          {/* ────────── STEP 3: DOKUMEN ────────── */}
          {step === 3 && (
            <>
              <View style={styles.warningBanner}>
                <Text style={styles.warningEmoji}>⚠️</Text>
                <Text style={styles.warningText}>Dokumen digunakan untuk verifikasi identitas. Data kamu aman dan terlindungi.</Text>
              </View>

              {/* Foto KTP */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Foto KTP</Text>
                <TouchableOpacity style={styles.uploadBox} onPress={() => uploadFoto('ktp')} activeOpacity={0.8}>
                  {uploadingKtp ? (
                    <ActivityIndicator color="#1565C0" />
                  ) : fotoKtp ? (
                    <Image source={{ uri: fotoKtp }} style={styles.uploadPreview} resizeMode="cover" />
                  ) : (
                    <>
                      <Text style={styles.uploadIcon}>🪪</Text>
                      <Text style={styles.uploadLabel}>Tap untuk upload foto KTP</Text>
                      <Text style={styles.uploadSub}>Pastikan semua tulisan terbaca jelas</Text>
                    </>
                  )}
                </TouchableOpacity>
                {fotoKtp && (
                  <TouchableOpacity onPress={() => uploadFoto('ktp')} style={styles.gantiBtn}>
                    <Text style={styles.gantiBtnText}>🔄 Ganti Foto KTP</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Foto Diri */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Foto Diri</Text>
                <TouchableOpacity style={styles.uploadBox} onPress={() => uploadFoto('diri')} activeOpacity={0.8}>
                  {uploadingDiri ? (
                    <ActivityIndicator color="#1565C0" />
                  ) : fotoDiri ? (
                    <Image source={{ uri: fotoDiri }} style={styles.uploadPreview} resizeMode="cover" />
                  ) : (
                    <>
                      <Text style={styles.uploadIcon}>🤳</Text>
                      <Text style={styles.uploadLabel}>Tap untuk upload foto diri</Text>
                      <Text style={styles.uploadSub}>Foto wajah jelas, tidak buram</Text>
                    </>
                  )}
                </TouchableOpacity>
                {fotoDiri && (
                  <TouchableOpacity onPress={() => uploadFoto('diri')} style={styles.gantiBtn}>
                    <Text style={styles.gantiBtnText}>🔄 Ganti Foto Diri</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {/* ── CTA Button ── */}
          {step < 3 ? (
            <TouchableOpacity style={styles.registerButton} onPress={handleNext} activeOpacity={0.8}>
              <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.registerButtonGradient}>
                <Text style={styles.registerButtonText}>Lanjut →</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.registerButton} onPress={handleRegisterVendor} disabled={loading} activeOpacity={0.8}>
              <LinearGradient colors={loading ? ['#B0BEC5', '#CFD8DC'] : ['#1565C0', '#42A5F5']} style={styles.registerButtonGradient}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerButtonText}>🏪 Kirim Pendaftaran</Text>}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Sudah punya akun? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Masuk disini</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {/* ── Country Modal ── */}
      <Modal visible={showCountryModal} transparent animationType="slide" onRequestClose={() => setShowCountryModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCountryModal(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Pilih Kode Negara</Text>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput style={styles.searchInput} placeholder="Ketik nama atau kode negara" placeholderTextColor="#aaa" value={searchCountry} onChangeText={setSearchCountry} autoFocus />
            </View>
            <FlatList
              data={filteredCountries}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.countryItem} onPress={() => { setSelectedCountry(item); setShowCountryModal(false); setSearchCountry(''); }} activeOpacity={0.7}>
                  <Text style={styles.countryItemFlag}>{item.flag}</Text>
                  <Text style={styles.countryItemName}>{item.name}</Text>
                  <Text style={styles.countryItemCode}>{item.code}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.countrySeparator} />}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // ── Header ──
  header: { height: 240, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  backButton: { position: 'absolute', top: 50, left: 20 },
  backText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  illustrationEmoji: { fontSize: 55, marginBottom: 8 },
  appName: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 6 },

  // ── Form container ──
  formContainer: {
    flex: 1, backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    marginTop: -24, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40,
  },

  // ── Step indicator ──
  stepRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 28 },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E0E0E0' },
  stepCircleActive: { backgroundColor: '#E3F2FD', borderColor: '#1565C0' },
  stepCircleDone: { backgroundColor: '#1565C0', borderColor: '#1565C0' },
  stepNum: { fontSize: 12, fontWeight: 'bold', color: '#aaa' },
  stepNumActive: { color: '#1565C0' },
  stepLabel: { fontSize: 11, color: '#aaa', marginLeft: 6, fontWeight: '600' },
  stepLabelActive: { color: '#1565C0' },
  stepLine: { width: 36, height: 2, backgroundColor: '#E0E0E0', marginHorizontal: 8 },
  stepLineActive: { backgroundColor: '#1565C0' },

  // ── Inputs ──
  inputWrapper: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 8 },
  input: { backgroundColor: '#F5F7FA', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: '#1a1a1a', borderWidth: 1, borderColor: '#E8ECF0' },
  inputMultiline: { minHeight: 88, textAlignVertical: 'top' },

  phoneRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  countryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E8ECF0', gap: 4 },
  countryFlag: { fontSize: 18 },
  countryCode: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  countryChevron: { fontSize: 10, color: '#888' },
  phoneInput: { flex: 1, backgroundColor: '#F5F7FA', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: '#1a1a1a', borderWidth: 1, borderColor: '#E8ECF0' },

  passwordRow: { flexDirection: 'row', backgroundColor: '#F5F7FA', borderRadius: 12, borderWidth: 1, borderColor: '#E8ECF0', alignItems: 'center', paddingHorizontal: 16 },
  passwordInput: { flex: 1, paddingVertical: 14, fontSize: 14, color: '#1a1a1a' },
  eyeButton: { padding: 4 },
  eyeIcon: { fontSize: 18 },

  errorHint: { fontSize: 12, color: '#EF5350', marginTop: 6, marginLeft: 4 },

  // ── Kategori chips ──
  kategoriGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kategoriChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100, backgroundColor: '#F5F7FA', borderWidth: 1, borderColor: '#E8ECF0' },
  kategoriChipActive: { backgroundColor: '#1565C0', borderColor: '#1565C0' },
  kategoriChipText: { fontSize: 13, fontWeight: '600', color: '#666' },
  kategoriChipTextActive: { color: '#fff' },

  // ── Upload dokumen ──
  warningBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF8E1', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#FFE082', gap: 10 },
  warningEmoji: { fontSize: 18, marginTop: 1 },
  warningText: { flex: 1, fontSize: 12, color: '#F57F17', lineHeight: 18 },

  uploadBox: { backgroundColor: '#F5F7FA', borderRadius: 12, height: 160, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#1565C0', overflow: 'hidden' },
  uploadPreview: { width: '100%', height: '100%' },
  uploadIcon: { fontSize: 36, marginBottom: 8 },
  uploadLabel: { fontSize: 13, fontWeight: '600', color: '#1565C0', marginBottom: 4 },
  uploadSub: { fontSize: 12, color: '#888' },
  gantiBtn: { alignSelf: 'center', marginTop: 8 },
  gantiBtnText: { fontSize: 13, color: '#1565C0', fontWeight: '600' },

  // ── CTA button ──
  registerButton: { marginTop: 8, borderRadius: 12, overflow: 'hidden', elevation: 3, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  registerButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  registerButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },

  // ── Login link ──
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText: { fontSize: 14, color: '#888' },
  loginLink: { fontSize: 14, color: '#1565C0', fontWeight: '600' },

  // ── Country modal ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40, maxHeight: '75%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 14 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16, borderWidth: 1, borderColor: '#E8ECF0' },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1a1a1a' },
  countryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  countryItemFlag: { fontSize: 24 },
  countryItemName: { flex: 1, fontSize: 14, color: '#1a1a1a' },
  countryItemCode: { fontSize: 14, color: '#888', fontWeight: '600' },
  countrySeparator: { height: 1, backgroundColor: '#F5F5F5' },
});