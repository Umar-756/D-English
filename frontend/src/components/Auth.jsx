import React, { useState } from 'react';
import { Sparkles, Eye, EyeOff, User, Mail, Lock, ArrowRight } from 'lucide-react';

const FEATURES = [
  { icon: '📖', text: '3,300+ IELTS Practice Questions' },
  { icon: '🤖', text: 'AI Teacher Dr. Diana — Band Score Feedback' },
  { icon: '🏆', text: 'Global Leaderboard & Trophy System' },
  { icon: '🔥', text: 'Daily Streak & XP Gamification' },
  { icon: '🎨', text: 'Unlockable Premium Themes' },
];

export default function Auth({ setToken, setUser, API_URL }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin
      ? { usernameOrEmail: email, password }
      : { username, email, password };

    try {
      const baseUrl = 'https://d-english-backend.onrender.com';;
      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed. Is the backend server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Animated background blobs */}
      <div style={{
        position: 'absolute', width: '500px', height: '500px',
        borderRadius: '50%', top: '-150px', left: '-100px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        animation: 'float 8s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', width: '400px', height: '400px',
        borderRadius: '50%', bottom: '-100px', right: '-80px',
        background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)',
        animation: 'float 10s ease-in-out infinite reverse',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', width: '100%', maxWidth: '900px', gap: '0', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>

        {/* Left Panel — Branding */}
        <div style={{
          flex: 1, display: 'none',
          flexDirection: 'column', justifyContent: 'center', padding: '48px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(168,85,247,0.15) 100%)',
          borderRight: '1px solid var(--border-color)',
          backdropFilter: 'blur(20px)'
        }} className="auth-brand-panel">
          <div style={{ display: 'inline-flex', background: 'var(--primary-gradient)', padding: '14px', borderRadius: '16px', color: 'white', marginBottom: '24px', width: 'fit-content', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}>
            <Sparkles size={36} />
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: '800', lineHeight: '1.2', marginBottom: '8px' }}>
            D English<br />
            <span style={{ fontSize: '22px', fontWeight: '600', color: 'var(--text-muted)' }}>IELTS Prep Platform</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginTop: '12px', lineHeight: '1.7', marginBottom: '32px' }}>
            Your all-in-one platform to achieve an IELTS Band 7+ score. Practice smarter, track progress, and compete globally.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>{f.icon}</span>
                <span style={{ fontSize: '14px', color: '#cbd5e1' }}>{f.text}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '40px', padding: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: '1.5' }}>
              "D English helped me jump from Band 5.5 to 7.5 in just 3 months. The daily practice and AI feedback are game-changers."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: 'white' }}>N</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700' }}>Nargiza T.</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>IELTS Band 7.5 — Tashkent</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="glass-panel auth-card" style={{ borderRadius: '0', maxWidth: '440px', width: '100%', border: 'none' }}>
          {loading && <div className="scanner-line"></div>}

          <div style={{ display: 'inline-flex', background: 'var(--primary-gradient)', padding: '12px', borderRadius: '14px', color: 'white', marginBottom: '20px', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
            <Sparkles size={28} />
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 6px 0', lineHeight: '1.2' }}>
            {isLogin ? 'Welcome back!' : 'Create account'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '28px' }}>
            {isLogin ? 'Sign in to continue your IELTS journey' : 'Join thousands of IELTS learners today'}
          </p>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '10px', padding: '12px 14px', color: '#f87171',
              fontSize: '13px', marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {!isLogin && (
              <div className="auth-input-group" style={{ marginBottom: '0' }}>
                <label htmlFor="username" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase' }}>
                  <User size={12} /> Username
                </label>
                <input
                  id="username"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. jondoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="auth-input-group" style={{ marginBottom: '0' }}>
              <label htmlFor="email" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase' }}>
                <Mail size={12} /> {isLogin ? 'Username or Email' : 'Email Address'}
              </label>
              <input
                id="email"
                type="text"
                className="auth-input"
                placeholder={isLogin ? 'johndoe or john@example.com' : 'john@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-input-group" style={{ marginBottom: '8px', position: 'relative' }}>
              <label htmlFor="password" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '700', textTransform: 'uppercase' }}>
                <Lock size={12} /> Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="glow-btn"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin-coin 0.8s linear infinite' }} />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="auth-toggle" style={{ marginTop: '20px' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => { setIsLogin(!isLogin); setError(''); setUsername(''); setEmail(''); setPassword(''); }}>
              {isLogin ? 'Sign Up Free' : 'Sign In'}
            </span>
          </p>

          {isLogin && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                🎓 New to D English? Start with <strong style={{ color: 'var(--primary)' }}>100 free coins</strong> on registration!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
