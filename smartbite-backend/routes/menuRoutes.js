const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { protect } = require('../middleware/authMiddleware');
const { getAllMenu } = require('../controllers/menuController');

// Customer liat menu (Gak perlu login juga bisa)
router.get('/:tokoId', menuController.getMenuByToko);
router.get('/', getAllMenu);

// Vendor ngatur menu (Harus login pakai "protect")
router.post('/', protect, menuController.addMenu);
router.put('/:id', protect, menuController.updateMenu);
router.delete('/:id', protect, menuController.deleteMenu);

router.get('/toko/:tokoId', menuController.getMenuByToko);

module.exports = router;

