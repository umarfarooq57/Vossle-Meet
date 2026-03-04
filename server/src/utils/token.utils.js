/**
 * Vossle — JWT Token Utilities
 */

const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');

/**
 * Generate access token (short-lived)
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role || 'user',
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpire }
    );
};

/**
 * Generate refresh token (long-lived)
 */
const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id },
        config.jwtRefreshSecret,
        { expiresIn: config.jwtRefreshExpire }
    );
};

/**
 * Verify access token
 */
const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, config.jwtSecret);
    } catch (error) {
        return null;
    }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, config.jwtRefreshSecret);
    } catch (error) {
        return null;
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
};
