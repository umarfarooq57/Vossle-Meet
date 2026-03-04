/**
 * Vossle — JWT Authentication Configuration
 */

module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'vossle_default_secret',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'vossle_default_refresh_secret',
    jwtExpire: process.env.JWT_EXPIRE || '15m',
    jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
    cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
};
