/**
 * Vossle — Session Controller
 * Manages video call session lifecycle.
 */

const { SessionStore, SessionStatus } = require('../models/session.model');

/**
 * POST /api/sessions — Create a new session
 */
const createSession = (req, res) => {
    try {
        const { title } = req.body;

        const session = SessionStore.create({
            hostId: req.user.id,
            hostName: req.user.name,
            title,
        });

        res.status(201).json({
            message: 'Session created.',
            session,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create session.' });
    }
};

/**
 * GET /api/sessions/:id — Get session details
 */
const getSession = (req, res) => {
    const session = SessionStore.findById(req.params.id);
    if (!session) {
        return res.status(404).json({ error: 'Session not found.' });
    }
    res.status(200).json({ session });
};

/**
 * GET /api/sessions/room/:roomCode — Find session by room code
 */
const getSessionByRoom = (req, res) => {
    const session = SessionStore.findByRoomCode(req.params.roomCode);
    if (!session) {
        return res.status(404).json({ error: 'Room not found.' });
    }
    if (session.status === SessionStatus.ENDED) {
        return res.status(410).json({ error: 'This session has ended.' });
    }
    res.status(200).json({ session });
};

/**
 * POST /api/sessions/:id/join — Join an existing session
 */
const joinSession = (req, res) => {
    const session = SessionStore.findById(req.params.id);
    if (!session) {
        return res.status(404).json({ error: 'Session not found.' });
    }
    if (session.status === SessionStatus.ENDED) {
        return res.status(410).json({ error: 'This session has ended.' });
    }
    if (session.participantId && session.participantId !== req.user.id) {
        return res.status(409).json({ error: 'Session is full.' });
    }

    // Host re-joining their own session
    if (session.hostId === req.user.id) {
        return res.status(200).json({ session, role: 'host' });
    }

    const updatedSession = SessionStore.joinSession(session.id, {
        participantId: req.user.id,
        participantName: req.user.name,
    });

    res.status(200).json({ session: updatedSession, role: 'participant' });
};

/**
 * POST /api/sessions/:id/end — End a session
 */
const endSession = (req, res) => {
    const session = SessionStore.findById(req.params.id);
    if (!session) {
        return res.status(404).json({ error: 'Session not found.' });
    }
    if (session.hostId !== req.user.id && session.participantId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to end this session.' });
    }

    const ended = SessionStore.endSession(session.id);
    res.status(200).json({ message: 'Session ended.', session: ended });
};

/**
 * GET /api/sessions — List user's sessions
 */
const listSessions = (req, res) => {
    const sessions = SessionStore.findByUserId(req.user.id);
    res.status(200).json({
        count: sessions.length,
        sessions,
    });
};

module.exports = {
    createSession,
    getSession,
    getSessionByRoom,
    joinSession,
    endSession,
    listSessions,
};
