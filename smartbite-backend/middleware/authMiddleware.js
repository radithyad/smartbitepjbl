const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  // Cek apakah di header request ada token yang dikirim (biasanya formatnya "Bearer <token>")
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Ambil tokennya aja (tanpa kata "Bearer ")
      token = req.headers.authorization.split(' ')[1];

      // Verifikasi token pakai kunci rahasia yang ada di .env
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Titipkan data user (id dan role) ke dalam request biar bisa dipakai di controller
      req.user = decoded;
      
      // Lanjut ke proses berikutnya
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Sesi tidak valid atau sudah kadaluarsa, silakan login ulang!' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak, kamu belum login!' });
  }
};

module.exports = { protect };