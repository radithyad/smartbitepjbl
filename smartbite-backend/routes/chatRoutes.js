const express = require('express');
const router = express.Router();
const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const { protect } = require('../middleware/authMiddleware'); 

router.get('/check/:tokoId', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id; 
    const room = await ChatRoom.findOne({ customer_id: userId, toko_id: req.params.tokoId });
    res.json({ room_id: room ? room._id : null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/messages/:roomId', protect, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ room_id: req.params.roomId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/send', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { toko_id, text, images_base64, reply_text } = req.body; 
    
    let room = await ChatRoom.findOne({ customer_id: userId, toko_id });
    if (!room) {
      room = new ChatRoom({ customer_id: userId, toko_id });
    }

    room.last_message = text ? text : (images_base64 && images_base64.length > 0 ? 'Mengirim foto' : '');
    await room.save();

    const msg = new ChatMessage({
      room_id: room._id,
      sender_id: userId,
      text,
      images: images_base64 || [],
      reply_text: reply_text || null 
    });
    await msg.save();

    res.json({ room_id: room._id, message: msg });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// 🔥 PERBAIKAN: Update last_message Room saat pesan ditarik
router.delete('/message/:id', protect, async (req, res) => {
  try {
    const msg = await ChatMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ error: 'Pesan tidak ditemukan' });

    const roomId = msg.room_id;
    await ChatMessage.findByIdAndDelete(req.params.id); // Hapus pesan

    // Cari pesan terakhir setelah dihapus
    const lastMsg = await ChatMessage.findOne({ room_id: roomId }).sort({ createdAt: -1 });
    
    // Update ChatRoom dengan pesan terakhir (atau kosongkan jika habis)
    await ChatRoom.findByIdAndUpdate(roomId, {
      last_message: lastMsg ? (lastMsg.text || 'Mengirim foto') : 'Pesan telah dihapus'
    });

    res.json({ success: true, message: 'Pesan ditarik' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/inbox', protect, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const rooms = await ChatRoom.find({ customer_id: userId })
      .populate('toko_id', 'nama foto_url')
      .sort({ updatedAt: -1 });
    res.json(rooms);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;