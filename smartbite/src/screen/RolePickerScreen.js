import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function RolePickerScreen({ navigation }) {
  return (
    <View style={styles.container}>

      {/* Back */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
        <Text style={styles.backIcon}>‹</Text>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>

        <Text style={styles.heading}>Mau daftar{'\n'}sebagai apa?</Text>
        <Text style={styles.subheading}>Pilih peranmu dan mulai perjalananmu</Text>

        {/* Customer Card */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#EEF5FF', '#ffffff']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.cardIconWrapper}>
              <Text style={styles.cardIcon}>🎓</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Customer</Text>
              <Text style={styles.cardDesc}>Pesan makanan dari kantin kampus dengan mudah dan cepat</Text>
            </View>
            <View style={styles.cardArrow}>
              <Text style={styles.cardArrowText}>›</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Seller Card */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('RegisterVendor')}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#FFF8E1', '#ffffff']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[styles.cardIconWrapper, { backgroundColor: '#FFE082' }]}>
              <Text style={styles.cardIcon}>🏪</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Penjual / Mitra</Text>
              <Text style={styles.cardDesc}>Buka toko di SmartBite dan jangkau lebih banyak pembeli</Text>
            </View>
            <View style={styles.cardArrow}>
              <Text style={styles.cardArrowText}>›</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
          <Text style={styles.loginLinkText}>Sudah punya akun? <Text style={styles.loginLinkBold}>Masuk disini</Text></Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  backButton: {
    position: 'absolute', top: 55, left: 20, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
  },
  backIcon: { fontSize: 26, color: '#1A1A1A', lineHeight: 30, marginTop: -2 },

  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 },

  heading: { fontSize: 30, fontWeight: 'bold', color: '#1A1A1A', lineHeight: 40, marginBottom: 8 },
  subheading: { fontSize: 14, color: '#888', marginBottom: 32 },

  card: {
    borderRadius: 20, marginBottom: 16,
    elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10,
    overflow: 'hidden',
  },
  cardGradient: {
    flexDirection: 'row', alignItems: 'center',
    padding: 20, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E8ECF0',
  },

  cardIconWrapper: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#DCEEFF',
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  cardIcon: { fontSize: 28 },

  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 5 },
  cardDesc: { fontSize: 12, color: '#888', lineHeight: 18, marginBottom: 10 },

  cardBadgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  cardBadge: { backgroundColor: '#EEF5FF', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  cardBadgeText: { fontSize: 10, fontWeight: '600', color: '#1565C0' },

  cardArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
  cardArrowText: { fontSize: 20, color: '#888', marginTop: -2 },

  loginLink: { marginTop: 8, alignItems: 'center' },
  loginLinkText: { fontSize: 14, color: '#888' },
  loginLinkBold: { color: '#1565C0', fontWeight: '700' },
});