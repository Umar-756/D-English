import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import questionRoutes from './routes/questions.js';
import shopRoutes from './routes/shop.js';
import leaderboardRoutes from './routes/leaderboard.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`D English Backend server running on port ${PORT}`);
});
