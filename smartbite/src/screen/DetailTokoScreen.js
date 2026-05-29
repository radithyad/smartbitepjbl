import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, Alert, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useContext } from 'react';
import { api } from '../service/api';
import { CartContext } from '../context/CartContext';
import FloatingCart from '../component/FloatingCart';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 280;

const cekJamOperasional = (jamBuka, jamTutup) => {
  if (!jamBuka || !jamTutup) return { buka: true, info: '' };
  const now = new Date();
  const [bukjam, bukmenit] = jamBuka.split(':').map(Number);
  const [tutjam, tutmenit] = jamTutup.split(':').map(Number);
  const nowMenit = now.getHours() * 60 + now.getMinutes();
  const bukaMenit = bukjam * 60 + bukmenit;
  const tutupMenit = tutjam * 60 + tutmenit;
  
  let buka = false;
  if (bukaMenit <= tutupMenit) buka = nowMenit >= bukaMenit && nowMenit < tutupMenit;
  else buka = nowMenit >= bukaMenit || nowMenit < tutupMenit;
  
  const info = `${jamBuka.slice(0, 5)} - ${jamTutup.slice(0, 5)}`;
  return { buka, info };
};

export default function DetailTokoScreen({ route, navigation }) {
  const { toko } = route.params;
  const [menuList, setMenuList] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Tarik data keranjang dari Global Context
  const { keranjang, setKeranjang, toko: globalToko, setToko: setGlobalToko, setMenuList: setGlobalMenuList } = useContext(CartContext);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await api.get(`/menu/toko/${toko._id || toko.id}`);
      if (response.data) {
        const sortedMenu = response.data.sort((a, b) => a.tersedia === b.tersedia ? 0 : a.tersedia ? -1 : 1);
        setMenuList(sortedMenu);
      }
    } catch (e) { } 
    finally { setLoading(false); }
  };

  const { buka: waktuBuka, info } = cekJamOperasional(toko?.jam_buka, toko?.jam_tutup);
  const isBuka = (toko?.aktif !== false) && waktuBuka;

  // Cek apakah toko yang lagi dibuka ini sama dengan toko yang ada di keranjang global
  const isCurrentToko = globalToko ? (globalToko._id || globalToko.id) === (toko._id || toko.id) : true;

  const tambahMenu = (menu) => {
    if (!isBuka) return;

    const menuId = menu._id || menu.id;

    // 🔥 LOGIKA KALO PESAN DARI TOKO BERBEDA
    if (globalToko && !isCurrentToko && Object.keys(keranjang).length > 0) {
      Alert.alert(
        'Ganti Pesanan?',
        `Keranjangmu saat ini berisi pesanan dari toko ${globalToko.nama}. Yakin ingin menghapus keranjang sebelumnya dan memesan dari ${toko.nama}?`,
        [
          { text: 'Batal', style: 'cancel' },
          { 
            text: 'Ganti Pesanan', 
            style: 'destructive',
            onPress: () => {
              setGlobalToko(toko);
              setGlobalMenuList(menuList); 
              setKeranjang({ [menuId]: 1 }); // Hapus keranjang lama, masukin yang baru
            }
          }
        ]
      );
      return;
    }

    if (!globalToko || Object.keys(keranjang).length === 0) {
      setGlobalToko(toko);
      setGlobalMenuList(menuList);
    }

    setKeranjang(prev => ({ ...prev, [menuId]: (prev[menuId] || 0) + 1 }));
  };

  const kurangMenu = (menu) => {
    if (!isBuka) return;
    const menuId = menu._id || menu.id;

    setKeranjang(prev => {
      if (!prev[menuId] || prev[menuId] === 0) return prev;
      const updated = { ...prev, [menuId]: prev[menuId] - 1 };
      if (updated[menuId] === 0) delete updated[menuId];
      
      // Kalo keranjang jadi kosong, lepas ikatan tokonya
      if (Object.keys(updated).length === 0) {
        setGlobalToko(null);
        setGlobalMenuList([]);
      }
      return updated;
    });
  };

  if (loading || !toko) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#1565C0" />
      </View>
    );
  }

  return (
  <View style={styles.container}>
    <View style={styles.headerImageContainer}>
      {toko.foto_url ? (
        <Image source={{ uri: toko.foto_url }} style={styles.headerImage} resizeMode="cover" />
      ) : (
        <View style={styles.headerImageFallback}><Text style={styles.headerFallbackEmoji}>{toko.emoji}</Text></View>
      )}
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.35)']} style={styles.headerGradientOverlay} />
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
        <Text style={styles.backIcon}>‹</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.tokoInfoCard}>
      <View style={styles.namaRow}>
        <Text style={styles.tokoNama}>{toko.nama}</Text>
        <View style={[styles.statusBadge, isBuka ? styles.bukaBadge : styles.tutupBadge]}>
          <Text style={[styles.statusText, { color: isBuka ? '#2E7D32' : '#C62828' }]}>{isBuka ? '● Buka' : '● Tutup'}</Text>
        </View>
      </View>
      <Text style={styles.tokoKategori}>{toko.kategori}</Text>
      <View style={styles.metaRow}>
        <View style={styles.metaItem}><Text style={styles.metaEmoji}>⭐</Text><Text style={styles.metaText}>{toko.rating || 'Baru'}</Text></View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}><Text style={styles.metaEmoji}>⏱</Text><Text style={styles.metaText}>{toko.estimasi || '10-15'} mnt</Text></View>
        {info ? (
          <><View style={styles.metaDivider} /><View style={styles.metaItem}><Text style={styles.metaEmoji}>🕐</Text><Text style={styles.metaText}>{info}</Text></View></>
        ) : null}
      </View>
      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Menu Tersedia</Text>
    </View>

    <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.menuContainer}>
        {menuList.length === 0 ? (
          <View style={styles.emptyState}><Text style={styles.emptyEmoji}>🍽️</Text><Text style={styles.emptyText}>Belum ada menu tersedia</Text></View>
        ) : (
          menuList.map((menu) => {
            const menuId = menu._id || menu.id;
            // 💡 Cuma tampilin angka keranjang kalo toko yang diliat = toko di keranjang
            const qty = isCurrentToko ? (keranjang[menuId] || 0) : 0;

            return (
              <View key={menuId} style={[styles.menuCard, !menu.tersedia && styles.menuCardHabis]}>
                <View style={styles.menuImageBox}>
                  {menu.foto_url ? (
                    <Image source={{ uri: menu.foto_url }} style={styles.menuImage} resizeMode="cover" />
                  ) : (
                    <Text style={[styles.menuEmoji, !menu.tersedia && { opacity: 0.4 }]}>{menu.emoji || '🍽️'}</Text>
                  )}
                  {!menu.tersedia && <View style={styles.habisOverlay}><Text style={styles.habisOverlayText}>Habis</Text></View>}
                </View>
                
                <View style={styles.menuInfo}>
                  <Text style={[styles.menuNama, !menu.tersedia && styles.menuNamaHabis]} numberOfLines={1}>{menu.nama}</Text>
                  {menu.deskripsi ? <Text style={styles.menuDeskripsi} numberOfLines={2}>{menu.deskripsi}</Text> : null}
                  <Text style={[styles.menuHarga, !menu.tersedia && styles.menuHargaHabis]}>Rp {menu.harga ? menu.harga.toLocaleString('id-ID') : '0'}</Text>
                </View>

                {menu.tersedia ? (
                  isBuka ? ( 
                    <View style={styles.counterBox}>
                      {qty > 0 ? (
                        <>
                          <TouchableOpacity style={styles.counterBtn} onPress={() => kurangMenu(menu)}><Text style={styles.counterBtnText}>−</Text></TouchableOpacity>
                          <Text style={styles.counterNum}>{qty}</Text>
                        </>
                      ) : null}
                      <TouchableOpacity style={[styles.counterBtn, styles.counterBtnAdd]} onPress={() => tambahMenu(menu)}><Text style={[styles.counterBtnText, { color: '#fff' }]}>+</Text></TouchableOpacity>
                    </View>
                  ) : null
                ) : (
                  <Text style={styles.habisText}>Stok Habis</Text>
                )}
              </View>
            )
          })
        )}
      </View>
    </ScrollView>

    {/* 🔥 MASUKIN FLOATING CART-NYA DI SINI (Posisi paling bawah) */}
    <FloatingCart bottom={24} />

  </View>
);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerImageContainer: { width: SCREEN_WIDTH, height: HEADER_HEIGHT, position: 'absolute', top: 0, left: 0, zIndex: 0 },
  headerImage: { width: '100%', height: '100%' },
  headerImageFallback: { width: '100%', height: '100%', backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
  headerFallbackEmoji: { fontSize: 80 },
  headerGradientOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  backButton: { position: 'absolute', top: 52, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', elevation: 3 },
  backIcon: { fontSize: 26, color: '#1a1a1a', lineHeight: 30, marginTop: -2 },
  menuScroll: { flex: 1 },
  tokoInfoCard: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8, marginTop: HEADER_HEIGHT - 28 },
  namaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  tokoNama: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', flex: 1, marginRight: 10 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  bukaBadge: { backgroundColor: '#E8F5E9' },
  tutupBadge: { backgroundColor: '#FFEBEE' },
  statusText: { fontSize: 12, fontWeight: '700' },
  tokoKategori: { fontSize: 13, color: '#888', marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaEmoji: { fontSize: 14 },
  metaText: { fontSize: 13, color: '#555', fontWeight: '500' },
  metaDivider: { width: 1, height: 14, backgroundColor: '#E0E0E0', marginHorizontal: 8 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  menuContainer: { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 8 },
  menuCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  menuCardHabis: { opacity: 0.55 },
  menuImageBox: { width: 72, height: 72, borderRadius: 16, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', marginRight: 14, overflow: 'hidden', position: 'relative' },
  menuImage: { width: 72, height: 72 },
  menuEmoji: { fontSize: 34 },
  habisOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  habisOverlayText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  menuInfo: { flex: 1 },
  menuNama: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 3 },
  menuNamaHabis: { color: '#aaa' },
  menuDeskripsi: { fontSize: 12, color: '#999', marginBottom: 5, lineHeight: 17 },
  menuHarga: { fontSize: 15, fontWeight: '800', color: '#1565C0' },
  menuHargaHabis: { color: '#bbb' },
  habisText: { fontSize: 13, fontWeight: '600', color: '#aaa', marginLeft: 8 },
  counterBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 },
  counterBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center' },
  counterBtnAdd: { backgroundColor: '#1565C0' },
  counterBtnText: { fontSize: 18, color: '#1565C0', fontWeight: 'bold', lineHeight: 22 },
  counterNum: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a', minWidth: 20, textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 13, color: '#aaa' },
});