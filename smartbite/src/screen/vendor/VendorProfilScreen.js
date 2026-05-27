import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { api } from '../../service/api';
import { customAlert } from '../../utils/alerthelper';

export default function VendorProfilScreen({ navigation, onLogout }) {
  const [toko, setToko] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── DUMMY STATS (Sampai fitur order aktif) ────────────
  const STATS = {
    totalSelesai: 128,
    totalPemasukan: 4320000,
    totalMenu: 8,
    rating: 4.8,
  };
  // ─────────────────────────────────────────────────────────

  const fetchProfilData = async () => {
    setLoading(true);
    try {
      // 1. Ambil data akun (email, username, no_hp) dari memori HP
      let userDataStr = Platform.OS === 'web' 
        ? localStorage.getItem('userData') 
        : await SecureStore.getItemAsync('userData');
      
      if (userDataStr) setUser(JSON.parse(userDataStr));

      // 2. Ambil data toko (nama toko, jam buka, emoji) dari MongoDB
      const res = await api.get('/toko/vendor/mytoko');
      setToko(res.data);
    } catch (error) {
      console.log("❌ ERROR FETCH PROFIL:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfilData();
    }, [])
  );

  // ── Fungsi Tombol Logout Asli ──
  const handleLogoutPress = () => {
    customAlert('Keluar?', 'Kamu yakin mau logout?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => onLogout && onLogout() },
    ]);
  };

  // Komponen MenuItem bawaanmu
  const MenuItem = ({ emoji, label, sub, onPress, danger, chevron = true }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.menuItemEmoji}>{emoji}</Text>
      <View style={styles.menuItemContent}>
        <Text style={[styles.menuItemLabel, danger && { color: '#EF5350' }]}>{label}</Text>
        {sub ? <Text style={styles.menuItemSub}>{sub}</Text> : null}
      </View>
      {chevron && <Text style={styles.menuItemChevron}>›</Text>}
    </TouchableOpacity>
  );

  if (loading && !toko) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' }}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={{ marginTop: 10, color: '#888' }}>Memuat profil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.header}>
          <View style={styles.avatarWrapper}>
            <Text style={styles.avatarEmoji}>{toko?.emoji || '🏪'}</Text>
          </View>
          <Text style={styles.headerNama}>{user?.nama || 'Nama Vendor'}</Text>
          <Text style={styles.headerUsername}>@{user?.username || 'username'}</Text>
          <View style={styles.ratingPill}>
            <Text style={styles.ratingText}>⭐ {STATS.rating} · {toko?.nama || 'Toko'}</Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{STATS.totalSelesai}</Text>
              <Text style={styles.statLabel}>Pesanan</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Rp {(STATS.totalPemasukan / 1000000).toFixed(1)}jt</Text>
              <Text style={styles.statLabel}>Pemasukan</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{STATS.totalMenu}</Text>
              <Text style={styles.statLabel}>Menu Aktif</Text>
            </View>
          </View>

          {/* ── Toko Section ── */}
          <Text style={styles.sectionTitle}>Toko Saya</Text>
          <TouchableOpacity style={styles.tokoCard} onPress={() => navigation.navigate('VendorToko')} activeOpacity={0.8}>
            <Text style={styles.tokoEmoji}>{toko?.emoji || '🏪'}</Text>
            <View style={styles.tokoInfo}>
              <View style={styles.tokoTopRow}>
                <Text style={styles.tokoNama}>{toko?.nama || 'Nama Toko'}</Text>
                <View style={[styles.tokoBadge, { backgroundColor: toko?.aktif ? '#E8F5E9' : '#FFEBEE' }]}>
                  <Text style={[styles.tokoBadgeText, { color: toko?.aktif ? '#2E7D32' : '#C62828' }]}>
                    {toko?.aktif ? '🟢 Buka' : '🔴 Tutup'}
                  </Text>
                </View>
              </View>
              <Text style={styles.tokoKategori}>{toko?.kategori || '-'}</Text>
              <Text style={styles.tokoJam}>🕐 {toko?.jam_buka || '-'} – {toko?.jam_tutup || '-'}</Text>
            </View>
            <Text style={styles.menuItemChevron}>›</Text>
          </TouchableOpacity>

          {/* ── Akun Section ── */}
          <Text style={styles.sectionTitle}>Informasi Akun</Text>
          <View style={styles.card}>
            {[
              { label: 'Email',    value: user?.email || '-',  icon: '📧' },
              { label: 'Nomor HP', value: user?.no_hp || '-',  icon: '📱' },
              { label: 'Username', value: `@${user?.username || '-'}`, icon: '👤' },
            ].map((item, i, arr) => (
              <View key={item.label}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>{item.icon}</Text>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{item.label}</Text>
                    <Text style={styles.infoValue}>{item.value}</Text>
                  </View>
                </View>
                {i < arr.length - 1 && <View style={styles.itemDivider} />}
              </View>
            ))}
          </View>

          {/* ── Pengaturan ── */}
          <Text style={styles.sectionTitle}>Pengaturan</Text>
          <View style={styles.card}>
            <MenuItem emoji="🏪" label="Pengaturan Toko" sub="Jam buka, QRIS, deskripsi" onPress={() => navigation.navigate('VendorToko')} />
            <View style={styles.itemDivider} />
            <MenuItem emoji="🔔" label="Notifikasi" sub="Pesanan masuk, promo" onPress={() => {}} />
            <View style={styles.itemDivider} />
            <MenuItem emoji="🔒" label="Ubah Password" onPress={() => {}} />
          </View>

          <View style={styles.card}>
            <MenuItem emoji="🚪" label="Logout" onPress={handleLogoutPress} danger />
          </View>

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  // Header
  header: { paddingTop: 70, paddingBottom: 28, alignItems: 'center' },
  avatarWrapper: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarEmoji: { fontSize: 44 },
  headerNama: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  headerUsername: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
  ratingPill: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  content: { padding: 16 },

  // Stats
  statsRow: { backgroundColor: '#fff', borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingVertical: 18, marginBottom: 20, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 17, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#888' },
  statDivider: { width: 1, height: 36, backgroundColor: '#F0F0F0' },

  // Section title
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Toko card
  tokoCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  tokoEmoji: { fontSize: 38 },
  tokoInfo: { flex: 1 },
  tokoTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  tokoNama: { fontSize: 15, fontWeight: 'bold', color: '#1A1A1A', flex: 1 },
  tokoBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  tokoBadgeText: { fontSize: 11, fontWeight: '700' },
  tokoKategori: { fontSize: 12, color: '#888', marginBottom: 2 },
  tokoJam: { fontSize: 11, color: '#aaa' },

  // Card
  card: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },

  // Info rows
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 12 },
  infoIcon: { fontSize: 18, width: 28 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#888', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },

  // Menu items
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  menuItemEmoji: { fontSize: 20, width: 28 },
  menuItemContent: { flex: 1 },
  menuItemLabel: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },
  menuItemSub: { fontSize: 11, color: '#aaa', marginTop: 2 },
  menuItemChevron: { fontSize: 20, color: '#ccc' },
  itemDivider: { height: 1, backgroundColor: '#F5F5F5' },
}); 