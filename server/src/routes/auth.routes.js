/**
 * Vossle — Auth Routes
 */

const express = require('express');
const router = express.Router();

const {
    register,
    login,
    refresh,
    logout,
    getProfile,
} = require('../controllers/auth.controller');

const { protect } = require('../middleware/auth.middleware');
const { validateRegister, validateLogin } = require('../middleware/validation.middleware');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, getProfile);

module.exports = router;
