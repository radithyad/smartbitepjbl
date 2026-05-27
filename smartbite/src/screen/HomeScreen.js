import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Image, FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../service/api';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// 👇 Kategori baru ala referensi GoFood
const KATEGORI = [
  { id: 'berat', label: 'Makanan\nBerat', emoji: '🍛' },
  { id: 'sehat', label: 'Makanan\nSehat', emoji: '🥗' },
  { id: 'jajan', label: 'Jajanan', emoji: '🍟' },
  { id: 'minuman', label: 'Minuman', emoji: '🧋' },
  { id: 'ekonomis', label: 'Ekonomis', emoji: '💰' },
  { id: 'vegan', label: 'Vegan', emoji: '🥬' },
];

export default function HomeScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [fotoUrl, setFotoUrl] = useState(null);
  const [tokoList, setTokoList] = useState([]);
  const [tokoFiltered, setTokoFiltered] = useState([]);
  const [menuTerlaris, setMenuTerlaris] = useState([]);
  const [kategoriAktif, setKategoriAktif] = useState('semua');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      fetchToko();
      fetchMenuTerlaris();
    }, [])
  );

  const fetchProfile = async () => {
    try {
      let userData = Platform.OS === 'web' 
        ? localStorage.getItem('userData') 
        : await SecureStore.getItemAsync('userData');

      if (userData) {
        const parsed = JSON.parse(userData);
        setProfile(parsed);
        setFotoUrl(parsed.foto_url || null);
      }
    } catch (error) {
      console.log('Gagal ambil profil:', error);
    }
  };

  const fetchToko = async () => {
    try {
      const response = await api.get('/toko');
      if (response.data) {
        setTokoList(response.data);
        setTokoFiltered(sortToko(response.data));
      }
    } catch (error) {
      console.log('Gagal ambil toko:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuTerlaris = async () => {
    setMenuTerlaris([]);
  };

  const sortToko = (list) => {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return [...list].sort((a, b) => {
      const isBukaA = isBuka(a, nowMinutes) ? 0 : 1;
      const isBukaB = isBuka(b, nowMinutes) ? 0 : 1;
      return isBukaA - isBukaB;
    });
  };

  const isBuka = (toko, nowMinutes) => {
    if (!toko.jam_buka || !toko.jam_tutup) return true;
    const [bukaH, bukaM] = toko.jam_buka.split(':').map(Number);
    const [tutupH, tutupM] = toko.jam_tutup.split(':').map(Number);
    const buka = bukaH * 60 + bukaM;
    const tutup = tutupH * 60 + tutupM;
    return nowMinutes >= buka && nowMinutes <= tutup;
  };

  // 👇 Logika klik ganda untuk reset filter
  const handleKategori = (id) => {
    if (kategoriAktif === id) {
      setKategoriAktif('semua'); // Reset jika diklik 2x
      setTokoFiltered(sortToko(tokoList));
    } else {
      setKategoriAktif(id);
      const filtered = tokoList.filter(t =>
        t.kategori?.toLowerCase().includes(id.toLowerCase())
      );
      setTokoFiltered(sortToko(filtered));
    }
  };

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1565C0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={['#1565C0', '#f2f2f2']} style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>
                Halo, {profile ? profile.nama.split(' ')[0] : 'Mahasiswa'}!
              </Text>
              <Text style={styles.subGreeting}>Mau makan apa hari ini?</Text>
            </View>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profil')}
              activeOpacity={0.8}
            >
              {fotoUrl ? (
                <Image
                  source={{ uri: fotoUrl }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Text style={{ fontSize: 20 }}>👤</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <TouchableOpacity
            style={styles.searchBar}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Search')}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={{ flex: 1, fontSize: 14, color: '#aaa' }}>Cari makanan atau toko disini</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.content}>

          {/* 👇 Kategori UI Ala GoFood (Tanpa Judul Bagian) */}
          <View style={styles.sectionKategori}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.kategoriRow}>
                {KATEGORI.map((kat) => (
                  <TouchableOpacity
                    key={kat.id}
                    style={[
                      styles.kategoriCard,
                      kategoriAktif === kat.id && styles.kategoriCardActive
                    ]}
                    onPress={() => handleKategori(kat.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.kategoriEmojiCard}>{kat.emoji}</Text>
                    <Text style={[
                      styles.kategoriLabelCard,
                      kategoriAktif === kat.id && styles.kategoriLabelCardActive
                    ]}>
                      {kat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Menu Terlaris */}
          {menuTerlaris.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Favorit orang-orang</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.terlarisRow}>
                  {menuTerlaris.map((item) => (
                    <TouchableOpacity
                      key={item._id || item.id}
                      style={styles.terlarisCard}
                      onPress={async () => {
                        try {
                          const response = await api.get(`/toko/${item.toko_id}`);
                          if (response.data) navigation.navigate('DetailToko', { toko: response.data });
                        } catch (error) {
                          console.log(error);
                        }
                      }}
                      activeOpacity={0.85}
                    >
                      {item.foto_url ? (
                        <Image
                          source={{ uri: item.foto_url }}
                          style={styles.terlarisImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.terlarisEmojiBox}>
                          <Text style={styles.terlarisEmoji}>{item.emoji}</Text>
                        </View>
                      )}
                      <View style={styles.terlarisBadge}>
                        <Text style={styles.terlarisBadgeText}>🔥 {item.total_dipesan}x</Text>
                      </View>
                      <View style={styles.terlarisInfo}>
                        <Text style={styles.terlarisNama} numberOfLines={1}>{item.nama}</Text>
                        <Text style={styles.terlarisToko} numberOfLines={1}>📍 {item.nama_toko}</Text>
                        <Text style={styles.terlarisHarga}>
                          Rp {item.harga.toLocaleString('id-ID')}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Toko di Kantin */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Toko yang tersedia
              {kategoriAktif !== 'semua' && (
                <Text style={styles.filterLabel}> • Kategori Pilihan</Text>
              )}
            </Text>

            {tokoFiltered.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyText}>Tidak ada toko untuk kategori ini</Text>
              </View>
            ) : (
              tokoFiltered.map((toko) => {
                const buka = isBuka(toko, nowMinutes);
                return (
                  <TouchableOpacity
                    key={toko._id} 
                    style={[styles.tokoCard, !buka && styles.tokoCardTutup]}
                    onPress={() => navigation.navigate('DetailToko', { toko })}
                    activeOpacity={0.85}
                  >
                    {/* Foto atau Emoji */}
                    <View style={styles.tokoImageWrapper}>
                      {toko.foto_url ? (
                        <Image
                          source={{ uri: toko.foto_url }}
                          style={styles.tokoImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.tokoEmojiBox}>
                          <Text style={styles.tokoEmoji}>{toko.emoji}</Text>
                        </View>
                      )}
                      {!buka && (
                        <View style={styles.tutupOverlay}>
                          <Text style={styles.tutupOverlayText}>Tutup</Text>
                        </View>
                      )}
                    </View>

                    {/* Info Toko */}
                    <View style={styles.tokoInfo}>
                      <View style={styles.tokoInfoTop}>
                        <Text style={styles.tokoNama} numberOfLines={1}>{toko.nama}</Text>
                        {/* Badge Buka/Tutup */}
                        <View style={[styles.statusBadge, buka ? styles.bukaBadge : styles.tutupBadge]}>
                          <Text style={styles.statusBadgeText}>
                            {buka ? '🟢 Buka' : '🔴 Tutup'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.tokoKategori}>{toko.kategori}</Text>
                      <View style={styles.tokoMeta}>
                        <Text style={styles.tokoMetaText}>⭐ {toko.rating || 'Baru'}</Text>
                        <Text style={styles.tokoMetaDot}>•</Text>
                        <Text style={styles.tokoMetaText}>🕐 {toko.jam_buka} - {toko.jam_tutup}</Text>
                      </View>
                    </View>
                    <Text style={styles.tokoChevron}>›</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: { paddingTop: 55, paddingHorizontal: 20, },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  subGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  profileButton: { padding: 2 },
  profileImage: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)' },
  profilePlaceholder: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  searchIcon: { fontSize: 16 },
  searchPlaceholder: { fontSize: 14, color: '#aaa' },

  content: { paddingTop: 16 },
  section: { marginBottom: 8, paddingBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a', paddingHorizontal: 20, marginBottom: 12 },
  filterLabel: { fontSize: 13, fontWeight: '400', color: '#1565C0' },

  // 👇 Style Baru Kategori Ala GoFood
  sectionKategori: { 
    marginBottom: 16, 
    marginTop: 4 
  },
  kategoriRow: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    gap: 12, 
    paddingBottom: 16, // Space for shadow
    paddingTop: 8 
  },
  kategoriCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    paddingVertical: 14, 
    paddingHorizontal: 10, 
    width: 86, 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 6 
  },
  kategoriCardActive: { 
    backgroundColor: '#E3F2FD', 
    borderWidth: 1.5, 
    borderColor: '#1565C0',
    paddingVertical: 12.5, // Disesuaikan border
    paddingHorizontal: 8.5
  },
  kategoriEmojiCard: { 
    fontSize: 34, 
    marginBottom: 8 
  },
  kategoriLabelCard: { 
    fontSize: 11.5, 
    fontWeight: 'bold', 
    color: '#1a1a1a', 
    textAlign: 'center', 
    lineHeight: 15 
  },
  kategoriLabelCardActive: { 
    color: '#1565C0' 
  },

  // Menu Terlaris
  terlarisRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12 },
  terlarisCard: { width: 140, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  terlarisImage: { width: 140, height: 100 },
  terlarisEmojiBox: { width: 140, height: 100, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center' },
  terlarisEmoji: { fontSize: 40 },
  terlarisBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  terlarisBadgeText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  terlarisInfo: { padding: 10 },
  terlarisNama: { fontSize: 12, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 2 },
  terlarisToko: { fontSize: 10, color: '#888', marginBottom: 4 },
  terlarisHarga: { fontSize: 12, fontWeight: 'bold', color: '#1565C0' },

  // Toko Card
  tokoCard: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 10, borderRadius: 14, padding: 12, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6 },
  tokoCardTutup: { opacity: 0.7 },
  tokoImageWrapper: { position: 'relative', marginRight: 12 },
  tokoImage: { width: 65, height: 65, borderRadius: 12 },
  tokoEmojiBox: { width: 65, height: 65, borderRadius: 12, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center' },
  tokoEmoji: { fontSize: 32 },
  tutupOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  tutupOverlayText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  tokoInfo: { flex: 1 },
  tokoInfoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  tokoNama: { fontSize: 14, fontWeight: 'bold', color: '#1a1a1a', flex: 1, marginRight: 6 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  bukaBadge: { backgroundColor: '#E8F5E9' },
  tutupBadge: { backgroundColor: '#FFEBEE' },
  statusBadgeText: { fontSize: 9, fontWeight: '600' },
  tokoKategori: { fontSize: 12, color: '#888', marginBottom: 4 },
  tokoMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tokoMetaText: { fontSize: 12, color: '#555' },
  tokoMetaDot: { color: '#ccc' },
  tokoJam: { fontSize: 10, color: '#aaa', marginTop: 3 },
  tokoChevron: { fontSize: 22, color: '#ccc', marginLeft: 4 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 13, color: '#aaa' },
});