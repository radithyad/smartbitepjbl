import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useState } from 'react';
import { api } from '../service/api'; 
import { Ionicons } from '@expo/vector-icons';

// 🔥 Import Floating Cart
import FloatingCart from '../component/FloatingCart';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ toko: [], menu: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (text) => {
    setQuery(text);
    if (text.length < 2) { 
      setResults({ toko: [], menu: [] }); 
      setSearched(false); 
      return; 
    }
    
    setLoading(true);
    setSearched(true);
    
    try {
      const [tokoRes, menuRes] = await Promise.all([
        api.get('/toko'),
        api.get('/menu')
      ]);

      const queryLower = text.toLowerCase();

      const filteredToko = (tokoRes.data || []).filter(t => 
        t.nama.toLowerCase().includes(queryLower) 
      );

      const filteredMenu = (menuRes.data || []).filter(m => 
        m.nama.toLowerCase().includes(queryLower)
      );

      setResults({ toko: filteredToko, menu: filteredMenu });
    } catch (error) {
      console.log('Gagal mencari data:', error.message);
      setResults({ toko: [], menu: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* Header dengan Search Bar Gaya HomeScreen */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={26} color="#1a1a1a" />
        </TouchableOpacity>
        
        <View style={styles.searchBarPintasan}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari makanan atau toko..."
            placeholderTextColor="#999"
            value={query}
            onChangeText={handleSearch}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults({ toko: [], menu: [] }); setSearched(false); }}>
              <Ionicons name="close-circle" size={20} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#1565C0" />
            <Text style={styles.loadingText}>Mencari...</Text>
          </View>
        ) : searched && results.toko.length === 0 && results.menu.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="search-outline" size={60} color="#D0D5DD" style={{ marginBottom: 8 }} />
            <Text style={styles.emptyText}>Hasil untuk "{query}" tidak ditemukan</Text>
          </View>
        ) : searched ? (
          <>
            {results.toko.length > 0 && (
              <>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="storefront" size={18} color="#1a1a1a" />
                  <Text style={styles.sectionTitle}>Toko ({results.toko.length})</Text>
                </View>
                
                {results.toko.map((toko) => (
                  <TouchableOpacity key={toko._id || toko.id} style={styles.tokoCard} activeOpacity={0.8} onPress={() => navigation.navigate('DetailToko', { toko })}>
                    <View style={styles.imageBox}>
                      {toko.foto_url ? (
                        <Image source={{ uri: toko.foto_url }} style={styles.imageStyle} resizeMode="cover" />
                      ) : (
                        <Ionicons name="storefront" size={26} color="#1565C0" />
                      )}
                    </View>
                    <View style={styles.tokoInfo}>
                      <Text style={styles.tokoNama}>{toko.nama}</Text>
                      <Text style={styles.tokoKategori}>{toko.kategori}</Text>
                      <View style={styles.tokoMeta}>
                        <Ionicons name="star" size={12} color="#FFC107" />
                        <Text style={styles.tokoMetaText}>{toko.rating || 'Baru'}</Text>
                        <Text style={styles.tokoDot}>•</Text>
                        <Ionicons name="time-outline" size={12} color="#888" />
                        <Text style={styles.tokoMetaText}>{toko.waktu || toko.estimasi || '10-15 mnt'}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </TouchableOpacity>
                ))}
              </>
            )}
            
            {results.menu.length > 0 && (
              <>
                <View style={[styles.sectionHeaderRow, { marginTop: 12 }]}>
                  <Ionicons name="restaurant" size={18} color="#1a1a1a" />
                  <Text style={styles.sectionTitle}>Menu ({results.menu.length})</Text>
                </View>

                {results.menu.map((menu) => {
                  const tokoData = menu.toko_id || menu.toko || {}; 

                  return (
                    <TouchableOpacity key={menu._id || menu.id} style={styles.menuCard} activeOpacity={0.8} onPress={() => navigation.navigate('DetailToko', { toko: tokoData })}>
                      <View style={styles.imageBox}>
                        {menu.foto_url ? (
                          <Image source={{ uri: menu.foto_url }} style={styles.imageStyle} resizeMode="cover" />
                        ) : (
                          <Ionicons name="fast-food" size={26} color="#1565C0" />
                        )}
                      </View>
                      <View style={styles.menuInfo}>
                        <Text style={styles.menuNama}>{menu.nama}</Text>
                        <Text style={styles.menuDeskripsi} numberOfLines={1}>{menu.deskripsi}</Text>
                        <Text style={styles.menuHarga}>Rp {(menu.harga || 0).toLocaleString('id-ID')}</Text>
                      </View>
                      <View style={styles.tokoTag}>
                        <Ionicons name="storefront-outline" size={16} color="#888" style={{ marginBottom: 2 }} />
                        <Text style={styles.tokoTagNama} numberOfLines={1}>{tokoData.nama || 'Toko'}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </>
        ) : (
          <View style={styles.centerContainer}>
            <Ionicons name="fast-food-outline" size={70} color="#D0D5DD" style={{ marginBottom: 8 }} />
            <Text style={styles.hintText}>Ayo cari menu yang lagi{'\n'}pengen kamu beli!</Text>
            <Text style={styles.hintSubText}>Contoh: baso goreng atau mie ayam</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Cart di bawah */}
      <FloatingCart bottom={24} />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  
  // Header & Searchbar Baru
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 55, paddingBottom: 16, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', gap: 12 },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center' },
  searchBarPintasan: { flex: 1, backgroundColor: '#fff', borderRadius: 50, flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1a1a1a', fontWeight: '500' },
  
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  centerContainer: { alignItems: 'center', paddingVertical: 80, gap: 8 },
  loadingText: { fontSize: 14, color: '#888' },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center' },
  hintText: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', alignItems: 'center', textAlign: 'center' },
  hintSubText: { fontSize: 13, color: '#888', textAlign: 'center' },
  
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 8, gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
  
  // Komponen Foto Universal (buat Toko & Menu)
  imageBox: { width: 56, height: 56, backgroundColor: '#F0F4FF', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
  imageStyle: { width: '100%', height: '100%' },

  tokoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  tokoInfo: { flex: 1 },
  tokoNama: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 2 },
  tokoKategori: { fontSize: 12, color: '#888', marginBottom: 6 },
  tokoMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tokoMetaText: { fontSize: 12, color: '#555', fontWeight: '600' },
  tokoDot: { color: '#ccc', marginHorizontal: 4 },
  
  menuCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, gap: 12 },
  menuInfo: { flex: 1 },
  menuNama: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 2 },
  menuDeskripsi: { fontSize: 12, color: '#888', marginBottom: 6 },
  menuHarga: { fontSize: 14, fontWeight: '800', color: '#1565C0' },
  
  tokoTag: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F7FA', padding: 8, borderRadius: 10, width: 64 },
  tokoTagNama: { fontSize: 10, color: '#666', textAlign: 'center', fontWeight: '600' },
});