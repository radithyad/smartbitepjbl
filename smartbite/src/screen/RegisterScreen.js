import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  ActivityIndicator, Modal, FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { api } from '../service/api';

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
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
  { name: 'UAE', code: '+971', flag: '🇦🇪' },  
  { name: 'Netherlands', code: '+31', flag: '🇳🇱' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'France', code: '+33', flag: '🇫🇷' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Brazil', code: '+55', flag: '🇧🇷' },
  { name: 'Vietnam', code: '+84', flag: '🇻🇳' },
  { name: 'Thailand', code: '+66', flag: '🇹🇭' },
  { name: 'Philippines', code: '+63', flag: '🇵🇭' },
];

export default function RegisterScreen({ navigation }) {
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [noHp, setNoHp] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [password, setPassword] = useState('');
  const [konfirmasi, setKonfirmasi] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [searchCountry, setSearchCountry] = useState('');

  const filteredCountries = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(searchCountry.toLowerCase()) ||
    c.code.includes(searchCountry)
  );

  const handleRegister = async () => {
    // (Biarkan validasi if-if yang di atas tetap ada)
    if (!nama || !username || !email || !noHp || !password || !konfirmasi) {
      Alert.alert('Oops!', 'Semua field wajib diisi ya!');
      return;
    }
    if (noHp.length < 9) {
      Alert.alert('Oops!', 'Nomor HP minimal 9 angka ya!');
      return;
    }
    if (password !== konfirmasi) {
      Alert.alert('Oops!', 'Password dan konfirmasi password tidak sama!');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Oops!', 'Password minimal 6 karakter ya!');
      return;
    }
    if (username.includes(' ')) {
      Alert.alert('Oops!', 'Username tidak boleh mengandung spasi!');
      return;
    }

    setLoading(true);
    const fullNoHp = selectedCountry.code + noHp;

    try {
      // Tembak API Register kita
      const response = await api.post('/auth/register', {
        nama,
        username: username.toLowerCase(),
        email,
        password,
        no_hp: fullNoHp,
        role: 'customer' // Otomatis diset sebagai customer
      });

      // Kalau sukses, langsung arahkan ke Login
      Alert.alert('Berhasil! 🎉', 'Akun kamu berhasil dibuat. Silakan login!', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);

    } catch (error) {
      // Tangkap pesan error dari backend (misal: "Email sudah terdaftar")
      const errorMsg = error.response?.data?.message || 'Gagal mendaftar, cek koneksi internetmu.';
      Alert.alert('Registrasi Gagal', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={{ flex: 1 }} bounces={false}>

        <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Kembali</Text>
          </TouchableOpacity>
          <Text style={styles.illustrationEmoji}>✍️</Text>
          <Text style={styles.appName}>Buat Akun</Text>
          <Text style={styles.tagline}>Daftar dan mulai pesan makananmu!</Text>
        </LinearGradient>

        <View style={styles.formContainer}>

          {/* Nama */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Nama Lengkap</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan nama lengkap kamu"
              placeholderTextColor="#aaa"
              value={nama}
              onChangeText={setNama}
            />
          </View>

          {/* Username */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: budi123"
              placeholderTextColor="#aaa"
              autoCapitalize="none"
              value={username}
              onChangeText={(text) => setUsername(text.toLowerCase().replace(/\s/g, ''))}
            />
          </View>

          {/* Email */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan email kamu"
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Nomor HP */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Nomor HP</Text>
            <View style={styles.phoneRow}>
              <TouchableOpacity
                style={styles.countryButton}
                onPress={() => setShowCountryModal(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                <Text style={styles.countryCode}>{selectedCountry.code}</Text>
                <Text style={styles.countryChevron}>▾</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.phoneInput}
                placeholder="8123456789"
                placeholderTextColor="#aaa"
                keyboardType="phone-pad"
                value={noHp}
                onChangeText={(text) => setNoHp(text.replace(/[^0-9]/g, ''))}
              />
            </View>
            {noHp.length > 0 && noHp.length < 9 && (
              <Text style={styles.errorHint}>⚠️ Minimal 9 angka</Text>
            )}
          </View>

          {/* Password */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Minimal 6 karakter"
                placeholderTextColor="#aaa"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Konfirmasi Password */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Konfirmasi Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Ulangi password kamu"
                placeholderTextColor="#aaa"
                secureTextEntry={!showKonfirmasi}
                value={konfirmasi}
                onChangeText={setKonfirmasi}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowKonfirmasi(!showKonfirmasi)}
              >
                <Text style={styles.eyeIcon}>{showKonfirmasi ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {konfirmasi.length > 0 && password !== konfirmasi && (
              <Text style={styles.errorHint}>⚠️ Password tidak sama</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.registerButton}
            activeOpacity={0.8}
            onPress={handleRegister}
            disabled={loading}
          >
            <LinearGradient
              colors={['#1565C0', '#42A5F5']}
              style={styles.registerButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>Daftar Sekarang</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Sudah punya akun? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.loginLink}>Masuk di sini</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {/* Modal Pilih Kode Negara */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCountryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCountryModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Cari kode negara</Text>

            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Ketik nama atau kode negara"
                placeholderTextColor="#aaa"
                value={searchCountry}
                onChangeText={setSearchCountry}
                autoFocus
              />
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => {
                    setSelectedCountry(item);
                    setShowCountryModal(false);
                    setSearchCountry('');
                  }}
                  activeOpacity={0.7}
                >
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
  header: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
  },
  backText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  illustrationEmoji: {
    fontSize: 55,
    marginBottom: 8,
  },
  appName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#E8ECF0',
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'stretch',
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E8ECF0',
    gap: 4,
  },
  countryFlag: {
    fontSize: 18,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  countryChevron: {
    fontSize: 10,
    color: '#888',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#E8ECF0',
  },
  errorHint: {
    fontSize: 12,
    color: '#EF5350',
    marginTop: 6,
    marginLeft: 4,
  },
  passwordRow: {
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8ECF0',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1a1a1a',
  },
  eyeButton: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 18,
  },
  registerButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  registerButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#888',
  },
  loginLink: {
    fontSize: 14,
    color: '#1565C0',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8ECF0',
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  countryItemFlag: {
    fontSize: 24,
  },
  countryItemName: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
  },
  countryItemCode: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  countrySeparator: {
    height: 1,
    backgroundColor: '#F5F5F5',
  },
});