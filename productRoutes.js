const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', async (req, res) => {
    const { category_id, search, limit = 10, offset = 0 } = req.query; 
    let query = 'SELECT p.*, c.name as category_name FROM Products p JOIN Categories c ON p.category_id = c.category_id WHERE 1=1';
    let queryParams = [];
    let paramIndex = 1;

    if (category_id) {
        query += ` AND p.category_id = $${paramIndex++}`;
        queryParams.push(category_id);
    }
    if (search) {
        query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`; 
        queryParams.push(`%${search}%`);
        paramIndex++; 
    }

    // Add ordering and pagination
    query += ` ORDER BY p.product_id ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(limit, offset);

    try {
        const products = await pool.query(query, queryParams);
        res.status(200).json(products.rows);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Server error fetching products.' });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const product = await pool.query('SELECT p.*, c.name as category_name FROM Products p JOIN Categories c ON p.category_id = c.category_id WHERE p.product_id = $1', [id]);
        if (product.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        res.status(200).json(product.rows[0]);
    } catch (error) {
        console.error(`Error fetching product with ID ${id}:`, error);
        res.status(500).json({ message: 'Server error fetching product.' });
    }
});

router.post('/', authenticateToken, authorizeRoles(['SuperAdmin', 'Editor']), async (req, res) => {
    const { name, description, price, stock_quantity, category_id, image_url } = req.body;

    if (!name || !price || !stock_quantity || !category_id) {
        return res.status(400).json({ message: 'Name, price, stock quantity, and category ID are required.' });
    }

    try {
        // Optional: Check if category_id exists
        const categoryExists = await pool.query('SELECT category_id FROM Categories WHERE category_id = $1', [category_id]);
        if (categoryExists.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid category ID.' });
        }

        const newProduct = await pool.query(
            'INSERT INTO Products (name, description, price, stock_quantity, category_id, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, description, price, stock_quantity, category_id, image_url]
        );
        res.status(201).json({
            message: 'Product added successfully!',
            product: newProduct.rows[0]
        });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Server error adding product.' });
    }
});

router.put('/:id', authenticateToken, authorizeRoles(['SuperAdmin', 'Editor']), async (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock_quantity, category_id, image_url } = req.body;

    try {
        const productExists = await pool.query('SELECT product_id FROM Products WHERE product_id = $1', [id]);
        if (productExists.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        let updateFields = [];
        let queryParams = [];
        let paramIndex = 1;

        if (name !== undefined) { updateFields.push(`name = $${paramIndex++}`); queryParams.push(name); }
        if (description !== undefined) { updateFields.push(`description = $${paramIndex++}`); queryParams.push(description); }
        if (price !== undefined) { updateFields.push(`price = $${paramIndex++}`); queryParams.push(price); }
        if (stock_quantity !== undefined) { updateFields.push(`stock_quantity = $${paramIndex++}`); queryParams.push(stock_quantity); }
        if (category_id !== undefined) {
            // Optional: Check if category_id exists
            const categoryExists = await pool.query('SELECT category_id FROM Categories WHERE category_id = $1', [category_id]);
            if (categoryExists.rows.length === 0) {
                return res.status(400).json({ message: 'Invalid category ID provided for update.' });
            }
            updateFields.push(`category_id = $${paramIndex++}`); queryParams.push(category_id);
        }
        if (image_url !== undefined) { updateFields.push(`image_url = $${paramIndex++}`); queryParams.push(image_url); }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No fields provided for update.' });
        }

        const query = `UPDATE Products SET ${updateFields.join(', ')}, updated_at = NOW() WHERE product_id = $${paramIndex} RETURNING *`;
        queryParams.push(id);

        const updatedProduct = await pool.query(query, queryParams);
        res.status(200).json({
            message: 'Product updated successfully!',
            product: updatedProduct.rows[0]
        });
    } catch (error) {
        console.error(`Error updating product with ID ${id}:`, error);
        res.status(500).json({ message: 'Server error updating product.' });
    }
});

router.delete('/:id', authenticateToken, authorizeRoles(['SuperAdmin', 'Editor']), async (req, res) => {
    const { id } = req.params;
    try {
        const deletedProduct = await pool.query('DELETE FROM Products WHERE product_id = $1 RETURNING product_id', [id]);
        if (deletedProduct.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        res.status(200).json({ message: 'Product deleted successfully!', product_id: deletedProduct.rows[0].product_id });
    } catch (error) {
        console.error(`Error deleting product with ID ${id}:`, error);
        if (error.code === '23503') { 
            return res.status(409).json({ message: 'Cannot delete product as it is part of existing orders.' });
        }
        res.status(500).json({ message: 'Server error deleting product.' });
    }
});

module.exports = router;