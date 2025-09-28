const { verifyToken } = require('../utils/authUtils');
const pool = require('../config/db');
 
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (token == null) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }

    if (decoded.userId) {
        try {
            const result = await pool.query('SELECT user_id, username, email FROM Users WHERE user_id = $1', [decoded.userId]);
            if (result.rows.length === 0) {
                return res.status(403).json({ message: 'User not found.' });
            }
            req.user = result.rows[0];
            req.user.role = 'user'; 
        } catch (error) {
            console.error('Error fetching user for token:', error);
            return res.status(500).json({ message: 'Server error during authentication.' });
        }
    } else if (decoded.adminId) {
        try {
            const result = await pool.query('SELECT admin_id, username, email, role FROM AdminUsers WHERE admin_id = $1', [decoded.adminId]);
            if (result.rows.length === 0) {
                return res.status(403).json({ message: 'Admin user not found.' });
            }
            req.user = result.rows[0]; // Renamed to req.user for consistency, contains admin details
            req.user.role = result.rows[0].role; // Set actual admin role
        } catch (error) {
            console.error('Error fetching admin for token:', error);
            return res.status(500).json({ message: 'Server error during authentication.' });
        }
    } else {
        return res.status(403).json({ message: 'Token does not contain valid user or admin ID.' });
    }

    next();
};

const authorizeRoles = (roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: 'Not authenticated or role not assigned.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Access denied. Requires one of: ${roles.join(', ')}.` });
        }
        next();
    };
};

module.exports = {
    authenticateToken,
    authorizeRoles
};