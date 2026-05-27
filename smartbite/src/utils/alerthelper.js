import { Alert, Platform } from 'react-native';

export const customAlert = (title, message, buttons = []) => {
  if (Platform.OS === 'web') {
    // Kalau cuma notifikasi biasa (nggak ada pilihan tombol Batal/OK)
    if (!buttons || buttons.length === 0) {
      window.alert(`${title}\n\n${message}`);
      return;
    }

    // Cari mana tombol untuk "Terima/OK" dan mana tombol "Batal"
    const confirmBtn = buttons.find(b => b.text !== 'Batal' && b.style !== 'cancel');
    
    // Kalau ini tipe konfirmasi (Yes/No)
    if (buttons.length > 1) {
      const isConfirmed = window.confirm(`${title}\n\n${message}`);
      if (isConfirmed && confirmBtn && confirmBtn.onPress) {
        confirmBtn.onPress();
      }
    } else {
      // Kalau cuma ada 1 tombol (misal tombol "OK" doang)
      window.alert(`${title}\n\n${message}`);
      if (confirmBtn && confirmBtn.onPress) confirmBtn.onPress();
    }
  } else {
    // Kalau di HP, panggil Alert bawaan React Native yang asli
    Alert.alert(title, message, buttons);
  }
};