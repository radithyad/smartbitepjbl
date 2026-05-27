import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, Alert, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { api } from '../service/api'; // API MONGODB

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
  if (bukaMenit <= tutupMenit) {
    buka = nowMenit >= bukaMenit && nowMenit < tutupMenit;
  } else {
    buka = nowMenit >= bukaMenit || nowMenit < tutupMenit;
  }
  
  const info = `${jamBuka.slice(0, 5)} - ${jamTutup.slice(0, 5)}`;
  return { buka, info };
};

export default function DetailTokoScreen({ route, navigation }) {
  const { toko } = route.params;
  const [menuList, setMenuList] = useState([]);
  const [keranjang, setKeranjang] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/menu/toko/${toko._id || toko.id}`);
      if (response.data) {
        // 1. SORTING: Yang tersedia taruh atas, yang habis taruh bawah
        const sortedMenu = response.data.sort((a, b) => {
          if (a.tersedia === b.tersedia) return 0;
          return a.tersedia ? -1 : 1;
        });
        setMenuList(sortedMenu);
      }
    } catch (e) {
      console.log('fetchMenu error:', e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. LOGIKA JAM BUKA: Toko buka HANYA JIKA toggle nyala DAN waktu cocok
  const { buka: waktuBuka, info } = cekJamOperasional(toko?.jam_buka, toko?.jam_tutup);
  const isBuka = (toko?.aktif !== false) && waktuBuka;

  const tambahMenu = (menuId) => {
    if (!isBuka) return; // Keamanan ganda
    setKeranjang(prev => ({
      ...prev,
      [menuId]: (prev[menuId] || 0) + 1,
    }));
  };

  const kurangMenu = (menuId) => {
    if (!isBuka) return; // Keamanan ganda
    setKeranjang(prev => {
      if (!prev[menuId] || prev[menuId] === 0) return prev;
      const updated = { ...prev, [menuId]: prev[menuId] - 1 };
      if (updated[menuId] === 0) delete updated[menuId];
      return updated;
    });
  };

  const totalItem = Object.values(keranjang).reduce((a, b) => a + b, 0);
  const totalHarga = menuList.reduce((total, menu) => {
    return total + (keranjang[menu._id || menu.id] || 0) * menu.harga;
  }, 0);

  if (loading || !toko) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#1565C0" />
      </View>
    );
  }

  return (
  <View style={styles.container}>

    {/* FOTO HEADER - Full Width, posisi absolute */}
    <View style={styles.headerImageContainer}>
      {toko.foto_url ? (
        <Image source={{ uri: toko.foto_url }} style={styles.headerImage} resizeMode="cover" />
      ) : (
        <View style={styles.headerImageFallback}>
          <Text style={styles.headerFallbackEmoji}>{toko.emoji}</Text>
        </View>
      )}
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.35)']} style={styles.headerGradientOverlay} />
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
        <Text style={styles.backIcon}>‹</Text>
      </TouchableOpacity>
    </View>

    {/* INFO TOKO - statis, tidak scroll */}
    <View style={styles.tokoInfoCard}>
      <View style={styles.namaRow}>
        <Text style={styles.tokoNama}>{toko.nama}</Text>
        <View style={[styles.statusBadge, isBuka ? styles.bukaBadge : styles.tutupBadge]}>
          <Text style={[styles.statusText, { color: isBuka ? '#2E7D32' : '#C62828' }]}>
            {isBuka ? '● Buka' : '● Tutup'}
          </Text>
        </View>
      </View>
      <Text style={styles.tokoKategori}>{toko.kategori}</Text>
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaEmoji}>⭐</Text>
          <Text style={styles.metaText}>{toko.rating || 'Baru'}</Text>
        </View>
        <View style={styles.metaDivider} />
        <View style={styles.metaItem}>
          <Text style={styles.metaEmoji}>⏱</Text>
          <Text style={styles.metaText}>{toko.estimasi || '10-15'} mnt</Text>
        </View>
        {info ? (
          <>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaEmoji}>🕐</Text>
              <Text style={styles.metaText}>{info}</Text>
            </View>
          </>
        ) : null}
      </View>
      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Menu Tersedia</Text>
    </View>

    {/* MENU LIST - hanya bagian ini yang scroll */}
    <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.menuContainer}>
        {menuList.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyText}>Belum ada menu tersedia</Text>
          </View>
        ) : (
          menuList.map((menu) => (
            <View key={menu._id || menu.id} style={[styles.menuCard, !menu.tersedia && styles.menuCardHabis]}>
              <View style={styles.menuImageBox}>
                {menu.foto_url ? (
                  <Image source={{ uri: menu.foto_url }} style={styles.menuImage} resizeMode="cover" />
                ) : (
                  <Text style={[styles.menuEmoji, !menu.tersedia && { opacity: 0.4 }]}>{menu.emoji || '🍽️'}</Text>
                )}
                {!menu.tersedia && (
                  <View style={styles.habisOverlay}>
                    <Text style={styles.habisOverlayText}>Habis</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.menuInfo}>
                <Text style={[styles.menuNama, !menu.tersedia && styles.menuNamaHabis]} numberOfLines={1}>{menu.nama}</Text>
                {menu.deskripsi ? <Text style={styles.menuDeskripsi} numberOfLines={2}>{menu.deskripsi}</Text> : null}
                <Text style={[styles.menuHarga, !menu.tersedia && styles.menuHargaHabis]}>
                  Rp {menu.harga ? menu.harga.toLocaleString('id-ID') : '0'}
                </Text>
              </View>

              {menu.tersedia ? (
                // 3. HIDE TOMBOL: Kalau isBuka = false, tombol tambah/kurang gak dimunculin
                isBuka ? ( 
                  <View style={styles.counterBox}>
                    {keranjang[menu._id || menu.id] ? (
                      <>
                        <TouchableOpacity style={styles.counterBtn} onPress={() => kurangMenu(menu._id || menu.id)}>
                          <Text style={styles.counterBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.counterNum}>{keranjang[menu._id || menu.id]}</Text>
                      </>
                    ) : null}
                    <TouchableOpacity style={[styles.counterBtn, styles.counterBtnAdd]} onPress={() => tambahMenu(menu._id || menu.id)}>
                      <Text style={[styles.counterBtnText, { color: '#fff' }]}>+</Text>
                    </TouchableOpacity>
                  </View>
                ) : null
              ) : (
                // 4. UI STOK HABIS ELEGAN (Tanpa emot sedih)
                <Text style={styles.habisText}>Stok Habis</Text>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>

    {/* Tombol Keranjang */}
    {totalItem > 0 && (
      <View style={styles.keranjangBar}>
        <TouchableOpacity
          style={styles.keranjangButton}
          activeOpacity={isBuka ? 0.9 : 1}
          onPress={() => {
            if (!isBuka) {
              Alert.alert('Toko Tutup', 'Maaf, toko ini sedang tutup. Silakan order saat jam operasional.');
              return;
            }
            navigation.navigate('Keranjang', { keranjang, menuList, toko });
          }}
        >
          <LinearGradient
            colors={isBuka ? ['#1565C0', '#42A5F5'] : ['#B0BEC5', '#CFD8DC']}
            style={styles.keranjangGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.keranjangBadge}>
              <Text style={styles.keranjangBadgeText}>{totalItem}</Text>
            </View>
            <Text style={styles.keranjangText}>
              {isBuka ? 'Lihat Keranjang' : '🔴 Toko Sedang Tutup'}
            </Text>
            <Text style={styles.keranjangHarga}>
              Rp {totalHarga.toLocaleString('id-ID')}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    )}

  </View>
);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  // ── Header Image ──────────────────────────────────────
  headerImageContainer: { width: SCREEN_WIDTH, height: HEADER_HEIGHT, position: 'absolute', top: 0, left: 0, zIndex: 0 },
  headerImage: { width: '100%', height: '100%' },
  headerImageFallback: { width: '100%', height: '100%', backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
  headerFallbackEmoji: { fontSize: 80 },
  headerGradientOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
  backButton: { position: 'absolute', top: 52, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
  backIcon: { fontSize: 26, color: '#1a1a1a', lineHeight: 30, marginTop: -2 },

  // ── Scroll & Card ─────────────────────────────────────
  menuScroll: { flex: 1 },
  tokoInfoCard: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8, marginTop: HEADER_HEIGHT - 28 },

  // ── Toko Info ─────────────────────────────────────────
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

  // ── Menu ──────────────────────────────────────────────
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
  // Coretan text (line-through) dihilangkan sesuai referensi!
  menuNamaHabis: { color: '#aaa' },
  menuDeskripsi: { fontSize: 12, color: '#999', marginBottom: 5, lineHeight: 17 },
  menuHarga: { fontSize: 15, fontWeight: '800', color: '#1565C0' },
  menuHargaHabis: { color: '#bbb' },
  
  // Font Stok Habis diedit lebih rapi
  habisText: { fontSize: 13, fontWeight: '600', color: '#aaa', marginLeft: 8 },

  // ── Counter ───────────────────────────────────────────
  counterBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 },
  counterBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center' },
  counterBtnAdd: { backgroundColor: '#1565C0' },
  counterBtnText: { fontSize: 18, color: '#1565C0', fontWeight: 'bold', lineHeight: 22 },
  counterNum: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a', minWidth: 20, textAlign: 'center' },

  // ── Keranjang Bar ─────────────────────────────────────
  keranjangBar: { position: 'absolute', bottom: 24, left: 20, right: 20 },
  keranjangButton: { borderRadius: 16, overflow: 'hidden', elevation: 8, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 },
  keranjangGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20 },
  keranjangBadge: { backgroundColor: '#fff', borderRadius: 10, width: 28, height: 28, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  keranjangBadgeText: { color: '#1565C0', fontWeight: 'bold', fontSize: 13 },
  keranjangText: { flex: 1, color: '#fff', fontSize: 15, fontWeight: 'bold' },
  keranjangHarga: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // ── Empty ─────────────────────────────────────────────
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 13, color: '#aaa' },
});