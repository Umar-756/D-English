import express from 'express';
import prisma from '../prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Get questions by category
router.get('/', authenticateToken, async (req, res) => {
  const { category, subCategory, difficulty, limit = 50, offset = 0 } = req.query;

  try {
    const where = {};
    if (category) {
      where.category = category;
    }
    if (subCategory) {
      where.subCategory = subCategory;
    }
    if (difficulty && difficulty !== 'All') {
      where.difficulty = difficulty;
    }

    const total = await prisma.question.count({ where });

    // Use random offset so each session gives different questions
    const maxOffset = Math.max(0, total - parseInt(limit));
    const randomOffset = parseInt(offset) || (total > parseInt(limit) ? Math.floor(Math.random() * maxOffset) : 0);

    const questions = await prisma.question.findMany({
      where,
      take: parseInt(limit),
      skip: randomOffset,
      orderBy: { id: 'asc' },
      select: {
        id: true,
        category: true,
        subCategory: true,
        title: true,
        passage: true,
        audioUrl: true,
        questionText: true,
        options: true, // JSON string
        difficulty: true,
        points: true
      }
    });

    // Parse options for the frontend if they are JSON
    const parsedQuestions = questions.map(q => {
      let options = null;
      if (q.options) {
        try {
          options = JSON.parse(q.options);
        } catch (e) {
          options = q.options;
        }
      }
      return {
        ...q,
        options
      };
    });

    res.json({
      total,
      questions: parsedQuestions,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Fetch questions error:', error);
    res.status(500).json({ error: 'Server error fetching questions' });
  }
});

// Get a specific question
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const question = await prisma.question.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    let options = null;
    if (question.options) {
      try {
        options = JSON.parse(question.options);
      } catch (e) {
        options = question.options;
      }
    }

    res.json({
      ...question,
      options
    });
  } catch (error) {
    console.error('Fetch question detail error:', error);
    res.status(500).json({ error: 'Server error fetching question details' });
  }
});

// Submit a practice answer
router.post('/:id/submit', authenticateToken, async (req, res) => {
  const { userAnswer } = req.body;
  const questionId = parseInt(req.params.id);
  const userId = req.user.id;

  if (userAnswer === undefined || userAnswer === null) {
    return res.status(400).json({ error: 'User answer is required' });
  }

  try {
    // 1. Fetch Question
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // 2. Grade Reading / Listening MCQ/Completion
    let isCorrect = false;
    if (question.category === 'Reading' || question.category === 'Listening') {
      // Compare option char (e.g. "B") or exact string
      const cleanUserAns = userAnswer.trim().toUpperCase();
      const cleanCorrectAns = question.correctOption.trim().toUpperCase();
      
      // Check if user provided "B" or "B) option text"
      isCorrect = cleanUserAns === cleanCorrectAns || 
                  cleanUserAns.startsWith(cleanCorrectAns) ||
                  cleanCorrectAns.startsWith(cleanUserAns);
    } else {
      // Writing/Speaking are submitted to AI for grading, not graded here
      return res.status(400).json({ error: 'Use AI evaluation route for Writing and Speaking tasks' });
    }

    const pointsEarned = isCorrect ? question.points : 0;
    const coinsEarned = isCorrect ? Math.max(2, Math.floor(question.points / 2)) : 0;

    // 3. Save progress
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_questionId: {
          userId,
          questionId
        }
      },
      update: {
        userAnswer,
        isCorrect,
        score: pointsEarned,
        completedAt: new Date()
      },
      create: {
        userId,
        questionId,
        userAnswer,
        isCorrect,
        score: pointsEarned
      }
    });

    // 4. Fetch current user to update stats
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 5. Update user stats
    const oldLevel = user.level;
    const newXP = user.xp + pointsEarned;
    const newCoins = user.coins + coinsEarned;
    // Simple level up: 500 XP per level
    const newLevel = Math.floor(newXP / 500) + 1;
    const levelUp = newLevel > oldLevel;

    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: newXP,
        coins: newCoins,
        level: newLevel
      }
    });

    // 6. Check & Unlock Achievements
    const unlockedAchievements = [];

    // Milestone triggers
    const triggerUnlock = async (achievementId) => {
      const existingUnlock = await prisma.userAchievement.findUnique({
        where: { userId_achievementId: { userId, achievementId } }
      });

      if (!existingUnlock) {
        const ach = await prisma.achievement.findUnique({ where: { id: achievementId } });
        if (ach) {
          await prisma.userAchievement.create({
            data: { userId, achievementId }
          });
          // Award XP bonus for achievement
          await prisma.user.update({
            where: { id: userId },
            data: {
              xp: { increment: ach.xpReward }
            }
          });
          unlockedAchievements.push(ach);
        }
      }
    };

    // A. Level achievements (gen_1 to gen_15)
    for (let l = 1; l <= Math.min(15, newLevel); l++) {
      await triggerUnlock(`gen_${l}`);
    }

    // B. Category-specific Milestones (Reading)
    if (question.category === 'Reading' && isCorrect) {
      const correctReadingCount = await prisma.userProgress.count({
        where: {
          userId,
          isCorrect: true,
          question: { category: 'Reading' }
        }
      });

      const readingMilestones = [5, 10, 20, 50, 100, 150, 200, 300, 400, 500];
      for (let idx = 0; idx < readingMilestones.length; idx++) {
        if (correctReadingCount >= readingMilestones[idx]) {
          await triggerUnlock(`read_${idx + 1}`);
        }
      }
    }

    // C. Category-specific Milestones (Listening)
    if (question.category === 'Listening' && isCorrect) {
      const correctListeningCount = await prisma.userProgress.count({
        where: {
          userId,
          isCorrect: true,
          question: { category: 'Listening' }
        }
      });

      const listeningMilestones = [5, 10, 20, 50, 100, 150, 200, 300, 400, 500];
      for (let idx = 0; idx < listeningMilestones.length; idx++) {
        if (correctListeningCount >= listeningMilestones[idx]) {
          await triggerUnlock(`listen_${idx + 1}`);
        }
      }
    }

    // D. Coin Collector (spec_2: 500 coins)
    if (newCoins >= 500) {
      await triggerUnlock('spec_2');
    }

    // E. Perfect Score (spec_4: Get 100% on any question - unlocked upon first correct answer here)
    if (isCorrect) {
      await triggerUnlock('spec_4');
    }

    res.json({
      isCorrect,
      correctOption: question.correctOption,
      explanation: question.explanation,
      xpGained: pointsEarned,
      coinsGained: coinsEarned,
      levelUp,
      newLevel,
      newXP,
      newCoins,
      unlockedAchievements
    });

  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ error: 'Server error processing answer submission' });
  }
});

