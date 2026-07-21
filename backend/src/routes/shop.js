import express from 'express';
import prisma from '../prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get shop items with purchase status for the user
router.get('/items', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const allItems = await prisma.shopItem.findMany();
    const userPurchases = await prisma.userShopItem.findMany({
      where: { userId }
    });

    const purchasedIds = new Set(userPurchases.map(up => up.shopItemId));

    const result = allItems.map(item => ({
      ...item,
      purchased: purchasedIds.has(item.id)
    }));

    res.json(result);
  } catch (error) {
    console.error('Fetch shop items error:', error);
    res.status(500).json({ error: 'Server error fetching shop items' });
  }
});

// Purchase a shop item
router.post('/purchase/:id', authenticateToken, async (req, res) => {
  const shopItemId = req.params.id;
  const userId = req.user.id;

  try {
    // 1. Fetch Item
    const item = await prisma.shopItem.findUnique({
      where: { id: shopItemId }
    });

    if (!item) {
      return res.status(404).json({ error: 'Shop item not found' });
    }

    // 2. Check if already purchased
    const existingPurchase = await prisma.userShopItem.findUnique({
      where: {
        userId_shopItemId: {
          userId,
          shopItemId
        }
      }
    });

    if (existingPurchase) {
      return res.status(400).json({ error: 'Item already purchased' });
    }

    // 3. Fetch User
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 4. Validate Coin Balance
    if (user.coins < item.price) {
      return res.status(400).json({ error: 'Insufficient coins balance' });
    }

    // 5. Deduct Coins & Record Purchase
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { coins: { decrement: item.price } }
      }),
      prisma.userShopItem.create({
        data: {
          userId,
          shopItemId
        }
      })
    ]);

    // 6. Check for "First Purchase" achievement (spec_1)
    let unlockedAchievement = null;
    const existingUnlock = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: 'spec_1'
        }
      }
    });

    if (!existingUnlock) {
      const ach = await prisma.achievement.findUnique({ where: { id: 'spec_1' } });
      if (ach) {
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: 'spec_1'
          }
        });
        // Award XP bonus
        await prisma.user.update({
          where: { id: userId },
          data: { xp: { increment: ach.xpReward } }
        });
        unlockedAchievement = ach;
      }
    }

    res.json({
      success: true,
      newCoins: user.coins - item.price,
      purchasedItemId: shopItemId,
      unlockedAchievement
    });

  } catch (error) {
    console.error('Purchase shop item error:', error);
    res.status(500).json({ error: 'Server error during purchase' });
  }
});

export default router;
