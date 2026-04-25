import http from 'http';
import { Server } from 'socket.io';
import app from './src/app.js';
import { setupSocket } from './src/socket/socketHandler.js';

const PORT = process.env.PORT || 5000;

// Create HTTP server using Express app
const server = http.createServer(app);

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
  },
});

// Setup socket event handling
setupSocket(io);

// Make io accessible in routes/controllers
app.set('io', io);

// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));