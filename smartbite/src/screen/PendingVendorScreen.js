import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function PendingVendorScreen({onLogout}) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>⏳</Text>
      <Text style={styles.title}>Pendaftaran Sedang Diverifikasi</Text>\
      <Text style={styles.desc}>
        Tim kami sedang meninjau data tokomu. Proses verifikasi biasanya memakan waktu{' '}
        <Text style={styles.bold}>1-2 hari kerja</Text>.{'\n\n'}
        Kamu akan mendapat notifikasi via email setelah akun disetujui.
      </Text>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoEmoji}>📧</Text>
          <Text style={styles.infoText}>Cek email untuk update status pendaftaran</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoEmoji}>📋</Text>
          <Text style={styles.infoText}>Pastikan dokumen yang dikirim sudah jelas dan valid</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoEmoji}>✅</Text>
          <Text style={styles.infoText}>Setelah disetujui, login ulang untuk akses dashboard</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Keluar dari Akun</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', padding: 32 },
  emoji: { fontSize: 72, marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A', textAlign: 'center', marginBottom: 16 },
  desc: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  bold: { fontWeight: '700', color: '#1A1A1A' },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', marginBottom: 32, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  infoEmoji: { fontSize: 20, marginTop: 1 },
  infoText: { flex: 1, fontSize: 13, color: '#555', lineHeight: 20 },
  logoutBtn: { backgroundColor: '#FFEBEE', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28, borderWidth: 1.5, borderColor: '#EF9A9A' },
  logoutText: { color: '#C62828', fontWeight: '700', fontSize: 14 },
});