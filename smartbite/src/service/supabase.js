import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://jtotvimhbftsegmkmhvb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0b3R2aW1oYmZ0c2VnbWttaHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0ODU5NjUsImV4cCI6MjA4NzA2MTk2NX0.OuepZ9OdTKLTAX5_ekJ5qaMbTAxj8kDlliu4tNrq-nM';

const storage = Platform.OS === 'web' ? localStorage : {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});