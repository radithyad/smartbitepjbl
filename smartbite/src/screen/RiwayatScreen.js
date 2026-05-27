import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../service/supabase';

export default function RiwayatScreen({ navigation }) {
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sudahUlasan, setSudahUlasan] = useState({});

  useFocusEffect(useCallback(() => { fetchRiwayat(); }, []));

  const fetchUlasan = async (orderIds) => {
    if (!orderIds.length) return;
    const { data } = await supabase.from('ulasan').select('order_id').in('order_id', orderIds);
    if (data) {
      const map = {};
      data.forEach(u => { map[u.order_id] = true; });
      setSudahUlasan(map);
    }
  };

  const fetchRiwayat = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('orders')
      .select(`*, toko (id, nama, emoji, kategori), order_items (nama_menu, qty, harga)`)
      .eq('customer_id', user.id)
      .eq('status', 'selesai')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setRiwayat(data);
      await fetchUlasan(data.map(o => o.id));
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat Pesanan</Text>
        <Text style={styles.headerSub}>Semua pesanan kamu sebelumnya</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1565C0" />
          <Text style={styles.loadingText}>Memuat riwayat...</Text>
        </View>
      ) : riwayat.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>Belum ada riwayat pesanan</Text>
          <Text style={styles.emptyDesc}>Pesanan yang sudah selesai akan muncul di sini</Text>
          <TouchableOpacity style={styles.orderButton} onPress={() => navigation.navigate('Home')} activeOpacity={0.8}>
            <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.orderButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.orderButtonText}>Pesan Sekarang 🍱</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {riwayat.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.cardTop}>
                <View style={styles.tokoRow}>
                  <Text style={styles.tokoEmoji}>{order.toko?.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tokoNama}>{order.toko?.nama}</Text>
                    <Text style={styles.tanggal}>{new Date(order.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>✅ Selesai</Text>
                </View>
              </View>
              <View style={styles.divider} />
              {order.order_items?.map((item, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.itemNama}>{item.nama_menu}</Text>
                  <Text style={styles.itemQty}>x{item.qty}</Text>
                  <Text style={styles.itemHarga}>Rp {(item.harga * item.qty).toLocaleString('id-ID')}</Text>
                </View>
              ))}
              <View style={styles.divider} />
              <View style={styles.cardBottom}>
                <View>
                  <Text style={styles.metodeText}>💳 {order.metode_bayar}</Text>
                  <Text style={styles.orderIdText}>#{order.id.split('-')[0].toUpperCase()}</Text>
                </View>
                <Text style={styles.totalText}>Rp {order.total_harga.toLocaleString('id-ID')}</Text>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.ulasanBtn, sudahUlasan[order.id] && styles.ulasanBtnDisabled]}
                  activeOpacity={sudahUlasan[order.id] ? 1 : 0.8}
                  onPress={() => { if (!sudahUlasan[order.id]) navigation.navigate('Ulasan', { order }); }}
                >
                  <Text style={[styles.ulasanText, sudahUlasan[order.id] && styles.ulasanTextDisabled]}>
                    {sudahUlasan[order.id] ? '✅ Sudah Diulas' : '⭐ Beri Ulasan'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pesanLagiBtn} activeOpacity={0.8} onPress={() => navigation.navigate('DetailToko', { toko: order.toko })}>
                  <Text style={styles.pesanLagiText}>🔁 Pesan Lagi</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={{ height: 30 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#fff', paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  headerSub: { fontSize: 13, color: '#888', marginTop: 2 },
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
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 8 },
  tokoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  tokoEmoji: { fontSize: 30 },
  tokoNama: { fontSize: 14, fontWeight: 'bold', color: '#1a1a1a' },
  tanggal: { fontSize: 11, color: '#888', marginTop: 2 },
  statusBadge: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, color: '#2E7D32', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  itemNama: { flex: 1, fontSize: 13, color: '#1a1a1a' },
  itemQty: { fontSize: 13, color: '#888', marginRight: 10 },
  itemHarga: { fontSize: 13, fontWeight: '700', color: '#1565C0' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metodeText: { fontSize: 12, color: '#666' },
  orderIdText: { fontSize: 11, color: '#aaa', marginTop: 2 },
  totalText: { fontSize: 15, fontWeight: 'bold', color: '#1565C0' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  ulasanBtn: { flex: 1, backgroundColor: '#FFF8E1', borderRadius: 10, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: '#FFC107' },
  ulasanBtnDisabled: { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' },
  ulasanText: { color: '#F57F17', fontWeight: '600', fontSize: 13 },
  ulasanTextDisabled: { color: '#aaa' },
  pesanLagiBtn: { flex: 1, backgroundColor: '#E3F2FD', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  pesanLagiText: { color: '#1565C0', fontWeight: '600', fontSize: 13 },
});