require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');
const groupRoutes = require('./routes/groups');

const app = express();
const PORT = process.env.PORT || 5000;
app.set('trust proxy', true);



// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

// Middleware
app.use(limiter);
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://piccsync.work',
      'https://www.piccsync.work', 
      'http://localhost:5173',
      process.env.CORS_ORIGIN
    ].filter(Boolean);
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/groups', groupRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test endpoint for frontend
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});