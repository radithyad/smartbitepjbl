import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../service/api';
import { customAlert } from '../../utils/alerthelper';

const STATUS_INFO = {
  menunggu: { bg: '#FFF8E1', color: '#F57F17', label: '🔔 Menunggu Konfirmasi' },
  diproses: { bg: '#E3F2FD', color: '#1565C0', label: '👨‍🍳 Sedang Diproses'    },
  siap:     { bg: '#E8F5E9', color: '#2E7D32', label: '✅ Siap Diambil'         },
  selesai:  { bg: '#F5F5F5', color: '#888',    label: '🏁 Selesai'              },
  ditolak:  { bg: '#FFEBEE', color: '#C62828', label: '❌ Ditolak'              },
};

export default function VendorDetailPesananScreen({ navigation, route }) {
  // Tangkap data pesanan penuh dari layar sebelumnya
  const order = route?.params?.order;
  
  if (!order) {
    return <View style={styles.container}><Text style={{textAlign: 'center', marginTop: 100}}>Data tidak ditemukan</Text></View>;
  }

  const orderId = order._id || order.id;
  const statusInfo = STATUS_INFO[order.status] || STATUS_INFO['menunggu'];
  const waktuOrder = new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const tanggalOrder = new Date(order.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // ── Fungsi Update Status ke Backend ──
  const updateStatus = async (newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      navigation.goBack(); // Kembali ke daftar pesanan, otomatis ke-refresh oleh useFocusEffect
    } catch (error) {
      customAlert('Gagal', 'Tidak dapat mengubah status pesanan.');
    }
  };

  const handleTerima = () => {
    customAlert('Terima Pesanan?', 'Pesanan akan mulai diproses.', [

      { text: 'Batal', style: 'cancel' },
      { text: 'Terima', onPress: () => updateStatus('diproses') },
    ]);
  };

  const handleTolak = () => {
    customAlert('Tolak Pesanan?', 'Pesanan akan ditolak dan customer akan diberitahu.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Tolak', style: 'destructive', onPress: () => updateStatus('ditolak') },
    ]);
  };

  const handleSiap = () => {
    customAlert('Pesanan Siap?', 'Tandai pesanan siap diambil oleh customer.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Siap!', onPress: () => updateStatus('siap') },
    ]);
  };

  const handleSelesai = () => {
    customAlert('Tandai Selesai?', 'Pesanan sudah diambil oleh customer.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Selesai', onPress: () => updateStatus('selesai') },
    ]);
  };

  const handleNotifCustomer = () => {
    customAlert(
      '🔔 Kirim Notifikasi',
      'Pilih estimasi waktu untuk dikirim ke customer:',
      [
        { text: '⏱ Siap dalam 10 menit', onPress: () => customAlert('Terkirim! ✅', 'Customer sudah diberitahu pesanan siap dalam 10 menit.') },
        { text: '⏱ Siap dalam 5 menit',  onPress: () => customAlert('Terkirim! ✅', 'Customer sudah diberitahu pesanan siap dalam 5 menit.')  },
        { text: '⏱ Siap dalam 2 menit',  onPress: () => customAlert('Terkirim! ✅', 'Customer sudah diberitahu pesanan siap dalam 2 menit.')  },
        { text: 'Batal', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>

      {/* ── Header — CheckoutScreen style ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Detail Pesanan</Text>
          <Text style={styles.headerSub}>{order.kode_pickup || `#${orderId.slice(0,6).toUpperCase()}`}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusInfo.bg }]}>
          <Text style={[styles.statusBannerLabel, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          <Text style={[styles.statusBannerTime,  { color: statusInfo.color }]}>🕐 {waktuOrder} · {tanggalOrder}</Text>
        </View>

        {/* Info Pemesan */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 Info Pemesan</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nama</Text>
            {/* Mengambil nama dari relasi customer_id MongoDB */}
            <Text style={styles.infoValue}>{order.customer_id?.nama || order.customer || 'Customer'}</Text>
          </View>
          <View style={[styles.infoRow, { marginBottom: 0 }]}>
            <Text style={styles.infoLabel}>Metode Bayar</Text>
            <View style={[
              styles.metodeBadge,
              order.metode_bayar === 'QRIS'          && { backgroundColor: '#F3E5F5' },
              order.metode_bayar === 'Transfer Bank' && { backgroundColor: '#E3F2FD' },
              order.metode_bayar === 'Tunai'         && { backgroundColor: '#E8F5E9' },
            ]}>
              <Text style={[
                styles.metodeText,
                order.metode_bayar === 'QRIS'          && { color: '#6A1B9A' },
                order.metode_bayar === 'Transfer Bank' && { color: '#1565C0' },
                order.metode_bayar === 'Tunai'         && { color: '#2E7D32' },
              ]}>💳 {order.metode_bayar}</Text>
            </View>
          </View>
        </View>

        {/* Daftar Pesanan */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🍽️ Daftar Pesanan</Text>
          {order.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemNama}>{item.nama_menu || item.nama}</Text>
              <Text style={styles.itemQty}>x{item.qty}</Text>
              <Text style={styles.itemHarga}>Rp {(item.harga * item.qty).toLocaleString('id-ID')}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Pembayaran</Text>
            <Text style={styles.totalValue}>Rp {(order.total_harga || order.total).toLocaleString('id-ID')}</Text>
          </View>
        </View>

        {/* Catatan */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📝 Catatan Customer</Text>
          {order.catatan ? (
            <View style={styles.catatanBox}>
              <Text style={styles.catatanText}>{order.catatan}</Text>
            </View>
          ) : (
            <Text style={styles.noCatatan}>Tidak ada catatan dari customer</Text>
          )}
        </View>

        {/* Bukti Bayar */}
        {(order.metode_bayar === 'QRIS' || order.metode_bayar === 'Transfer Bank') && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🧾 Bukti Pembayaran</Text>
            {order.bukti_bayar ? (
              <Image source={{ uri: order.bukti_bayar }} style={styles.buktiBayarImg} resizeMode="cover" />
            ) : (
              <View style={styles.buktiEmpty}>
                <Text style={styles.buktiEmptyEmoji}>📷</Text>
                <Text style={styles.buktiEmptyText}>Bukti pembayaran belum dikirim</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Action Buttons ── */}
        <View style={styles.actionRow}>

          {/* MENUNGGU: 3 button sama besar */}
          {order.status === 'menunggu' && (
            <>
              <TouchableOpacity style={[styles.btn, styles.btnOutlineRed]} onPress={handleTolak} activeOpacity={0.8}>
                <Text style={styles.btnTextRed}>❌ Tolak</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleTerima} activeOpacity={0.8}>
                <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.btnTextWhite}>✅ Terima</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {/* DIPROSES: 2 button sama besar */}
          {order.status === 'diproses' && (
            <>
              <TouchableOpacity style={[styles.btn, styles.btnOutlineYellow]} onPress={handleNotifCustomer} activeOpacity={0.8}>
                <Text style={styles.btnTextYellow}>🔔 Notif Customer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleSiap} activeOpacity={0.8}>
                <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.btnTextWhite}>🍽️ Tandai Siap</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {/* SIAP: 1 button full width */}
          {order.status === 'siap' && (
            <TouchableOpacity style={[styles.btn, styles.btnPrimary, { flex: 1 }]} onPress={handleSelesai} activeOpacity={0.8}>
              <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.btnTextWhite}>✅ Tandai Sudah Diambil</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  // ── Header — CheckoutScreen style ──
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

  content: { paddingHorizontal: 16, paddingTop: 16 },

  // Status Banner
  statusBanner: { borderRadius: 14, padding: 16, marginBottom: 12 },
  statusBannerLabel: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  statusBannerTime: { fontSize: 12, opacity: 0.8 },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 14 },

  // Info rows
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  infoLabel: { fontSize: 13, color: '#888' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  metodeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  metodeText: { fontSize: 12, fontWeight: '700' },

  // Items
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  itemNama: { flex: 1, fontSize: 13, color: '#1A1A1A', fontWeight: '500' },
  itemQty: { fontSize: 13, color: '#888', marginRight: 12 },
  itemHarga: { fontSize: 13, fontWeight: '700', color: '#1565C0' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a' },
  totalValue: { fontSize: 15, fontWeight: 'bold', color: '#1565C0' },

  // Catatan
  catatanBox: { backgroundColor: '#FFF8E1', borderRadius: 10, padding: 12, borderLeftWidth: 3, borderLeftColor: '#FFC107' },
  catatanText: { fontSize: 13, color: '#F57F17', lineHeight: 20 },
  noCatatan: { fontSize: 13, color: '#ccc', fontStyle: 'italic' },

  // Bukti bayar
  buktiBayarImg: { width: '100%', height: 200, borderRadius: 12 },
  buktiEmpty: { height: 120, backgroundColor: '#F5F7FA', borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8 },
  buktiEmptyEmoji: { fontSize: 36 },
  buktiEmptyText: { fontSize: 13, color: '#888' },

  // ── Buttons — all equal size, same style ──
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  btn: { flex: 1, borderRadius: 10, overflow: 'hidden' },

  btnOutlineRed:    { backgroundColor: '#FFF3F3', borderWidth: 1, borderColor: '#EF5350', paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  btnTextRed:       { color: '#EF5350', fontWeight: '600', fontSize: 13 },

  btnOutlineGray:   { backgroundColor: '#F5F7FA', borderWidth: 1, borderColor: '#E0E0E0', paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  btnTextGray:      { color: '#555', fontWeight: '600', fontSize: 13 },

  btnOutlineYellow: { backgroundColor: '#FFF8E1', borderWidth: 1, borderColor: '#FFC107', paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  btnTextYellow:    { color: '#F57F17', fontWeight: '600', fontSize: 13 },

  btnPrimary: { elevation: 2, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  btnGradient: { paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  btnTextWhite: { color: '#fff', fontWeight: '700', fontSize: 13 },
});