/**
 * Vossle — Authentication Controller
 * Handles registration, login, token refresh, and profile.
 */

const bcrypt = require('bcryptjs');
const UserStore = require('../models/user.model');
const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} = require('../utils/token.utils');
const config = require('../config/auth.config');

/**
 * POST /api/auth/register
 */
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existing = UserStore.findByEmail(email);
        if (existing) {
            return res.status(409).json({ error: 'Email already registered.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const user = UserStore.create({ name, email, passwordHash });

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Set refresh token in httpOnly cookie
        res.cookie('refreshToken', refreshToken, config.cookieOptions);

        res.status(201).json({
            message: 'Account created successfully.',
            user,
            accessToken,
        });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = UserStore.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Update last login
        UserStore.updateLastLogin(user.id);

        // Generate tokens
        const sanitizedUser = UserStore.sanitize(user);
        const accessToken = generateAccessToken(sanitizedUser);
        const refreshToken = generateRefreshToken(sanitizedUser);

        res.cookie('refreshToken', refreshToken, config.cookieOptions);

        res.status(200).json({
            message: 'Login successful.',
            user: sanitizedUser,
            accessToken,
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
};

/**
 * POST /api/auth/refresh
 */
const refresh = (req, res) => {
    const token = req.cookies?.refreshToken;

    if (!token) {
        return res.status(401).json({ error: 'Refresh token not found.' });
    }

    const decoded = verifyRefreshToken(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Invalid refresh token.' });
    }

    const user = UserStore.findById(decoded.id);
    if (!user) {
        return res.status(401).json({ error: 'User not found.' });
    }

    const sanitizedUser = UserStore.sanitize(user);
    const accessToken = generateAccessToken(sanitizedUser);

    res.status(200).json({ accessToken });
};

/**
 * POST /api/auth/logout
 */
const logout = (req, res) => {
    res.clearCookie('refreshToken', config.cookieOptions);
    res.status(200).json({ message: 'Logged out successfully.' });
};

/**
 * GET /api/auth/me
 */
const getProfile = (req, res) => {
    res.status(200).json({ user: req.user });
};

module.exports = { register, login, refresh, logout, getProfile };
