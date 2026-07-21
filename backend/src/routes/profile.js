import express from 'express';
import prisma from '../prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get achievements list with status (locked/unlocked) for the user
router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all achievements
    const allAchievements = await prisma.achievement.findMany();

    // Fetch user's unlocked achievements
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId }
    });

    const unlockedSet = new Set(userAchievements.map(ua => ua.achievementId));

    const result = allAchievements.map(ach => ({
      ...ach,
      unlocked: unlockedSet.has(ach.id),
      unlockedAt: userAchievements.find(ua => ua.achievementId === ach.id)?.unlockedAt || null
    }));

    res.json(result);
  } catch (error) {
    console.error('Fetch achievements error:', error);
    res.status(500).json({ error: 'Server error fetching achievements' });
  }
});

// Update profile lastActive and streak manual update (usually triggered on daily task complete)
router.post('/streak', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now = new Date();
    const lastActive = new Date(user.lastActive);
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const lastActiveDate = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());

    let streak = user.streak;
    let streakUpdated = false;

    if (lastActiveDate.getTime() === yesterday.getTime()) {
      streak += 1;
      streakUpdated = true;
    } else if (lastActiveDate.getTime() !== today.getTime()) {
      streak = 1;
      streakUpdated = true;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        lastActive: now,
        streak
      },
      select: {
        id: true,
        streak: true,
        lastActive: true
      }
    });

    // Check if the user unlocked streak achievement (spec_5: 7 days streak)
    let unlockedAchievement = null;
    if (updatedUser.streak >= 7) {
      const achievementId = 'spec_5';
      const existingUnlock = await prisma.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId
          }
        }
      });

      if (!existingUnlock) {
        const ach = await prisma.achievement.findUnique({ where: { id: achievementId } });
        if (ach) {
          await prisma.userAchievement.create({
            data: {
              userId,
              achievementId
            }
          });
          // Award rewards
          await prisma.user.update({
            where: { id: userId },
            data: {
              xp: { increment: ach.xpReward },
              coins: { increment: 50 } // extra bonus
            }
          });
          unlockedAchievement = ach;
        }
      }
    }

    res.json({
      streak: updatedUser.streak,
      lastActive: updatedUser.lastActive,
      streakUpdated,
      unlockedAchievement
    });
  } catch (error) {
    console.error('Streak update error:', error);
    res.status(500).json({ error: 'Server error updating streak' });
  }
});

// Get user weekly analytics (correct vs incorrect answers in the last 7 days, by category)
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const progress = await prisma.userProgress.findMany({
      where: {
        userId,
        completedAt: {
          gte: sevenDaysAgo
        }
      },
      select: {
        isCorrect: true,
        completedAt: true,
        score: true,
        question: {
          select: { category: true }
        }
      }
    });

    const correctCount = progress.filter(p => p.isCorrect).length;
    const incorrectCount = progress.filter(p => !p.isCorrect).length;
    const totalCount = progress.length;
    const totalScore = progress.reduce((sum, p) => sum + (p.score || 0), 0);

    // Per-category breakdown
    const categories = ['Reading', 'Listening', 'Writing', 'Speaking'];
    const byCategory = {};
    for (const cat of categories) {
      const catProgress = progress.filter(p => p.question?.category === cat);
      byCategory[cat] = {
        total: catProgress.length,
        correct: catProgress.filter(p => p.isCorrect).length,
        incorrect: catProgress.filter(p => !p.isCorrect).length,
      };
    }

    // Daily breakdown for the last 7 days
    const daily = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayLabel = d.toLocaleDateString('en', { weekday: 'short' });
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const dayProgress = progress.filter(p => {
        const t = new Date(p.completedAt).getTime();
        return t >= dayStart.getTime() && t < dayEnd.getTime();
      });
      daily.push({
        day: dayLabel,
        total: dayProgress.length,
        correct: dayProgress.filter(p => p.isCorrect).length,
      });
    }

    res.json({
      correct: correctCount,
      incorrect: incorrectCount,
      total: totalCount,
      totalScore,
      accuracy: totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0,
      byCategory,
      daily
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ error: 'Server error fetching analytics' });
  }
});

// Reward user with XP and coins (e.g. from vocab builder)
router.post('/reward', authenticateToken, async (req, res) => {
  const { xp = 0, coins = 0 } = req.body;
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    const newXP = user.xp + xp;
    const newLevel = Math.floor(newXP / 500) + 1;
    
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        xp: { increment: xp },
        coins: { increment: coins },
        level: newLevel
      }
    });

    res.json({
      success: true,
      newXP: updated.xp,
      newCoins: updated.coins,
      newLevel: updated.level
    });
  } catch (error) {
    console.error('Reward error:', error);
    res.status(500).json({ error: 'Failed to add reward' });
  }
});

export default router;
