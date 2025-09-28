const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const userCarts = {};
router.post('/add', authenticateToken, authorizeRoles(['user']), async (req, res) => {
    const userId = req.user.user_id;
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity || quantity <= 0) {
        return res.status(400).json({ message: 'Product ID and a positive quantity are required.' });
    }

    try {
        const productResult = await pool.query('SELECT product_id, name, price, stock_quantity, image_url FROM Products WHERE product_id = $1', [product_id]);
        if (productResult.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        const product = productResult.rows[0];

        if (product.stock_quantity < quantity) {
            return res.status(400).json({ message: `Insufficient stock for product ${product.name}. Available: ${product.stock_quantity}, Requested: ${quantity}.` });
        }

        if (!userCarts[userId]) {
            userCarts[userId] = [];
        }

        const existingItemIndex = userCarts[userId].findIndex(item => item.product_id === product_id);

        if (existingIquantitytemIndex > -1) {
            userCarts[userId][existingItemIndex].quantity += quantity;
        } else {
            userCarts[userId].push({
                product_id: product.product_id,
                name: product.name,
                price: product.price,
                image_url: product.image_url,
                quantity: quantity
            });
        }

        res.status(200).json({
            message: 'Item added to cart successfully!',
            cart: userCarts[userId]
        });

    } catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({ message: 'Server error adding item to cart.' });
    }
});

router.get('/', authenticateToken, authorizeRoles(['user']), (req, res) => {
    const userId = req.user.user_id;
    const cart = userCarts[userId] || []; 

    let total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.status(200).json({
        cart_items: cart,
        total_items: cart.length,
        total_amount: total.toFixed(2)
    });
});

module.exports = router;