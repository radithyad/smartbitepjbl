const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Endpoint untuk register -> POST /api/auth/register
router.post('/register', authController.register);

// Endpoint untuk login -> POST /api/auth/login
router.post('/login', authController.login);

router.put('/update-profile', protect, updateProfile);

module.exports = router;