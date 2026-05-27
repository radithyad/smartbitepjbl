const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toko_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Toko', required: true },

  kode_pickup: { type: String, unique: true },
  items: [{
    menu_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu' },
    nama_menu: String,
    harga: Number,
    qty: Number
  }],
  total_harga: { type: Number, required: true },
  metode_bayar: { type: String, required: true },
  bukti_bayar: { type: String, default: null },
  catatan: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['menunggu', 'diproses', 'siap', 'selesai', 'dibatalkan', 'ditolak'], 
    default: 'menunggu' 
  },
  is_reviewed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);