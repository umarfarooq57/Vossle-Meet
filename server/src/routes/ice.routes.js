/**
 * Vossle — ICE Configuration Route
 * Returns TURN/STUN server config to authenticated clients.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getIceServers } = require('../config/ice.config');

/**
 * GET /api/ice/servers — Get ICE server configuration
 * Protected: only authenticated users can get TURN credentials
 */
router.get('/servers', protect, (req, res) => {
    const iceServers = getIceServers();
    res.status(200).json({
        iceServers,
        iceTransportPolicy: 'all', // 'all' = prefer P2P, 'relay' = force TURN
    });
});

module.exports = router;
