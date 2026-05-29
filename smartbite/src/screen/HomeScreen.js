import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, FlatList, Platform
} from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../service/api';
import * as SecureStore from 'expo-secure-store';

// 👇 Import semua keluarga ikon yang kita butuhkan!
import { Ionicons, FontAwesome5, FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons'; 

// 👇 Kategori campuran (tiap ikon bisa diatur ukurannya biar visualnya seimbang)
const KATEGORI = [
  { id: 'nasi', label: 'Nasi', type: 'FA6', icon: 'bowl-food', size: 24 },
  { id: 'mie', label: 'Mie', type: 'MCI', icon: 'noodles', size: 28 },
  { id: 'jajan', label: 'Jajanan', type: 'FA5', icon: 'pizza-slice', size: 24 },
  { id: 'minuman', label: 'Minuman', type: 'FA5', icon: 'mug-hot', size: 24 },
  { id: 'berat', label: 'Makanan\nBerat', type: 'FA5', icon: 'drumstick-bite', size: 24 },
  { id: 'lainnya', label: 'Lainnya', type: 'FA5', icon: 'th-large', size: 24 },
];

export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState('');
  const [tokoList, setTokoList] = useState([]);
  const [tokoFiltered, setTokoFiltered] = useState([]);
  const [menuTerlaris, setMenuTerlaris] = useState([]);
  const [selectedKategori, setSelectedKategori] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Ambil Data Nama User Dari Sesi Login ──
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        let data = Platform.OS === 'web' ? localStorage.getItem('userData') : await SecureStore.getItemAsync('userData');
        if (data) {
          const parsed = JSON.parse(data);
          setUserName(parsed.nama || parsed.name || 'Mahasiswa');
        }
      } catch (e) {
        console.log("Error get user data", e);
      }
    };
    fetchUserData();
  }, []);

  // ── Ambil Data Toko & Menu Terlaris Dari Backend ──
  const fetchData = async () => {
    setLoading(true);
    try {
      const tokoRes = await api.get('/toko');
      setTokoList(tokoRes.data || []);
      setTokoFiltered(tokoRes.data || []);

      const terlarisRes = await api.get('/menu/terlaris').catch(() => ({ data: [] }));
      setMenuTerlaris(terlarisRes.data || []);
    } catch (error) {
      console.log('❌ Gagal mengambil data homescreen:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  // ── Fungsi Filter Kategori ──
  const handleSelectKategori = (kategoriId) => {
    if (selectedKategori === kategoriId) {
      setSelectedKategori(null);
      setTokoFiltered(tokoList);
    } else {
      setSelectedKategori(kategoriId);
      const filtered = tokoList.filter(t => t.kategori?.toLowerCase().includes(kategoriId.toLowerCase()));
      setTokoFiltered(filtered);
    }
  };

  if (loading && tokoList.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1565C0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* ── Header Solid Blue ── */}
      <View style={styles.headerSolid}>
        <View style={styles.headerTop}>
          <Text style={styles.headerGreeting}>Halo, {userName}!</Text>
          <Text style={styles.headerSubtext}>Mau makan hemat & praktis di kantin mana hari ini?</Text>
        </View>

        {/* ── Search Bar Di Dalam Header ── */}
        <TouchableOpacity 
          style={styles.searchBarPintasan} 
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Search')}
        >
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <Text style={styles.searchTextPlaceholder}>Cari makanan atau toko disini...</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120, paddingTop: 18 }}>
        
        {/* ── Section Kategori Campuran (Mix Libraries) ── */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.kategoriContainer}
        >
          {KATEGORI.map((item) => {
            const isSelected = selectedKategori === item.id;
            
            // 👇 Logika Sakti: Nentuin komponen mana yang dipakai
            let IconComponent = FontAwesome5;
            if (item.type === 'FA6') IconComponent = FontAwesome6;
            if (item.type === 'MCI') IconComponent = MaterialCommunityIcons;

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.kategoriCard, isSelected && styles.kategoriCardActive]}
                onPress={() => handleSelectKategori(item.id)}
                activeOpacity={0.8}
              >
                <IconComponent 
                  name={item.icon} 
                  size={item.size} 
                  color={isSelected ? '#fff' : '#1565C0'} 
                  style={{ marginBottom: 8 }}
                />
                <Text style={[styles.kategoriLabel, isSelected && styles.kategoriLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Section Menu Terlaris ── */}
        {menuTerlaris.length >= 3 && (
          <View style={{ marginBottom: 6 }}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="flame" size={22} color="#E65100" />
              <Text style={styles.sectionTitleWithIcon}>Paling Banyak Dibeli (7 Hari)</Text>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={menuTerlaris}
              keyExtractor={(item) => item._id || item.id}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.terlarisCard}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('DetailToko', { toko: item.toko_id || item.toko })}
                >
                  <View style={styles.terlarisImageBox}>
                    {item.foto_url ? (
                       <Image source={{ uri: item.foto_url }} style={styles.terlarisImage} resizeMode="cover" />
                    ) : (
                       <Ionicons name="restaurant" size={30} color="#1565C0" />
                    )}
                  </View>
                  <View style={styles.terlarisInfo}>
                    <Text style={styles.terlarisNama} numberOfLines={1}>{item.nama}</Text>
                    <View style={styles.tokoTerlarisRow}>
                      <Ionicons name="storefront-outline" size={12} color="#666" />
                      <Text style={styles.terlarisToko} numberOfLines={1}>{item.toko_id?.nama || 'Tenant Kantin'}</Text>
                    </View>
                    <Text style={styles.terlarisHarga}>Rp {(item.harga || 0).toLocaleString('id-ID')}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* ── Section Toko Tersedia ── */}
        <Text style={styles.sectionTitle}>Daftar Toko Tersedia</Text>
        <View style={styles.tokoListContainer}>
          {tokoFiltered.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Ionicons name="search-outline" size={40} color="#ccc" />
              <Text style={styles.emptyStateText}>Tidak ada toko yang sesuai kategori ini.</Text>
            </View>
          ) : (
            tokoFiltered.map((toko) => {
              const isBuka = toko.aktif !== false;
              return (
                <TouchableOpacity
                  key={toko._id || toko.id}
                  style={[styles.tokoCard, !isBuka && styles.tokoCardTutup]}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('DetailToko', { toko })}
                >
                  <View style={styles.tokoImageWrapper}>
                    <View style={styles.tokoImageBox}>
                      {toko.foto_url ? (
                        <Image source={{ uri: toko.foto_url }} style={styles.tokoImage} resizeMode="cover" />
                      ) : (
                        <Ionicons name="storefront" size={32} color="#1565C0" />
                      )}
                    </View>
                    {!isBuka && (
                      <View style={styles.tutupOverlay}>
                        <Text style={styles.tutupOverlayText}>TUTUP</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.tokoInfo}>
                    <View style={styles.tokoInfoTop}>
                      <Text style={styles.tokoNama} numberOfLines={1}>{toko.nama}</Text>
                      <View style={[styles.statusBadge, isBuka ? styles.bukaBadge : styles.tutupBadge]}>
                        <Text style={[styles.statusBadgeText, { color: isBuka ? '#2E7D32' : '#C62828' }]}>
                          {isBuka ? 'Buka' : 'Tutup'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.tokoKategori}>{toko.kategori}</Text>
                    
                    {/* Meta Info (Estimasi & Jam Dihapus Murni) */}
                    <View style={styles.tokoMeta}>
                      <Ionicons name="star" size={12} color="#FFC107" />
                      <Text style={styles.tokoMetaText}>{toko.rating || 'Baru'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
  
  // ── Header Solid Blue & Raksasa ──
  headerSolid: {
    backgroundColor: '#1565C0',
    paddingTop: Platform.OS === 'ios' ? 65 : 55, 
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 32, 
    borderBottomRightRadius: 32,
  },
  headerTop: { marginBottom: 18 }, 
  headerGreeting: { fontSize: 30, fontWeight: 'bold', color: '#fff', letterSpacing: -0.5 },
  headerSubtext: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 0, lineHeight: 20 }, 
  
  // ── Search Bar Di Dalam Header ──
  searchBarPintasan: {
    backgroundColor: '#fff',
    borderRadius: 50, 
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6,
  },
  searchIcon: { marginRight: 10 },
  searchTextPlaceholder: { color: '#999', fontSize: 14, fontWeight: '500' },
  
  // ── Kategori (Campuran Libraries) ──
  kategoriContainer: { paddingHorizontal: 20, gap: 12, paddingBottom: 4 },
  kategoriCard: { 
    backgroundColor: '#fff', 
    borderRadius: 18, 
    width: 82, 
    height: 82, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 2, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 
  },
  kategoriCardActive: { backgroundColor: '#1565C0', borderWidth: 0 },
  kategoriLabel: { fontSize: 11, fontWeight: '700', color: '#555', textAlign: 'center' },
  kategoriLabelActive: { color: '#fff' },

  // ── Spasi Antar Section Dirapatkan ──
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 16, marginBottom: 10, gap: 6 },
  sectionTitleWithIcon: { fontSize: 17, fontWeight: 'bold', color: '#1A1A1A' },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#1A1A1A', marginHorizontal: 20, marginTop: 18, marginBottom: 10 },
  
  // ── Menu Terlaris ──
  terlarisCard: { backgroundColor: '#fff', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', width: 230, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, gap: 12 },
  terlarisImageBox: { width: 60, height: 60, backgroundColor: '#F0F4FF', borderRadius: 14, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  terlarisImage: { width: '100%', height: '100%' },
  terlarisInfo: { flex: 1, gap: 3 },
  terlarisNama: { fontSize: 13, fontWeight: 'bold', color: '#1A1A1A' },
  tokoTerlarisRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  terlarisToko: { fontSize: 11, color: '#666', flex: 1 },
  terlarisHarga: { fontSize: 13, fontWeight: '800', color: '#1565C0' },
  
  // ── Toko List ──
  tokoListContainer: { paddingHorizontal: 20, gap: 10 },
  tokoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  tokoCardTutup: { opacity: 0.65 },
  tokoImageWrapper: { position: 'relative', marginRight: 14 },
  tokoImageBox: { width: 64, height: 64, borderRadius: 14, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  tokoImage: { width: '100%', height: '100%' },
  tutupOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  tutupOverlayText: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  tokoInfo: { flex: 1 },
  tokoInfoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  tokoNama: { fontSize: 15, fontWeight: 'bold', color: '#1A1A1A', flex: 1, marginRight: 8 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  bukaBadge: { backgroundColor: '#E8F5E9' },
  tutupBadge: { backgroundColor: '#FFEBEE' },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  tokoKategori: { fontSize: 12, color: '#777', marginBottom: 5 },
  tokoMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tokoMetaText: { fontSize: 12, color: '#555', fontWeight: '500' },
  
  emptyStateCard: { borderRadius: 16, padding: 30, marginHorizontal: 20, alignItems: 'center', gap: 10 },
  emptyStateText: { color: '#888', fontSize: 13, fontWeight: '500' }
});