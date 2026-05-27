import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';

// ── DUMMY DATA ────────────────────────────────────────────
const DUMMY_TOKO = {
  nama: 'Warung Bu Sari',
  kategori: 'Nasi',
  deskripsi: 'Warung makan dengan menu nasi dan lauk pauk yang lezat dan terjangkau.',
  emoji: '🍱',
  aktif: true,
  jam_buka: '07:00',
  jam_tutup: '16:00',
  estimasi: '10-15',
  norek: '1234567890',
  qris: null,
  foto_url: null,
};

const KATEGORI_LIST = ['Nasi', 'Mie', 'Snack', 'Minuman', 'Masakan Rumahan', 'Lainnya'];
// ─────────────────────────────────────────────────────────

export default function VendorTokoScreen({ navigation }) {
  const [nama, setNama] = useState(DUMMY_TOKO.nama);
  const [kategori, setKategori] = useState(DUMMY_TOKO.kategori);
  const [deskripsi, setDeskripsi] = useState(DUMMY_TOKO.deskripsi);
  const [emoji, setEmoji] = useState(DUMMY_TOKO.emoji);
  const [aktif, setAktif] = useState(DUMMY_TOKO.aktif);
  const [jamBuka, setJamBuka] = useState(DUMMY_TOKO.jam_buka);
  const [jamTutup, setJamTutup] = useState(DUMMY_TOKO.jam_tutup);
  const [estimasi, setEstimasi] = useState(DUMMY_TOKO.estimasi);
  const [norek, setNorek] = useState(DUMMY_TOKO.norek);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      Alert.alert('Tersimpan! ✅', 'Data toko berhasil diperbarui.');
    }, 800);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Pengaturan Toko</Text>
            <Text style={styles.headerSub}>{nama}</Text>
          </View>
          <View style={styles.headerToggle}>
            <Text style={styles.headerToggleLabel}>{aktif ? '🟢 Buka' : '🔴 Tutup'}</Text>
            <Switch
              value={aktif}
              onValueChange={setAktif}
              trackColor={{ false: 'rgba(239,83,80,0.4)', true: 'rgba(76,175,80,0.4)' }}
              thumbColor={aktif ? '#4CAF50' : '#EF5350'}
            />
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

          {/* ── Info Toko ── */}
          <Text style={styles.sectionTitle}>Info Toko</Text>
          <View style={styles.card}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Nama Toko</Text>
              <TextInput style={styles.input} value={nama} onChangeText={setNama} placeholderTextColor="#aaa" />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Emoji Toko</Text>
              <TextInput style={styles.input} value={emoji} onChangeText={setEmoji} placeholderTextColor="#aaa" />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Deskripsi</Text>
              <TextInput style={[styles.input, styles.inputMultiline]} value={deskripsi} onChangeText={setDeskripsi} multiline numberOfLines={3} placeholderTextColor="#aaa" />
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
          </View>

          {/* ── Jam Operasional ── */}
          <Text style={styles.sectionTitle}>Jam Operasional</Text>
          <View style={styles.card}>
            <View style={styles.jamRow}>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Jam Buka</Text>
                <TextInput style={styles.input} value={jamBuka} onChangeText={setJamBuka} placeholder="07:00" placeholderTextColor="#aaa" />
              </View>
              <Text style={styles.jamSeparator}>–</Text>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Jam Tutup</Text>
                <TextInput style={styles.input} value={jamTutup} onChangeText={setJamTutup} placeholder="16:00" placeholderTextColor="#aaa" />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Estimasi Siap (menit)</Text>
              <TextInput style={styles.input} value={estimasi} onChangeText={setEstimasi} placeholder="10-15" placeholderTextColor="#aaa" keyboardType="default" />
            </View>
          </View>

          {/* ── Pembayaran ── */}
          <Text style={styles.sectionTitle}>Info Pembayaran</Text>
          <View style={styles.card}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Nomor Rekening</Text>
              <TextInput style={styles.input} value={norek} onChangeText={setNorek} placeholder="Nomor rekening toko" placeholderTextColor="#aaa" keyboardType="number-pad" />
            </View>

            <TouchableOpacity style={styles.uploadQrisBtn} activeOpacity={0.8}>
              <Text style={styles.uploadQrisIcon}>📷</Text>
              <Text style={styles.uploadQrisText}>Upload Foto QRIS</Text>
            </TouchableOpacity>
          </View>

          {/* Save button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
            <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.saveBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.saveBtnText}>{saving ? 'Menyimpan...' : '💾 Simpan Perubahan'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 55, paddingBottom: 16, paddingHorizontal: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  backIcon: { fontSize: 26, color: '#1a1a1a', lineHeight: 30, marginTop: -2 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 1 },
  headerToggle: { alignItems: 'center', gap: 2 },
  headerToggleLabel: { fontSize: 11, fontWeight: '700', color: '#1a1a1a' },
  content: { padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 10, marginTop: 8 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  inputWrapper: { marginBottom: 14 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 7 },
  input: { backgroundColor: '#F5F7FA', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1A1A1A', borderWidth: 1, borderColor: '#E8ECF0' },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  kategoriGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kategoriChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, backgroundColor: '#F5F7FA', borderWidth: 1, borderColor: '#E8ECF0' },
  kategoriChipActive: { backgroundColor: '#1565C0', borderColor: '#1565C0' },
  kategoriChipText: { fontSize: 12, fontWeight: '600', color: '#666' },
  kategoriChipTextActive: { color: '#fff' },
  jamRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  jamSeparator: { fontSize: 18, color: '#888', paddingBottom: 14 },
  uploadQrisBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F5F7FA', borderRadius: 10, paddingVertical: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#1565C0' },
  uploadQrisIcon: { fontSize: 20 },
  uploadQrisText: { fontSize: 13, fontWeight: '600', color: '#1565C0' },
  saveBtn: { borderRadius: 14, overflow: 'hidden', elevation: 3, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, marginTop: 8 },
  saveBtnGradient: { paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});