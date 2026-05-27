const mongoose = require('mongoose');

const tokoSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nama: { type: String, required: true },
  kategori: { type: String, required: true },
  deskripsi: { type: String },
  emoji: { type: String, default: '🏪' },
  aktif: { type: Boolean, default: false },
  jam_buka: { type: String, default: '07:00' },
  jam_tutup: { type: String, default: '16:00' },
  estimasi: { type: String, default: '10-15' },
  norek: { type: String },
  qris: { type: String },
  foto_url: { type: String, default: null },
  foto_ktp_url: { type: String },
  foto_diri_url: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rating: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Toko', tokoSchema);