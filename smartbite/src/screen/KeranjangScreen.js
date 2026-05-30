import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native'; 
import { LinearGradient } from 'expo-linear-gradient';
import { useContext } from 'react';
import { CartContext } from '../context/CartContext';

export default function KeranjangScreen({ route, navigation }) {
  const { keranjang, setKeranjang, toko, menuList, setToko, setMenuList } = useContext(CartContext);

  // Deteksi: apakah layar dibuka dari Navbar?
  const isTab = route.name === 'KeranjangTab';

  const tambah = (menuId) => {
    setKeranjang(prev => ({ ...prev, [menuId]: (prev[menuId] || 0) + 1 }));
  };

  const kurang = (menuId) => {
    setKeranjang(prev => {
      const updated = { ...prev, [menuId]: prev[menuId] - 1 };
      if (updated[menuId] === 0) delete updated[menuId];
      
      if (Object.keys(updated).length === 0) {
        setToko(null);
        setMenuList([]);
      }
      return updated;
    });
  };

  if (!toko || Object.keys(keranjang).length === 0) {
    return (
      <View style={styles.container}>
        
        {/* 🔥 HEADER DINAMIS (KOSONG) */}
        {isTab ? (
          <View style={styles.headerTab}>
            <Text style={styles.headerTitleTab}>Keranjang</Text>
          </View>
        ) : (
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={styles.backButton}>
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Keranjang</Text>
            </View>
          </View>
        )}

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyText}>Keranjang kamu masih kosong</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Home' })} activeOpacity={0.8}>
            <Text style={styles.emptyLink}>Cari makanan enak dulu yuk!</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const itemDiKeranjang = menuList.filter(m => keranjang[m._id || m.id]);
  const totalItem = Object.values(keranjang).reduce((a, b) => a + b, 0);
  const totalHarga = itemDiKeranjang.reduce((total, menu) => {
    return total + (keranjang[menu._id || menu.id] * menu.harga);
  }, 0);

  return (
    <View style={styles.container}>
      
      {/* 🔥 HEADER DINAMIS (ADA ISI) */}
      {isTab ? (
        <View style={styles.headerTab}>
          <Text style={styles.headerTitleTab}>Keranjang</Text>
          <Text style={styles.headerSubTab}>Dari kantin {toko.nama}</Text>
        </View>
      ) : (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Keranjang</Text>
            <Text style={styles.headerSub}>Dari kantin {toko.nama}</Text>
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: isTab ? 190 : 100 }]}>
        <Text style={styles.sectionTitle}>Pesanan kamu</Text>
        {itemDiKeranjang.map((menu) => (
          <View key={menu._id || menu.id} style={styles.itemCard}>
            
            <View style={styles.itemImageBox}>
              {menu.foto_url ? (
                <Image source={{ uri: menu.foto_url }} style={styles.itemImage} resizeMode="cover" />
              ) : (
                <Text style={{ fontSize: 28 }}>{menu.emoji || '🍽️'}</Text>
              )}
            </View>

            <View style={styles.itemInfo}>
              <Text numberOfLines={1} style={styles.itemNama}>{menu.nama}</Text>
              <Text style={styles.itemHarga}>Rp {(menu.harga * keranjang[menu._id || menu.id]).toLocaleString('id-ID')}</Text>
            </View>
            <View style={styles.counterBox}>
              <TouchableOpacity onPress={() => kurang(menu._id || menu.id)} style={styles.counterBtn}>
                <Text style={styles.counterBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.counterNum}>{keranjang[menu._id || menu.id]}</Text>
              <TouchableOpacity onPress={() => tambah(menu._id || menu.id)} style={[styles.counterBtn, styles.counterBtnAdd]}>
                <Text style={[styles.counterBtnText, { color: '#fff' }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Ringkasan Pesanan</Text>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Total item</Text><Text style={styles.summaryValue}>{totalItem} item</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>Rp {totalHarga.toLocaleString('id-ID')}</Text></View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}><Text style={styles.summaryTotal}>Total Bayar</Text><Text style={styles.summaryTotalValue}>Rp {totalHarga.toLocaleString('id-ID')}</Text></View>
        </View>
      </ScrollView>

      <View style={[styles.checkoutBar, { bottom: isTab ? 95 : 24 }]}>
        <TouchableOpacity activeOpacity={0.9} style={styles.checkoutButton} onPress={() => navigation.navigate('Checkout', { keranjang, menuList, toko, totalHarga })}>
          <LinearGradient colors={['#1565C0', '#42A5F5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.checkoutGradient}>
            <Text style={styles.checkoutText}>Lanjut ke Checkout</Text>
            <Text style={styles.checkoutHarga}>Rp {totalHarga.toLocaleString('id-ID')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  
  // 🔥 STYLES HEADER NORMAL (Stack Screen)
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 55, paddingBottom: 16, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  backIcon: { fontSize: 26, color: '#1a1a1a', lineHeight: 30, marginTop: -2 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 1 },
  
  // 🔥 STYLES HEADER TAB BARU
  headerTab: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitleTab: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  headerSubTab: { fontSize: 13, color: '#888', marginTop: 2 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#888', marginBottom: 10 },
  emptyLink: { fontSize: 14, color: '#1565C0', fontWeight: '600' },
  
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 14 },
  
  itemCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  itemImageBox: { width: 64, height: 64, borderRadius: 14, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
  itemImage: { width: '100%', height: '100%' }, 
  
  itemInfo: { flex: 1 },
  itemNama: { fontSize: 14, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 2 },
  itemSatuan: { fontSize: 11, color: '#aaa', marginBottom: 3 },
  itemHarga: { fontSize: 14, fontWeight: '800', color: '#1565C0' },
  counterBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 },
  counterBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center' },
  counterBtnAdd: { backgroundColor: '#1565C0' },
  counterBtnText: { fontSize: 18, color: '#1565C0', fontWeight: 'bold', lineHeight: 22 },
  counterNum: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a', minWidth: 20, textAlign: 'center' },
  
  summaryCard: { backgroundColor: '#F5F7FA', borderRadius: 16, padding: 16, marginTop: 8 },
  summaryTitle: { fontSize: 14, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 13, color: '#888' },
  summaryValue: { fontSize: 13, color: '#1a1a1a' },
  summaryDivider: { height: 1, backgroundColor: '#E8ECF0', marginVertical: 10 },
  summaryTotal: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a' },
  summaryTotalValue: { fontSize: 15, fontWeight: 'bold', color: '#1565C0' },
  
  checkoutBar: { position: 'absolute', left: 20, right: 20 },
  checkoutButton: { borderRadius: 16, overflow: 'hidden', elevation: 8, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 },
  checkoutGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20 },
  checkoutText: { flex: 1, color: '#fff', fontSize: 18, fontWeight: 'bold' },
  checkoutHarga: { color: '#fff', fontSize: 16, fontWeight: '700' },
});