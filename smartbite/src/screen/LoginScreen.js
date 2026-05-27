import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { api, setToken } from '../service/api'; // Pastikan import api dan setToken

export default function LoginScreen({ navigation, route, onLogin }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Oops!', 'Email/username/no HP dan password wajib diisi ya!');
      return;
    }

    setLoading(true); 

    try {
      // Langsung tembak API, biarkan Node.js yang mikir ini email, username, atau no_hp
      const response = await api.post('/auth/login', { 
        identifier: identifier.trim().toLowerCase(), 
        password 
      });

      // Simpan token ke device
      await setToken(response.data.token);

      if (onLogin) {
        onLogin(response.data.token, response.data.user);
      }
      
    } catch (error) {
      console.log('Error detail API:', error.message); // 👈 TAMBAHKAN BARIS INI
      const errorMsg = error.response?.data?.message || 'Gagal terhubung ke server';
      Alert.alert('Login Gagal', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholder = () => 'Email, username, atau no HP';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={{ flex: 1 }} bounces={false}>

        <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.header}>
          <Text style={styles.illustrationEmoji}>🍱</Text>
          <Text style={styles.appName}>SmartBite</Text>
          <Text style={styles.tagline}>Pesan makan di kantin, lebih mudah!</Text>
        </LinearGradient>

        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Halo, Selamat Datang 👋</Text>
          <Text style={styles.subText}>Masuk untuk mulai memesan</Text>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Email / Username / No HP</Text>
            <TextInput
              style={styles.input}
              placeholder={getPlaceholder()}
              placeholderTextColor="#aaa"
              autoCapitalize="none"
              value={identifier}
              onChangeText={setIdentifier}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Masukkan password kamu"
              placeholderTextColor="#aaa"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

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
            <TouchableOpacity onPress={() => navigation.navigate('RolePicker')}>
              <Text style={styles.registerLink}>Daftar sekarang</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ... biarkan styles persis sama seperti sebelumnya ...
const styles = StyleSheet.create({
  header: { height: 300, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  illustrationEmoji: { fontSize: 80, marginBottom: 10 },
  appName: { fontSize: 32, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 6 },
  formContainer: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, paddingHorizontal: 24, paddingTop: 30, paddingBottom: 40 },
  welcomeText: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  subText: { fontSize: 14, color: '#888', marginBottom: 28 },
  inputWrapper: { marginBottom: 18 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 8 },
  input: { backgroundColor: '#F5F7FA', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: '#1a1a1a', borderWidth: 1, borderColor: '#E8ECF0' },
  loginButton: { marginTop: 8, borderRadius: 12, overflow: 'hidden', elevation: 3, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  loginButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  registerText: { fontSize: 14, color: '#888' },
  registerLink: { fontSize: 14, color: '#1565C0', fontWeight: '600' },
});