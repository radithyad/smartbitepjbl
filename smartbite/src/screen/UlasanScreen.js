import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { api } from '../service/api';
// Perbaikan huruf kapital biar aman saat dijalankan
import { customAlert } from '../utils/alerthelper';

export default function UlasanScreen({ route, navigation }) {
  const { order } = route.params;
  const [rating, setRating] = useState(0);
  const [komentar, setKomentar] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validasi rating
    if (rating === 0) { 
      customAlert('Oops!', 'Pilih rating bintangnya dulu ya!'); 
      return; 
    }
    
    setLoading(true);
    try {
      // Ambil ID dengan aman
      const orderId = order._id || order.id;
      const tokoId = order.toko?._id || order.toko?.id || order.toko_id;

      // Tembak ke Backend
      await api.post('/ulasan', {
        order_id: orderId,
        toko_id: tokoId,
        rating: rating,
        komentar: komentar
      });

      // Kalau sukses, kembali ke tab Aktivitas untuk me-refresh data
      customAlert('Terima Kasih! 🎉', 'Ulasanmu sudah berhasil dikirim!', [
        { text: 'OK', onPress: () => navigation.navigate('Main', { screen: 'Aktivitas' }) }
      ]);

    } catch (error) {
      console.log('Gagal submit ulasan:', error.response?.data || error.message);
      customAlert('Gagal', error.response?.data?.message || 'Tidak bisa submit ulasan, coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const ratingLabel = ['', '😞 Sangat Buruk', '😕 Kurang Memuaskan', '😐 Cukup', '😊 Bagus', '🤩 Luar Biasa!'];
  const tanggalOrder = order.createdAt || order.created_at;

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Beri Ulasan</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Info Pesanan (Dikembalikan karena sempat hilang) */}
        <View style={styles.orderInfo}>
          <Text style={styles.orderInfoEmoji}>{order.toko?.emoji || '🏪'}</Text>
          <View>
            <Text style={styles.orderInfoNama}>{order.toko?.nama || 'Nama Toko'}</Text>
            <Text style={styles.orderInfoTanggal}>
              {tanggalOrder ? new Date(tanggalOrder).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </Text>
          </View>
        </View>

        {/* Rating */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bagaimana pengalamanmu?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
                <Text style={[styles.star, { color: star <= rating ? '#FFC107' : '#E0E0E0' }]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>{ratingLabel[rating]}</Text>
          )}
        </View>

        {/* Komentar */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📝 Komentar</Text>
          <TextInput
            style={styles.komentarInput}
            placeholder="Ceritakan pengalamanmu memesan makanan di sini..."
            placeholderTextColor="#aaa"
            multiline
            numberOfLines={4}
            value={komentar}
            onChangeText={setKomentar}
          />
        </View>

        {/* Tombol Submit */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
          <LinearGradient colors={['#1565C0', '#42A5F5']} style={styles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Kirim Ulasan ⭐</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 55, paddingBottom: 16, paddingHorizontal: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  backIcon: { fontSize: 26, color: '#1a1a1a', lineHeight: 30, marginTop: -2 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },

  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },

  orderInfo: {
    backgroundColor: '#E3F2FD', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12,
  },
  orderInfoEmoji: { fontSize: 30 },
  orderInfoNama: { fontSize: 14, fontWeight: 'bold', color: '#1565C0' },
  orderInfoTanggal: { fontSize: 12, color: '#555', marginTop: 2 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#888', marginBottom: 16 },

  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 12 },
  star: { fontSize: 48 },
  ratingLabel: { textAlign: 'center', fontSize: 15, fontWeight: '600', color: '#1565C0' },

  komentarInput: {
    backgroundColor: '#F5F7FA', borderRadius: 12, padding: 12,
    fontSize: 13, color: '#1a1a1a', borderWidth: 1, borderColor: '#E8ECF0',
    textAlignVertical: 'top', minHeight: 100,
  },

  submitButton: { borderRadius: 16, overflow: 'hidden', elevation: 6, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  submitGradient: { paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});