import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function RolePickerScreen({ navigation }) {
  return (
    <View style={styles.container}>

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
              <Ionicons name="school" size={28} color="#1565C0" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Customer</Text>
              <Text style={styles.cardDesc}>Pesan makanan dari kantin kampus dengan mudah dan cepat</Text>
            </View>
            <View style={styles.cardArrow}>
              <Ionicons name="chevron-forward" size={18} color="#888" />
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
              <Ionicons name="storefront" size={26} color="#F57F17" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Penjual / Mitra</Text>
              <Text style={styles.cardDesc}>Buka toko di SmartBite dan jangkau lebih banyak pembeli</Text>
            </View>
            <View style={styles.cardArrow}>
               <Ionicons name="chevron-forward" size={18} color="#888" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink} activeOpacity={0.7}>
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

  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 },

  heading: { fontSize: 30, fontWeight: 'bold', color: '#1A1A1A', lineHeight: 40, marginBottom: 8 },
  subheading: { fontSize: 14, color: '#888', marginBottom: 32 },

  card: {
    borderRadius: 20, marginBottom: 16,
    elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10,
    overflow: 'hidden', // Biar background gradient gak keluar dari border radius
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

  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 5 },
  cardDesc: { fontSize: 12, color: '#888', lineHeight: 18, marginBottom: 10 },

  cardArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },

  loginLink: { marginTop: 8, alignItems: 'center' },
  loginLinkText: { fontSize: 14, color: '#888' },
  loginLinkBold: { color: '#1565C0', fontWeight: '700' },
});