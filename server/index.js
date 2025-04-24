const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store messages for each room
const roomMessages = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
    
    // Send existing room messages to the new user
    const messages = roomMessages.get(room) || [];
    if (messages.length > 0) {
      socket.emit('receive_message', ...messages);
    }
  });

  socket.on('send_message', (data) => {
    // Ensure timestamp exists
    if (!data.timestamp) {
      data.timestamp = Date.now();
    }
    
    console.log('Message received:', data);
    
    // Store message in room history
    if (!roomMessages.has(data.room)) {
      roomMessages.set(data.room, []);
    }
    roomMessages.get(data.room).push(data);
    
    // Limit stored messages to prevent memory issues
    if (roomMessages.get(data.room).length > 100) {
      roomMessages.get(data.room).shift();
    }
    
    // Broadcast message to room
    io.to(data.room).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Server running on port 3000');
});