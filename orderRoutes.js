const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.post('/', authenticateToken, authorizeRoles(['user']), async (req, res) => {
    const userId = req.user.user_id;
    const { items } = req.body; 

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Order must contain at least one item.' });
    }

    const client = await pool.connect(); 
    try {
        await client.query('BEGIN'); 

        let totalAmount = 0;
        let orderItems = [];

    
        for (const item of items) {
            const productResult = await client.query('SELECT product_id, price, stock_quantity FROM Products WHERE product_id = $1', [item.product_id]);
            if (productResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ message: `Product with ID ${item.product_id} not found.` });
            }
            const product = productResult.rows[0];

            if (product.stock_quantity < item.quantity) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: `Insufficient stock for product ${product.product_id}. Available: ${product.stock_quantity}, Requested: ${item.quantity}.` });
            }

            totalAmount += product.price * item.quantity;
            orderItems.push({ product_id: product.product_id, quantity: item.quantity, unit_price: product.price });
        }

        const orderResult = await client.query(
            'INSERT INTO Orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING order_id, order_date, total_amount, status',
            [userId, totalAmount, 'Pending']
        );
        const newOrder = orderResult.rows[0];

        for (const item of orderItems) {
            await client.query(
                'INSERT INTO OrderItems (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
                [newOrder.order_id, item.product_id, item.quantity, item.unit_price]
            );
            await client.query(
                'UPDATE Products SET stock_quantity = stock_quantity - $1 WHERE product_id = $2',
                [item.quantity, item.product_id]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({
            message: 'Order created successfully!',
            order: newOrder,
            items: orderItems
        });

    } catch (error) {
        await client.query('ROLLBACK'); 
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Server error creating order.' });
    } finally {
        client.release();
    }
});

router.get('/', authenticateToken, authorizeRoles(['user']), async (req, res) => {
    const userId = req.user.user_id;
    try {
        const orders = await pool.query(
            'SELECT o.order_id, o.order_date, o.total_amount, o.status, ' +
            'json_agg(json_build_object(\'product_id\', oi.product_id, \'name\', p.name, \'quantity\', oi.quantity, \'unit_price\', oi.unit_price, \'image_url\', p.image_url)) as items ' +
            'FROM Orders o JOIN OrderItems oi ON o.order_id = oi.order_id JOIN Products p ON oi.product_id = p.product_id ' +
            'WHERE o.user_id = $1 GROUP BY o.order_id ORDER BY o.order_date DESC',
            [userId]
        );
        res.status(200).json(orders.rows);
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ message: 'Server error fetching orders.' });
    }
});

router.get('/admin', authenticateToken, authorizeRoles(['SuperAdmin', 'Editor']), async (req, res) => {
    try {
        const orders = await pool.query(
            'SELECT o.order_id, o.order_date, o.total_amount, o.status, u.username as customer_username, u.email as customer_email, ' +
            'json_agg(json_build_object(\'product_id\', oi.product_id, \'name\', p.name, \'quantity\', oi.quantity, \'unit_price\', oi.unit_price)) as items ' +
            'FROM Orders o JOIN Users u ON o.user_id = u.user_id JOIN OrderItems oi ON o.order_id = oi.order_id JOIN Products p ON oi.product_id = p.product_id ' +
            'GROUP BY o.order_id, u.username, u.email ORDER BY o.order_date DESC'
        );
        res.status(200).json(orders.rows);
    } catch (error) {
        console.error('Error fetching all orders (admin):', error);
        res.status(500).json({ message: 'Server error fetching all orders.' });
    }
});

router.put('/:id/status', authenticateToken, authorizeRoles(['SuperAdmin', 'Editor']), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; 

    const allowedStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status provided. Must be one of: ${allowedStatuses.join(', ')}.` });
    }

    try {
        const updatedOrder = await pool.query(
            'UPDATE Orders SET status = $1 WHERE order_id = $2 RETURNING order_id, status, total_amount',
            [status, id]
        );
        if (updatedOrder.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found.' });
        }
        res.status(200).json({
            message: `Order ${id} status updated to ${status}.`,
            order: updatedOrder.rows[0]
        });
    } catch (error) {
        console.error(`Error updating order ${id} status:`, error);
        res.status(500).json({ message: 'Server error updating order status.' });
    }
});

module.exports = router;