const Toko = require('../models/Toko');
const Order = require('../models/Order'); // Pastikan ini ada di atas

// Ambil semua toko yang aktif (Buat HomeScreen customer)
exports.getAllToko = async (req, res) => {
  try {
    const toko = await Toko.find({ aktif: true });
    res.json(toko);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data toko', error: error.message });
  }
};

// Ambil detail 1 toko beserta menu-menunya nanti (Buat DetailTokoScreen)
exports.getTokoById = async (req, res) => {
  try {
    const toko = await Toko.findById(req.params.id);
    if (!toko) return res.status(404).json({ message: 'Toko tidak ditemukan' });
    res.json(toko);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data toko', error: error.message });
  }
};

// Ambil data toko milik vendor yang lagi login (Buat VendorDashboard)
exports.getMyToko = async (req, res) => {
  try {
    // req.user.id ini dapat dari "Satpam" (authMiddleware) tadi
    const toko = await Toko.findOne({ user_id: req.user.id });
    if (!toko) return res.status(404).json({ message: 'Kamu belum punya toko' });
    res.json(toko);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data tokomu', error: error.message });
  }
};

// Update data toko & LOGIKA SAPU BERSIH (Buat VendorTokoScreen & Toggle)
exports.updateToko = async (req, res) => {
  try {
    const updatedToko = await Toko.findOneAndUpdate(
      { user_id: req.user.id }, 
      req.body, 
      { new: true } // Biar yang di-return adalah data terbaru
    );

    // 🧹 LOGIKA SAPU BERSIH OTOMATIS SAAT TOKO DITUTUP
    if (req.body.aktif === false || String(req.body.aktif) === 'false') {
      
      // Kasus A: Pesanan udah 'diproses' atau 'siap' -> Otomatis 'selesai'
      await Order.updateMany(
        { 
          toko_id: updatedToko._id, 
          status: { $in: ['diproses', 'siap'] } 
        },
        { status: 'selesai' }
      );

      // Kasus B: Pesanan baru 'menunggu' (belum di-acc) -> Otomatis 'ditolak'
      await Order.updateMany(
        { 
          toko_id: updatedToko._id, 
          status: 'menunggu' 
        },
        { status: 'ditolak' }
      );
      
      console.log(`[SYSTEM] Toko ${updatedToko.nama} tutup. Pesanan disapu bersih!`);
    }

    res.json({ message: 'Toko berhasil diupdate!', toko: updatedToko });
  } catch (error) {
    res.status(500).json({ message: 'Gagal update toko', error: error.message });
  }
};

// Bikin Toko Baru (Dipanggil pas Vendor baru daftar)
exports.createToko = async (req, res) => {
  try {
    const newToko = new Toko({
      ...req.body,
      user_id: req.user.id
    });
    await newToko.save();
    res.status(201).json({ message: 'Toko berhasil dibuat!', toko: newToko });
  } catch (error) {
    res.status(500).json({ message: 'Gagal membuat toko', error: error.message });
  }
};