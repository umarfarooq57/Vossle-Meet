/**
 * Vossle — Session Store (Prisma/MongoDB)
 */

const prisma = require('../config/prisma.client');

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
    async create({ hostId, hostName, title }) {
        const roomCode = this.generateRoomCode();
        return prisma.session.create({
            data: {
                roomCode,
                title: title || 'Vossle Meeting',
                host: { connect: { id: hostId } },
                hostName,
                status: SessionStatus.CREATED,
            },
        });
    },

    /**
     * Find session by ID
     */
    async findById(id) {
        return prisma.session.findUnique({
            where: { id },
        });
    },

    /**
     * Find session by room code
     */
    async findByRoomCode(roomCode) {
        return prisma.session.findUnique({
            where: { roomCode },
        });
    },

    /**
     * Join session as participant
     */
    async joinSession(sessionId, { participantId, participantName }) {
        return prisma.session.update({
            where: { id: sessionId },
            data: {
                participant: { connect: { id: participantId } },
                participantName,
                status: SessionStatus.ACTIVE,
                startedAt: new Date(),
                participantJoinedAt: new Date(),
            },
        });
    },

    /**
     * End a session
     */
    async endSession(sessionId) {
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
        });
        if (!session) return null;

        const endedAt = new Date();
        let duration = null;

        if (session.startedAt) {
            duration = Math.round(
                (endedAt.getTime() - new Date(session.startedAt).getTime()) / 1000
            );
        }

        return prisma.session.update({
            where: { id: sessionId },
            data: {
                status: SessionStatus.ENDED,
                endedAt,
                duration,
            },
        });
    },

    /**
     * Get sessions for a specific user (as host or participant)
     */
    async findByUserId(userId) {
        return prisma.session.findMany({
            where: {
                OR: [
                    { hostId: userId },
                    { participantId: userId },
                ],
            },
            orderBy: { createdAt: 'desc' },
        });
    },

    /**
     * Get active sessions count
     */
    async activeCount() {
        return prisma.session.count({
            where: { status: SessionStatus.ACTIVE },
        });
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
