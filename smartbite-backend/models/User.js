const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  no_hp: { type: String, required: true, unique: true },
  role: { 
    type: String, 
    enum: ['customer', 'vendor', 'pending_vendor'], 
    default: 'customer' 
  },
  foto_url: { type: String, default: null }
}, { timestamps: true }); // timestamps otomatis bikin field createdAt & updatedAt

module.exports = mongoose.model('User', userSchema);