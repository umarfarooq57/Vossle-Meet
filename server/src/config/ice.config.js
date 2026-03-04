/**
 * Vossle — ICE Server Configuration
 * Provides STUN/TURN server config for WebRTC peer connections.
 */

const getIceServers = () => {
    const servers = [
        // Public STUN servers
        { urls: process.env.STUN_URL || 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ];

    // Add TURN server if configured
    if (process.env.TURN_URL) {
        servers.push({
            urls: process.env.TURN_URL,
            username: process.env.TURN_USERNAME,
            credential: process.env.TURN_CREDENTIAL,
        });

        // TURN over TLS on port 443 (firewall traversal)
        if (process.env.TURN_TLS_URL) {
            servers.push({
                urls: process.env.TURN_TLS_URL,
                username: process.env.TURN_USERNAME,
                credential: process.env.TURN_CREDENTIAL,
            });
        }
    }

    return servers;
};

module.exports = { getIceServers };
