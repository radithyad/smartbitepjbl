const Menu = require('../models/Menu');

// Ambil semua menu berdasarkan ID Toko (Bisa diakses customer & vendor)
exports.getMenuByToko = async (req, res) => {
  try {
    const menus = await Menu.find({ toko_id: req.params.tokoId });
    res.json(menus);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil menu', error: error.message });
  }
};

// Tambah Menu Baru (Khusus Vendor)
exports.addMenu = async (req, res) => {
  try {
    const newMenu = new Menu(req.body);
    await newMenu.save();
    res.status(201).json({ message: 'Menu berhasil ditambahkan!', menu: newMenu });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambah menu', error: error.message });
  }
};

// Update Menu (Khusus Vendor, misal buat ubah harga atau ketersediaan)
exports.updateMenu = async (req, res) => {
  try {
    const menuId = req.params.id;
    
    // Cari menu berdasarkan ID lalu update dengan data baru (req.body)
    const updatedMenu = await Menu.findByIdAndUpdate(
      menuId,
      req.body,
      { new: true } // Opsi ini bikin fungsi me-return data SETELAH diupdate
    );

    if (!updatedMenu) {
      return res.status(404).json({ message: 'Menu tidak ditemukan' });
    }

    res.json({ message: 'Menu berhasil diupdate!', data: updatedMenu });
  } catch (error) {
    res.status(500).json({ message: 'Gagal update menu', error: error.message });
  }
};

exports.deleteMenu = async (req, res) => {
  try {
    const menuId = req.params.id;
    const deletedMenu = await Menu.findByIdAndDelete(menuId);

    if (!deletedMenu) {
      return res.status(404).json({ message: 'Menu tidak ditemukan' });
    }

    res.json({ message: 'Menu berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus menu', error: error.message });
  }
};

// Mengambil semua data menu beserta info tokonya untuk halaman pencarian
exports.getAllMenu = async (req, res) => {
  try {
    // .populate() digunakan agar data toko (nama, emoji, rating) ikut kebawa ke dalam menu
    const menus = await Menu.find().populate('toko_id', 'nama emoji kategori rating waktu');
    res.json(menus);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data menu', error: error.message });
  }
};