/**
 * Vossle — Input Validation Middleware
 */

const validator = require('validator');

/**
 * Validate registration input
 */
const validateRegister = (req, res, next) => {
    const { name, email, password } = req.body;
    const errors = [];

    if (!name || name.trim().length < 2) {
        errors.push('Name must be at least 2 characters.');
    }
    if (name && name.trim().length > 50) {
        errors.push('Name must be under 50 characters.');
    }
    if (!email || !validator.isEmail(email)) {
        errors.push('Valid email is required.');
    }
    if (!password || password.length < 8) {
        errors.push('Password must be at least 8 characters.');
    }
    if (password && password.length > 128) {
        errors.push('Password must be under 128 characters.');
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    // Sanitize
    req.body.name = validator.escape(name.trim());
    req.body.email = validator.normalizeEmail(email);

    next();
};

/**
 * Validate login input
 */
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email || !validator.isEmail(email)) {
        errors.push('Valid email is required.');
    }
    if (!password) {
        errors.push('Password is required.');
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    req.body.email = validator.normalizeEmail(email);
    next();
};

/**
 * Validate session creation
 */
const validateCreateSession = (req, res, next) => {
    const { title } = req.body;

    if (title && title.length > 100) {
        return res.status(400).json({ errors: ['Title must be under 100 characters.'] });
    }

    if (title) {
        req.body.title = validator.escape(title.trim());
    }

    next();
};

module.exports = { validateRegister, validateLogin, validateCreateSession };
