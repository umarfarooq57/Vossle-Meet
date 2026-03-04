/**
 * Vossle — Session Controller
 * Manages video call session lifecycle.
 */

const { SessionStore, SessionStatus } = require('../models/session.model');

/**
 * POST /api/sessions — Create a new session
 */
const createSession = async (req, res) => {
    try {
        const { title } = req.body;

        const session = await SessionStore.create({
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
const getSession = async (req, res) => {
    try {
        const session = await SessionStore.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found.' });
        }
        res.status(200).json({ session });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch session.' });
    }
};

/**
 * GET /api/sessions/room/:roomCode — Find session by room code
 */
const getSessionByRoom = async (req, res) => {
    try {
        const session = await SessionStore.findByRoomCode(req.params.roomCode);
        if (!session) {
            return res.status(404).json({ error: 'Room not found.' });
        }
        if (session.status === SessionStatus.ENDED) {
            return res.status(410).json({ error: 'This session has ended.' });
        }
        res.status(200).json({ session });
    } catch (error) {
        res.status(500).json({ error: 'Failed to find room.' });
    }
};

/**
 * POST /api/sessions/:id/join — Join an existing session
 */
const joinSession = async (req, res) => {
    try {
        const session = await SessionStore.findById(req.params.id);
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

        const updatedSession = await SessionStore.joinSession(session.id, {
            participantId: req.user.id,
            participantName: req.user.name,
        });

        res.status(200).json({ session: updatedSession, role: 'participant' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to join session.' });
    }
};

/**
 * POST /api/sessions/:id/end — End a session
 */
const endSession = async (req, res) => {
    try {
        const session = await SessionStore.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found.' });
        }
        if (session.hostId !== req.user.id && session.participantId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to end this session.' });
        }

        const ended = await SessionStore.endSession(session.id);
        res.status(200).json({ message: 'Session ended.', session: ended });
    } catch (error) {
        res.status(500).json({ error: 'Failed to end session.' });
    }
};

/**
 * GET /api/sessions — List user's sessions
 */
const listSessions = async (req, res) => {
    try {
        const sessions = await SessionStore.findByUserId(req.user.id);
        res.status(200).json({
            count: sessions.length,
            sessions,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to list sessions.' });
    }
};

module.exports = {
    createSession,
    getSession,
    getSessionByRoom,
    joinSession,
    endSession,
    listSessions,
};
