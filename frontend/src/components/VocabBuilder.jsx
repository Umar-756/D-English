import React, { useState, useEffect } from 'react';
import { Brain, Flame, Target, Trophy, ArrowRight, Zap, CheckCircle, XCircle } from 'lucide-react';

const VOCAB_WORDS = [
  { word: "Ubiquitous", answer: "Found everywhere", options: ["Found everywhere", "Extremely rare", "Very expensive", "Highly contagious"] },
  { word: "Ameliorate", answer: "Make better", options: ["Make better", "Destroy completely", "Confuse", "Appreciate"] },
  { word: "Proliferate", answer: "Increase rapidly", options: ["Increase rapidly", "Decrease steadily", "Stay the same", "Hide away"] },
  { word: "Mitigate", answer: "Make less severe", options: ["Make less severe", "Encourage", "Celebrate", "Complicate"] },
  { word: "Scrutinize", answer: "Examine closely", options: ["Examine closely", "Ignore completely", "Quickly scan", "Lend money"] },
  { word: "Exacerbate", answer: "Make worse", options: ["Make worse", "Solve quickly", "Clean thoroughly", "Forget easily"] },
  { word: "Substantiate", answer: "Provide evidence", options: ["Provide evidence", "Deny strongly", "Steal secretly", "Run away"] },
  { word: "Advocate", answer: "Publicly support", options: ["Publicly support", "Criticize harshly", "Whisper quietly", "Attack physically"] },
  { word: "Predominant", answer: "Main or strongest", options: ["Main or strongest", "Weakest link", "Hidden factor", "Random chance"] },
  { word: "Encompass", answer: "Include completely", options: ["Include completely", "Exclude entirely", "Cut in half", "Throw away"] },
  { word: "Inherent", answer: "Built-in naturally", options: ["Built-in naturally", "Added later", "Easily removed", "Fake or artificial"] },
  { word: "Facilitate", answer: "Make easier", options: ["Make easier", "Make impossible", "Slow down", "Complain about"] },
  { word: "Detrimental", answer: "Harmful", options: ["Harmful", "Helpful", "Nutritious", "Beautiful"] },
  { word: "Augment", answer: "Increase or add to", options: ["Increase or add to", "Subtract from", "Divide equally", "Ignore"] },
  { word: "Ambiguous", answer: "Unclear meaning", options: ["Unclear meaning", "Crystal clear", "Very loud", "Extremely fast"] },
  { word: "Autonomous", answer: "Independent", options: ["Independent", "Controlled by others", "Very slow", "Highly expensive"] },
  { word: "Converge", answer: "Come together", options: ["Come together", "Split apart", "Fly away", "Disappear"] },
  { word: "Disparity", answer: "Great difference", options: ["Great difference", "Exact similarity", "Close friendship", "Small mistake"] },
  { word: "Eloquent", answer: "Fluent & persuasive", options: ["Fluent & persuasive", "Stuttering", "Very quiet", "Rude and loud"] },
  { word: "Feasible", answer: "Possible to do", options: ["Possible to do", "Impossible", "Very dangerous", "Illegal"] },
];

export default function VocabBuilder({ user, updateCoinsAndXP, API_URL, token, triggerAchievementModal }) {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [timerInterval, setTimerInterval] = useState(null);

  const startGame = () => {
    setScore(0);
    setStreak(0);
    setIsPlaying(true);
    setGameOver(false);
    nextQuestion();
  };

  const nextQuestion = () => {
    const randomWord = VOCAB_WORDS[Math.floor(Math.random() * VOCAB_WORDS.length)];
    // Shuffle options
    const shuffled = [...randomWord.options].sort(() => 0.5 - Math.random());
    
    setCurrentQuestion(randomWord);
    setOptions(shuffled);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setTimeLeft(15);

    if (timerInterval) clearInterval(timerInterval);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setTimerInterval(interval);
  };

  const handleTimeUp = () => {
    setGameOver(true);
    awardRewards();
  };

  const handleAnswer = (option) => {
    if (selectedAnswer || gameOver) return;
    
    clearInterval(timerInterval);
    setSelectedAnswer(option);
    
    if (option === currentQuestion.answer) {
      setIsCorrect(true);
      setScore(s => s + 10 + (streak * 2));
      setStreak(s => s + 1);
      
      setTimeout(() => {
        nextQuestion();
      }, 1000);
    } else {
      setIsCorrect(false);
      setTimeout(() => {
        setGameOver(true);
        awardRewards();
      }, 1500);
    }
  };

  const awardRewards = async () => {
    if (score === 0) return;
    
    const xpReward = Math.floor(score / 2);
    const coinReward = Math.floor(score / 5);

    try {
      const res = await fetch(`${API_URL}/profile/reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ xp: xpReward, coins: coinReward })
      });
      if (res.ok) {
        const data = await res.json();
        updateCoinsAndXP(data.newCoins, data.newXP, data.newLevel);
        if (data.unlockedAchievement) {
          triggerAchievementModal(data.unlockedAchievement);
        }
      }
    } catch (err) {
      console.error('Failed to save vocab rewards', err);
    }
  };

  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerInterval]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fade-in 0.3s ease', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(236,72,153,0.1) 0%, rgba(99,102,241,0.05) 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', padding: '14px', borderRadius: '16px', display: 'flex', boxShadow: '0 0 20px rgba(236,72,153,0.3)' }}>
            <Brain size={28} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Vocab Builder</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>Fast-paced IELTS vocabulary quiz</p>
          </div>
        </div>
      </div>

      {!isPlaying && !gameOver ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(236,72,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
            ⚡
          </div>
          <div>
            <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px' }}>Rapid-Fire Mode</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
              Match the IELTS academic word with its definition. You have 15 seconds per word. One mistake and the game is over. Earn XP and Coins based on your streak!
            </p>
          </div>
          <button onClick={startGame} className="glow-btn" style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', padding: '14px 32px', fontSize: '16px', border: 'none' }}>
            Start Quiz <ArrowRight size={18} style={{ marginLeft: '8px' }} />
          </button>
        </div>
      ) : gameOver ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          
          <h3 style={{ fontSize: '28px', fontWeight: '800' }}>Game Over!</h3>
          
          <div style={{ display: 'flex', gap: '20px', margin: '16px 0' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', minWidth: '120px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '8px' }}>Final Score</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-main)' }}>{score}</div>
            </div>
            <div style={{ background: 'rgba(236,72,153,0.1)', padding: '20px', borderRadius: '16px', minWidth: '120px', border: '1px solid rgba(236,72,153,0.3)' }}>
              <div style={{ fontSize: '12px', color: '#ec4899', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '8px' }}>Max Streak</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#ec4899' }}>{streak}🔥</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', background: 'rgba(16,185,129,0.1)', padding: '12px 24px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)' }}>
            <span style={{ color: '#10b981', fontWeight: '700' }}>+{Math.floor(score / 2)} XP</span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
            <span style={{ color: '#fbbf24', fontWeight: '700' }}>+{Math.floor(score / 5)} Coins</span>
          </div>

          <button onClick={startGame} className="glow-btn" style={{ marginTop: '16px' }}>
            Try Again
          </button>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '32px', position: 'relative' }}>
          {/* Game Stats Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: '700' }}>
              <Target color="#8b5cf6" size={24} /> Score: {score}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', fontWeight: '800', color: timeLeft <= 5 ? '#ef4444' : 'var(--text-main)' }}>
              ⏳ {timeLeft}s
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: '700', color: '#ec4899' }}>
              <Flame color="#ec4899" size={24} /> Streak: {streak}
            </div>
          </div>

          {/* Question */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '700', marginBottom: '12px' }}>What is the meaning of:</div>
            <h3 style={{ fontSize: '42px', fontWeight: '800', background: 'linear-gradient(135deg, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {currentQuestion?.word}
            </h3>
          </div>

          {/* Options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {options.map((opt, i) => {
              let bg = 'rgba(255,255,255,0.03)';
              let border = '1px solid var(--border-color)';
              let color = 'var(--text-main)';
              let icon = null;

              if (selectedAnswer) {
                if (opt === currentQuestion.answer) {
                  bg = 'rgba(16,185,129,0.15)';
                  border = '1px solid #10b981';
                  color = '#10b981';
                  icon = <CheckCircle size={20} />;
                } else if (opt === selectedAnswer) {
                  bg = 'rgba(239,68,68,0.15)';
                  border = '1px solid #ef4444';
                  color = '#ef4444';
                  icon = <XCircle size={20} />;
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  disabled={selectedAnswer !== null}
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    background: bg,
                    border: border,
                    color: color,
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: selectedAnswer ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '70px',
                    boxShadow: selectedAnswer && opt === currentQuestion.answer ? '0 0 20px rgba(16,185,129,0.2)' : 'none'
                  }}
                  className={selectedAnswer ? '' : 'glass-panel-hover'}
                >
                  {opt}
                  {icon}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
