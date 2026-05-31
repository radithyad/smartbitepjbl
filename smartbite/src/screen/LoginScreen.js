import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { api, setToken } from '../service/api'; 
import { Ionicons } from '@expo/vector-icons';

// 🔥 KOMPONEN INPUT GAYA PROFIL (Minimalis & Garis bawah nyala biru)
const LoginInput = ({ 
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

export default function LoginScreen({ navigation, route, onLogin }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Oops!', 'Isi dulu data kamu kalau mau masuk');
      return;
    }

    setLoading(true); 

    try {
      const response = await api.post('/auth/login', { 
        identifier: identifier.trim().toLowerCase(), 
        password 
      });

      await setToken(response.data.token);

      if (onLogin) {
        onLogin(response.data.token, response.data.user);
      }
      
    } catch (error) {
      console.log('Error detail API:', error.message); 
      const errorMsg = error.response?.data?.message || 'Gagal terhubung ke server';
      Alert.alert('Login Gagal', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={{ flex: 1 }} bounces={false} showsVerticalScrollIndicator={false}>

        {/* 🔥 1. HEADER SEBELUMNYA (Gradient Blue Banner) */}
        <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.header}>
          <Text style={styles.illustrationEmoji}>🍱</Text>
          <Text style={styles.appName}>SmartBite</Text>
          <Text style={styles.tagline}>Pesan makan di kantin, lebih mudah!</Text>
        </LinearGradient>

        {/* 🔥 2. CONTAINER DENGAN ROUNDED DI UJUNGNYA */}
        <View style={styles.formContainer}>
          
          {/* 🔥 3. LANGSUNG FIELD INPUT BARUSAN (Tanpa Welcome Text) */}
          <LoginInput 
            iconName="person-outline" 
            placeholder="Email atau no HP" 
            value={identifier} 
            onChangeText={setIdentifier} 
            autoCapitalize="none" 
          />
          
          <View style={{ height: 16 }} />

          <LoginInput 
            iconName="lock-closed-outline" 
            placeholder="Password" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry={true} 
            showEyeToggle={true} 
          />

          {/* Jarak pengganti lupa password agar tatanan tetap seimbang */}
          <View style={{ height: 40 }} />

          {/* 🔥 4. BUTTON BARUSAN (Fully Rounded / Pill Shape) */}
          <TouchableOpacity
            style={styles.loginButton}
            activeOpacity={0.8}
            onPress={handleLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={['#1565C0', '#42A5F5']}
              style={styles.loginButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Masuk</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Belum punya akun? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('RolePicker')} activeOpacity={0.7}>
              <Text style={styles.registerLink}>Daftar sekarang</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  
  // Style Header Banner Gradient Sebelumnya
  header: { height: 300, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  illustrationEmoji: { fontSize: 80, marginBottom: 10 },
  appName: { fontSize: 32, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 6 },
  
  // Style Form Container Rounded Corners
  formContainer: { 
    flex: 1, 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28, 
    marginTop: -24, 
    paddingHorizontal: 24, 
    paddingTop: 44, // Ditambah sedikit biar area atas input lega setelah teks dihapus
    paddingBottom: 40 
  },

  // Input Components Style (Gaya Profil)
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  iconContainer: { width: 44, justifyContent: 'center', alignItems: 'flex-start', marginTop: 4 }, 
  textInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingVertical: 14 },
  textInputStyle: { flex: 1, fontSize: 16, color: '#1a1a1a', padding: 0, margin: 0 },
  eyeIconBtn: { padding: 4, marginLeft: 8 }, 

  // Style Button Fully Rounded Barusan
  loginButton: { borderRadius: 100, overflow: 'hidden', elevation: 6, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  loginButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  
  // Register Footer Row
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  registerText: { fontSize: 14, color: '#888' },
  registerLink: { fontSize: 14, color: '#1565C0', fontWeight: 'bold' },
});