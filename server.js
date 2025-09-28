const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Ensure environment variables are loaded
const pool = require('../config/db'); // Database connection pool

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for all origins (adjust for production)
app.use(express.json()); // Body parser for JSON requests

// Basic route to check server status
app.get('/', (req, res) => {
    res.send('Tech Store Backend API is running!');
});

// --- Routes will be imported and used here ---
// Example: app.use('/api/users', userRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Test DB connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err.stack);
    } else {
        console.log('Database connected successfully at:', res.rows[0].now);
    }
});