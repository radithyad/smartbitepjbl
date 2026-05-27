const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const authRoutes = require('./routes/authRoutes');
const tokoRoutes = require('./routes/tokoRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const ulasanRoutes = require('./routes/ulasanRoutes');

// Middleware biar aplikasi React Native kamu diizinin ngakses server ini
app.use(cors());
// Middleware biar server bisa baca format JSON
app.use(express.json({ limit: '50mb' }));
// Daftarkan jalur API
app.use('/api/auth', authRoutes);
app.use('/api/toko', tokoRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ulasan', ulasanRoutes);

// Endpoint dasar buat ngecek server jalan atau nggak
app.get('/', (req, res) => {
  res.send('API SmartBite nyala nih boss! 🚀');
});

// Proses koneksi ke MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Yeay! Berhasil terhubung ke MongoDB!');
  })
  .catch((error) => {
    console.error('❌ Waduh, gagal connect ke MongoDB nih:', error.message);
  });

// Menyalakan server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});