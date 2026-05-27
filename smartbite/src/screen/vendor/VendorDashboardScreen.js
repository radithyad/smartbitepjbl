import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Image, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../service/api';
import { customAlert } from '../../utils/alerthelper';

// ── DUMMY DATA SEMENTARA (Tunggu fitur order selesai) ──────
const DUMMY_STATS = {
  hariIni: 185000,
  orderAktif: 3,
  selesaiHariIni: 12,
};

const DUMMY_ORDERS = [
  { id: 'ord-001', items: 'Nasi Ayam x2, Es Teh x2',       waktu: '11:42', status: 'menunggu', total: 38000 },
  { id: 'ord-002', items: 'Nasi Goreng x1, Jus Jeruk x1',  waktu: '11:30', status: 'diproses', total: 25000 },
  { id: 'ord-003', items: 'Mie Goreng x2',                 waktu: '11:15', status: 'siap',     total: 24000 },
  { id: 'ord-004', items: 'Nasi Soto x1',                  waktu: '10:55', status: 'selesai',  total: 15000 },
  { id: 'ord-005', items: 'Nasi Rendang x1, Teh Manis x1', waktu: '10:30', status: 'selesai',  total: 28000 },
];

const STATUS_INFO = {
  menunggu: { bg: '#FFF8E1', color: '#F57F17', label: 'Menunggu' },
  diproses: { bg: '#E3F2FD', color: '#1565C0', label: 'Diproses' },
  siap:     { bg: '#E8F5E9', color: '#2E7D32', label: 'Siap'     },
  selesai:  { bg: '#F5F5F5', color: '#888',    label: 'Selesai'  },
  ditolak:  { bg: '#FFEBEE', color: '#C62828', label: 'Ditolak'  },
};
// ─────────────────────────────────────────────────────────

