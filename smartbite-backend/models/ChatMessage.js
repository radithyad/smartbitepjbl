const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
  sender_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  text: { type: String, default: '' },
  images: { type: [String], default: [] }, 
  
  // 🔥 FITUR BARU: Nyimpen teks yang di-reply
  reply_text: { type: String, default: null }, 
}, { timestamps: true });

chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);