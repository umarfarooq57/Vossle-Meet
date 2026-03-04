/**
 * Vossle — Session Routes
 */

const express = require('express');
const router = express.Router();

const {
    createSession,
    getSession,
    getSessionByRoom,
    joinSession,
    endSession,
    listSessions,
} = require('../controllers/session.controller');

const { protect } = require('../middleware/auth.middleware');
const { validateCreateSession } = require('../middleware/validation.middleware');

// All session routes require authentication
router.use(protect);

router.post('/', validateCreateSession, createSession);
router.get('/', listSessions);
router.get('/:id', getSession);
router.get('/room/:roomCode', getSessionByRoom);
router.post('/:id/join', joinSession);
router.post('/:id/end', endSession);

module.exports = router;
