const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', async (req, res) => {
    try {
        const categories = await pool.query('SELECT * FROM Categories ORDER BY name ASC');
        res.status(200).json(categories.rows);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Server error fetching categories.' });
    }
});

router.post('/', authenticateToken, authorizeRoles(['SuperAdmin', 'Editor']), async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Category name is required.' });
    }

    try {
        const categoryExists = await pool.query('SELECT category_id FROM Categories WHERE name = $1', [name]);
        if (categoryExists.rows.length > 0) {
            return res.status(409).json({ message: 'Category with that name already exists.' });
        }

        const newCategory = await pool.query(
            'INSERT INTO Categories (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );
        res.status(201).json({
            message: 'Category added successfully!',
            category: newCategory.rows[0]
        });
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).json({ message: 'Server error adding category.' });
    }
});

module.exports = router;