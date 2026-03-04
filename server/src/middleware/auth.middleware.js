/**
 * Vossle — Authentication Middleware
 * Protects routes by verifying JWT tokens.
 */

const { verifyAccessToken } = require('../utils/token.utils');
const UserStore = require('../models/user.model');

/**
 * Require authentication — attaches user to req.user
 */
const protect = (req, res, next) => {
    let token;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            error: 'Access denied. No token provided.',
        });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
        return res.status(401).json({
            error: 'Invalid or expired token.',
        });
    }

    const user = UserStore.findById(decoded.id);
    if (!user) {
        return res.status(401).json({
            error: 'User not found.',
        });
    }

    req.user = UserStore.sanitize(user);
    next();
};

/**
 * Optional auth — attaches user if token exists, but doesn't block
 */
const optionalAuth = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        const decoded = verifyAccessToken(token);
        if (decoded) {
            const user = UserStore.findById(decoded.id);
            if (user) {
                req.user = UserStore.sanitize(user);
            }
        }
    }

    next();
};

module.exports = { protect, optionalAuth };
