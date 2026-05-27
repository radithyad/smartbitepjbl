const express = require('express');
const router = express.Router();
const { createUlasan } = require('../controllers/ulasanController');
const { protect } = require('../middleware/authMiddleware'); // Pastikan nama middleware-mu 'protect'

// Rute untuk submit ulasan
router.post('/', protect, createUlasan);

module.exports = router;