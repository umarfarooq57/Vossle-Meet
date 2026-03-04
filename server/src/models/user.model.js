/**
 * Vossle — User Store (Prisma/MongoDB)
 */

const prisma = require('../config/prisma.client');

const UserStore = {
    /**
     * Create a new user
     */
    async create({ name, email, passwordHash }) {
        const user = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                passwordHash,
                role: 'user',
            },
        });
        return this.sanitize(user);
    },

    /**
     * Find user by email
     */
    async findByEmail(email) {
        return prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
    },

    /**
     * Find user by ID
     */
    async findById(id) {
        return prisma.user.findUnique({
            where: { id },
        });
    },

    /**
     * Update last login timestamp
     */
    async updateLastLogin(id) {
        try {
            await prisma.user.update({
                where: { id },
                data: { lastLoginAt: new Date() },
            });
        } catch (error) {
            console.error('[UserStore] Error updating last login:', error.message);
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
    async count() {
        return prisma.user.count();
    },
};

module.exports = UserStore;
