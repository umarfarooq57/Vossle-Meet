/**
 * Vossle — ICE Server Configuration
 * Provides STUN/TURN server config for WebRTC peer connections.
 */

const getIceServers = () => {
    const servers = [
        // Public STUN servers (multiple for redundancy)
        { urls: process.env.STUN_URL || 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
    ];

    if (process.env.TURN_URL) {
        // Use configured TURN server (production)
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
    } else {
        // Free public TURN servers (Open Relay Project by Metered)
        // These are free and suitable for development/testing/small apps
        servers.push(
            {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject',
            },
            {
                urls: 'turn:openrelay.metered.ca:443',
                username: 'openrelayproject',
                credential: 'openrelayproject',
            },
            {
                urls: 'turn:openrelay.metered.ca:443?transport=tcp',
                username: 'openrelayproject',
                credential: 'openrelayproject',
            },
        );
    }

    return servers;
};

module.exports = { getIceServers };
