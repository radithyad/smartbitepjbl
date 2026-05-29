import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Image, ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { api } from '../service/api'; // 👈 Ubah supabase jadi api
import { useContext } from 'react';
import { CartContext } from '../context/CartContext';

const PAYMENT_INFO = {
  '1': { qris: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=BuSari-QRIS-001', norek: 'BCA 1234567890 a/n Sari' },
  '2': { qris: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PakJoko-QRIS-002', norek: 'Mandiri 0987654321 a/n Joko' },
  '3': { qris: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MbakRina-QRIS-003', norek: 'BNI 1122334455 a/n Rina' },
  '4': { qris: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=NasiGoreng-QRIS-004', norek: 'BRI 5566778899 a/n Budi' },
  '5': { qris: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Snack-QRIS-005', norek: 'BCA 6677889900 a/n Dewi' },
};

const METODE_BAYAR = [
  { id: 'qris', label: 'QRIS', emoji: '📱', desc: 'Scan QR code toko' },
  { id: 'transfer', label: 'Transfer Bank', emoji: '🏦', desc: 'Transfer ke rekening toko' },
  { id: 'tunai', label: 'Tunai', emoji: '💵', desc: 'Bayar langsung saat pickup' },
];

export default function CheckoutScreen({ route, navigation }) {
  const { keranjang, menuList, toko, totalHarga } = route.params;
  const { setKeranjang, setToko, setMenuList } = useContext(CartContext);
  const [catatan, setCatatan] = useState('');
  const [metodeBayar, setMetodeBayar] = useState('tunai');
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [buktiBayar, setBuktiBayar] = useState(null);
  const [uploading, setUploading] = useState(false);

  const itemDiKeranjang = menuList.filter(m => keranjang[m._id || m.id]);
  
  // Karena ID dari MongoDB panjang, kita kasih fallback ke '1' biar Dummy QRIS tetep muncul
  const paymentInfo = PAYMENT_INFO[toko._id || toko.id] || PAYMENT_INFO['1']; 
  
  const butuhBukti = metodeBayar === 'qris' || metodeBayar === 'transfer';
  const bisaPesan = !butuhBukti || buktiBayar !== null;

  const handlePilihMetode = (id) => {
    setMetodeBayar(id);
    setBuktiBayar(null);
    if (id === 'qris' || id === 'transfer') {
      setDropdownOpen(dropdownOpen === id ? null : id);
    } else {
      setDropdownOpen(null);
    }
  };

  // 👈 Fungsi upload kita ganti pakai Base64 biar instan dan gak perlu storage external
  const handleUploadBukti = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin Diperlukan', 'Izinkan akses galeri untuk upload bukti pembayaran.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.3,
      base64: true // Tambahkan ini
    });
    
    if (result.canceled) return;
    setUploading(true);
    
    try {
      // Simpan langsung sebagai string base64
      setBuktiBayar(`data:image/jpeg;base64,${result.assets[0].base64}`);
    } catch (err) {
      Alert.alert('Upload Gagal', 'Terjadi kesalahan saat memproses foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleOrder = async () => {
    if (butuhBukti && !buktiBayar) {
      Alert.alert('Upload Bukti Dulu', 'Kamu harus upload bukti pembayaran sebelum memesan.');
      return;
    }
    const metodeTerpilih = METODE_BAYAR.find(m => m.id === metodeBayar);
    const title = 'Konfirmasi Pesanan';
    const message = `Pesan dari ${toko.nama}\nTotal: Rp ${totalHarga.toLocaleString('id-ID')}\nBayar via: ${metodeTerpilih.label}\n\nLanjutkan?`;

    const onConfirm = async () => {
      try {
        setUploading(true); // Pakai state ini buat muterin loading kalau mau
        
        // 👈 Kita satukan data pesanan & itemnya buat dikirim ke Node.js
        const orderPayload = {
          toko_id: toko._id || toko.id,
          total_harga: totalHarga,
          metode_bayar: metodeTerpilih.label,
          bukti_bayar: buktiBayar,
          catatan: catatan,
          items: itemDiKeranjang.map(menu => ({
            menu_id: menu._id || menu.id,
            nama_menu: menu.nama,
            harga: menu.harga,
            qty: keranjang[menu._id || menu.id],
          }))
        };

        // Tembak API Buatan kita
        const response = await api.post('/orders', orderPayload);
        const orderData = response.data.order;

        setKeranjang({});
        setToko(null);
        setMenuList([]);
        
        navigation.navigate('StatusOrder', {
          toko, totalHarga, catatan,
          metodeBayar: metodeTerpilih,
          itemDiKeranjang, keranjang,
          orderId: orderData._id || orderData.id,
        });
      } catch (err) {
        console.log("❌ ERROR CHECKOUT:", err.response?.data || err.message);
        const pesanError = err.response?.data?.error || err.response?.data?.message || 'Terjadi kesalahan!';
        Alert.alert('Gagal Memesan', err.response?.data?.message || 'Terjadi kesalahan, coba lagi ya!');
      } finally {
        setUploading(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) {
        await onConfirm();
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Pesan Sekarang!', onPress: onConfirm },
      ]);
    }
  };

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Checkout</Text>
          <Text style={styles.headerSub}>Periksa & konfirmasi pesanan</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Ringkasan Pesanan */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧾 Ringkasan Pesanan</Text>
          {itemDiKeranjang.map((menu) => (
            <View key={menu._id || menu.id} style={styles.orderRow}>
              <View style={styles.orderImageBox}>
                {menu.foto_url ? (
                  <Image source={{ uri: menu.foto_url }} style={styles.orderImage} resizeMode="cover" />
                ) : (
                  <Text style={{ fontSize: 20 }}>{menu.emoji}</Text>
                )}
              </View>
              <Text style={styles.orderNama} numberOfLines={1}>{menu.nama}</Text>
              <Text style={styles.orderQty}>x{keranjang[menu._id || menu.id]}</Text>
              <Text style={styles.orderHarga}>
                Rp {(menu.harga * keranjang[menu._id || menu.id]).toLocaleString('id-ID')}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Bayar</Text>
            <Text style={styles.totalValue}>Rp {totalHarga.toLocaleString('id-ID')}</Text>
          </View>
        </View>

        {/* Metode Pembayaran */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💳 Metode Pembayaran</Text>
          {METODE_BAYAR.map((metode) => (
            <View key={metode.id}>
              <TouchableOpacity
                style={[styles.metodeItem, metodeBayar === metode.id && styles.metodeItemActive]}
                onPress={() => handlePilihMetode(metode.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.metodeEmoji}>{metode.emoji}</Text>
                <View style={styles.metodeInfo}>
                  <Text style={[styles.metodeLabel, metodeBayar === metode.id && styles.metodeLabelActive]}>
                    {metode.label}
                  </Text>
                  <Text style={styles.metodeDesc}>{metode.desc}</Text>
                </View>
                <View style={styles.metodeRight}>
                  {(metode.id === 'qris' || metode.id === 'transfer') && (
                    <Text style={styles.dropdownArrow}>
                      {metodeBayar === metode.id && dropdownOpen === metode.id ? '▲' : '▼'}
                    </Text>
                  )}
                  <View style={[styles.radioOuter, metodeBayar === metode.id && styles.radioOuterActive]}>
                    {metodeBayar === metode.id && <View style={styles.radioInner} />}
                  </View>
                </View>
              </TouchableOpacity>

              {/* Dropdown QRIS */}
              {metode.id === 'qris' && metodeBayar === 'qris' && dropdownOpen === 'qris' && (
                <View style={styles.dropdown}>
                  <Text style={styles.dropdownTitle}>Scan QRIS {toko.nama}</Text>
                  <Image source={{ uri: paymentInfo?.qris }} style={styles.qrisImage} resizeMode="contain" />
                  <Text style={styles.dropdownNote}>Scan QR di atas menggunakan aplikasi e-wallet atau mobile banking kamu</Text>
                </View>
              )}

              {/* Dropdown Transfer Bank */}
              {metode.id === 'transfer' && metodeBayar === 'transfer' && dropdownOpen === 'transfer' && (
                <View style={styles.dropdown}>
                  <Text style={styles.dropdownTitle}>Rekening {toko.nama}</Text>
                  <View style={styles.norekBox}>
                    <Text style={styles.norekText}>{paymentInfo?.norek}</Text>
                  </View>
                  <Text style={styles.dropdownNote}>Transfer tepat sesuai nominal. Simpan bukti untuk diupload.</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Upload Bukti */}
        {butuhBukti && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📎 Bukti Pembayaran</Text>
            <Text style={styles.uploadDesc}>
              Upload screenshot bukti {metodeBayar === 'qris' ? 'pembayaran QRIS' : 'transfer'} kamu
            </Text>
            {buktiBayar ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: buktiBayar }} style={styles.previewImage} resizeMode="cover" />
                <TouchableOpacity style={styles.gantiButton} onPress={handleUploadBukti}>
                  <Text style={styles.gantiText}>🔄 Ganti Foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadBox} onPress={handleUploadBukti} activeOpacity={0.7}>
                {uploading ? (
                  <ActivityIndicator color="#1565C0" />
                ) : (
                  <>
                    <Text style={styles.uploadEmoji}>📷</Text>
                    <Text style={styles.uploadText}>Tap untuk pilih foto</Text>
                    <Text style={styles.uploadSubText}>dari galeri HP kamu</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {!buktiBayar && (
              <View style={styles.warnBox}>
                <Text style={styles.warnText}>⚠️ Wajib upload bukti pembayaran sebelum memesan</Text>
              </View>
            )}
          </View>
        )}

        {/* Catatan */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📝 Catatan (opsional)</Text>
          <TextInput
            style={styles.catatanInput}
            placeholder="Contoh: jangan pakai sambal, tambah kerupuk, dll..."
            placeholderTextColor="#aaa"
            multiline
            numberOfLines={3}
            value={catatan}
            onChangeText={setCatatan}
          />
        </View>

        {/* Pickup Info */}
        <View style={styles.pickupInfo}>
          <Text style={styles.pickupEmoji}>🏃</Text>
          <View>
            <Text style={styles.pickupTitle}>Pickup Mandiri</Text>
            <Text style={styles.pickupDesc}>Jangan lupa ambil langsung pesanan anda setelah pesanan telah siap</Text>
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Tombol Pesan */}
      <View style={styles.orderBar}>
        <TouchableOpacity activeOpacity={bisaPesan ? 0.9 : 1} style={styles.orderButton} onPress={handleOrder}>
          <LinearGradient
            colors={bisaPesan ? ['#1565C0', '#42A5F5'] : ['#B0BEC5', '#CFD8DC']}
            style={styles.orderGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {uploading && bisaPesan ? (
               <ActivityIndicator color="#fff" style={{flex: 1}} />
            ) : (
              <>
                <Text style={styles.orderText}>
                  {bisaPesan ? '🍱 Pesan Sekarang' : '🔒 Upload Bukti Dulu'}
                </Text>
                <Text style={styles.orderHargaText}>Rp {totalHarga.toLocaleString('id-ID')}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ⬇️ STYLE MURNI GAK ADA YANG DISENTUH ⬇️
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  // ── Header ────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 55,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backIcon: {
    fontSize: 26,
    color: '#1a1a1a',
    lineHeight: 30,
    marginTop: -2,
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 1 },

  // ── Scroll ────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // ── Card ──────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 14,
  },

  // ── Order Row ─────────────────────────────────────────
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  orderImageBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  orderImage: { width: 36, height: 36 },
  orderNama: { flex: 1, fontSize: 13, color: '#1a1a1a', fontWeight: '500' },
  orderQty: { fontSize: 13, color: '#888' },
  orderHarga: { fontSize: 13, fontWeight: '700', color: '#1565C0' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a' },
  totalValue: { fontSize: 15, fontWeight: 'bold', color: '#1565C0' },

  // ── Metode Bayar ──────────────────────────────────────
  metodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8ECF0',
    marginBottom: 10,
    gap: 12,
  },
  metodeItemActive: { borderColor: '#1565C0', backgroundColor: '#F0F7FF' },
  metodeEmoji: { fontSize: 22 },
  metodeInfo: { flex: 1 },
  metodeLabel: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  metodeLabelActive: { color: '#1565C0' },
  metodeDesc: { fontSize: 11, color: '#888', marginTop: 2 },
  metodeRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dropdownArrow: { fontSize: 12, color: '#1565C0' },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#ccc',
    justifyContent: 'center', alignItems: 'center',
  },
  radioOuterActive: { borderColor: '#1565C0' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1565C0' },

  // ── Dropdown ──────────────────────────────────────────
  dropdown: {
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  dropdownTitle: { fontSize: 14, fontWeight: 'bold', color: '#1565C0', marginBottom: 12 },
  qrisImage: { width: 180, height: 180, marginBottom: 10 },
  norekBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: '#1565C0',
    marginBottom: 10,
  },
  norekText: { fontSize: 15, fontWeight: 'bold', color: '#1565C0', textAlign: 'center' },
  dropdownNote: { fontSize: 11, color: '#666', textAlign: 'center' },

  // ── Upload ────────────────────────────────────────────
  uploadDesc: { fontSize: 13, color: '#666', marginBottom: 14 },
  uploadBox: {
    borderWidth: 2, borderColor: '#1565C0',
    borderStyle: 'dashed', borderRadius: 14,
    padding: 28, alignItems: 'center',
    backgroundColor: '#F0F7FF',
  },
  uploadEmoji: { fontSize: 36, marginBottom: 8 },
  uploadText: { fontSize: 14, fontWeight: '600', color: '#1565C0' },
  uploadSubText: { fontSize: 12, color: '#888', marginTop: 4 },
  previewContainer: { alignItems: 'center' },
  previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 10 },
  gantiButton: {
    backgroundColor: '#E3F2FD', borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 20,
  },
  gantiText: { color: '#1565C0', fontWeight: '600', fontSize: 13 },
  warnBox: { backgroundColor: '#FFF3E0', borderRadius: 10, padding: 10, marginTop: 12 },
  warnText: { fontSize: 12, color: '#E65100', textAlign: 'center' },

  // ── Catatan ───────────────────────────────────────────
  catatanInput: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12, padding: 12,
    fontSize: 13, color: '#1a1a1a',
    borderWidth: 1, borderColor: '#E8ECF0',
    textAlignVertical: 'top', minHeight: 80,
  },

  // ── Pickup Info ───────────────────────────────────────
  pickupInfo: {
    backgroundColor: '#E3F2FD',
    borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center',
    gap: 12, marginBottom: 12,
  },
  pickupEmoji: { fontSize: 26 },
  pickupTitle: { fontSize: 13, fontWeight: 'bold', color: '#1565C0' },
  pickupDesc: { fontSize: 12, color: '#555', marginTop: 2 },

  // ── Order Bar ─────────────────────────────────────────
  orderBar: {
    position: 'absolute',
    bottom: 24, left: 20, right: 20,
  },
  orderButton: {
    borderRadius: 16, overflow: 'hidden',
    elevation: 8,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10,
  },
  orderGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 20,
  },
  orderText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  orderHargaText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});