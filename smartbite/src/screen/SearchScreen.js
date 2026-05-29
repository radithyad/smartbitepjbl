import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { api } from '../service/api'; 

// 🔥 Import Floating Cart komponen baru kita
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Mau makan apa hari ini..."
            placeholderTextColor="#aaa"
            value={query}
            onChangeText={handleSearch}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults({ toko: [], menu: [] }); setSearched(false); }}>
              <Text style={{ color: '#aaa', fontSize: 16, paddingHorizontal: 4 }}>✕</Text>
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
            <Text style={styles.emptyEmoji}>🤷</Text>
            <Text style={styles.emptyText}>Hasil untuk "{query}" tidak ditemukan</Text>
          </View>
        ) : searched ? (
          <>
            {results.toko.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>🏪 Toko ({results.toko.length})</Text>
                {results.toko.map((toko) => (
                  <TouchableOpacity key={toko._id || toko.id} style={styles.tokoCard} activeOpacity={0.8} onPress={() => navigation.navigate('DetailToko', { toko })}>
                    <View style={styles.tokoEmojiBox}>
                      <Text style={{ fontSize: 30 }}>{toko.emoji}</Text>
                    </View>
                    <View style={styles.tokoInfo}>
                      <Text style={styles.tokoNama}>{toko.nama}</Text>
                      <Text style={styles.tokoKategori}>{toko.kategori}</Text>
                      <View style={styles.tokoMeta}>
                        <Text style={styles.tokoMetaText}>⭐ {toko.rating}</Text>
                        <Text style={styles.tokoDot}>•</Text>
                        <Text style={styles.tokoMetaText}>⏱ {toko.waktu}</Text>
                      </View>
                    </View>
                    <Text style={styles.arrow}>›</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
            {results.menu.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>🍽 Menu ({results.menu.length})</Text>
                {results.menu.map((menu) => {
                  const tokoData = menu.toko_id || menu.toko || {}; 

                  return (
                    <TouchableOpacity key={menu._id || menu.id} style={styles.menuCard} activeOpacity={0.8} onPress={() => navigation.navigate('DetailToko', { toko: tokoData })}>
                      <View style={styles.menuEmojiBox}>
                        <Text style={{ fontSize: 28 }}>{menu.emoji}</Text>
                      </View>
                      <View style={styles.menuInfo}>
                        <Text style={styles.menuNama}>{menu.nama}</Text>
                        <Text style={styles.menuDeskripsi} numberOfLines={1}>{menu.deskripsi}</Text>
                        <Text style={styles.menuHarga}>Rp {(menu.harga || 0).toLocaleString('id-ID')}</Text>
                      </View>
                      <View style={styles.tokoTag}>
                        <Text style={styles.tokoTagEmoji}>{tokoData.emoji || '🏪'}</Text>
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
            <Text style={styles.hintEmoji}>🍜</Text>
            <Text style={styles.hintText}>Ketik nama toko atau menu</Text>
            <Text style={styles.hintSubText}>Contoh: "bakso", "Bu Sari", "mie"</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 🔥 FLOATING CART: Terpasang indah di paling bawah Search Screen */}
      <FloatingCart bottom={24} />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 55, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', gap: 10 },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 26, color: '#1a1a1a', lineHeight: 30, marginTop: -2 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#E8ECF0' },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1a1a1a' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  centerContainer: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  loadingText: { fontSize: 14, color: '#888' },
  emptyEmoji: { fontSize: 50 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center' },
  hintEmoji: { fontSize: 60, marginBottom: 8 },
  hintText: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  hintSubText: { fontSize: 13, color: '#888' },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 10, marginTop: 8 },
  tokoCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  tokoEmojiBox: { width: 52, height: 52, backgroundColor: '#F0F4FF', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  tokoInfo: { flex: 1 },
  tokoNama: { fontSize: 14, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 2 },
  tokoKategori: { fontSize: 12, color: '#888', marginBottom: 4 },
  tokoMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tokoMetaText: { fontSize: 12, color: '#555' },
  tokoDot: { color: '#ccc' },
  arrow: { fontSize: 24, color: '#ccc' },
  menuCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, gap: 12 },
  menuEmojiBox: { width: 52, height: 52, backgroundColor: '#F0F4FF', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuInfo: { flex: 1 },
  menuNama: { fontSize: 14, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 2 },
  menuDeskripsi: { fontSize: 11, color: '#888', marginBottom: 4 },
  menuHarga: { fontSize: 13, fontWeight: '700', color: '#1565C0' },
  tokoTag: { alignItems: 'center', gap: 2 },
  tokoTagEmoji: { fontSize: 18 },
  tokoTagNama: { fontSize: 10, color: '#888', textAlign: 'center', maxWidth: 55 },
});