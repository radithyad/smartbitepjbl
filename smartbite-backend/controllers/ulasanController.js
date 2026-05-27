const Ulasan = require('../models/Ulasan');
const Toko = require('../models/Toko');
const Order = require('../models/Order');

exports.createUlasan = async (req, res) => {
  try {
    const { order_id, toko_id, rating, komentar } = req.body;
    const customer_id = req.user.id || req.user._id;

    // 1. Simpan ulasan
    const ulasanBaru = new Ulasan({ order_id, toko_id, customer_id, rating, komentar });
    await ulasanBaru.save();

    // 2. Tandai Order kalau sudah diulas
    await Order.findByIdAndUpdate(order_id, { is_reviewed: true });

    // 3. Hitung rata-rata bintang toko
    const semuaUlasan = await Ulasan.find({ toko_id });
    const rataRata = semuaUlasan.reduce((sum, u) => sum + u.rating, 0) / semuaUlasan.length;
    await Toko.findByIdAndUpdate(toko_id, { rating: rataRata.toFixed(1) });

    res.status(201).json({ message: 'Ulasan berhasil disimpan!' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menyimpan ulasan', error: error.message });
  }
};