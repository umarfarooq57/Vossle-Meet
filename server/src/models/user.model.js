/**
 * Vossle — In-Memory User Store
 * 
 * Production: Replace with PostgreSQL/MongoDB via an ORM (Prisma/Sequelize).
 * This in-memory store is for MVP rapid development.
 */

const { v4: uuidv4 } = require('uuid');

const users = new Map();

const UserStore = {
    /**
     * Create a new user
     */
    create({ name, email, passwordHash }) {
        const id = uuidv4();
        const user = {
            id,
            name,
            email: email.toLowerCase(),
            passwordHash,
            avatar: null,
            role: 'user',
            createdAt: new Date().toISOString(),
            lastLoginAt: null,
        };
        users.set(id, user);
        return this.sanitize(user);
    },

    /**
     * Find user by email
     */
    findByEmail(email) {
        for (const user of users.values()) {
            if (user.email === email.toLowerCase()) return user;
        }
        return null;
    },

    /**
     * Find user by ID
     */
    findById(id) {
        return users.get(id) || null;
    },

    /**
     * Update last login timestamp
     */
    updateLastLogin(id) {
        const user = users.get(id);
        if (user) {
            user.lastLoginAt = new Date().toISOString();
            users.set(id, user);
        }
    },

    /**
     * Remove sensitive fields before sending to client
     */
    sanitize(user) {
        if (!user) return null;
        const { passwordHash, ...safe } = user;
        return safe;
    },

    /**
     * Get total user count
     */
    count() {
        return users.size;
    },
};

module.exports = UserStore;
