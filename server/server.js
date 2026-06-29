const http = require('http');
const app = require('./app');
const { testConnection } = require('./config/db');
const { initSocket } = require('./config/socket');
const { verifyTransporter } = require('./config/mailer');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

const startServer = async () => {
  // Test database connection
  await testConnection();

  // Verify email transport (non-blocking)
  verifyTransporter();

  server.listen(PORT, () => {
    console.log(`\n🦷 Denti-Choice Server`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Port: ${PORT}`);
    console.log(`   API: http://localhost:${PORT}/api`);
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
  });
};

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
