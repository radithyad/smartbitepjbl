const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// Semua urusan order wajib login (protect)
router.post('/', protect, orderController.createOrder); // Buat order
router.get('/me', protect, orderController.getMyOrders); // Liat order sendiri (customer)
router.get('/vendor/:tokoId', protect, orderController.getVendorOrders); // Liat order masuk (vendor)
router.put('/:id/status', protect, orderController.updateOrderStatus); // Update status
router.get('/vendor/:tokoId/stats', orderController.getVendorStats);
router.get('/vendor/:tokoId/terbaru', orderController.getRecentOrders);

module.exports = router;