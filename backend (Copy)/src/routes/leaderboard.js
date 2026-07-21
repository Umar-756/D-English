import express from 'express';
import prisma from '../prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get top 20 users by XP (Leaderboard) with time filtering
router.get('/', authenticateToken, async (req, res) => {
  const filter = req.query.filter || 'all';
  try {
    if (filter === 'weekly' || filter === 'monthly') {
      const days = filter === 'weekly' ? 7 : 30;
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - days);

      // Group user progress in the specified time frame by userId and sum their score
      const aggregations = await prisma.userProgress.groupBy({
        by: ['userId'],
        where: {
          completedAt: {
            gte: thresholdDate
          }
        },
        _sum: {
          score: true
        },
        orderBy: {
          _sum: {
            score: 'desc'
          }
        },
        take: 20
      });

      const userIds = aggregations.map(a => a.userId);
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: userIds
          }
        },
        select: {
          id: true,
          username: true,
          coins: true,
          level: true,
          streak: true
        }
      });

      // Map the sum back to the user object, preserving order from the aggregations query
      let result = aggregations.map(agg => {
        const user = users.find(u => u.id === agg.userId);
        return {
          ...user,
          xp: agg._sum.score || 0
        };
      }).filter(item => item.id !== undefined); // filter out any null entries

      // If we have fewer than 20 users, pad the leaderboard with other registered users
      if (result.length < 20) {
        const existingIds = new Set(userIds);
        const extraUsers = await prisma.user.findMany({
          where: {
            id: {
              notIn: Array.from(existingIds)
            }
          },
          take: 20 - result.length,
          orderBy: { xp: 'desc' },
          select: {
            id: true,
            username: true,
            coins: true,
            level: true,
            streak: true
          }
        });

        extraUsers.forEach(u => {
          result.push({
            ...u,
            xp: 0 // No XP earned during this period
          });
        });
      }

      res.json(result);
    } else {
      // Default: All-time leaderboard based on cumulative User XP
      const topUsers = await prisma.user.findMany({
        take: 20,
        orderBy: { xp: 'desc' },
        select: {
          id: true,
          username: true,
          xp: true,
          coins: true,
          level: true,
          streak: true
        }
      });
      res.json(topUsers);
    }
  } catch (error) {
    console.error('Fetch leaderboard error:', error);
    res.status(500).json({ error: 'Server error fetching leaderboard rankings' });
  }
});

export default router;
