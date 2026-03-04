require('dotenv').config();

const app = require('./app');
const http = require('http');
const { initializeSocket } = require('./services/socket.service');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO signaling
initializeSocket(server);

// Start server
server.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║                                          ║
  ║   🚀 VOSSLE Signaling Server             ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}            ║
  ║   Port: ${PORT}                              ║
  ║   Ready for connections                  ║
  ║                                          ║
  ╚══════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err.message);
    server.close(() => process.exit(1));
});
