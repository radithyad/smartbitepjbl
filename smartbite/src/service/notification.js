import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return true;
}

// Ini fungsi baru yang dicari sama StatusOrderScreen!
export async function sendOrderStatusNotification(status, tokoNama, orderId) {
  let title = '';
  let body = '';

  if (status === 'diproses') {
    title = '👨‍🍳 Pesanan Diproses!';
    body = `${tokoNama} sedang menyiapkan pesananmu.`;
  } else if (status === 'siap') {
    title = '✅ Pesanan Siap Diambil!';
    body = `Pesananmu di ${tokoNama} sudah siap! Segera pickup ya.`;
  } else if (status === 'ditolak') {
    title = '❌ Pesanan Ditolak';
    body = `Maaf, pesananmu di ${tokoNama} ditolak oleh penjual.`;
  } else {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { orderId, status },
    },
    trigger: null, 
  });
}