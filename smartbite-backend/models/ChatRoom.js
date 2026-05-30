const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toko_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Toko', required: true },
  last_message: { type: String, default: '' },
}, { timestamps: true });

// 🔥 INI MAGIC-NYA: Otomatis hapus room setelah 7 hari (604800 detik) dari pesan terakhir!
chatRoomSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);