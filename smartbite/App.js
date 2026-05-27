import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, ActivityIndicator, View, Platform, Alert, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { api } from './src/service/api';
import * as SecureStore from 'expo-secure-store';
import Svg, { Path } from 'react-native-svg';

// 👇 IMPORT IKON VEKTOR EXPO (CUMA UNTUK BENTUK GRAFISNYA)
import { Ionicons } from '@expo/vector-icons';

// ── Customer Screens ──────────────────────────────────────
import LoginScreen from './src/screen/LoginScreen';
import RegisterScreen from './src/screen/RegisterScreen';
import RolePickerScreen from './src/screen/RolePickerScreen';
import RegisterVendorScreen from './src/screen/RegisterVendorScreen';
import PendingVendorScreen from './src/screen/PendingVendorScreen';
import HomeScreen from './src/screen/HomeScreen';
import DetailTokoScreen from './src/screen/DetailTokoScreen';
import KeranjangScreen from './src/screen/KeranjangScreen';
import CheckoutScreen from './src/screen/CheckoutScreen';
import StatusOrderScreen from './src/screen/StatusOrderScreen';
import ChatScreen from './src/screen/ChatScreen';
import ProfilScreen from './src/screen/ProfilScreen';
import AktivitasScreen from './src/screen/AktivitasScreen';
import SearchScreen from './src/screen/SearchScreen';
import UlasanScreen from './src/screen/UlasanScreen';
import SplashScreen from './src/screen/SplashScreen';
import EditProfilScreen from './src/screen/EditProfilScreen';

// ── Vendor Screens ────────────────────────────────────────
import VendorDashboardScreen from './src/screen/vendor/VendorDashboardScreen';
import VendorPesananScreen from './src/screen/vendor/VendorPesananScreen';
import VendorMenuScreen from './src/screen/vendor/VendorMenuScreen';
import VendorTokoScreen from './src/screen/vendor/VendorTokoScreen';
import VendorProfilScreen from './src/screen/vendor/VendorProfilScreen';
import VendorAddMenuScreen from './src/screen/vendor/VendorAddMenuScreen';
import VendorEditMenuScreen from './src/screen/vendor/VendorEditMenuScreen';
import VendorDetailPesananScreen from './src/screen/vendor/VendorDetailPesananScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Custom Tab Bar dengan Floating Center Button + SVG Notch ─
const BAR_HEIGHT    = 72;
const FLOAT_BTN_SIZE   = 64;   // ukuran button
const FLOAT_BTN_RADIUS = 32;   // = FLOAT_BTN_SIZE / 2
// Button center berada 12px DI ATAS top bar → top = -(radius + 12)
const FLOAT_BTN_TOP    = -(FLOAT_BTN_RADIUS + 12); // = -44

// Notch SVG: lebih dalam + lebih lebar supaya mengikuti lingkaran button
const NOTCH_DEPTH  = 30;  // seberapa dalam lekukan masuk ke bar
const NOTCH_HALF_W = 55;  // setengah lebar total notch (kiri ke tengah)

function TabBarBackground({ width }) {
  const cx = width / 2;

  // Cubic bezier yang meniru busur lingkaran secara halus:
  // - CP1 berada di y=0 (menarik horizontal di awal) 
  // - CP2 berada dekat titik terdalam (menarik ke bawah)
  // Hasilnya: kurva masuk pelan lalu melengkung dalam mengikuti button
  const d = [
    `M 0 0`,
    `L ${cx - NOTCH_HALF_W} 0`,
    // kiri: dari (cx-55, 0) → (cx, 30)
    `C ${cx - NOTCH_HALF_W + 10} 0, ${cx - 10} ${NOTCH_DEPTH}, ${cx} ${NOTCH_DEPTH}`,
    // kanan: dari (cx, 30) → (cx+55, 0)
    `C ${cx + 10} ${NOTCH_DEPTH}, ${cx + NOTCH_HALF_W - 10} 0, ${cx + NOTCH_HALF_W} 0`,
    `L ${width} 0`,
    `L ${width} ${BAR_HEIGHT}`,
    `L 0 ${BAR_HEIGHT}`,
    `Z`,
  ].join(' ');

  return (
    <Svg width={width} height={BAR_HEIGHT} style={StyleSheet.absoluteFill}>
      <Path d={d} fill="#FFFFFF" />
    </Svg>
  );
}

