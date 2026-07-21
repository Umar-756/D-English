import React, { useState, useEffect } from 'react';
import { Award, BookOpen, Headphones, MessageSquare, ShoppingBag, Star, Lock, CheckCircle, Loader } from 'lucide-react';

const ICON_MAP = {
  Award: <Award size={24} />,
  BookOpen: <BookOpen size={24} />,
  Headphones: <Headphones size={24} />,
  MessageSquare: <MessageSquare size={24} />,
  ShoppingBag: <ShoppingBag size={24} />,
  CheckCircle: <CheckCircle size={24} />,
  Star: <Star size={24} />,
  TrendingUp: <Award size={24} />,
  Coins: <Star size={24} />,
  Calendar: <Award size={24} />,
};

const CATEGORY_COLORS = {
  General: 'var(--primary-gradient)',
  Reading: 'linear-gradient(135deg, #10b981, #059669)',
  Listening: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  Expression: 'linear-gradient(135deg, #f59e0b, #d97706)',
  Special: 'linear-gradient(135deg, #fbbf24, #d4af37)',
};

export default function TrophyRoom({ token, API_URL }) {
  const [achievements, setAchievements] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/profile/achievements`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.ok) {
        const data = await res.json();
        setAchievements(data);
        // Backend already returns unlocked status in the achievement objects
        const unlockedIds = data.filter(a => a.unlocked).map(a => a.id);
        setUserAchievements(unlockedIds);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isUnlocked = (achId) => userAchievements.includes(achId);
  
  const unlockedCount = achievements.filter(a => isUnlocked(a.id)).length;
  const totalXPEarned = achievements
    .filter(a => isUnlocked(a.id))
    .reduce((sum, a) => sum + (a.xpReward || 0), 0);

  const categories = ['All', 'General', 'Reading', 'Listening', 'Expression', 'Special'];
  const filtered = activeFilter === 'All' ? achievements : achievements.filter(a => a.category === activeFilter);

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', position: 'relative' }}>
        <div className="scanner-line" />
        <Loader size={24} style={{ animation: 'spin-coin 1s linear infinite', color: 'var(--primary)' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading Trophy Room...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fade-in 0.3s ease' }}>
      
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: '800', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {unlockedCount}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Achievements Unlocked</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: '800', color: '#fbbf24' }}>
            {achievements.length}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Total Achievements</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', fontWeight: '800', color: '#10b981' }}>
            {totalXPEarned.toLocaleString()}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>XP Earned from Trophies</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="glass-panel" style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600' }}>Overall Progress</span>
          <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '700' }}>
            {unlockedCount} / {achievements.length} ({Math.round((unlockedCount / Math.max(achievements.length, 1)) * 100)}%)
          </span>
        </div>
        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(unlockedCount / Math.max(achievements.length, 1)) * 100}%`,
            background: 'var(--primary-gradient)',
            borderRadius: '4px',
            transition: 'width 0.8s ease',
            boxShadow: '0 0 10px var(--primary-glow)'
          }} />
        </div>
      </div>

      {/* Category Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            style={{
              padding: '7px 16px', borderRadius: '20px', border: 'none',
              background: activeFilter === cat ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)',
              color: activeFilter === cat ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer', fontWeight: '600', fontSize: '12px',
              transition: 'all 0.2s ease',
              boxShadow: activeFilter === cat ? '0 4px 12px var(--primary-glow)' : 'none'
            }}
          >
            {cat}
            <span style={{ marginLeft: '6px', opacity: '0.7' }}>
              ({cat === 'All' ? achievements.length : achievements.filter(a => a.category === cat).length})
            </span>
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="trophies-grid">
        {filtered.map((ach) => {
          const unlocked = isUnlocked(ach.id);
          const catColor = CATEGORY_COLORS[ach.category] || 'var(--primary-gradient)';
          return (
            <div
              key={ach.id}
              className={`glass-panel trophy-card ${unlocked ? 'unlocked' : ''}`}
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              {unlocked && (
                <div style={{
                  position: 'absolute', top: '10px', right: '10px',
                  background: '#10b981', borderRadius: '50%', width: '20px', height: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <CheckCircle size={14} color="white" />
                </div>
              )}
              {!unlocked && (
                <div style={{
                  position: 'absolute', top: '10px', right: '10px',
                  background: 'rgba(255,255,255,0.05)', borderRadius: '50%', width: '20px', height: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Lock size={12} color="var(--text-muted)" />
                </div>
              )}
              <div className="trophy-icon-circle" style={{ background: unlocked ? catColor : 'rgba(255,255,255,0.05)' }}>
                {ICON_MAP[ach.icon] || <Award size={24} />}
              </div>
              <h4 style={{ fontSize: '13px', fontWeight: '700', textAlign: 'center', marginTop: '4px' }}>{ach.title}</h4>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.4' }}>
                {ach.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <Star size={12} style={{ color: '#fbbf24' }} />
                <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: '700' }}>+{ach.xpReward} XP</span>
              </div>
              <span style={{
                fontSize: '10px', padding: '2px 8px', borderRadius: '10px',
                background: unlocked ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                color: unlocked ? '#10b981' : 'var(--text-muted)',
                fontWeight: '600', textTransform: 'uppercase'
              }}>
                {unlocked ? 'Unlocked' : ach.category}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
