import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Headphones, FileText, Mic, Award, ArrowRight, Flame, BarChart2, Target, Zap, TrendingUp } from 'lucide-react';

// 30 premium IELTS Academic words for daily rotation
const IELTS_WORDS = [
  { word: 'Ubiquitous', type: 'Adjective', definition: 'Present, appearing, or found everywhere at the same time.', example: '"Mobile phones are now ubiquitous, making instant communication accessible globally."' },
  { word: 'Ameliorate', type: 'Verb', definition: 'To make something bad or unsatisfactory better.', example: '"Government policies aim to ameliorate the living conditions of low-income households."' },
  { word: 'Proliferate', type: 'Verb', definition: 'To increase rapidly in numbers or amount.', example: '"Social media platforms have proliferated over the past decade."' },
  { word: 'Mitigate', type: 'Verb', definition: 'To make less severe, serious, or painful.', example: '"Companies are taking steps to mitigate the environmental impact of production."' },
  { word: 'Scrutinize', type: 'Verb', definition: 'To examine or inspect closely and thoroughly.', example: '"Scientists scrutinized the data for any signs of error."' },
  { word: 'Exacerbate', type: 'Verb', definition: 'To make a problem, bad situation, or negative feeling worse.', example: '"The drought exacerbated food shortages in the region."' },
  { word: 'Substantiate', type: 'Verb', definition: 'To provide evidence to support or prove the truth of something.', example: '"The researcher failed to substantiate his claims with reliable data."' },
  { word: 'Advocate', type: 'Verb/Noun', definition: 'To publicly recommend or support a particular cause or policy.', example: '"Many scientists advocate for stricter carbon emission regulations."' },
  { word: 'Predominant', type: 'Adjective', definition: 'Present as the strongest or main element; having control.', example: '"Agriculture is still the predominant source of income in rural areas."' },
  { word: 'Encompass', type: 'Verb', definition: 'To include a wide range of things.', example: '"The curriculum encompasses all aspects of modern science."' },
  { word: 'Inherent', type: 'Adjective', definition: 'Existing as a natural or basic part of something.', example: '"There are inherent risks in any form of investment."' },
  { word: 'Facilitate', type: 'Verb', definition: 'To make an action or process easier.', example: '"Technology has facilitated communication across continents."' },
  { word: 'Detrimental', type: 'Adjective', definition: 'Tending to cause harm; damaging.', example: '"Excessive screen time can be detrimental to children\'s health."' },
  { word: 'Augment', type: 'Verb', definition: 'To make something greater by adding to it; to increase.', example: '"Many workers augment their income by taking on freelance projects."' },
  { word: 'Ambiguous', type: 'Adjective', definition: 'Having more than one possible meaning; not clear or definite.', example: '"The politician gave an ambiguous answer to avoid controversy."' },
  { word: 'Autonomous', type: 'Adjective', definition: 'Having the freedom to act independently.', example: '"Some nations maintain an autonomous foreign policy."' },
  { word: 'Converge', type: 'Verb', definition: 'To come together from different directions to meet at a point.', example: '"Cultures converge in cosmopolitan cities like London and New York."' },
  { word: 'Disparity', type: 'Noun', definition: 'A great difference or inequality.', example: '"There is a significant disparity in wealth between urban and rural areas."' },
  { word: 'Eloquent', type: 'Adjective', definition: 'Fluent or persuasive in speaking or writing.', example: '"Her eloquent speech moved the audience to tears."' },
  { word: 'Feasible', type: 'Adjective', definition: 'Possible to do easily or conveniently.', example: '"The scientist determined that the project was feasible within the allocated budget."' },
  { word: 'Gregarious', type: 'Adjective', definition: 'Fond of company; sociable.', example: '"Gregarious individuals often thrive in team-based work environments."' },
  { word: 'Hinder', type: 'Verb', definition: 'To make it difficult for something to happen or develop.', example: '"Lack of funding can hinder scientific research progress."' },
  { word: 'Illuminate', type: 'Verb', definition: 'To make clear; to explain.', example: '"The documentary illuminated the complexities of climate change."' },
  { word: 'Juxtapose', type: 'Verb', definition: 'To place two things side by side for comparison or contrast.', example: '"The author juxtaposes wealth and poverty to highlight social inequality."' },
  { word: 'Lenient', type: 'Adjective', definition: 'Merciful or tolerant; not strict or severe.', example: '"Critics argue that the judge was too lenient with the sentence."' },
  { word: 'Marginalise', type: 'Verb', definition: 'To treat as unimportant or push to the edge of society.', example: '"Minority groups are often marginalised in political discourse."' },
  { word: 'Nuance', type: 'Noun', definition: 'A subtle difference in meaning, expression, or response.', example: '"A skilled translator must be sensitive to the nuances of language."' },
  { word: 'Overarching', type: 'Adjective', definition: 'Comprehensive or all-embracing.', example: '"The overarching goal of the project is to reduce carbon emissions by 40%."' },
  { word: 'Paramount', type: 'Adjective', definition: 'More important than anything else; supreme.', example: '"Patient safety is of paramount importance in medicine."' },
  { word: 'Quantify', type: 'Verb', definition: 'To express or measure the quantity of something.', example: '"It is difficult to quantify the emotional impact of natural disasters."' },
];

