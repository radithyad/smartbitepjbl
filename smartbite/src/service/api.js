import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// 👉 GANTI '192.168.X.X' DENGAN IP LAPTOP KAMU!
// Wajib pakai http:// (bukan https) dan ujungnya wajib :5000/api
const BASE_URL = 'https://depose-primary-sterling.ngrok-free.dev/api'; // Contoh: 'http://192.168.X.X:5000/api'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true'
    // Header ngrok udah dihapus karena kita gak pake ngrok lagi
  }
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