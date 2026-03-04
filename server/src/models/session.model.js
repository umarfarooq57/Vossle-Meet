/**
 * Vossle — In-Memory Session Store
 * 
 * Manages video call session lifecycle:
 * CREATED → WAITING → ACTIVE → ENDED → ARCHIVED
 */

const { v4: uuidv4 } = require('uuid');

const sessions = new Map();

const SessionStatus = {
    CREATED: 'created',
    WAITING: 'waiting',
    ACTIVE: 'active',
    ENDED: 'ended',
    ARCHIVED: 'archived',
};

const SessionStore = {
    /**
     * Create a new video session (room)
     */
    create({ hostId, hostName, title }) {
        const id = uuidv4();
        const roomCode = this.generateRoomCode();
        const session = {
            id,
            roomCode,
            title: title || 'Vossle Meeting',
            hostId,
            hostName,
            participantId: null,
            participantName: null,
            status: SessionStatus.CREATED,
            createdAt: new Date().toISOString(),
            startedAt: null,
            endedAt: null,
            duration: null,
            metadata: {
                hostJoinedAt: null,
                participantJoinedAt: null,
                qualityMetrics: [],
            },
        };
        sessions.set(id, session);
        return session;
    },

    /**
     * Find session by ID
     */
    findById(id) {
        return sessions.get(id) || null;
    },

    /**
     * Find session by room code
     */
    findByRoomCode(roomCode) {
        for (const session of sessions.values()) {
            if (session.roomCode === roomCode) return session;
        }
        return null;
    },

    /**
     * Join session as participant
     */
    joinSession(sessionId, { participantId, participantName }) {
        const session = sessions.get(sessionId);
        if (!session) return null;
        if (session.status === SessionStatus.ENDED) return null;

        session.participantId = participantId;
        session.participantName = participantName;
        session.status = SessionStatus.ACTIVE;
        session.startedAt = new Date().toISOString();
        session.metadata.participantJoinedAt = new Date().toISOString();
        sessions.set(sessionId, session);
        return session;
    },

    /**
     * End a session
     */
    endSession(sessionId) {
        const session = sessions.get(sessionId);
        if (!session) return null;

        session.status = SessionStatus.ENDED;
        session.endedAt = new Date().toISOString();

        if (session.startedAt) {
            session.duration = Math.round(
                (new Date(session.endedAt) - new Date(session.startedAt)) / 1000
            );
        }

        sessions.set(sessionId, session);
        return session;
    },

    /**
     * Get sessions for a specific user (as host or participant)
     */
    findByUserId(userId) {
        const result = [];
        for (const session of sessions.values()) {
            if (session.hostId === userId || session.participantId === userId) {
                result.push(session);
            }
        }
        return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    /**
     * Get active sessions count
     */
    activeCount() {
        let count = 0;
        for (const session of sessions.values()) {
            if (session.status === SessionStatus.ACTIVE) count++;
        }
        return count;
    },

    /**
     * Generate a human-readable room code
     */
    generateRoomCode() {
        const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
        const segments = [];
        for (let s = 0; s < 3; s++) {
            let segment = '';
            for (let i = 0; i < 4; i++) {
                segment += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            segments.push(segment);
        }
        return segments.join('-'); // e.g., "ab3k-m7qr-x2np"
    },
};

module.exports = { SessionStore, SessionStatus };
