/**
 * Vossle — API Service
 * Centralized HTTP client for all API calls.
 */

const API_BASE = process.env.REACT_APP_API_URL || 'https://vossle-server-production.up.railway.app/api';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('vossle_token') || null;
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('vossle_token', token);
        } else {
            localStorage.removeItem('vossle_token');
        }
    }

    getToken() {
        return this.token;
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(this.token && { Authorization: `Bearer ${this.token}` }),
            ...options.headers,
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                credentials: 'include',
            });

            const data = await response.json();

            if (!response.ok) {
                // Attempt token refresh on 401
                if (response.status === 401 && endpoint !== '/auth/refresh') {
                    const refreshed = await this.refreshToken();
                    if (refreshed) {
                        // Retry original request
                        headers.Authorization = `Bearer ${this.token}`;
                        const retryResponse = await fetch(url, { ...options, headers, credentials: 'include' });
                        return retryResponse.json();
                    }
                }
                throw new Error(data.error || data.errors?.[0] || 'Request failed');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    async refreshToken() {
        try {
            const data = await this.request('/auth/refresh', { method: 'POST' });
            if (data.accessToken) {
                this.setToken(data.accessToken);
                return true;
            }
            return false;
        } catch {
            this.setToken(null);
            return false;
        }
    }

    // ── Auth ──
    async register(name, email, password) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
        });
        if (data.accessToken) this.setToken(data.accessToken);
        return data;
    }

    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (data.accessToken) this.setToken(data.accessToken);
        return data;
    }

    async logout() {
        await this.request('/auth/logout', { method: 'POST' });
        this.setToken(null);
    }

    async getProfile() {
        return this.request('/auth/me');
    }

    // ── Sessions ──
    async createSession(title) {
        return this.request('/sessions', {
            method: 'POST',
            body: JSON.stringify({ title }),
        });
    }

    async getSession(id) {
        return this.request(`/sessions/${id}`);
    }

    async getSessionByRoom(roomCode) {
        return this.request(`/sessions/room/${roomCode}`);
    }

    async joinSession(id) {
        return this.request(`/sessions/${id}/join`, { method: 'POST' });
    }

    async endSession(id) {
        return this.request(`/sessions/${id}/end`, { method: 'POST' });
    }

    async listSessions() {
        return this.request('/sessions');
    }

    // ── ICE Servers ──
    async getIceServers() {
        return this.request('/ice/servers');
    }
}

const api = new ApiService();
export default api;
