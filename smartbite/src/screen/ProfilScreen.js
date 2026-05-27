import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Switch, Platform, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '../service/api';
import { customAlert } from '../utils/alerthelper'; 

const TRANSLATIONS = {
  id: {
    header: 'Profil Saya', aktivitas: 'AKTIVITAS', support: 'LAINNYA', dangerZone: 'ZONA BAHAYA',
    currentOrder: 'Pesanan Saat Ini', history: 'Riwayat Pesanan',
    lang: 'Bahasa', darkMode: 'Mode Gelap', deleteAcc: 'Hapus Akun Permanent',
    logout: 'Keluar Akun', selectLang: 'Pilih Bahasa / Select Language', close: 'Tutup'
  },
  en: {
    header: 'My Profile', aktivitas: 'ACTIVITY', support: 'SUPPORT', dangerZone: 'DANGER ZONE',
    currentOrder: 'Current Orders', history: 'Order History',
    lang: 'Language', darkMode: 'Dark Mode', deleteAcc: 'Delete Account Permanently',
    logout: 'Log Out', selectLang: 'Select Language / Pilih Bahasa', close: 'Close'
  }
};

export default function ProfilScreen({ navigation, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('id'); // 'id' atau 'en'
  const [showLanguageModal, setShowLanguageModal] = useState(false); // State Modal Pop-up Bahasa

  const t = TRANSLATIONS[language];

  useEffect(() => {
    fetchProfileLocal();
    const unsubscribe = navigation.addListener('focus', fetchProfileLocal);
    return unsubscribe;
  }, [navigation]);

  const fetchProfileLocal = async () => {
    setLoading(true);
    try {
      let userData = Platform.OS === 'web' ? localStorage.getItem('userData') : await SecureStore.getItemAsync('userData');
      if (userData) setProfile(JSON.parse(userData));
    } catch (error) {
      console.log('Error ambil profil:', error);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    customAlert(t.logout, language === 'id' ? 'Yakin ingin keluar dari aplikasi?' : 'Are you sure you want to log out?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: () => onLogout && onLogout() }
    ]);
  };

  const handleDeleteAccount = () => {
    customAlert(t.deleteAcc, language === 'id' ? 'Akun akan dihapus permanen dari database!' : 'Account will be deleted permanently!', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        try {
          await api.delete('/auth/me');
          onLogout();
        } catch (e) { customAlert('Error', 'Gagal hapus akun'); }
      }}
    ]);
  };

  const dynamicStyles = {
    container: { backgroundColor: isDarkMode ? '#121212' : '#F5F7FA' },
    card: { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' },
    textMain: { color: isDarkMode ? '#FFFFFF' : '#1A1A1A' },
    textSub: { color: isDarkMode ? '#AAAAAA' : '#888888' },
    border: { borderColor: isDarkMode ? '#333' : '#F0F0F0' }
  };

  if (loading && !profile) {
    return (
      <View style={[styles.center, dynamicStyles.container]}>
        <ActivityIndicator size="large" color="#1565C0" />
      </View>
    );
  }

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Header */}
      <View style={[styles.headerNav, dynamicStyles.border]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backIcon, dynamicStyles.textMain]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, dynamicStyles.textMain]}>{t.header}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            {profile?.foto_url ? (
              <Image source={{ uri: profile.foto_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{profile?.nama?.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            {/* Tombol Edit Melekat pada Foto Profil */}
            <TouchableOpacity 
                style={styles.editIconBtn} 
                onPress={() => navigation.navigate('EditProfil', { profile })}
                activeOpacity={0.8}
            >
              <Text style={styles.editIcon}>✎</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.userName, dynamicStyles.textMain]}>{profile?.nama || 'User'}</Text>
          <Text style={[styles.userEmail, dynamicStyles.textSub]}>{profile?.email || profile?.username}</Text>
        </View>

        {/* Menu Groups */}
        <View style={styles.menuWrapper}>
          
          {/* SUB-MENU 1: AKTIVITAS */}
          <Text style={[styles.groupLabel, dynamicStyles.textSub]}>{t.aktivitas}</Text>
          <View style={[styles.menuCard, dynamicStyles.card]}>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Main', { screen: 'Aktivitas' })} activeOpacity={0.7}>
              <Text style={styles.menuIcon}>⚡</Text>
              <Text style={[styles.menuLabel, dynamicStyles.textMain]}>{t.currentOrder}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <View style={[styles.divider, dynamicStyles.border]} />
            
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Riwayat')} activeOpacity={0.7}>
              <Text style={styles.menuIcon}>🕐</Text>
              <Text style={[styles.menuLabel, dynamicStyles.textMain]}>{t.history}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>

          {/* SUB-MENU 2: LAINNYA */}
          <Text style={[styles.groupLabel, dynamicStyles.textSub]}>{t.support}</Text>
          <View style={[styles.menuCard, dynamicStyles.card]}>
            {/* Klik Bahasa membuka Modal popup pilihan */}
            <TouchableOpacity style={styles.menuItem} onPress={() => setShowLanguageModal(true)} activeOpacity={0.7}>
              <Text style={styles.menuIcon}>🌐</Text>
              <Text style={[styles.menuLabel, dynamicStyles.textMain]}>{t.lang}</Text>
              <Text style={styles.langValue}>{language === 'id' ? '🇮🇩 Indonesia' : '🇺🇸 English'}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <View style={[styles.divider, dynamicStyles.border]} />

            <View style={styles.menuItem}>
              <Text style={styles.menuIcon}>🌙</Text>
              <Text style={[styles.menuLabel, dynamicStyles.textMain]}>{t.darkMode}</Text>
              <Switch 
                value={isDarkMode} 
                onValueChange={setIsDarkMode}
                trackColor={{ false: '#DDD', true: '#BBDEFB' }}
                thumbColor={isDarkMode ? '#1565C0' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* SUB-MENU 3: ZONA BAHAYA */}
          <Text style={[styles.groupLabel, dynamicStyles.textSub]}>{t.dangerZone}</Text>
          <View style={[styles.menuCard, dynamicStyles.card]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount} activeOpacity={0.7}>
              <Text style={styles.menuIcon}>🗑️</Text>
              <Text style={[styles.menuLabel, { color: '#D32F2F' }]}>{t.deleteAcc}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
            <View style={[styles.divider, dynamicStyles.border]} />
            
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.7}>
              <Text style={styles.menuIcon}>🚪</Text>
              <Text style={[styles.menuLabel, { color: '#D32F2F' }]}>{t.logout}</Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>

      {/* POPUP MODAL PILIHAN BAHASA */}
      <Modal visible={showLanguageModal} transparent animationType="fade" onRequestClose={() => setShowLanguageModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.langModalCard, dynamicStyles.card]}>
            <Text style={[styles.langModalTitle, dynamicStyles.textMain]}>{t.selectLang}</Text>
            
            {/* Opsi Bahasa Indonesia */}
            <TouchableOpacity style={styles.langOptionRow} onPress={() => { setLanguage('id'); setShowLanguageModal(false); }} activeOpacity={0.7}>
              <Text style={styles.langOptionText}>🇮🇩 Indonesia</Text>
              {language === 'id' && <Text style={styles.checkIcon}>✓</Text>}
            </TouchableOpacity>
            
            <View style={[styles.divider, dynamicStyles.border]} />
            
            {/* Opsi English */}
            <TouchableOpacity style={styles.langOptionRow} onPress={() => { setLanguage('en'); setShowLanguageModal(false); }} activeOpacity={0.7}>
              <Text style={styles.langOptionText}>🇺🇸 English</Text>
              {language === 'en' && <Text style={styles.checkIcon}>✓</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowLanguageModal(false)} activeOpacity={0.8}>
              <Text style={styles.closeModalBtnText}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { fontSize: 24 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  
  profileSection: { alignItems: 'center', marginTop: 10, marginBottom: 30 },
  avatarWrapper: { position: 'relative' },
  
  // 👉 PENAMBAHAN OUTLINE DI FOTO PROFIL
  avatar: { width: 95, height: 95, borderRadius: 47.5, borderWidth: 3, borderColor: '#1565C0' },
  avatarPlaceholder: { width: 95, height: 95, borderRadius: 47.5, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#1565C0' },
  
  avatarText: { fontSize: 36, color: '#1565C0', fontWeight: 'bold' },
  editIconBtn: { position: 'absolute', right: -2, bottom: 2, backgroundColor: '#FFF', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, borderWidth: 1, borderColor: '#E8ECF0' },
  editIcon: { fontSize: 15, color: '#444', fontWeight: 'bold' },
  userName: { fontSize: 18, fontWeight: 'bold', marginTop: 14 },
  userEmail: { fontSize: 13, marginTop: 4 },

  menuWrapper: { paddingHorizontal: 20 },
  groupLabel: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginLeft: 16, letterSpacing: 1 },
  menuCard: { borderRadius: 18, paddingHorizontal: 16, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 }, 
  menuIcon: { fontSize: 18, marginRight: 14, width: 24, textAlign: 'center' },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  chevron: { fontSize: 20, color: '#CCC', fontWeight: '300' },
  langValue: { fontSize: 13, fontWeight: 'bold', color: '#1565C0', marginRight: 4 },
  divider: { height: 1, width: '100%' },

  // 👉 STYLING MODAL POPUP BAHASA
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  langModalCard: { width: '100%', borderRadius: 20, padding: 20, elevation: 10, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10 },
  langModalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  langOptionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4 },
  langOptionText: { fontSize: 14, fontWeight: '500' },
  checkIcon: { fontSize: 16, color: '#1565C0', fontWeight: 'bold' },
  closeModalBtn: { marginTop: 16, backgroundColor: '#1565C0', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  closeModalBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' }
});