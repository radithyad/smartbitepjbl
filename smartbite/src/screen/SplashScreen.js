import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.container}>
      <Text style={styles.emoji}>🍱</Text>
      <Text style={styles.appName}>SmartBite</Text>
      <Text style={styles.tagline}>Pesan makan di kantin, lebih mudah!</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 8,
    marginBottom: 40,
  }
});