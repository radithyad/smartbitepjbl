import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef } from 'react';
import { api } from '../service/api'; 
import { sendOrderStatusNotification } from '../service/notification';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const STATUS_STEPS = [
  { id: 1, key: 'menunggu', label: 'Pesanan Diterima', desc: 'Pesanan kamu sudah masuk ke toko', icon: 'time-outline', lib: 'Ionicons' },
  { id: 2, key: 'diproses', label: 'Sedang Diproses', desc: 'Penjual sedang menyiapkan pesananmu', icon: 'chef-hat', lib: 'MaterialCommunityIcons' },
  { id: 3, key: 'siap', label: 'Pesanan Siap', desc: 'Pesanan siap diambil di toko!', icon: 'bag-check-outline', lib: 'Ionicons' },
];

export default function StatusOrderScreen({ route, navigation }) {
  const { toko, totalHarga, catatan, metodeBayar, itemDiKeranjang, keranjang, orderId } = route.params;
  const [currentStatus, setCurrentStatus] = useState(1);
  const [orderData, setOrderData] = useState(null); 
  
  const lastStatusRef = useRef('menunggu');

  const routes = navigation.getState()?.routes;
  const prevRoute = routes ? routes[routes.length - 2]?.name : '';
  const isFromCheckout = prevRoute === 'Checkout';

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const timestamp = new Date().getTime();
        const response = await api.get(`/orders/me?t=${timestamp}`);
        
        const myOrder = response.data.find(o => (o._id === orderId) || (o.id === orderId));
        
        if (myOrder) {
          setOrderData(myOrder);
          
          if (myOrder.status !== lastStatusRef.current) {
            sendOrderStatusNotification(myOrder.status, toko.nama, orderId);
            lastStatusRef.current = myOrder.status;
          }

          if (myOrder.status === 'menunggu') setCurrentStatus(1);
          else if (myOrder.status === 'diproses') setCurrentStatus(2);
          else if (myOrder.status === 'siap' || myOrder.status === 'selesai') setCurrentStatus(3);
          else if (myOrder.status === 'ditolak') setCurrentStatus(0); 
        }
      } catch (error) {
        console.log("Gagal cek status:", error.message);
      }
    };

    fetchStatus();
    const intervalId = setInterval(() => {
       if (lastStatusRef.current !== 'siap' && lastStatusRef.current !== 'selesai' && lastStatusRef.current !== 'ditolak') {
          fetchStatus();
       }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [orderId]);

  const getStepColor = (stepId) => {
    if (stepId < currentStatus) return '#4CAF50';
    if (stepId === currentStatus) return '#1565C0';
    return '#E8ECF0';
  };

  const getMetodeIcon = (label) => {
    const lbl = (label || '').toLowerCase();
    if (lbl.includes('qris')) return 'qr-code-outline';
    if (lbl.includes('transfer')) return 'swap-horizontal-outline';
    return 'cash-outline';
  };

  const isRejected = orderData?.status === 'ditolak';
  const statusLabel = isRejected ? 'Ditolak' : currentStatus === 3 ? 'Siap Diambil!' : currentStatus === 2 ? 'Sedang Dimasak' : 'Menunggu Konfirmasi';

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        {!isFromCheckout && (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
        )}

        <View style={styles.headerInner}>
          <Text style={styles.headerLabel}>Status Pesanan</Text>
          <Text style={styles.headerOrderId}>
            {orderData?.kode_pickup ? orderData.kode_pickup : 'Memuat Kode...'}
          </Text>
          <View style={[styles.statusPill, currentStatus === 3 && styles.statusPillGreen, isRejected && styles.statusPillRed]}>
            {isRejected && <Ionicons name="close-circle" size={14} color="#C62828" style={{ marginRight: 6 }} />}
            {currentStatus === 3 && <Ionicons name="checkmark-circle" size={14} color="#2E7D32" style={{ marginRight: 6 }} />}
            <Text style={[styles.statusPillText, currentStatus === 3 && { color: '#2E7D32' }, isRejected && { color: '#C62828' }]}>
              {statusLabel}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Kalau ditolak */}
        {isRejected ? (
          <View style={styles.rejectedCard}>
            <Ionicons name="close-circle" size={54} color="#EF5350" style={{ marginBottom: 12 }} />
            <Text style={styles.rejectedTitle}>Pesanan Ditolak Penjual</Text>
            <Text style={styles.rejectedDesc}>Maaf, pesananmu tidak dapat diproses saat ini. Silakan coba pesan menu lain atau di toko yang berbeda.</Text>
          </View>
        ) : (
          <>
            {/* Alert siap pickup */}
            {currentStatus === 3 && (
              <View style={styles.pickupAlert}>
                <Ionicons name="checkmark-circle" size={32} color="#2E7D32" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickupAlertTitle}>Pesanan Siap Diambil!</Text>
                  <Text style={styles.pickupAlertDesc}>Segera ke {toko.nama} untuk pickup</Text>
                </View>
              </View>
            )}

            {/* Tracking Pesanan */}
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="location-outline" size={18} color="#1a1a1a" />
                <Text style={styles.cardTitle}>Tracking Pesanan</Text>
              </View>

              {STATUS_STEPS.map((step, index) => {
                const IconStatus = step.lib === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;
                return (
                  <View key={step.id} style={styles.stepRow}>
                    <View style={styles.stepLeft}>
                      <View style={[styles.stepCircle, { backgroundColor: getStepColor(step.id) }]}>
                        {step.id < currentStatus ? (
                          <Ionicons name="checkmark" size={18} color="#fff" />
                        ) : step.id === currentStatus ? (
                          <View style={styles.stepDot} />
                        ) : (
                          <Text style={styles.stepNum}>{step.id}</Text>
                        )}
                      </View>
                      {index < STATUS_STEPS.length - 1 && (
                        <View style={[styles.stepLine, { backgroundColor: step.id < currentStatus ? '#4CAF50' : '#E8ECF0' }]} />
                      )}
                    </View>
                    <View style={styles.stepInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                        <IconStatus name={step.icon} size={15} color={step.id <= currentStatus ? '#1a1a1a' : '#bbb'} style={{ marginRight: 6 }} />
                        <Text style={[styles.stepLabel, { color: step.id <= currentStatus ? '#1a1a1a' : '#bbb' }]}>
                          {step.label}
                        </Text>
                      </View>
                      <Text style={[styles.stepDesc, { color: step.id <= currentStatus ? '#666' : '#ccc' }]}>
                        {step.desc}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* 🔥 Info Toko (FOTO DIBESARKAN) */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="storefront-outline" size={18} color="#1a1a1a" />
            <Text style={styles.cardTitle}>Info Pengambilan</Text>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.tokoIconBox}>
              {toko.foto_url ? (
                <Image source={{ uri: toko.foto_url }} style={styles.tokoImage} resizeMode="cover" />
              ) : (
                <Ionicons name="storefront" size={40} color="#1565C0" />
              )}
            </View>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={styles.infoNama}>{toko.nama}</Text>
              <Text style={styles.infoKategori}>{toko.kategori}</Text>
            </View>
          </View>
          
          <View style={styles.infoDetail}>
            <View style={styles.infoDetailLeft}>
              <Ionicons name="time-outline" size={15} color="#888" />
              <Text style={styles.infoDetailLabel}>Estimasi</Text>
            </View>
            <Text style={styles.infoDetailValue}>{toko.estimasi || toko.waktu || '10-15 mnt'}</Text>
          </View>
          
          <View style={styles.infoDetail}>
            <View style={styles.infoDetailLeft}>
              <Ionicons name="card-outline" size={15} color="#888" />
              <Text style={styles.infoDetailLabel}>Pembayaran</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '60%', flexShrink: 1 }}>
              <Ionicons name={getMetodeIcon(metodeBayar.label)} size={14} color="#1a1a1a" />
              <Text style={[styles.infoDetailValue, { maxWidth: '100%' }]} numberOfLines={1}>{metodeBayar.label}</Text>
            </View>
          </View>

          {catatan ? (
            <View style={styles.infoDetail}>
              <View style={styles.infoDetailLeft}>
                <Ionicons name="document-text-outline" size={15} color="#888" />
                <Text style={styles.infoDetailLabel}>Catatan</Text>
              </View>
              <Text style={styles.infoDetailValue}>{catatan}</Text>
            </View>
          ) : null}
        </View>

        {/* 🔥 Detail Pesanan (PENGGUNAAN FOTO MENU) */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="receipt-outline" size={18} color="#1a1a1a" />
            <Text style={styles.cardTitle}>Detail Pesanan</Text>
          </View>

          {itemDiKeranjang.map((menu) => (
            <View key={menu._id || menu.id} style={styles.orderRow}>
              <View style={styles.orderImageBox}>
                {menu.foto_url ? (
                   <Image source={{ uri: menu.foto_url }} style={styles.orderImage} resizeMode="cover" />
                ) : (
                   <Text style={{ fontSize: 26 }}>{menu.emoji || '🍱'}</Text>
                )}
              </View>
              
              <View style={styles.orderTextWrapper}>
                <Text style={styles.orderNama} numberOfLines={2}>{menu.nama}</Text>
                <Text style={styles.orderHargaText}>
                  Rp {((menu.harga || 0)).toLocaleString('id-ID')}
                </Text>
              </View>

              <Text style={styles.orderQty}>x{keranjang[menu._id || menu.id]}</Text>
              <Text style={styles.orderHargaTotal}>
                Rp {((menu.harga || 0) * keranjang[menu._id || menu.id]).toLocaleString('id-ID')}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Bayar</Text>
            <Text style={styles.totalValue}>Rp {totalHarga.toLocaleString('id-ID')}</Text>
          </View>
        </View>

        {isFromCheckout && (
          <TouchableOpacity style={styles.homeButton} activeOpacity={0.8} onPress={() => navigation.navigate('Main')}>
            <Ionicons name="home-outline" size={18} color="#1565C0" style={{ marginRight: 8 }} />
            <Text style={styles.homeButtonText}>Kembali ke Beranda</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  // ── Header ────────────────────────────────────────────
  header: {
    backgroundColor: '#fff',
    paddingTop: 55,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
    position: 'relative',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 55, 
    width: 36, height: 36, borderRadius: 18, 
    backgroundColor: '#F5F7FA',
    justifyContent: 'center', alignItems: 'center'
  },
  backIcon: { fontSize: 26, color: '#1a1a1a', lineHeight: 30, marginTop: -2 },
  
  headerInner: { alignItems: 'center' },
  headerLabel: { fontSize: 13, color: '#888', fontWeight: '500', marginBottom: 4 },
  headerOrderId: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 10, letterSpacing: 1 },
  
  statusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  statusPillGreen: { backgroundColor: '#E8F5E9' },
  statusPillRed: { backgroundColor: '#FFEBEE' },
  statusPillText: { fontSize: 13, fontWeight: '700', color: '#1565C0' },

  // ── Scroll ────────────────────────────────────────────
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },

  // ── Alert & Status ────────────────────────────────────
  pickupAlert: { backgroundColor: '#E8F5E9', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, borderWidth: 1.5, borderColor: '#4CAF50' },
  pickupAlertTitle: { fontSize: 14, fontWeight: 'bold', color: '#2E7D32' },
  pickupAlertDesc: { fontSize: 12, color: '#555', marginTop: 2 },

  rejectedCard: { backgroundColor: '#FFEBEE', borderRadius: 16, padding: 24, marginBottom: 12, borderWidth: 1.5, borderColor: '#EF5350', alignItems: 'center' },
  rejectedTitle: { fontSize: 16, fontWeight: 'bold', color: '#C62828', marginBottom: 6 },
  rejectedDesc: { fontSize: 13, color: '#D32F2F', textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 },

  // ── Card Global ───────────────────────────────────────
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a' },

  // ── Step Tracking ─────────────────────────────────────
  stepRow: { flexDirection: 'row', marginBottom: 4 },
  stepLeft: { alignItems: 'center', marginRight: 14, width: 32 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  stepNum: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  stepLine: { width: 2, flex: 1, minHeight: 30, marginVertical: 2 },
  stepInfo: { flex: 1, paddingBottom: 20 },
  stepLabel: { fontSize: 14, fontWeight: '600' },
  stepDesc: { fontSize: 12, lineHeight: 18 },

  // ── Info Toko (DIPERBESAR) ────────────────────────────
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  tokoIconBox: { width: 84, height: 84, borderRadius: 18, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  tokoImage: { width: '100%', height: '100%' },
  infoNama: { fontSize: 17, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  infoKategori: { fontSize: 13, color: '#888' },
  
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 6 },
  
  infoDetail: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  infoDetailLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoDetailLabel: { fontSize: 13, color: '#888' },
  infoDetailValue: { fontSize: 13, color: '#1a1a1a', fontWeight: '500', maxWidth: '60%', textAlign: 'right' },

  // ── Order Detail (PAKAI FOTO MENU) ────────────────────
  orderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  orderImageBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  orderImage: { width: '100%', height: '100%' },
  orderTextWrapper: { flex: 1, justifyContent: 'center' },
  orderNama: { fontSize: 14, color: '#1a1a1a', fontWeight: '600', marginBottom: 2 },
  orderHargaText: { fontSize: 12, color: '#888' }, // Harga satuan
  orderQty: { fontSize: 13, color: '#888', fontWeight: '500', marginHorizontal: 6 },
  orderHargaTotal: { fontSize: 14, fontWeight: '700', color: '#1565C0', minWidth: 70, textAlign: 'right' }, // Harga total item
  
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  totalLabel: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: '#1565C0' },

  // ── Home Button ───────────────────────────────────────
  homeButton: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: '#1565C0' },
  homeButtonText: { color: '#1565C0', fontSize: 15, fontWeight: 'bold' },
});