function CustomTabBar({ state, descriptors, navigation, onLogout }) {
  const { width } = useWindowDimensions();
  const CENTER_INDEX = 2;

  const tabConfig = [
    { name: 'Home',      label: 'Beranda',   icon: 'home',        iconOutline: 'home-outline' },
    { name: 'Aktivitas', label: 'Aktivitas', icon: 'wallet',      iconOutline: 'wallet-outline' },
    { name: 'Keranjang', label: 'Keranjang', icon: 'paper-plane', iconOutline: 'paper-plane-outline' },
    { name: 'Chat',      label: 'Chat',      icon: 'card',        iconOutline: 'card-outline' },
    { name: 'Profil',    label: 'Profil',    icon: 'person',      iconOutline: 'person-outline' },
  ];

  const isCenterFocused = state.index === CENTER_INDEX;
  const centerColor = isCenterFocused ? '#1565C0' : '#9AA5B4';

  return (
    <View style={[tabStyles.wrapper, { width }]}>
      {/* SVG background dengan lekukan melengkung */}
      <TabBarBackground width={width} />

      {/* Shadow tipis di atas bar (karena SVG tidak punya shadow bawaan) */}
      <View style={[tabStyles.shadowLine, { width }]} />

      {/* Row tab items */}
      <View style={[tabStyles.row, { width, height: BAR_HEIGHT }]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const color = focused ? '#1565C0' : '#9AA5B4';
          const cfg = tabConfig[index];

          // Slot tengah: hanya tampilkan label "Keranjang" di bawah notch
          if (index === CENTER_INDEX) {
            return (
              <TouchableOpacity
                key={route.key}
                style={tabStyles.centerSlot}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Keranjang')}
              >
                {/* Label tetap tampil di bawah area notch */}
                <Text style={[tabStyles.centerLabel, { color: centerColor }]}>
                  {cfg.label}
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              style={tabStyles.tabItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(route.name)}
            >
              <Ionicons name={focused ? cfg.icon : cfg.iconOutline} size={22} color={color} />
              <Text style={[tabStyles.label, { color }]}>{cfg.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Floating Center Button — melayang di atas notch */}
      <TouchableOpacity
        style={[tabStyles.floatingButton, isCenterFocused && tabStyles.floatingButtonActive]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Keranjang')}
      >
        <Ionicons name="paper-plane" size={26} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignItems: 'center',
    // Tinggi wrapper = bar + sebagian floating button yang muncul ke atas
    height: BAR_HEIGHT,
    // Shadow keseluruhan untuk bar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 14,
  },
  // Garis shadow tipis di paling atas bar (pengganti borderTop di SVG)
  shadowLine: {
    position: 'absolute',
    top: 0,
    height: 1,
    backgroundColor: '#E8ECF0',
    zIndex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',         // rata bawah supaya label sejajar
    paddingBottom: Platform.OS === 'ios' ? 14 : 10,
    paddingHorizontal: 8,
    zIndex: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    paddingBottom: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
  // Slot tengah: area transparan untuk floating button, label tetap di bawah
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  centerLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  // Floating button melayang jauh di atas notch — center 12px di atas bar top
  floatingButton: {
    position: 'absolute',
    top: FLOAT_BTN_TOP,  // = -44: button center berada 12px di atas garis bar
    zIndex: 10,
    width: FLOAT_BTN_SIZE,
    height: FLOAT_BTN_SIZE,
    borderRadius: FLOAT_BTN_RADIUS,
    backgroundColor: '#1565C0',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  floatingButtonActive: {
    backgroundColor: '#0D47A1',
    shadowOpacity: 0.6,
  },
});

// ── Customer Tab Navigator ────────────────────────────────
function MainTab({ onLogout }) {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} onLogout={onLogout} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"      component={HomeScreen}      options={{ tabBarLabel: 'Beranda' }} />
      <Tab.Screen name="Aktivitas" component={AktivitasScreen} options={{ tabBarLabel: 'Aktivitas' }} />
      <Tab.Screen name="Keranjang" component={KeranjangScreen} options={{ tabBarLabel: 'Keranjang' }} />
      <Tab.Screen name="Chat"      component={ChatScreen}      options={{ tabBarLabel: 'Chat' }} />
      <Tab.Screen name="Profil"    options={{ tabBarLabel: 'Profil' }}>
        {props => <ProfilScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ── Vendor Tab Navigator ──────────────────────────────────
function VendorTab() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E8ECF0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 10,
        },
        tabBarActiveTintColor: '#1565C0',
        tabBarInactiveTintColor: '#888888',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === 'VendorDashboard') { iconName = focused ? 'stats-chart' : 'stats-chart-outline'; }
          if (route.name === 'VendorPesanan') { iconName = focused ? 'notifications' : 'notifications-outline'; }
          if (route.name === 'VendorMenu') { iconName = focused ? 'fast-food' : 'fast-food-outline'; }
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 3 }}>
              {/* 👉 INDIKATOR GARIS BIRU SUDAH DIHAPUS BERSIH DI SINI JUGA */}
              <Ionicons name={iconName} size={22} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="VendorDashboard" component={VendorDashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="VendorPesanan"   component={VendorPesananScreen}   options={{ tabBarLabel: 'Pesanan' }} />
      <Tab.Screen name="VendorMenu"      component={VendorMenuScreen}      options={{ tabBarLabel: 'Menu' }} />
    </Tab.Navigator>
  );
}

// ── Root App ──────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      let token = Platform.OS === 'web' ? localStorage.getItem('userToken') : await SecureStore.getItemAsync('userToken');
      let userData = Platform.OS === 'web' ? localStorage.getItem('userData') : await SecureStore.getItemAsync('userData');

      if (token && userData) {
        const parsed = JSON.parse(userData);
        setSession(token);
        setRole(parsed.role);
      }
    } catch (e) { console.log(e); }
    setLoading(false);
  };

  const handleLoginSuccess = async (token, user) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('userToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
      } else {
        await SecureStore.setItemAsync('userToken', token);
        await SecureStore.setItemAsync('userData', JSON.stringify(user));
      }
      setSession(token);
      setRole(user.role);
    } catch (error) { Alert.alert('System Error', 'Gagal menyimpan sesi login.'); }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
    } else {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userData');
    }
    setSession(null);
    setRole(null);
  };

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 60, marginBottom: 20 }}>🍱</Text>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={{ marginTop: 16, fontSize: 14, color: '#888' }}>Memuat SmartBite...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <>
            <Stack.Screen name="Login">
              {props => <LoginScreen {...props} onLogin={handleLoginSuccess} />}
            </Stack.Screen>
            <Stack.Screen name="RolePicker"     component={RolePickerScreen} />
            <Stack.Screen name="Register"       component={RegisterScreen} />
            <Stack.Screen name="RegisterVendor" component={RegisterVendorScreen} />
          </>
        ) : role === 'pending_vendor' ? (
          <>
            <Stack.Screen name="PendingVendor">
              {props => <PendingVendorScreen {...props} onLogout={handleLogout} />}
            </Stack.Screen>
          </>
        ) : role === 'vendor' ? (
          <>
            <Stack.Screen name="VendorMain"          component={VendorTab} />
            <Stack.Screen name="VendorProfil">
              {props => <VendorProfilScreen {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen name="VendorToko"          component={VendorTokoScreen} />
            <Stack.Screen name="VendorDetailPesanan" component={VendorDetailPesananScreen} />
            <Stack.Screen name="VendorAddMenu"       component={VendorAddMenuScreen} />
            <Stack.Screen name="VendorEditMenu"      component={VendorEditMenuScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main">
              {props => <MainTab {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen name="DetailToko"  component={DetailTokoScreen} />
            <Stack.Screen name="Checkout"    component={CheckoutScreen} />
            <Stack.Screen name="StatusOrder" component={StatusOrderScreen} />
            <Stack.Screen name="Search"      component={SearchScreen} />
            <Stack.Screen name="Ulasan"      component={UlasanScreen} />
            <Stack.Screen name="EditProfil"  component={EditProfilScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// 👉 STYLE BUAT INDIKATOR GARIS BIRU SUDAH DIHAPUS TOTAL DI SINI