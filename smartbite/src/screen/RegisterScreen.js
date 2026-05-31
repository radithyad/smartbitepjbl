import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { api } from '../service/api'; 
import { Ionicons } from '@expo/vector-icons';

// 🔥 KOMPONEN INPUT GAYA PROFIL (Elegan dan tipis)
const RegisterInput = ({ 
  iconName, placeholder, value, onChangeText, secureTextEntry, 
  keyboardType, autoCapitalize, showEyeToggle 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [passwordShown, setPasswordShown] = useState(!secureTextEntry);

  // Kembali pakai warna kalem khas ProfilScreen
  const iconColor = isFocused ? '#1565C0' : '#888';
  const borderBottomColor = isFocused ? '#1565C0' : '#E8ECF0';

  return (
    <View style={styles.inputRow}>
      <View style={styles.iconContainer}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>
      {/* Ketebalan garis dikembalikan jadi tipis */}
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
          autoComplete="off"
          textContentType="none"
          autoCorrect={false}
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

export default function RegisterScreen({ navigation }) {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [noHp, setNoHp] = useState('');
  const [password, setPassword] = useState('');
  const [konfirmasi, setKonfirmasi] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!nama || !email || !noHp || !password || !konfirmasi) {
      Alert.alert('Oops!', 'Semua kolom wajib diisi ya!');
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

    setLoading(true); 

    try {
      // Username di-generate otomatis
      const username = email.split('@')[0] + Math.floor(Math.random() * 1000);

      const response = await api.post('/auth/register', { 
        nama: nama.trim(),
        username: username.toLowerCase(),
        email: email.trim().toLowerCase(),
        no_hp: noHp.trim(), 
        password,
        role: 'customer'
      });

      Alert.alert('Berhasil!', 'Akun kamu berhasil dibuat. Silakan masuk!', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
      
    } catch (error) {
      console.log('Error detail API:', error.message); 
      const errorMsg = error.response?.data?.message || 'Gagal mendaftar, cek koneksi internetmu.';
      Alert.alert('Registrasi Gagal', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={{ flex: 1 }} bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* HEADER BANNER GRADIENT */}
        <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.header}>
          <Ionicons name="create-outline" size={60} color="#fff" style={{ marginBottom: 12 }} />
          <Text style={styles.appName}>Buat Akun</Text>
          <Text style={styles.tagline}>Daftar dan mulai pesan makananmu!</Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          
          <View style={{ height: 10 }} />

          <View>
            <RegisterInput 
              iconName="person-outline" 
              placeholder="Nama Lengkap" 
              value={nama} 
              onChangeText={setNama} 
            />
            
            <View style={{ height: 8 }} />

            {/* 🔥 Ikon at-outline (simbol @) digunakan di sini */}
            <RegisterInput 
              iconName="at-outline" 
              placeholder="Email" 
              value={email} 
              onChangeText={setEmail} 
              keyboardType="email-address"
              autoCapitalize="none" 
            />

            <View style={{ height: 8 }} />

            <RegisterInput 
              iconName="call-outline" 
              placeholder="Nomor Handphone" 
              value={noHp} 
              onChangeText={(t) => setNoHp(t.replace(/[^0-9]/g, ''))} 
              keyboardType="phone-pad" 
            />
            {noHp.length > 0 && noHp.length < 9 && (
              <View style={styles.errorHintRow}>
                <Ionicons name="warning-outline" size={14} color="#EF5350" />
                <Text style={styles.errorHint}>Minimal 9 angka</Text>
              </View>
            )}

            <View style={{ height: 8 }} />

            <RegisterInput 
              iconName="lock-closed-outline" 
              placeholder="Password (Min. 6 karakter)" 
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry={true} 
              showEyeToggle={true} 
            />

            <View style={{ height: 8 }} />

            <RegisterInput 
              iconName="shield-checkmark-outline" 
              placeholder="Ulangi Password" 
              value={konfirmasi} 
              onChangeText={setKonfirmasi} 
              secureTextEntry={true} 
              showEyeToggle={true} 
            />
          </View>

          <View style={{ flex: 1, minHeight: 40 }} />

          <View style={styles.bottomArea}>
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
                  <Text style={styles.registerButtonText}>Daftar</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Sudah punya akun? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                <Text style={styles.loginLink}>Masuk di sini</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1 }, 
  
  header: { height: 280, justifyContent: 'center', alignItems: 'center', paddingTop: 20 },
  illustrationEmoji: { fontSize: 55, marginBottom: 8 },
  appName: { fontSize: 28, fontWeight: 'bold', color: '#fff', letterSpacing: 1, marginBottom: 6 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  
  backButton: { position: 'absolute', top: 50, left: 16, width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start', zIndex: 10 },

  formContainer: { 
    flex: 1, 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28, 
    marginTop: -24, 
    paddingHorizontal: 28, 
    paddingTop: 32, 
    paddingBottom: 30 
  },

  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  iconContainer: { width: 44, justifyContent: 'center', alignItems: 'flex-start', marginTop: 4 }, 
  textInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingVertical: 14 }, 
  textInputStyle: { flex: 1, fontSize: 16, color: '#1a1a1a', padding: 0, margin: 0 }, 
  eyeIconBtn: { padding: 4, marginLeft: 8 }, 

  errorHintRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 44, marginTop: -2, marginBottom: 6, gap: 4 },
  errorHint: { fontSize: 12, color: '#EF5350', fontWeight: '500' },

  bottomArea: { width: '100%' },

  registerButton: { borderRadius: 100, overflow: 'hidden', elevation: 6, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  registerButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  registerButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 }, 
  loginText: { fontSize: 14, color: '#888' },
  loginLink: { fontSize: 14, color: '#1565C0', fontWeight: 'bold' },
});