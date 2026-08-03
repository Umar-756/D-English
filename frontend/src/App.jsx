import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, BookOpen, Trophy, 
  ShoppingBag, LogOut, Sparkles, Award, User, Brain
} from 'lucide-react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import PracticeArena from './components/PracticeArena';
import Leaderboard from './components/Leaderboard';
import TrophyRoom from './components/TrophyRoom';
import Shop from './components/Shop';
import Profile, { getAvatarEmoji } from './components/Profile';
import VocabBuilder from './components/VocabBuilder';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [unlockedAchievement, setUnlockedAchievement] = useState(null);
  const [activeThemeSkin, setActiveThemeSkin] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.body.className = activeThemeSkin ? `theme-${activeThemeSkin}` : '';
  }, [activeThemeSkin]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUserProfile();
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        updateStreak(userData.id);
        fetchOwnedThemes(userData.id);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const updateStreak = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/profile/streak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.streakUpdated) {
          setUser(prev => prev ? { ...prev, streak: data.streak, lastActive: data.lastActive } : null);
        }
        if (data.unlockedAchievement) triggerAchievementModal(data.unlockedAchievement);
      }
    } catch (err) {
      console.error('Error checking streak:', err);
    }
  };

  const fetchOwnedThemes = async () => {
    try {
      const res = await fetch(`${API_URL}/shop/items`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const items = await res.json();
        const activeTheme = localStorage.getItem('equipped_theme') || '';
        const owned = items.find(item => item.id === activeTheme && item.purchased);
        setActiveThemeSkin(owned ? activeTheme : '');
      }
    } catch (err) {
      console.error('Error fetching owned themes:', err);
    }
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token');
    localStorage.removeItem('equipped_theme');
    setActiveThemeSkin('');
    setUser(null);
    navigate('/');
  };

  const triggerAchievementModal = (ach) => {
    setUnlockedAchievement(ach);
    setTimeout(() => setUnlockedAchievement(null), 5000);
  };

  const updateCoinsAndXP = (newCoins, newXP, newLevel) => {
    setUser(prev => prev ? { ...prev, coins: newCoins, xp: newXP, level: newLevel } : null);
  };

  const handleAvatarUpdate = (newAvatar) => {
    setUser(prev => prev ? { ...prev, avatar: newAvatar } : null);
  };

  if (!token) return <Auth setToken={setToken} setUser={setUser} API_URL={API_URL} />;

  if (!user) {
    return (
      <div className="auth-wrapper">
        <div className="glass-panel auth-card" style={{ padding: '24px' }}>
          <div className="scanner-line"></div>
          <h2 className="text-gradient">Loading Profile...</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Connecting to IELTS Arena server</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/practice', label: 'Arena', icon: <BookOpen size={20} /> },
    { path: '/leaderboard', label: 'Rank', icon: <Trophy size={20} /> },
    { path: '/vocab', label: 'Vocab', icon: <Brain size={20} /> },
    { path: '/trophies', label: 'Trophies', icon: <Award size={20} /> },
    { path: '/shop', label: 'Shop', icon: <ShoppingBag size={20} /> },
  ];

  const getPageTitle = (path) => {
    const item = navItems.find(n => n.path === path);
    if (item) return item.label === 'Arena' ? 'IELTS Arena' : item.label === 'Rank' ? 'Top Ranking' : item.label;
    if (path === '/profile') return 'My Profile';
    return 'D English';
  };

  const currentPath = location.pathname;
  const avatarEmoji = getAvatarEmoji(user.avatar || 'avatar_1');
  const xpProgress = Math.min(100, Math.floor(((user.xp % 500) / 500) * 100));

  return (
    <div className="app-container">
      {/* Desktop Sidebar */}
      <aside className="sidebar desktop-only">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{ background: 'var(--primary-gradient)', padding: '8px', borderRadius: '10px', display: 'flex', color: 'white' }}>
            <Sparkles size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', lineHeight: '1' }}>D English</h1>
            <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: '700', letterSpacing: '1px' }}>IELTS PREP</span>
          </div>
        </div>

        {/* User mini card */}
        <div
          onClick={() => navigate('/profile')}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 14px', borderRadius: '12px', marginBottom: '24px',
            background: currentPath === '/profile' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
            border: currentPath === '/profile' ? '1px solid var(--primary)' : '1px solid var(--border-color)',
            cursor: 'pointer', transition: 'all 0.2s'
          }}
          className="glass-panel-hover"
        >
          <div style={{ fontSize: '28px', width: '42px', height: '42px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {avatarEmoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: '700', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>LVL {user.level} • {user.xp} XP</div>
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginTop: '5px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${xpProgress}%`, background: 'var(--primary-gradient)', borderRadius: '2px', transition: 'width 0.8s ease' }} />
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1' }}>
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                padding: '11px 14px', borderRadius: '10px', border: 'none',
                background: currentPath === item.path ? 'rgba(99,102,241,0.15)' : 'transparent',
                borderLeft: currentPath === item.path ? '3px solid var(--primary)' : '3px solid transparent',
                color: currentPath === item.path ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-body)',
                gap: '12px'
              }}
              className="glass-panel-hover"
            >
              {item.icon}
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom stats */}
        <div style={{ margin: '16px 0', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#fbbf24' }}>{user.coins}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>🪙 Coins</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#f97316' }}>{user.streak}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>🔥 Streak</div>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
            padding: '11px 14px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)',
            background: 'rgba(239,68,68,0.05)', color: '#ef4444', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s'
          }}
          className="glass-panel-hover"
        >
          <LogOut size={16} />
          Log Out
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-navbar glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '700' }}>{getPageTitle(currentPath)}</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Welcome back, {user.username}! 👋</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="badge-item desktop-only" style={{ background: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.3)' }}>
              <span style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '13px' }}>LVL {user.level}</span>
            </div>
            <div className="badge-item streak">
              <span style={{ fontSize: '14px' }}>🔥</span>
              <span style={{ fontSize: '13px' }}>{user.streak}d</span>
            </div>
            <div className="badge-item coins">
              <span style={{ fontSize: '14px' }}>🪙</span>
              <span style={{ fontSize: '13px' }}>{user.coins}</span>
            </div>
            <div
              onClick={() => navigate('/profile')}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'var(--primary-gradient)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', cursor: 'pointer',
                border: '2px solid var(--primary)', flexShrink: 0
              }}
              title="My Profile"
            >
              {avatarEmoji}
            </div>
          </div>
        </header>

        {/* Page Content with Router */}
        <div className="page-content-wrapper">
          <Routes>
            <Route path="/" element={<Dashboard user={user} API_URL={API_URL} token={token} />} />
            <Route path="/practice" element={<PracticeArena token={token} API_URL={API_URL} user={user} updateCoinsAndXP={updateCoinsAndXP} triggerAchievementModal={triggerAchievementModal} />} />
            <Route path="/leaderboard" element={<Leaderboard token={token} API_URL={API_URL} currentUser={user} />} />
            <Route path="/vocab" element={<VocabBuilder token={token} API_URL={API_URL} user={user} updateCoinsAndXP={updateCoinsAndXP} triggerAchievementModal={triggerAchievementModal} />} />
            <Route path="/trophies" element={<TrophyRoom token={token} API_URL={API_URL} />} />
            <Route path="/shop" element={<Shop token={token} API_URL={API_URL} user={user} updateCoinsAndXP={updateCoinsAndXP} triggerAchievementModal={triggerAchievementModal} activeThemeSkin={activeThemeSkin} setActiveThemeSkin={setActiveThemeSkin} />} />
            <Route path="/profile" element={<Profile token={token} API_URL={API_URL} user={user} onAvatarUpdate={handleAvatarUpdate} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        {navItems.map(item => (
          <div 
            key={item.path} 
            className={`nav-item ${currentPath === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Achievement Modal */}
      {unlockedAchievement && (
        <div style={{ position: 'fixed', bottom: '80px', right: '30px', zIndex: 999, animation: 'slide-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
          <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '4px solid #fbbf24', background: 'rgba(15,23,42,0.97)', maxWidth: '360px', boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(251,191,36,0.25)' }}>
            <div style={{ background: 'linear-gradient(135deg, #fbbf24, #d4af37)', padding: '10px', borderRadius: '50%', color: '#000', display: 'flex', flexShrink: 0 }}>
              <Award size={26} />
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#fbbf24', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Achievement Unlocked!</div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginTop: '3px' }}>{unlockedAchievement.title}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{unlockedAchievement.description}</p>
              <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '700', display: 'block', marginTop: '4px' }}>+{unlockedAchievement.xpReward} XP!</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
