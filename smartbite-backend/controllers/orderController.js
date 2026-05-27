const Order = require('../models/Order');

// Customer bikin pesanan baru
exports.createOrder = async (req, res) => {
  try {
     // Bikin kode pickup random otomatis (Contoh: ORD-A3F8)
    const randomCode = 'ORD-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    const newOrder = new Order({
      ...req.body,
      kode_pickup: randomCode, // 👈 Masukin kode randomnya ke sini
      customer_id: req.user.id // Otomatis dapet dari token JWT
    });
    
    await newOrder.save();
    res.status(201).json({ message: 'Pesanan berhasil dibuat!', order: newOrder });
  } catch (error) {
    res.status(500).json({ message: 'Gagal membuat pesanan', error: error.message });
  }
};

// ... (sisanya getMyOrders, getVendorOrders, updateOrderStatus biarin aja gak usah diubah)

// Customer ngecek riwayat atau pesanan aktif miliknya
exports.getMyOrders = async (req, res) => {
  try {
    // .populate() ini fungsinya mirip JOIN di SQL, buat ngambil data toko sekalian
    const orders = await Order.find({ customer_id: req.user.id })
      .populate('toko_id', 'nama emoji kategori')
      .sort({ createdAt: -1 }); // Urutkan dari yang terbaru
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data pesanan', error: error.message });
  }
};

// Vendor ngecek pesanan yang masuk ke tokonya
exports.getVendorOrders = async (req, res) => {
  try {
    const orders = await Order.find({ toko_id: req.params.tokoId })
      .populate('customer_id', 'nama no_hp')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil pesanan toko', error: error.message });
  }
};

// Vendor/Customer update status pesanan (misal: "diproses", "siap", "dibatalkan")
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id, 
      { status: req.body.status }, 
      { new: true }
    );
    res.json({ message: 'Status pesanan berhasil diupdate!', order });
  } catch (error) {
    res.status(500).json({ message: 'Gagal update status pesanan', error: error.message });
  }
};