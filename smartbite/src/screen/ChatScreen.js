import { View, Text, StyleSheet } from 'react-native';

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>💬</Text>
      <Text style={styles.title}>Fitur Chat</Text>
      <Text style={styles.desc}>Nanti kamu bisa chat langsung sama penjual di sini. Sedang dalam tahap pengembangan! 🚀</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', padding: 40 },
  emoji: { fontSize: 70, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  desc: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },
});