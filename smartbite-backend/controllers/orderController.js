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

exports.getVendorStats = async (req, res) => {
  try {
    const { tokoId } = req.params;

    const orderAktif = await Order.countDocuments({
      toko_id: tokoId,
      status: { $in: ['menunggu', 'diproses', 'siap'] }
    });

    const semuaPesananSelesai = await Order.find({
      toko_id: tokoId,
      status: 'selesai'
    });

    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const todayWIB = formatter.format(new Date());

    let selesaiHariIni = 0;
    let hariIni = 0;

    semuaPesananSelesai.forEach(order => {
      const orderDate = new Date(order.updatedAt || order.createdAt);
      
      const orderDateWIB = formatter.format(orderDate);

      if (orderDateWIB === todayWIB) {
        selesaiHariIni++;
        hariIni += Number(order.total_harga || 0); 
      }
    });

    res.json({ hariIni, orderAktif, selesaiHariIni });
  } catch (error) {
    console.error("Error getVendorStats:", error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil statistik' });
  }
};

// ── AMBIL 5 PESANAN TERBARU ──
exports.getRecentOrders = async (req, res) => {
  try {
    const { tokoId } = req.params;
    // Ambil maksimal 5 pesanan, diurutkan dari yang paling baru dibuat
    const recentOrders = await Order.find({ toko_id: tokoId })
      .sort({ createdAt: -1 }) // -1 artinya descending (terbaru di atas)
      .limit(5);
      
    res.json(recentOrders);
  } catch (error) {
    console.error("Error getRecentOrders:", error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil pesanan terbaru' });
  }
};