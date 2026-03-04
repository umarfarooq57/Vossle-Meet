/**
 * Vossle — Socket.IO Service
 * Manages real-time signaling connection.
 */

import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
        this._connectPromise = null;
    }

    /**
     * Connect to signaling server with auth token.
     * Returns a Promise that resolves when socket is connected.
     */
    connect(token) {
        if (this.socket?.connected) return Promise.resolve(this.socket);

        // If already connecting, return the existing promise
        if (this._connectPromise) return this._connectPromise;

        this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
        });

        this._connectPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Socket connection timed out'));
            }, 15000);

            this.socket.on('connect', () => {
                clearTimeout(timeout);
                console.log('[Vossle Socket] Connected:', this.socket.id);
                this._connectPromise = null;
                resolve(this.socket);
            });

            this.socket.on('connect_error', (error) => {
                clearTimeout(timeout);
                console.error('[Vossle Socket] Connection error:', error.message);
                this._connectPromise = null;
                reject(error);
            });
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[Vossle Socket] Disconnected:', reason);
            this._connectPromise = null;
        });

        return this._connectPromise;
    }

    /**
     * Disconnect from signaling server
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    /**
     * Get the socket instance
     */
    getSocket() {
        return this.socket;
    }

    /**
     * Emit event to server
     */
    emit(event, data) {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        }
    }

    /**
     * Listen for event from server
     */
    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    /**
     * Remove event listener
     */
    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }
}

const socketService = new SocketService();
export default socketService;
