require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/database');
const { authenticateSocket, handleConnection } = require('./socket/socketHandlers');

// Import routes
const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const messageRoutes = require('./routes/messages');
const headingRoutes = require('./routes/headings');
const orderRoutes = require('./routes/orders');
const priceRoutes = require('./routes/prices'); // New
const receiptRoutes = require('./routes/receipts'); // New
const settlementRoutes = require('./routes/settlements');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? 
      process.env.CLIENT_URL : "http://localhost:5174",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 
    process.env.CLIENT_URL : "http://localhost:5174",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add io to req object for controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/groups', messageRoutes);
app.use('/api/groups', headingRoutes);
app.use('/api/headings', orderRoutes);
app.use('/api/items', priceRoutes); // New
app.use('/api/headings', receiptRoutes); // New
app.use('/api/receipts', receiptRoutes); // New
app.use('/api/headings', settlementRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'TalkWallet API is running' });
});

// Socket.IO
io.use(authenticateSocket);
io.on('connection', (socket) => handleConnection(io, socket));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };
