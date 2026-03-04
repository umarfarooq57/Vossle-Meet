/**
 * Vossle — WebRTC Signaling Service v2 (Socket.IO)
 *
 * Full signaling for WebRTC peer connections:
 * - SDP offer/answer exchange
 * - ICE candidate trickling
 * - Room management (join/leave)
 * - Connection state tracking
 * - Call quality metrics relay
 * - Hand raise / reactions
 * - Chat
 */

const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/token.utils');

// Track connected users: socketId -> { userId, userName, roomId }
const connectedUsers = new Map();
// Track rooms: roomId -> Set of socketIds
const rooms = new Map();

/**
 * Initialize Socket.IO with the HTTP server
 */
const initializeSocket = (httpServer) => {
    const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    const io = new Server(httpServer, {
        cors: {
            origin: (origin, cb) => {
                if (!origin) return cb(null, true);
                if (allowedOrigins.some(o => origin === o || origin.endsWith('.vercel.app'))) {
                    return cb(null, true);
                }
                cb(new Error('Not allowed by CORS'));
            },
            methods: ['GET', 'POST'],
            credentials: true,
        },
        pingInterval: 10000,
        pingTimeout: 5000,
        transports: ['websocket', 'polling'],
    });

    // ── Authentication Middleware ──
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error('Authentication required'));
        }

        const decoded = verifyAccessToken(token);
        if (!decoded) {
            return next(new Error('Invalid or expired token'));
        }

        socket.userId = decoded.id;
        socket.userName = decoded.name;
        next();
    });

    io.on('connection', (socket) => {
        console.log(`[Vossle] User connected: ${socket.userName} (${socket.id})`);

        // Store connection
        connectedUsers.set(socket.id, {
            userId: socket.userId,
            userName: socket.userName,
            roomId: null,
        });

        // ── Join Room ──
        socket.on('room:join', ({ roomId, sessionId }) => {
            try {
                // Leave any existing room first
                leaveCurrentRoom(socket, io);

                // Join the new room
                socket.join(roomId);

                const userInfo = connectedUsers.get(socket.id);
                if (userInfo) {
                    userInfo.roomId = roomId;
                }

                // Track room membership
                if (!rooms.has(roomId)) {
                    rooms.set(roomId, new Set());
                }
                rooms.get(roomId).add(socket.id);

                const roomMembers = rooms.get(roomId);
                const memberCount = roomMembers.size;

                console.log(`[Vossle] ${socket.userName} joined room ${roomId} (${memberCount} users)`);

                // Notify the joiner of existing users
                const existingUsers = [];
                for (const memberId of roomMembers) {
                    if (memberId !== socket.id) {
                        const member = connectedUsers.get(memberId);
                        if (member) {
                            existingUsers.push({
                                socketId: memberId,
                                userId: member.userId,
                                userName: member.userName,
                            });
                        }
                    }
                }

                socket.emit('room:joined', {
                    roomId,
                    existingUsers,
                    memberCount,
                });

                // Notify others in the room
                socket.to(roomId).emit('room:user-joined', {
                    socketId: socket.id,
                    userId: socket.userId,
                    userName: socket.userName,
                    memberCount,
                });

            } catch (error) {
                socket.emit('error', { message: 'Failed to join room.' });
            }
        });

        // ── WebRTC Signaling: SDP Offer ──
        socket.on('webrtc:offer', ({ offer, targetSocketId }) => {
            console.log(`[Vossle] SDP Offer: ${socket.userName} → ${targetSocketId}`);
            io.to(targetSocketId).emit('webrtc:offer', {
                offer,
                senderSocketId: socket.id,
                senderName: socket.userName,
            });
        });

        // ── WebRTC Signaling: SDP Answer ──
        socket.on('webrtc:answer', ({ answer, targetSocketId }) => {
            console.log(`[Vossle] SDP Answer: ${socket.userName} → ${targetSocketId}`);
            io.to(targetSocketId).emit('webrtc:answer', {
                answer,
                senderSocketId: socket.id,
            });
        });

        // ── WebRTC Signaling: ICE Candidate ──
        socket.on('webrtc:ice-candidate', ({ candidate, targetSocketId }) => {
            io.to(targetSocketId).emit('webrtc:ice-candidate', {
                candidate,
                senderSocketId: socket.id,
            });
        });

        // ── Media Control Events ──
        socket.on('media:toggle-video', ({ enabled }) => {
            const userInfo = connectedUsers.get(socket.id);
            if (userInfo?.roomId) {
                socket.to(userInfo.roomId).emit('media:video-toggled', {
                    socketId: socket.id,
                    userName: socket.userName,
                    enabled,
                });
            }
        });

        socket.on('media:toggle-audio', ({ enabled }) => {
            const userInfo = connectedUsers.get(socket.id);
            if (userInfo?.roomId) {
                socket.to(userInfo.roomId).emit('media:audio-toggled', {
                    socketId: socket.id,
                    userName: socket.userName,
                    enabled,
                });
            }
        });

        socket.on('media:screen-share', ({ sharing }) => {
            const userInfo = connectedUsers.get(socket.id);
            if (userInfo?.roomId) {
                socket.to(userInfo.roomId).emit('media:screen-share-changed', {
                    socketId: socket.id,
                    userName: socket.userName,
                    sharing,
                });
            }
        });

        // ── Hand Raise ──
        socket.on('media:hand-raise', ({ raised }) => {
            const userInfo = connectedUsers.get(socket.id);
            if (userInfo?.roomId) {
                socket.to(userInfo.roomId).emit('media:hand-raised', {
                    socketId: socket.id,
                    userName: socket.userName,
                    raised,
                });
            }
        });

        // ── Reactions ──
        socket.on('reaction', ({ emoji }) => {
            const userInfo = connectedUsers.get(socket.id);
            if (userInfo?.roomId && emoji) {
                socket.to(userInfo.roomId).emit('reaction', {
                    socketId: socket.id,
                    userName: socket.userName,
                    emoji,
                });
            }
        });

        // ── In-call Chat ──
        socket.on('chat:message', ({ message }) => {
            const userInfo = connectedUsers.get(socket.id);
            if (userInfo?.roomId && message?.trim()) {
                const chatMessage = {
                    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
                    senderId: socket.userId,
                    senderName: socket.userName,
                    message: message.trim().substring(0, 1000),
                    timestamp: new Date().toISOString(),
                };
                io.to(userInfo.roomId).emit('chat:message', chatMessage);
            }
        });

        // ── Quality Metrics ──
        socket.on('quality:report', (metrics) => {
            const userInfo = connectedUsers.get(socket.id);
            if (userInfo?.roomId) {
                socket.to(userInfo.roomId).emit('quality:peer-report', {
                    socketId: socket.id,
                    metrics,
                });
            }
        });

        // ── Leave Room ──
        socket.on('room:leave', () => {
            leaveCurrentRoom(socket, io);
        });

        // ── Disconnect ──
        socket.on('disconnect', (reason) => {
            console.log(`[Vossle] User disconnected: ${socket.userName} (${reason})`);
            leaveCurrentRoom(socket, io);
            connectedUsers.delete(socket.id);
        });
    });

    return io;
};

/**
 * Remove user from their current room and notify peers
 */
function leaveCurrentRoom(socket, io) {
    const userInfo = connectedUsers.get(socket.id);
    if (!userInfo?.roomId) return;

    const roomId = userInfo.roomId;
    socket.leave(roomId);

    // Update room tracking
    const room = rooms.get(roomId);
    if (room) {
        room.delete(socket.id);
        if (room.size === 0) {
            rooms.delete(roomId);
        }
    }

    // Update user tracking
    userInfo.roomId = null;

    // Notify remaining users
    io.to(roomId).emit('room:user-left', {
        socketId: socket.id,
        userId: socket.userId,
        userName: socket.userName,
        memberCount: room?.size || 0,
    });

    console.log(`[Vossle] ${socket.userName} left room ${roomId}`);
}

module.exports = { initializeSocket };