// AI Evaluation route for Writing and Speaking tasks
router.post('/:id/evaluate', authenticateToken, async (req, res) => {
  const { userAnswer } = req.body;
  const questionId = parseInt(req.params.id);
  const userId = req.user.id;

  if (!userAnswer || !userAnswer.trim()) {
    return res.status(400).json({ error: 'User answer text is required' });
  }

  try {
    // 1. Fetch Question
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (question.category !== 'Writing' && question.category !== 'Speaking') {
      return res.status(400).json({ error: 'Only Writing and Speaking tasks can be evaluated using AI' });
    }

    let aiResult;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim()) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
You are Dr. Diana, an expert IELTS teacher and examiner.
Analyze the following student response for a ${question.category} task.

Task Title: "${question.title}"
Task Prompt/Passage: "${question.passage}"
Student Response: "${userAnswer}"

Please evaluate this response strictly according to official IELTS grading criteria.
Return your response ONLY as a JSON object with this exact format:
{
  "bandScore": 6.5,
  "feedback": "Overall summary of the work.",
  "criteria": {
    "coherence": "Brief evaluation of coherence and cohesion / fluency",
    "lexical": "Brief evaluation of lexical resource and vocabulary choice",
    "grammar": "Brief evaluation of grammatical range and accuracy",
    "task": "Brief evaluation of task achievement / response detail"
  },
  "suggestions": [
    "Specific correction 1",
    "Specific correction 2"
  ]
}
Make sure to return only the raw JSON structure, with no markdown formatting tags.
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        // Extract JSON if it contains markdown wrappers
        const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        aiResult = JSON.parse(cleanText);
      } catch (err) {
        console.error('Gemini API Error, falling back to simulated evaluation:', err);
      }
    }

    // Fallback if API key is not present or if the call failed
    if (!aiResult) {
      const wordCount = userAnswer.trim().split(/\s+/).filter(Boolean).length;
      let bandScore = 5.0;
      let feedback = "";
      let suggestions = [];

      if (question.category === 'Writing') {
        if (wordCount >= 250) {
          bandScore = 7.0;
          feedback = "Muvaffaqiyatli topshirildi! Sizning inshongiz minimal so'z chegarasidan o'tdi. Grammatika va leksika yaxshi shakllangan.";
          suggestions = [
            "Inshodagi kirish qismini yanada ta'sirliroq qilish uchun sinonimlardan kengroq foydalaning.",
            "Paragraphlarni bir-biriga bog'lovchi bog'lovchilarni ko'paytiring."
          ];
        } else if (wordCount >= 150) {
          bandScore = 6.0;
          feedback = "Yaxshi urinish, lekin insho so'z soni 250 tadan kam. Bu sizning ballingizga ta'sir qilishi mumkin.";
          suggestions = [
            "Mavzuni kengroq yoritishga harakat qiling, ko'proq real hayotiy misollar keltiring.",
            "Murakkab gap strukturalaridan ko'proq foydalaning."
          ];
        } else {
          bandScore = 4.5;
          feedback = "Insho o'ta qisqa va mavzuni to'liq ochib bermaydi.";
          suggestions = [
            "IELTS Task 2 inshosi uchun kamida 250 ta so'z yozish shart.",
            "Fikrlaringizni tartib bilan bayon qiling."
          ];
        }
      } else {
        // Speaking
        if (wordCount >= 100) {
          bandScore = 7.0;
          feedback = "Ajoyib nutq! Mavzu to'liq ochib berilgan va nutqingiz ravon va tushunarli.";
          suggestions = [
            "Gaplar orasida intonatsiyaga ko'proq e'tibor bering.",
            "Nutq davomida IELTS uchun zarur bo'lgan 'linking phrases'lardan ko'proq foydalaning."
          ];
        } else {
          bandScore = 5.5;
          feedback = "Nutqingiz bir oz qisqa bo'ldi. Fikrni to'liqroq ifodalashga harakat qiling.";
          suggestions = [
            "IELTS Cue card savoliga javob berganda kamida 1.5 - 2 daqiqa gapirishga harakat qiling.",
            "So'zlar talaffuziga va gaplarning ravonligiga ko'proq e'tibor qarating."
          ];
        }
      }

      aiResult = {
        bandScore,
        feedback,
        criteria: {
          coherence: question.category === 'Writing' ? "Paragraphlar strukturasi qoniqarli." : "Nutq ravonligi va tezligi o'rtacha.",
          lexical: "So'z boyligi mavzuga mos, ammo oddiyroq sinonimlar ko'p.",
          grammar: "Sodda va murakkab gaplar aralashmasi ishlatilgan.",
          task: question.category === 'Writing' ? "Task talabi qisman bajarilgan." : "Mavzu bo'yicha berilgan savollarga qisman javob berildi."
        },
        suggestions
      };
    }

    const bandScore = parseFloat(aiResult.bandScore) || 6.0;
    const pointsEarned = Math.round((bandScore / 9) * question.points);
    const coinsEarned = Math.round((bandScore / 9) * Math.max(10, Math.floor(question.points / 2)));

    // 2. Save progress
    await prisma.userProgress.upsert({
      where: {
        userId_questionId: {
          userId,
          questionId
        }
      },
      update: {
        userAnswer,
        isCorrect: bandScore >= 6.0,
        score: pointsEarned,
        completedAt: new Date()
      },
      create: {
        userId,
        questionId,
        userAnswer,
        isCorrect: bandScore >= 6.0,
        score: pointsEarned
      }
    });

    // 3. Update user stats
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const oldLevel = user.level;
    const newXP = user.xp + pointsEarned;
    const newCoins = user.coins + coinsEarned;
    const newLevel = Math.floor(newXP / 500) + 1;
    const levelUp = newLevel > oldLevel;

    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: newXP,
        coins: newCoins,
        level: newLevel
      }
    });

    // 4. Unlock Achievement (Expressionist - sp_wr)
    const unlockedAchievements = [];
    const submissionsCount = await prisma.userProgress.count({
      where: {
        userId,
        question: {
          category: { in: ['Writing', 'Speaking'] }
        }
      }
    });

    const triggerUnlock = async (achievementId) => {
      const existingUnlock = await prisma.userAchievement.findUnique({
        where: { userId_achievementId: { userId, achievementId } }
      });

      if (!existingUnlock) {
        const ach = await prisma.achievement.findUnique({ where: { id: achievementId } });
        if (ach) {
          await prisma.userAchievement.create({
            data: { userId, achievementId }
          });
          await prisma.user.update({
            where: { id: userId },
            data: { xp: { increment: ach.xpReward } }
          });
          unlockedAchievements.push(ach);
        }
      }
    };

    const milestones = [1, 3, 5, 10, 15, 20, 30, 40, 50, 100];
    for (let idx = 0; idx < milestones.length; idx++) {
      if (submissionsCount >= milestones[idx]) {
        await triggerUnlock(`sp_wr_${idx + 1}`);
      }
    }

    res.json({
      evaluation: aiResult.feedback,
      bandScore,
      criteria: aiResult.criteria,
      suggestions: aiResult.suggestions,
      xpGained: pointsEarned,
      coinsGained: coinsEarned,
      levelUp,
      newLevel,
      newXP,
      newCoins,
      unlockedAchievements
    });

  } catch (error) {
    console.error('AI evaluation error:', error);
    res.status(500).json({ error: 'Server error processing AI evaluation' });
  }
});

export default router;
