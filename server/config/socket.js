const { Server } = require('socket.io');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (() => {
        if (!process.env.CLIENT_URL) return 'http://localhost:5173';
        return process.env.CLIENT_URL.includes(',')
          ? process.env.CLIENT_URL.split(',').map(url => url.trim())
          : process.env.CLIENT_URL;
      })(),
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
