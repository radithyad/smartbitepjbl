import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../service/api';
import { customAlert } from '../utils/alerthelper';

const STATUS_LABEL = {
  menunggu:   { label: 'Menunggu Konfirmasi', emoji: '📋', color: '#F57F17', bg: '#FFF8E1' },
  diproses:   { label: 'Sedang Diproses',     emoji: '👨‍🍳', color: '#1565C0', bg: '#E3F2FD' },
  siap:       { label: 'Siap Diambil!',       emoji: '✅', color: '#2E7D32', bg: '#E8F5E9' },
  selesai:    { label: 'Selesai',             emoji: '🏁', color: '#888888', bg: '#F5F5F5' },
  ditolak:    { label: 'Ditolak Penjual',     emoji: '❌', color: '#C62828', bg: '#FFEBEE' },
  dibatalkan: { label: 'Dibatalkan',          emoji: '🗑️', color: '#C62828', bg: '#FFEBEE' },
};

export default function AktivitasScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('berjalan'); // 'berjalan' atau 'riwayat'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const timestamp = new Date().getTime();
      const response = await api.get(`/orders/me?t=${timestamp}`);
      // Urutkan dari yang paling baru
      const sortedData = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sortedData);
    } catch (error) {
      console.log("Gagal memuat pesanan:", error.message);
    }
    setLoading(false);
  };

  const handleCancel = (orderId) => {
    customAlert('Batalkan Pesanan?', 'Pesanan yang dibatalkan tidak bisa dikembalikan. Yakin?', [
      { text: 'Tidak', style: 'cancel' },
      { text: 'Ya, Batalkan', style: 'destructive', onPress: async () => {
        try {
          await api.put(`/orders/${orderId}/status`, { status: 'dibatalkan' });
          customAlert('Dibatalkan', 'Pesananmu berhasil dibatalkan.'); 
          fetchOrders(); 
        } catch (error) {
          customAlert('Gagal', 'Tidak bisa membatalkan pesanan.');
        }
      }},
    ]);
  };

  // Pisahkan pesanan berdasarkan status
  const activeOrders = orders.filter(o => ['menunggu', 'diproses', 'siap'].includes(o.status));
  const historyOrders = orders.filter(o => ['selesai', 'ditolak', 'dibatalkan'].includes(o.status));

  const displayData = activeTab === 'berjalan' ? activeOrders : historyOrders;

  return (
    <View style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Aktivitas</Text>
        <Text style={styles.headerSub}>Pantau semua pesananmu di sini</Text>
      </View>

      {/* Top Tab Bar */}
      <View style={styles.topTabBar}>
        <TouchableOpacity 
          style={[styles.topTabButton, activeTab === 'berjalan' && styles.topTabActive]} 
          onPress={() => setActiveTab('berjalan')}
          activeOpacity={0.8}
        >
          <Text style={[styles.topTabText, activeTab === 'berjalan' && styles.topTabTextActive]}>Sedang Berjalan</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.topTabButton, activeTab === 'riwayat' && styles.topTabActive]} 
          onPress={() => setActiveTab('riwayat')}
          activeOpacity={0.8}
        >
          <Text style={[styles.topTabText, activeTab === 'riwayat' && styles.topTabTextActive]}>Riwayat</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1565C0" />
          <Text style={styles.loadingText}>Memuat pesanan...</Text>
        </View>
      ) : displayData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>{activeTab === 'berjalan' ? '🍽️' : '📭'}</Text>
          <Text style={styles.emptyTitle}>
            {activeTab === 'berjalan' ? 'Tidak ada pesanan aktif' : 'Belum ada riwayat pesanan'}
          </Text>
          <Text style={styles.emptyDesc}>
            {activeTab === 'berjalan' ? 'Pesanan yang sedang diproses akan muncul di sini' : 'Pesanan yang sudah selesai atau batal akan muncul di sini'}
          </Text>
          {activeTab === 'berjalan' && (
            <TouchableOpacity style={styles.orderButton} onPress={() => navigation.navigate('Home')} activeOpacity={0.8}>
              <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.orderButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.orderButtonText}>Pesan Sekarang 🍱</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {displayData.map((order) => {
            const orderId = order._id || order.id;
            const s = STATUS_LABEL[order.status] || STATUS_LABEL['menunggu'];
            const toko = order.toko_id || order.toko || {};
            
            return (
              <View key={orderId} style={styles.orderCard}>
                
                {/* Bagian Atas Card */}
                <View style={styles.cardTop}>
                  <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                    <Text style={[styles.statusText, { color: s.color }]}>{s.emoji} {s.label}</Text>
                  </View>
                  <Text style={styles.tanggalText}>
                    {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                {/* Info Toko */}
                <View style={styles.tokoRow}>
                  <Text style={styles.tokoEmoji}>{toko.emoji || '🏪'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tokoNama}>{toko.nama || 'Nama Toko'}</Text>
                    <Text style={styles.orderIdText}>{order.kode_pickup || `#${orderId.slice(0,6).toUpperCase()}`}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Daftar Item */}
                {order.items?.map((item, i) => (
                  <View key={i} style={styles.itemRow}>
                    <Text style={styles.itemNama} numberOfLines={1}>{item.nama_menu || item.nama}</Text>
                    <Text style={styles.itemQty}>x{item.qty}</Text>
                    <Text style={styles.itemHarga}>Rp {(item.harga * item.qty).toLocaleString('id-ID')}</Text>
                  </View>
                ))}

                <View style={styles.divider} />

                {/* Bagian Bawah */}
                <View style={styles.orderBottom}>
                  <Text style={styles.metodeText}>💳 {order.metode_bayar}</Text>
                  <Text style={styles.totalText}>Rp {(order.total_harga || order.total).toLocaleString('id-ID')}</Text>
                </View>

                {/* Alert & Actions khusus Berjalan */}
                {activeTab === 'berjalan' && (
                  <>
                    {order.status === 'siap' && (
                      <View style={styles.pickupAlert}>
                        <Text style={styles.pickupAlertText}>🎉 Segera ke {toko.nama || 'toko'} untuk pickup!</Text>
                      </View>
                    )}
                    {order.status === 'menunggu' && (
                      <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancel(orderId)} activeOpacity={0.8}>
                        <Text style={styles.cancelText}>❌ Batalkan Pesanan</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {/* Actions khusus Riwayat */}
                {activeTab === 'riwayat' && order.status === 'selesai' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      // 👇 Sytle bakal otomatis berubah jadi abu-abu kalau sudah diulas
                      style={[styles.ulasanBtn, order.is_reviewed && styles.ulasanBtnDisabled]} 
                      activeOpacity={order.is_reviewed ? 1 : 0.8} 
                      // 👇 Matikan fungsi pencet tombol bawaan React Native
                      disabled={order.is_reviewed} 
                      onPress={() => {
                        if (!order.is_reviewed) navigation.navigate('Ulasan', { order });
                      }}
                    >
                      {/* 👇 Teks otomatis berubah kalau sudah diulas */}
                      <Text style={[styles.ulasanText, order.is_reviewed && styles.ulasanTextDisabled]}>
                        {order.is_reviewed ? '✅ Sudah Diulas' : '⭐ Beri Ulasan'}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.pesanLagiBtn} activeOpacity={0.8} onPress={() => navigation.navigate('DetailToko', { toko: toko })}>
                      <Text style={styles.pesanLagiText}>🔁 Pesan Lagi</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#fff', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  headerSub: { fontSize: 13, color: '#888', marginTop: 2 },
  
  // ── Top Tab Bar Baru ──
  topTabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  topTabButton: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  topTabActive: { borderBottomColor: '#1565C0' },
  topTabText: { fontSize: 14, fontWeight: '600', color: '#888' },
  topTabTextActive: { color: '#1565C0' },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#888' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 70, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8, textAlign: 'center' },
  emptyDesc: { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  orderButton: { borderRadius: 14, overflow: 'hidden', elevation: 4, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  orderButtonGradient: { paddingVertical: 14, paddingHorizontal: 32 },
  orderButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  orderCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  tanggalText: { fontSize: 11, color: '#888' },
  
  tokoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tokoEmoji: { fontSize: 30 },
  tokoNama: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a' },
  orderIdText: { fontSize: 12, color: '#888', marginTop: 2, fontWeight: '600' },
  
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  itemNama: { flex: 1, fontSize: 13, color: '#1a1a1a' },
  itemQty: { fontSize: 13, color: '#888', marginRight: 10 },
  itemHarga: { fontSize: 13, fontWeight: '700', color: '#1565C0' },
  
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metodeText: { fontSize: 12, color: '#666', fontWeight: '500' },
  totalText: { fontSize: 16, fontWeight: 'bold', color: '#1565C0' },
  
  pickupAlert: { backgroundColor: '#E8F5E9', borderRadius: 10, padding: 10, marginTop: 14, borderWidth: 1, borderColor: '#4CAF50' },
  pickupAlertText: { fontSize: 13, color: '#2E7D32', fontWeight: '600', textAlign: 'center' },
  cancelButton: { backgroundColor: '#FFF3F3', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 14, borderWidth: 1, borderColor: '#EF5350' },
  cancelText: { color: '#EF5350', fontWeight: '600', fontSize: 13 },
  
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  ulasanBtn: { flex: 1, backgroundColor: '#FFF8E1', borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#FFC107' },
  ulasanText: { color: '#F57F17', fontWeight: '600', fontSize: 13 },
  pesanLagiBtn: { flex: 1, backgroundColor: '#E3F2FD', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  pesanLagiText: { color: '#1565C0', fontWeight: '600', fontSize: 13 },

  ulasanBtnDisabled: { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' },
  ulasanTextDisabled: { color: '#aaa' },
});