const mongoose = require('mongoose');

const ulasanSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  toko_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Toko', required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  komentar: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Ulasan', ulasanSchema);