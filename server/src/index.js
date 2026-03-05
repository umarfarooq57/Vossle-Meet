require('dotenv').config();

const app = require('./app');
const http = require('http');
const { initializeSocket } = require('./services/socket.service');
const prisma = require('./config/prisma.client');

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Railway requires binding to all interfaces

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO signaling
initializeSocket(server);

// Test database connection (non-blocking)
prisma.$connect()
    .then(() => {
        console.log('✅ Database connected successfully');
    })
    .catch((err) => {
        console.error('⚠️  Database connection failed:', err.message);
        console.error('   Server will continue but database operations may fail');
    });

// Start server
server.listen(PORT, HOST, () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║                                          ║
  ║   🚀 VOSSLE Signaling Server             ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}            ║
  ║   Host: ${HOST}                         ║
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
