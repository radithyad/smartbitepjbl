const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { nama, username, email, password, no_hp, role } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { username }, { no_hp }] });
    if (existingUser) return res.status(400).json({ message: 'Email, Username, atau No HP sudah terdaftar!' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      nama, username, email, password: hashedPassword, no_hp,
      role: role || 'customer' 
    });

    await newUser.save();
    res.status(201).json({ message: 'Yeay, Registrasi berhasil!', user: newUser });
  } catch (error) { res.status(500).json({ message: 'Terjadi kesalahan di server', error: error.message }); }
};

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }, { no_hp: identifier }] });
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan!' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Password salah!' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    user.password = undefined;

    res.json({ message: 'Login berhasil!', token, user });
  } catch (error) { res.status(500).json({ message: 'Terjadi kesalahan di server', error: error.message }); }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    const { nama, email, no_hp, password_lama, password_baru, foto_base64 } = req.body;

    if (nama) user.nama = nama;
    if (email) user.email = email;
    if (no_hp !== undefined) user.no_hp = no_hp;

    // 🔥 FIX: Kalau dikirim "", berarti fotonya minta dihapus (jadi null)
    if (foto_base64 !== undefined) {
      user.foto_url = foto_base64 === "" ? null : foto_base64;
    }

    if (password_lama && password_baru) {
      const isMatch = await bcrypt.compare(password_lama, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Password lama tidak cocok.' });
      user.password = await bcrypt.hash(password_baru, 10);
    }

    await user.save();
    
    const updatedUser = user.toObject();
    delete updatedUser.password;
    
    res.json({ message: 'Profil berhasil diupdate', user: updatedUser });
  } catch (error) { res.status(500).json({ message: 'Gagal update profil', error: error.message }); }
};