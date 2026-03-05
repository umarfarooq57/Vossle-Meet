/**
 * Vossle — Socket.IO Service
 * Manages real-time signaling connection.
 */

import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
    constructor() {
        this.socket = null;
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

        // Disconnect any stale socket first
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }

        console.log('[Vossle Socket] Connecting to', SOCKET_URL);

        this.socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 15,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            timeout: 20000,
            forceNew: true,
        });

        this._connectPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this._connectPromise = null;
                reject(new Error('Socket connection timed out'));
            }, 20000);

            this.socket.on('connect', () => {
                clearTimeout(timeout);
                console.log('[Vossle Socket] Connected:', this.socket.id);
                this._connectPromise = null;
                resolve(this.socket);
            });

            this.socket.on('connect_error', (error) => {
                console.error('[Vossle Socket] Connection error:', error.message);
                // Don't reject on first error — socket.io will retry
                // Only reject if this is the initial connection attempt
                if (this._connectPromise) {
                    clearTimeout(timeout);
                    this._connectPromise = null;
                    reject(error);
                }
            });
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[Vossle Socket] Disconnected:', reason);
            this._connectPromise = null;
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('[Vossle Socket] Reconnected after', attemptNumber, 'attempts');
        });

        this.socket.on('reconnect_failed', () => {
            console.error('[Vossle Socket] Reconnection failed after all attempts');
        });

        return this._connectPromise;
    }

    /**
     * Disconnect from signaling server
     */
    disconnect() {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
            this._connectPromise = null;
        }
    }

    /**
     * Get the socket instance
     */
    getSocket() {
        return this.socket;
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.socket?.connected === true;
    }

    /**
     * Emit event to server
     */
    emit(event, data) {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        } else {
            console.warn('[Vossle Socket] Cannot emit', event, '— not connected');
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
