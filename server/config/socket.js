const { Server } = require('socket.io');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join rooms for targeted updates
    socket.on('join:dashboard', () => {
      socket.join('dashboard');
      console.log(`📊 ${socket.id} joined dashboard room`);
    });

    socket.on('join:appointments', () => {
      socket.join('appointments');
      console.log(`📅 ${socket.id} joined appointments room`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
    });
  });

  console.log('✅ Socket.IO initialized');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocket first.');
  }
  return io;
};

module.exports = { initSocket, getIO };
