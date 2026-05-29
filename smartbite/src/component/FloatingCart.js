import { View, Text, TouchableOpacity, StyleSheet, Animated, Keyboard, Platform } from 'react-native';
import { useContext, useEffect, useRef } from 'react';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { CartContext } from '../context/CartContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function FloatingCart({ bottom = 90 }) {
  const navigation = useNavigation();
  const { keranjang, toko, menuList } = useContext(CartContext);

  const currentTabName = useNavigationState((state) => {
    if (!state) return null;
    return state.routes[state.index]?.name;
  });

  // 🔥 1. Siapkan mesin animasi
  const keyboardOffset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Gunakan event yang berbeda antara iOS dan Android biar presisi
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onKeyboardShow = (e) => {
      Animated.timing(keyboardOffset, {
        // Naik ke atas sejauh tinggi keyboard
        toValue: -e.endCoordinates.height + (Platform.OS === 'android' ? 24 : 10),
        duration: e.duration || 250,
        useNativeDriver: true, // Wajib true biar animasinya super mulus tanpa ngelag
      }).start();
    };

    const onKeyboardHide = () => {
      Animated.timing(keyboardOffset, {
        toValue: 0, // Turun lagi ke posisi semula
        duration: 250,
        useNativeDriver: true,
      }).start();
    };

    // Daftarkan listener
    const showSub = Keyboard.addListener(showEvent, onKeyboardShow);
    const hideSub = Keyboard.addListener(hideEvent, onKeyboardHide);

    return () => {
      // Bersihkan listener saat komponen tidak dipakai
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const totalItem = Object.values(keranjang).reduce((a, b) => a + b, 0);
  
  if (totalItem === 0 || !toko || currentTabName === 'Profil' || currentTabName === 'KeranjangTab') {
    return null;
  }

  const totalHarga = menuList.reduce((total, menu) => {
    return total + (keranjang[menu._id || menu.id] || 0) * menu.harga;
  }, 0);

  return (
    // 🔥 2. Ubah View biasa menjadi Animated.View dan suntikkan transform translateY
    <Animated.View style={[styles.keranjangBar, { bottom, transform: [{ translateY: keyboardOffset }] }]}>
      <TouchableOpacity
        style={styles.keranjangButton}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('Keranjang')}
      >
        <LinearGradient
          colors={['#1565C0', '#42A5F5']} 
          style={styles.keranjangGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {/* Teks informatif di tengah */}
          <View style={styles.textContainer}>
            <Text style={styles.keranjangText}>{totalItem} Item</Text>
            <Text style={styles.keranjangSubText} numberOfLines={1}>
              {toko.nama}
            </Text>
          </View>

          {/* Total Harga di kanan */}
          <Text style={styles.keranjangHarga}>
            Rp {totalHarga.toLocaleString('id-ID')}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  keranjangBar: { 
    position: 'absolute', 
    left: 20, 
    right: 20, 
    zIndex: 999 
  },
  keranjangButton: { 
    borderRadius: 16, 
    overflow: 'hidden', 
    elevation: 8, 
    shadowColor: '#1565C0', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.35, 
    shadowRadius: 10 
  },
  keranjangGradient: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 14, 
    paddingHorizontal: 20 
  },
  textContainer: { 
    flex: 1, 
    marginRight: 10 
  },
  keranjangText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  keranjangSubText: { 
    color: 'rgba(255,255,255,0.85)', 
    fontSize: 11, 
    marginTop: 2,
    fontWeight: '500'  
  },
  keranjangHarga: { 
    color: '#fff', 
    fontSize: 15, 
    fontWeight: '700' 
  },
});