export default function VendorDashboardScreen({ navigation }) {
  const [toko, setToko] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  // ── Tarik Data Asli dari MongoDB ─────────────────────────
  const fetchTokoData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/toko/vendor/mytoko');
      setToko(res.data);
    } catch (error) {
      console.log("❌ ERROR FETCH TOKO:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTokoData();
    }, [])
  );

  // ── Fungsi Buka/Tutup Toko Asli ke MongoDB ───────────────
  const toggleStatusToko = async (newValue) => {
    if (!toko) return;
    setIsUpdating(true);
    
    // Ubah di layar duluan biar responsif
    setToko({ ...toko, aktif: newValue });

    try {
      await api.put('/toko/vendor/update', { aktif: newValue });
    } catch (error) {
      customAlert('Gagal', 'Tidak dapat mengubah status toko. Cek koneksi.');
      // Balikin seperti semula kalau API error
      setToko({ ...toko, aktif: !newValue });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading && !toko) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' }}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={{ marginTop: 10, color: '#888' }}>Memuat tokomu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* ── Header ── */}
        <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.header}>

          {/* Top row */}
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerDate}>{today}</Text>
              <Text style={styles.headerGreeting}>Hi, {toko?.nama || 'Juragan'}!</Text>
              <Text style={styles.headerKategori}>{toko?.kategori || 'Kategori'}</Text>
            </View>

            {/* Profile button */}
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('VendorProfil')}
              activeOpacity={0.8}
            >
              {toko?.foto_url ? (
                <Image source={{ uri: toko.foto_url }} style={styles.profileImage} />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Text style={{ fontSize: 20 }}>{toko?.emoji || '👤'}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Toggle buka/tutup */}
          <View style={styles.toggleCard}>
            <View style={styles.toggleLeft}>
              <View style={[styles.toggleDot, { backgroundColor: toko?.aktif ? '#4CAF50' : '#EF5350' }]} />
              <View>
                <Text style={styles.toggleLabel}>{toko?.aktif ? 'Toko Sedang Buka' : 'Toko Sedang Tutup'}</Text>
                <Text style={styles.toggleSub}>Jam operasional: {toko?.jam_buka || '-'} – {toko?.jam_tutup || '-'}</Text>
              </View>
            </View>
            <Switch
              value={toko?.aktif || false}
              onValueChange={toggleStatusToko}
              disabled={isUpdating}
              trackColor={{ false: 'rgba(239,83,80,0.35)', true: 'rgba(76,175,80,0.35)' }}
              thumbColor={toko?.aktif ? '#4CAF50' : '#EF5350'}
            />
          </View>

        </LinearGradient>

        {/* ── Body container ── */}
        <View style={styles.bodyContainer}>

          {/* Stats 3 kolom */}
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={[styles.statCard]}
              onPress={() => navigation.navigate('VendorPesanan')}
              activeOpacity={0.8}
            >
              <Text style={styles.statIcon}>🛎️</Text>
              <Text style={[styles.statValue, { color: '#E65100' }]}>{DUMMY_STATS.orderAktif}</Text>
              <Text style={styles.statLabel}>Pesanan{'\n'}Aktif</Text>
              {DUMMY_STATS.orderAktif > 0 && <View style={styles.alertDot} />}
            </TouchableOpacity>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={styles.statValue}>Rp {(DUMMY_STATS.hariIni / 1000).toFixed(0)}k</Text>
              <Text style={styles.statLabel}>Pemasukan{'\n'}Hari Ini</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>✅</Text>
              <Text style={styles.statValue}>{DUMMY_STATS.selesaiHariIni}</Text>
              <Text style={styles.statLabel}>Pesanan Selesai{'\n'}Hari Ini</Text>
            </View>
          </View>

          {/* Pesanan Terbaru */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Pesanan Terbaru</Text>
            <TouchableOpacity onPress={() => navigation.navigate('VendorPesanan')} activeOpacity={0.7}>
              <Text style={styles.seeAll}>Lihat semua →</Text>
            </TouchableOpacity>
          </View>

          {DUMMY_ORDERS.map((order) => {
            const s = STATUS_INFO[order.status];
            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => navigation.navigate('VendorDetailPesanan', { orderId: order.id })}
                activeOpacity={0.8}
              >
                <View style={styles.orderLeft}>
                  <Text style={styles.orderId}>#{order.id.toUpperCase()}</Text>
                  <Text style={styles.orderItems} numberOfLines={1}>{order.items}</Text>
                  <Text style={styles.orderTime}>🕐 {order.waktu}</Text>
                </View>
                <View style={styles.orderRight}>
                  <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                    <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                  </View>
                  <Text style={styles.orderTotal}>Rp {order.total.toLocaleString('id-ID')}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  // ── Header ──
  header: { paddingTop: 58, paddingHorizontal: 20, paddingBottom: 32 },

  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 20,
  },
  headerDate: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: 5 },
  headerGreeting: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 3 },
  headerKategori: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },

  // Profile button — same as HomeScreen
  profileButton: { padding: 2 },
  profileImage: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
  },
  profilePlaceholder: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },

  // Toggle card
  toggleCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  toggleDot: { width: 10, height: 10, borderRadius: 5 },
  toggleLabel: { fontSize: 13, fontWeight: '700', color: '#fff' },
  toggleSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // ── Body ──
  bodyContainer: {
    backgroundColor: '#F5F7FA',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    marginTop: -20, padding: 20,
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14,
    alignItems: 'center', position: 'relative',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
  },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4, textAlign: 'center' },
  statLabel: { fontSize: 10, color: '#888', fontWeight: '500', textAlign: 'center', lineHeight: 14 },
  alertDot: {
    position: 'absolute', top: 10, right: 10,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#E65100',
  },

  // Pesanan terbaru
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1A1A1A' },
  seeAll: { fontSize: 13, color: '#1565C0', fontWeight: '600' },
  orderCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  orderLeft: { flex: 1, marginRight: 12 },
  orderId: { fontSize: 13, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 3 },
  orderItems: { fontSize: 12, color: '#888', marginBottom: 3 },
  orderTime: { fontSize: 11, color: '#aaa' },
  orderRight: { alignItems: 'flex-end', gap: 6 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  orderTotal: { fontSize: 13, fontWeight: 'bold', color: '#1565C0' },
});