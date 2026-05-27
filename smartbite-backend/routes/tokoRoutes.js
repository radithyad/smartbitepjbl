const express = require('express');
const router = express.Router();
const tokoController = require('../controllers/tokoController');
const { protect } = require('../middleware/authMiddleware');
const { getAllToko } = require('../controllers/tokoController');

// Endpoint yang bisa diakses SIAPA SAJA (Customer yang mau lihat daftar toko)
router.get('/', tokoController.getAllToko);
router.post('/', protect, tokoController.createToko);
router.get('/', getAllToko);

// Endpoint yang cuma bisa diakses kalau UDAH LOGIN (Vendor yang mau ngurus tokonya)
router.get('/vendor/mytoko', protect, tokoController.getMyToko);
router.put('/vendor/update', protect, tokoController.updateToko);

// ⚠️ PENTING: Rute dinamis /:id HARUS ditaruh paling bawah biar gak nabrak rute /vendor/mytoko
router.get('/:id', tokoController.getTokoById);

module.exports = router;