export default function Dashboard({ user, API_URL, token }) {
  const navigate = useNavigate();

  // Level progress calculations
  const xpInCurrentLevel = user.xp % 500;
  const xpNeededForNextLevel = 500;
  const progressPercentage = Math.min(100, Math.floor((xpInCurrentLevel / xpNeededForNextLevel) * 100));

  // Circular progress calculations for SVG
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  // Daily word — changes every day based on date
  const todayWord = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    return IELTS_WORDS[dayOfYear % IELTS_WORDS.length];
  }, []);

  const navigateToCategory = (cat) => {
    localStorage.setItem('selected_practice_category', cat);
    navigate('/practice');
  };

  const categories = [
    { id: 'Reading', title: 'Reading Arena', icon: <BookOpen size={24} />, desc: '800+ comprehension and vocabulary matching tasks.', color: '#6366f1' },
    { id: 'Listening', title: 'Listening Arena', icon: <Headphones size={24} />, desc: 'Audio transcription and sentence completion drills.', color: '#10b981' },
    { id: 'Writing', title: 'Writing Simulator', icon: <FileText size={24} />, desc: 'Submit Task 2 essays to Dr. Diana for band reports.', color: '#f59e0b' },
    { id: 'Speaking', title: 'Speaking Lounge', icon: <Mic size={24} />, desc: 'Simulate cue cards and receive pronunciation feedback.', color: '#ec4899' },
  ];

  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`${API_URL}/profile/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (token) fetchAnalytics();
  }, [token, API_URL]);

  const categoryColors = {
    Reading: '#6366f1',
    Listening: '#10b981',
    Writing: '#f59e0b',
    Speaking: '#ec4899',
  };

  return (
    <div className="dashboard-grid">
      {/* Level XP circular progress card */}
      <div className="glass-panel xp-card">
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>Your Level Rank</h3>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Accumulate XP to rank up</span>
        
        <div className="progress-wheel-container">
          <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="80" cy="80" r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
            <circle
              cx="80" cy="80" r={radius} fill="transparent"
              stroke="var(--primary)" strokeWidth="10"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div className="progress-wheel-text">
            <h3>LVL {user.level}</h3>
            <span>{xpInCurrentLevel} / {xpNeededForNextLevel} XP</span>
          </div>
        </div>

        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-highlight)' }}>
          {progressPercentage}% to Level {user.level + 1}
        </span>

        {/* Quick Stats */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', width: '100%' }}>
          <div style={{ flex: 1, textAlign: 'center', background: 'rgba(99,102,241,0.08)', borderRadius: '10px', padding: '10px 6px', border: '1px solid rgba(99,102,241,0.15)' }}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>{user.xp.toLocaleString()}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Total XP</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', background: 'rgba(249,115,22,0.08)', borderRadius: '10px', padding: '10px 6px', border: '1px solid rgba(249,115,22,0.15)' }}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#f97316' }}>{user.streak}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Day Streak</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', background: 'rgba(251,191,36,0.08)', borderRadius: '10px', padding: '10px 6px', border: '1px solid rgba(251,191,36,0.15)' }}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#fbbf24' }}>{user.coins}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Coins</div>
          </div>
        </div>
      </div>

      {/* Daily Word of the Day Card */}
      <div className="glass-panel challenges-card">
        <div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '12px' }}>
            <Flame size={14} /> Word of the Day
          </span>
          <h3 style={{ fontSize: '26px', fontWeight: '800', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            "{todayWord.word}"
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {todayWord.type}
          </span>
          <p style={{ color: '#cbd5e1', fontSize: '15px', marginTop: '10px', lineHeight: '1.6' }}>
            <strong>Definition:</strong> {todayWord.definition}
          </p>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '8px', lineHeight: '1.5', fontStyle: 'italic', borderLeft: '3px solid var(--primary)', paddingLeft: '12px' }}>
            {todayWord.example}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => navigateToCategory('Reading')}
            className="glow-btn"
            style={{ padding: '10px 18px', fontSize: '14px' }}
          >
            Practice Synonyms <ArrowRight size={16} />
          </button>
          <button 
            onClick={() => navigateToCategory('Listening')}
            className="badge-item glass-panel-hover"
            style={{ border: '1px solid var(--border-color)', padding: '10px 16px', cursor: 'pointer', borderRadius: '10px', color: 'var(--text-main)', fontSize: '14px' }}
          >
            Listening Drill
          </button>
        </div>
      </div>

      {/* Weekly Analytics Card */}
      <div className="glass-panel" style={{ gridColumn: 'span 12', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(99,102,241,0.15)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
              <BarChart2 style={{ color: 'var(--primary)' }} size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Weekly Performance Analytics</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Last 7 days summary</p>
            </div>
          </div>
          {analytics && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '8px 16px' }}>
              <Target size={16} style={{ color: '#10b981' }} />
              <span style={{ fontWeight: '800', color: '#10b981', fontSize: '18px' }}>{analytics.accuracy}%</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Accuracy</span>
            </div>
          )}
        </div>
        
        {analytics ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Main Stats Row */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '140px', background: 'rgba(255,255,255,0.04)', padding: '20px', borderRadius: '14px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Total Answers</span>
                <div style={{ fontSize: '36px', fontWeight: '800', marginTop: '8px', color: 'var(--text-main)' }}>{analytics.total}</div>
              </div>
              <div style={{ flex: 1, minWidth: '140px', background: 'rgba(16,185,129,0.08)', padding: '20px', borderRadius: '14px', textAlign: 'center', border: '1px solid rgba(16,185,129,0.25)' }}>
                <span style={{ fontSize: '11px', color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>✓ Correct</span>
                <div style={{ fontSize: '36px', fontWeight: '800', marginTop: '8px', color: '#10b981' }}>{analytics.correct}</div>
              </div>
              <div style={{ flex: 1, minWidth: '140px', background: 'rgba(239,68,68,0.08)', padding: '20px', borderRadius: '14px', textAlign: 'center', border: '1px solid rgba(239,68,68,0.25)' }}>
                <span style={{ fontSize: '11px', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>✗ Incorrect</span>
                <div style={{ fontSize: '36px', fontWeight: '800', marginTop: '8px', color: '#ef4444' }}>{analytics.incorrect}</div>
              </div>
              <div style={{ flex: 1, minWidth: '140px', background: 'rgba(251,191,36,0.08)', padding: '20px', borderRadius: '14px', textAlign: 'center', border: '1px solid rgba(251,191,36,0.25)' }}>
                <span style={{ fontSize: '11px', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Total Score</span>
                <div style={{ fontSize: '36px', fontWeight: '800', marginTop: '8px', color: '#fbbf24' }}>{(analytics.totalScore || 0).toLocaleString()}</div>
              </div>
            </div>

            {/* Category Breakdown */}
            {analytics.byCategory && (
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>By Category</h4>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {Object.entries(analytics.byCategory).map(([cat, data]) => {
                    const catAccuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                    const color = categoryColors[cat] || 'var(--primary)';
                    return (
                      <div
                        key={cat}
                        onClick={() => navigateToCategory(cat)}
                        style={{
                          flex: 1, minWidth: '140px', padding: '16px', borderRadius: '14px',
                          background: `${color}10`, border: `1px solid ${color}30`,
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', color }}>{cat}</span>
                          <span style={{ fontSize: '18px', fontWeight: '800', color }}>{catAccuracy}%</span>
                        </div>
                        {/* Progress bar */}
                        <div style={{ height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                          <div style={{ height: '100%', width: `${catAccuracy}%`, background: color, borderRadius: '3px', transition: 'width 0.8s ease' }} />
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {data.correct}✓ / {data.total} answered
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Daily Mini Bar Chart */}
            {analytics.daily && analytics.daily.some(d => d.total > 0) && (
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>Daily Activity</h4>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '80px' }}>
                  {analytics.daily.map((d, i) => {
                    const maxTotal = Math.max(...analytics.daily.map(x => x.total), 1);
                    const barHeight = Math.max(4, (d.total / maxTotal) * 72);
                    const correctHeight = d.total > 0 ? (d.correct / d.total) * barHeight : 0;
                    const isToday = i === analytics.daily.length - 1;
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '100%', height: `${barHeight}px`, borderRadius: '4px 4px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'rgba(255,255,255,0.05)', position: 'relative' }}>
                          <div style={{ width: '100%', height: `${correctHeight}px`, background: isToday ? 'var(--primary-gradient)' : 'rgba(99,102,241,0.5)', borderRadius: '4px 4px 0 0' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: isToday ? 'var(--primary)' : 'var(--text-muted)', fontWeight: isToday ? '700' : '400' }}>{d.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            <Zap size={24} style={{ opacity: 0.4 }} />
            <p style={{ marginTop: '8px' }}>Loading your analytics...</p>
          </div>
        )}
      </div>

      {/* Category Navigation Cards */}
      <div className="arena-categories-grid">
        {categories.map(cat => (
          <div 
            key={cat.id} 
            onClick={() => navigateToCategory(cat.id)}
            className="glass-panel glass-panel-hover category-card"
          >
            <div className="category-icon-wrapper" style={{ color: cat.color, borderColor: `${cat.color}30` }}>
              {cat.icon}
            </div>
            <h4 style={{ fontSize: '18px', fontWeight: '700', marginTop: '8px' }}>{cat.title}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', flex: '1', lineHeight: '1.4' }}>{cat.desc}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '8px', fontSize: '12px', fontWeight: '600' }}>
              <span style={{ color: cat.color }}>
                {analytics?.byCategory?.[cat.id]?.total
                  ? `${analytics.byCategory[cat.id].total} practiced this week`
                  : 'Start practicing →'}
              </span>
              <ArrowRight size={14} style={{ color: cat.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
