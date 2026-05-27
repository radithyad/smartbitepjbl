import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// PENTING: Ganti dengan URL servermu!
// Kalau pakai Emulator Android -> 'http://10.0.2.2:5000/api'
// Kalau pakai HP Fisik/Expo Go -> Pakai IP Address WiFi laptopmu, misal: 'http://192.168.1.15:5000/api'
const BASE_URL = '192.168.3.77'; 

export const api = axios.create({
  baseURL: BASE_URL,
});

// "Satpam" Frontend: Otomatis nyelipin Token JWT tiap kali pindah halaman/ngambil data
api.interceptors.request.use(async (config) => {
  let token;
  if (Platform.OS === 'web') {
    token = localStorage.getItem('userToken');
  } else {
    token = await SecureStore.getItemAsync('userToken');
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fungsi bantuan buat simpan & hapus token
export const setToken = async (token) => {
  if (Platform.OS === 'web') localStorage.setItem('userToken', token);
  else await SecureStore.setItemAsync('userToken', token);
};

export const removeToken = async () => {
  if (Platform.OS === 'web') localStorage.removeItem('userToken');
  else await SecureStore.deleteItemAsync('userToken');
};