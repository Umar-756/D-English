import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning existing database entries...');
  await prisma.userShopItem.deleteMany({});
  await prisma.userProgress.deleteMany({});
  await prisma.userAchievement.deleteMany({});
  await prisma.shopItem.deleteMany({});
  await prisma.achievement.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding Shop Items...');
  const shopItems = [
    { id: 'ielts_mock_pack', title: 'Premium IELTS Mock Pack', description: 'Unlock 5 complete IELTS simulation exams with grading keys.', price: 150, icon: 'BookOpen', category: 'Course' },
    { id: 'ai_writing_pro', title: 'AI Writing Critique Pro', description: 'Get 20 comprehensive essays reviewed by our expert AI Teacher.', price: 200, icon: 'FileText', category: 'Feature' },
    { id: 'ai_speaking_pro', title: 'AI Speaking Partner Live', description: 'Unlock unlimited real-time speech evaluation and suggestions.', price: 250, icon: 'Mic', category: 'Feature' },
    { id: 'theme_neon_aurora', title: 'Neon Aurora Theme', description: 'A sleek custom interface skin with floating animations and neon green glowing accents.', price: 80, icon: 'Sparkles', category: 'Skin' },
    { id: 'theme_gold_royale', title: 'Gold Royale Theme', description: 'The ultimate luxury theme featuring golden gradients and premium card borders.', price: 120, icon: 'Award', category: 'Skin' },
    { id: 'unlimited_hearts', title: 'Unlimited Hearts', description: 'Never run out of lives when practicing vocabulary drills.', price: 180, icon: 'Heart', category: 'Feature' },
  ];

  for (const item of shopItems) {
    await prisma.shopItem.create({ data: item });
  }

  console.log('Seeding Achievements (50+ Achievements)...');
  const achievements = [];
  
  // 1. General & Streak Achievements (15 items)
  for (let i = 1; i <= 15; i++) {
    achievements.push({
      id: `gen_${i}`,
      title: `English Explorer Level ${i}`,
      description: `Reach level ${i} by accumulating XP through tests and lessons.`,
      xpReward: i * 50,
      icon: 'Award',
      category: 'General'
    });
  }
  
  // 2. Reading Achievements (10 items)
  const readingMilestones = [5, 10, 20, 50, 100, 150, 200, 300, 400, 500];
  readingMilestones.forEach((count, idx) => {
    achievements.push({
      id: `read_${idx + 1}`,
      title: `Reading Sage ${idx + 1}`,
      description: `Correctly answer ${count} reading comprehension questions.`,
      xpReward: (idx + 1) * 60,
      icon: 'BookOpen',
      category: 'Reading'
    });
  });

  // 3. Listening Achievements (10 items)
  const listeningMilestones = [5, 10, 20, 50, 100, 150, 200, 300, 400, 500];
  listeningMilestones.forEach((count, idx) => {
    achievements.push({
      id: `listen_${idx + 1}`,
      title: `Acoustic Master ${idx + 1}`,
      description: `Complete ${count} listening audio comprehension drills.`,
      xpReward: (idx + 1) * 60,
      icon: 'Headphones',
      category: 'Listening'
    });
  });

  // 4. Writing & Speaking Achievements (10 items)
  const speakingWritingMilestones = [1, 3, 5, 10, 15, 20, 30, 40, 50, 100];
  speakingWritingMilestones.forEach((count, idx) => {
    achievements.push({
      id: `sp_wr_${idx + 1}`,
      title: `Expressionist Level ${idx + 1}`,
      description: `Submit ${count} essays or speaking cards to the AI Teacher.`,
      xpReward: (idx + 1) * 85,
      icon: 'MessageSquare',
      category: 'Expression'
    });
  });

  // 5. Special Shop & Social Achievements (5 items)
  const specials = [
    { id: 'spec_1', title: 'First Purchase', description: 'Unlock your first item from the Premium Shop using coins.', xpReward: 100, icon: 'ShoppingBag', category: 'Special' },
    { id: 'spec_2', title: 'Coin Collector', description: 'Save up 500 coins on your profile dashboard.', xpReward: 150, icon: 'Coins', category: 'Special' },
    { id: 'spec_3', title: 'Top Leaderboard', description: 'Reach the Top 3 on the global leaderboard rank list.', xpReward: 300, icon: 'TrendingUp', category: 'Special' },
    { id: 'spec_4', title: 'Perfect Score', description: 'Get a 100% score on any Reading or Listening mock exam.', xpReward: 200, icon: 'CheckCircle', category: 'Special' },
    { id: 'spec_5', title: 'Dedicated Learner', description: 'Maintain a study streak of 7 consecutive active days.', xpReward: 250, icon: 'Calendar', category: 'Special' },
  ];
  specials.forEach(s => achievements.push(s));

  for (const ach of achievements) {
    await prisma.achievement.create({ data: ach });
  }
  console.log(`Successfully seeded ${achievements.length} Achievements.`);

  console.log('Seeding Core IELTS Questions...');
  const coreQuestions = [
    {
      category: 'Reading',
      subCategory: 'Multiple Choice',
      title: 'The Rise of Automation in Modern Industry',
      passage: 'Automation is the technology by which a process or procedure is performed with minimal human assistance. Automated control is applied in various industries to run machinery and processes like manufacturing, chemical refining, and telecommunications. While automation increases efficiency and reduces human labor costs, it also raises concerns about job displacement and the need for workforce retraining. Economic analysts suggest that automation will create new opportunities in technology sectors, but lower-skilled workers will bear the brunt of workforce transitions.',
      questionText: 'According to the passage, what is one of the primary concerns related to industrial automation?',
      options: JSON.stringify([
        'A reduction in product quality and reliability.',
        'Job displacement and the necessity for employee retraining.',
        'An increase in raw material shipping costs.',
        'A complete absence of new technological opportunities.'
      ]),
      correctOption: 'B',
      explanation: 'The passage explicitly notes that automation "raises concerns about job displacement and the need for workforce retraining."',
      points: 20
    },
    {
      category: 'Reading',
      subCategory: 'Sentence Completion',
      title: 'Biodiversity in Tropical Rainforests',
      passage: 'Tropical rainforests house more than half of the world\'s plant and animal species, making them critical hubs of biodiversity. Despite occupying less than 6% of the Earth\'s land surface, they are essential for regulating global climate patterns and producing oxygen. Deforestation, driven by agricultural expansion and logging, threatens this rich ecosystem. Scientists warn that losing these habitats could accelerate global warming due to the release of stored carbon.',
      questionText: 'Complete the statement: Tropical rainforests occupy less than _______ percent of the Earth\'s land surface.',
      options: JSON.stringify(['4%', '6%', '10%', '12%']),
      correctOption: 'B',
      explanation: 'The passage states: "Despite occupying less than 6% of the Earth\'s land surface..."',
      points: 15
    },
    {
      category: 'Listening',
      subCategory: 'Sentence Completion',
      title: 'University Library Orientation Tour',
      passage: 'Speaker: Welcome to the central library! This is the main floor, which houses our reference desk, computer labs, and help center. To borrow books, you need a student card, which you can get at the administration office. The borrowing limit is 10 books at one time, and books can be kept for up to two weeks. If you return books late, a fine of 50 cents per day will be charged to your account.',
      questionText: 'Write the correct word: The maximum number of books a student can borrow at one time is ______.',
      options: JSON.stringify(['5', '10', '15', '20']),
      correctOption: 'B',
      explanation: 'The speaker mentions: "The borrowing limit is 10 books at one time."',
      points: 20
    },
    {
      category: 'Writing',
      subCategory: 'Task 2 Essay',
      title: 'Modern Technology & Communication',
      passage: 'Writing Task 2: Some people believe that technology has made communication more superficial and has damaged face-to-face relationships. Others argue that it has connected people globally like never before. Discuss both views and give your opinion.',
      questionText: 'Type your essay in the box below (minimum 250 words). Our AI Teacher will evaluate your vocabulary, grammar, cohesion, and generate an IELTS Band score estimation.',
      options: null,
      correctOption: 'IELTS Writing Task 2 Criteria',
      explanation: 'Essays are evaluated based on Task Achievement, Coherence & Cohesion, Lexical Resource, and Grammatical Range & Accuracy.',
      points: 50
    },
    {
      category: 'Speaking',
      subCategory: 'Part 2 Cue Card',
      title: 'A Memorable Journey',
      passage: 'Speaking Part 2 (Cue Card): Describe a memorable journey you have taken. You should say: where you went, how you traveled, who was with you, and explain why this journey was so memorable to you.',
      questionText: 'Prepare for 1 minute, then speak for 2 minutes. Press Record to simulate speaking practice. Our AI Teacher will review your flow and response structure.',
      options: null,
      correctOption: 'IELTS Speaking Part 2 Criteria',
      explanation: 'Speaking is graded on Fluency & Coherence, Lexical Resource, Grammatical Range, and Pronunciation.',
      difficulty: 'Advanced',
      points: 50
    }
  ];

  for (const q of coreQuestions) {
    if (!q.difficulty) q.difficulty = 'Intermediate';
    await prisma.question.create({ data: q });
  }

  import('./questionData.js').then(async ({ readingPassages, listeningPassages, speakingTopics, writingPrompts }) => {}).catch(() => {});
  const { readingPassages, listeningPassages, speakingTopics, writingPrompts } = await import('./questionData.js');

  const generatedQuestions = [];

  // ── READING: 10 passages × 3 questions × 28 variants = 840 questions ──
  console.log('Generating 800+ IELTS Reading questions...');
  const difficulties = ['Beginner', 'Elementary', 'Intermediate', 'Advanced'];
  for (let variant = 0; variant < 28; variant++) {
    for (const passage of readingPassages) {
      for (const qObj of passage.questions) {
        const opts = [...qObj.opts];
        // Rotate correct answer to different positions each variant
        const rotated = [...opts.slice(variant % opts.length), ...opts.slice(0, variant % opts.length)];
        const correctIdx = rotated.indexOf(qObj.opts[0]);
        const correctChar = String.fromCharCode(65 + correctIdx);
        generatedQuestions.push({
          category: 'Reading',
          subCategory: 'Comprehension',
          title: `${passage.title} — Set ${variant + 1}`,
          passage: passage.passage,
          questionText: qObj.q,
          options: JSON.stringify(rotated.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`)),
          correctOption: correctChar,
          explanation: `The correct answer is: "${qObj.opts[0]}".`,
          difficulty: difficulties[Math.floor(variant / 7) % 4],
          points: 20
        });
      }
    }
  }

  // ── LISTENING: 10 passages × 3 questions × 28 variants = 840 questions ──
  console.log('Generating 800+ IELTS Listening questions...');
  for (let variant = 0; variant < 28; variant++) {
    for (const passage of listeningPassages) {
      for (const qObj of passage.questions) {
        const opts = [...qObj.opts];
        const rotated = [...opts.slice(variant % opts.length), ...opts.slice(0, variant % opts.length)];
        const correctIdx = rotated.indexOf(qObj.opts[0]);
        const correctChar = String.fromCharCode(65 + correctIdx);
        generatedQuestions.push({
          category: 'Listening',
          subCategory: 'Audio Comprehension',
          title: `${passage.title} — Session ${variant + 1}`,
          passage: passage.passage,
          questionText: qObj.q,
          options: JSON.stringify(rotated.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`)),
          correctOption: correctChar,
          explanation: `The correct answer is: "${qObj.opts[0]}".`,
          difficulty: difficulties[Math.floor(variant / 7) % 4],
          points: 20
        });
      }
    }
  }

  // ── SPEAKING: 30 topics × 28 variants = 840 cue cards ──
  console.log('Generating 800+ IELTS Speaking cue cards...');
  for (let variant = 0; variant < 28; variant++) {
    for (const topic of speakingTopics) {
      generatedQuestions.push({
        category: 'Speaking',
        subCategory: 'Cue Card',
        title: `Describe a ${topic.adj} ${topic.noun} — Card ${variant + 1}`,
        passage: `Speaking Part 2 — Cue Card:\n\nDescribe a ${topic.adj} ${topic.noun}.\n\nYou should say:\n• What/who it is\n• How you know about it\n• What makes it ${topic.adj}\n• And explain ${topic.extra}.`,
        questionText: 'Prepare for 1 minute, then speak for 2 minutes. Our AI Teacher will evaluate your fluency, vocabulary, grammar, and coherence.',
        options: null,
        correctOption: 'IELTS Speaking Part 2 Criteria',
        explanation: 'Speaking is graded on Fluency & Coherence, Lexical Resource, Grammatical Range, and Pronunciation.',
        difficulty: difficulties[variant % 4],
        points: 50
      });
    }
  }

  // ── WRITING: 30 prompts × 28 variants = 840 essays ──
  console.log('Generating 800+ IELTS Writing tasks...');
  for (let variant = 0; variant < 28; variant++) {
    for (const wp of writingPrompts) {
      generatedQuestions.push({
        category: 'Writing',
        subCategory: wp.type,
        title: `${wp.type} — Prompt Set ${variant + 1}`,
        passage: `IELTS ${wp.type}:\n\n${wp.prompt}`,
        questionText: 'Write your response below. Aim for at least 250 words. Our AI Teacher (Dr. Diana) will give you a Band score with detailed feedback on Task Achievement, Coherence, Lexical Resource, and Grammar.',
        options: null,
        correctOption: 'IELTS Writing Criteria',
        explanation: 'Essays are evaluated on Task Achievement, Coherence & Cohesion, Lexical Resource, and Grammatical Range & Accuracy.',
        difficulty: difficulties[variant % 4],
        points: 50
      });
    }
  }

  // ── INSERT IN BATCHES ──
  console.log(`Inserting ${generatedQuestions.length} questions in batches of 100...`);
  const batchSize = 100;
  for (let i = 0; i < generatedQuestions.length; i += batchSize) {
    await prisma.question.createMany({ data: generatedQuestions.slice(i, i + batchSize) });
  }

  console.log('Seeding Mock Competitors...');
  const mockUsers = [
    { username: 'alex_ielts_9', email: 'alex@example.com', passwordHash: '$2a$10$Wp1B/kL2D2gI6zsz5d/w6.XkX0XWv19x7Q81k8G1P6kH5D2I8D5yO', xp: 2400, coins: 350, level: 5, streak: 15 },
    { username: 'nargiza_prepper', email: 'nargiza@example.com', passwordHash: '$2a$10$Wp1B/kL2D2gI6zsz5d/w6.XkX0XWv19x7Q81k8G1P6kH5D2I8D5yO', xp: 1800, coins: 280, level: 4, streak: 8 },
    { username: 'john_doe_band8', email: 'john@example.com', passwordHash: '$2a$10$Wp1B/kL2D2gI6zsz5d/w6.XkX0XWv19x7Q81k8G1P6kH5D2I8D5yO', xp: 1300, coins: 150, level: 3, streak: 5 },
    { username: 'prestigelearner', email: 'prestige@example.com', passwordHash: '$2a$10$Wp1B/kL2D2gI6zsz5d/w6.XkX0XWv19x7Q81k8G1P6kH5D2I8D5yO', xp: 950, coins: 220, level: 2, streak: 1 },
    { username: 'vazirbek_ielts', email: 'vazirbek@example.com', passwordHash: '$2a$10$Wp1B/kL2D2gI6zsz5d/w6.XkX0XWv19x7Q81k8G1P6kH5D2I8D5yO', xp: 600, coins: 180, level: 2, streak: 3 }
  ];

  const createdUsers = [];
  for (const u of mockUsers) {
    const user = await prisma.user.create({ data: u });
    createdUsers.push(user);
  }

  // Get a few seeded question IDs to link to user progress
  const seededQuestions = await prisma.question.findMany({ take: 5 });

  console.log('Seeding Mock Progress for Competitors...');
  const now = new Date();
  
  const progressEntries = [
    { userId: createdUsers[0].id, questionId: seededQuestions[0].id, userAnswer: 'B', isCorrect: true, score: 20, completedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
    { userId: createdUsers[0].id, questionId: seededQuestions[1].id, userAnswer: 'B', isCorrect: true, score: 15, completedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
    
    { userId: createdUsers[1].id, questionId: seededQuestions[0].id, userAnswer: 'B', isCorrect: true, score: 20, completedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
    
    { userId: createdUsers[2].id, questionId: seededQuestions[0].id, userAnswer: 'B', isCorrect: true, score: 20, completedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
    { userId: createdUsers[2].id, questionId: seededQuestions[1].id, userAnswer: 'B', isCorrect: true, score: 15, completedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000) },

    { userId: createdUsers[3].id, questionId: seededQuestions[2].id, userAnswer: 'B', isCorrect: true, score: 20, completedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) }
  ];

  for (const prog of progressEntries) {
    if (prog.questionId) {
      await prisma.userProgress.create({ data: prog });
    }
  }

  console.log('Database seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
