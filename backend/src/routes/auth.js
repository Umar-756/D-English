import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password are required' });
  }

  try {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          { email: email.toLowerCase() }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash,
        xp: 0,
        coins: 100,
        level: 1,
        streak: 0,
        lastActive: new Date()
      }
    });

    // Sign JWT
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username },
      process.env.JWT_SECRET || 'd_english_platform_secret_token_123!',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        xp: newUser.xp,
        coins: newUser.coins,
        level: newUser.level,
        streak: newUser.streak
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail.toLowerCase() },
          { email: usernameOrEmail.toLowerCase() }
        ]
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    // Update streak / last active when user logs in
    let streak = user.streak;
    const now = new Date();
    const lastActive = new Date(user.lastActive);
    
    // Reset hours to compare dates
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const lastActiveDate = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());

    if (lastActiveDate.getTime() === yesterday.getTime()) {
      streak += 1;
    } else if (lastActiveDate.getTime() !== today.getTime()) {
      streak = 1; // start new streak
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        streak,
        lastActive: now
      }
    });

    // Sign JWT
    const token = jwt.sign(
      { id: updatedUser.id, username: updatedUser.username },
      process.env.JWT_SECRET || 'd_english_platform_secret_token_123!',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        xp: updatedUser.xp,
        coins: updatedUser.coins,
        level: updatedUser.level,
        streak: updatedUser.streak
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user (Auth check)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        xp: true,
        coins: true,
        level: true,
        streak: true,
        avatar: true,
        lastActive: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Fetch me error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

// Update avatar
router.patch('/avatar', authenticateToken, async (req, res) => {
  const { avatar } = req.body;
  if (!avatar) return res.status(400).json({ error: 'Avatar required' });
  const allowed = ['avatar_1','avatar_2','avatar_3','avatar_4','avatar_5','avatar_6','avatar_7','avatar_8','avatar_9','avatar_10','avatar_11','avatar_12'];
  if (!allowed.includes(avatar)) return res.status(400).json({ error: 'Invalid avatar' });
  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatar },
      select: { id: true, avatar: true }
    });
    res.json({ success: true, avatar: updated.avatar });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update avatar' });
  }
});

export default router;
