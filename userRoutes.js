const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { hashPassword, comparePassword, generateToken } = require('../utils/authUtils');
const { authenticateToken } = require('../middleware/auth');

// POST /api/register - Register a new user
router.post('/register', async (req, res) => {
    const { username, email, password, first_name, last_name, address, city, state, zip_code, phone_number } = req.body;

    try {
        // Check if user already exists
        const userExists = await pool.query('SELECT user_id FROM Users WHERE email = $1 OR username = $2', [email, username]);
        if (userExists.rows.length > 0) {
            return res.status(409).json({ message: 'User with that email or username already exists.' });
        }

        const hashedPassword = await hashPassword(password);
        const newUser = await pool.query(
            'INSERT INTO Users (username, email, password_hash, first_name, last_name, address, city, state, zip_code, phone_number) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING user_id, username, email',
            [username, email, hashedPassword, first_name, last_name, address, city, state, zip_code, phone_number]
        );
        res.status(201).json({
            message: 'User registered successfully!',
            user: newUser.rows[0]
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// POST /api/login - Authenticate a user and return a JWT token
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const userResult = await pool.query('SELECT user_id, password_hash, username, email FROM Users WHERE email = $1', [email]);
        const adminResult = await pool.query('SELECT admin_id, password_hash, username, email, role FROM AdminUsers WHERE email = $1', [email]);

        let user = null;
        let isAdmin = false;

        if (userResult.rows.length > 0) {
            user = userResult.rows[0];
        } else if (adminResult.rows.length > 0) {
            user = adminResult.rows[0];
            isAdmin = true;
        }

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await comparePassword(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        let tokenPayload;
        if (isAdmin) {
            tokenPayload = { adminId: user.admin_id, role: user.role };
        } else {
            tokenPayload = { userId: user.user_id, role: 'user' };
        }

        const token = generateToken(tokenPayload);
        res.status(200).json({
            message: 'Login successful!',
            token,
            user: {
                id: isAdmin ? user.admin_id : user.user_id,
                username: user.username,
                email: user.email,
                role: isAdmin ? user.role : 'user'
            }
        });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// GET /api/profile - Retrieve user profile (authenticated)
router.get('/profile', authenticateToken, async (req, res) => {
    // req.user is populated by authenticateToken middleware
    // We filter out password_hash for security
    const { password_hash, ...userProfile } = req.user;
    res.status(200).json(userProfile);
});

// PUT /api/profile - Update user profile (authenticated)
router.put('/profile', authenticateToken, async (req, res) => {
    // This route should only be accessible to regular users updating their own profile
    if (req.user.role !== 'user' || !req.user.user_id) {
        return res.status(403).json({ message: 'Access denied. Admins cannot update user profiles via this endpoint.' });
    }

    const userId = req.user.user_id;
    const { first_name, last_name, address, city, state, zip_code, phone_number, password } = req.body;

    try {
        let updateFields = [];
        let queryParams = [];
        let paramIndex = 1;

        if (first_name !== undefined) { updateFields.push(`first_name = $${paramIndex++}`); queryParams.push(first_name); }
        if (last_name !== undefined) { updateFields.push(`last_name = $${paramIndex++}`); queryParams.push(last_name); }
        if (address !== undefined) { updateFields.push(`address = $${paramIndex++}`); queryParams.push(address); }
        if (city !== undefined) { updateFields.push(`city = $${paramIndex++}`); queryParams.push(city); }
        if (state !== undefined) { updateFields.push(`state = $${paramIndex++}`); queryParams.push(state); }
        if (zip_code !== undefined) { updateFields.push(`zip_code = $${paramIndex++}`); queryParams.push(zip_code); }
        if (phone_number !== undefined) { updateFields.push(`phone_number = $${paramIndex++}`); queryParams.push(phone_number); }
        if (password !== undefined) {
            const hashedPassword = await hashPassword(password);
            updateFields.push(`password_hash = $${paramIndex++}`); queryParams.push(hashedPassword);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No fields provided for update.' });
        }

        const query = `UPDATE Users SET ${updateFields.join(', ')} WHERE user_id = $${paramIndex} RETURNING user_id, username, email`;
        queryParams.push(userId);

        const updatedUser = await pool.query(query, queryParams);

        if (updatedUser.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json({
            message: 'Profile updated successfully!',
            user: updatedUser.rows[0]
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Server error during profile update.' });
    }
});

module.exports = router;