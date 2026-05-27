const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// LOGIKA REGISTER
exports.register = async (req, res) => {
  try {
    const { nama, username, email, password, no_hp, role } = req.body;

    // 1. Cek apakah email, username, atau no_hp sudah dipakai orang lain
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }, { no_hp }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Email, Username, atau No HP sudah terdaftar!' });
    }

    // 2. Acak/Hash password sebelum disimpan ke database
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Simpan user baru ke database
    const newUser = new User({
      nama,
      username,
      email,
      password: hashedPassword,
      no_hp,
      role: role || 'customer' // Defaultnya customer kalau gak dikirim
    });

    await newUser.save();

    res.status(201).json({ message: 'Yeay, Registrasi berhasil!', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan di server', error: error.message });
  }
};

// LOGIKA LOGIN
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // 1. Cari user pakai Email, Username, ATAU No HP (menyesuaikan frontend kamu)
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }, { no_hp: identifier }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan!' });
    }

    // 2. Cocokkan password yang diketik dengan yang ada di database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password salah!' });
    }

    // 3. Buat "Karcis" JWT buat tanda kalau user udah login (berlaku 7 hari)
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Jangan kirim password kembali ke frontend demi keamanan
    user.password = undefined;

    res.json({ message: 'Login berhasil!', token, user });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan di server', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    const { nama, username, email, no_hp, password_lama, password_baru, foto_base64 } = req.body;

    // Update data dasar
    if (nama) user.nama = nama;
    if (username) user.username = username;
    if (email) user.email = email;
    if (no_hp) user.no_hp = no_hp;

    // Update foto profil (kalau ada upload base64)
    if (foto_base64) {
      user.foto_url = foto_base64; // Disimpan sebagai string base64
    }

    // Ganti Password (kalau ada isinya)
    if (password_lama && password_baru) {
      const isMatch = await bcrypt.compare(password_lama, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Password lama tidak cocok.' });
      }
      user.password = await bcrypt.hash(password_baru, 10);
    }

    await user.save();
    
    // Kembalikan data user terbaru ke HP (tanpa password)
    const updatedUser = user.toObject();
    delete updatedUser.password;
    
    res.json({ message: 'Profil berhasil diupdate', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Gagal update profil', error: error.message });
  }
};