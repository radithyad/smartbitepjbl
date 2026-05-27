import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../service/api';
import { customAlert } from '../../utils/alerthelper';

export default function VendorEditMenuScreen({ route, navigation }) {
  // Tangkap data menu yang dilempar dari layar Kelola Menu
  const { menu } = route.params;

  // Isi state awal dengan data menu yang sudah ada
  const [namaMenu, setNamaMenu] = useState(menu.nama);
  const [deskripsi, setDeskripsi] = useState(menu.deskripsi || '');
  const [harga, setHarga] = useState(menu.harga ? menu.harga.toString() : '');
  const [kategori, setKategori] = useState(menu.kategori || 'Makanan');
  const [fotoMenu, setFotoMenu] = useState(menu.foto_url);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { 
      customAlert('Izin diperlukan', 'Izinkan akses galeri untuk ubah foto menu.');
      return; 
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true
      });

      if (!result.canceled) {
        setFotoMenu(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (error) {
      customAlert('Error', 'Gagal memproses foto menu.');
    }
  };

  const handleUpdateMenu = async () => {
    if (!namaMenu || !harga) {
      customAlert('Oops!', 'Nama menu dan harga wajib diisi ya!');
      return;
    }

    setLoading(true);
    try {
      // Nembak API PUT ke /menu/:id
      await api.put(`/menu/${menu._id}`, {
        nama: namaMenu,
        deskripsi: deskripsi,
        harga: Number(harga),
        kategori: kategori,
        foto_url: fotoMenu
      });

      customAlert('Berhasil! ✨', 'Data menu berhasil diperbarui.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.log("❌ ERROR UPDATE MENU:", error.response ? error.response.data : error.message);
      const errorMsg = error.response?.data?.message || 'Gagal update menu. Cek koneksi servermu.';
      customAlert('Gagal Update', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Batal</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Menu</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Foto Menu</Text>
            <TouchableOpacity style={styles.uploadBox} onPress={pickImage} activeOpacity={0.8}>
              {fotoMenu ? (
                <Image source={{ uri: fotoMenu }} style={styles.previewImage} resizeMode="cover" />
              ) : (
                <>
                  <Text style={styles.uploadIcon}>📸</Text>
                  <Text style={styles.uploadText}>Tap untuk upload foto</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Nama Menu</Text>
            <TextInput style={styles.input} value={namaMenu} onChangeText={setNamaMenu} />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Harga (Rp)</Text>
            <TextInput style={styles.input} keyboardType="number-pad" value={harga} onChangeText={setHarga} />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Kategori</Text>
            <View style={styles.kategoriRow}>
              {['Makanan', 'Minuman', 'Snack'].map((kat) => (
                <TouchableOpacity 
                  key={kat} 
                  style={[styles.kategoriChip, kategori === kat && styles.kategoriChipActive]} 
                  onPress={() => setKategori(kat)}
                >
                  <Text style={[styles.kategoriText, kategori === kat && styles.kategoriTextActive]}>{kat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Deskripsi (Opsional)</Text>
            <TextInput 
              style={[styles.input, styles.inputArea]} 
              multiline 
              numberOfLines={3}
              value={deskripsi} 
              onChangeText={setDeskripsi} 
            />
          </View>

          <TouchableOpacity style={styles.btnSimpan} onPress={handleUpdateMenu} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnSimpanText}>Simpan Perubahan</Text>}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Stylenya 100% sama persis kayak VendorAddMenuScreen
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { backgroundColor: '#fff', padding: 20, paddingTop: 50, paddingBottom: 15, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E8ECF0' },
  backBtn: { marginRight: 15 },
  backBtnText: { fontSize: 15, color: '#1565C0', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  form: { padding: 20 },
  inputWrapper: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: '#1a1a1a', borderWidth: 1, borderColor: '#E8ECF0' },
  inputArea: { minHeight: 80, textAlignVertical: 'top' },
  uploadBox: { backgroundColor: '#fff', borderRadius: 12, height: 160, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#1565C0', overflow: 'hidden' },
  uploadIcon: { fontSize: 32, marginBottom: 8 },
  uploadText: { fontSize: 13, color: '#1565C0', fontWeight: '500' },
  previewImage: { width: '100%', height: '100%' },
  kategoriRow: { flexDirection: 'row', gap: 10 },
  kategoriChip: { flex: 1, paddingVertical: 12, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E8ECF0', alignItems: 'center' },
  kategoriChipActive: { backgroundColor: '#1565C0', borderColor: '#1565C0' },
  kategoriText: { fontSize: 13, fontWeight: '600', color: '#666' },
  kategoriTextActive: { color: '#fff' },
  btnSimpan: { backgroundColor: '#1565C0', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, marginBottom: 30 },
  btnSimpanText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});