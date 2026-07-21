import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Award, Crown, Medal, Flame, Loader } from 'lucide-react';

export default function Leaderboard({ token, API_URL, currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');

  useEffect(() => {
    fetchLeaderboard();
  }, [timeFilter]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/leaderboard?filter=${timeFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown size={20} style={{ color: '#fbbf24' }} />;
    if (rank === 2) return <Medal size={20} style={{ color: '#cbd5e1' }} />;
    if (rank === 3) return <Medal size={20} style={{ color: '#b45309' }} />;
    return <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)' }}>#{rank}</span>;
  };

  const getAvatarColor = (username) => {
    const colors = [
      'linear-gradient(135deg, #6366f1, #a855f7)',
      'linear-gradient(135deg, #10b981, #059669)',
      'linear-gradient(135deg, #f59e0b, #ef4444)',
      'linear-gradient(135deg, #3b82f6, #6366f1)',
      'linear-gradient(135deg, #ec4899, #a855f7)',
    ];
    return colors[(username?.charCodeAt(0) || 0) % colors.length];
  };

  const initials = (name) => name ? name.slice(0, 2).toUpperCase() : '??';

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', position: 'relative', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div className="scanner-line" />
        <Loader size={24} style={{ animation: 'spin-coin 1s linear infinite', color: 'var(--primary)' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading Top Rankings...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fade-in 0.3s ease' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'linear-gradient(135deg, #fbbf24, #d4af37)', padding: '10px', borderRadius: '12px', display: 'flex' }}>
            <Trophy size={22} color="#000" />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Global IELTS Leaderboard</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{users.length} learners competing</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'weekly', 'monthly'].map(f => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: '20px', border: 'none',
                background: timeFilter === f ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)',
                color: timeFilter === f ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer', fontWeight: '600', fontSize: '12px', textTransform: 'capitalize'
              }}
            >
              {f === 'all' ? 'All Time' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      {top3.length >= 3 && (
        <div className="glass-panel" style={{ padding: '40px 24px 24px', background: 'linear-gradient(180deg, rgba(251,191,36,0.05) 0%, transparent 100%)' }}>
          <div className="pedestal-container">
            {/* 2nd Place */}
            <div className="glass-panel pedestal-card rank-2">
              <div className="rank-badge badge-2">2</div>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: getAvatarColor(top3[1]?.username), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '800', color: 'white' }}>
                {initials(top3[1]?.username)}
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginTop: '8px' }}>{top3[1]?.username}</h4>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>LVL {top3[1]?.level}</span>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#cbd5e1' }}>{top3[1]?.xp?.toLocaleString()} XP</span>
            </div>

            {/* 1st Place */}
            <div className="glass-panel pedestal-card rank-1">
              <div style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)' }}>
                <Crown size={32} style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.6))' }} />
              </div>
              <div className="rank-badge badge-1">1</div>
              <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: getAvatarColor(top3[0]?.username), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '800', color: 'white', boxShadow: '0 0 20px rgba(251,191,36,0.4)' }}>
                {initials(top3[0]?.username)}
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '800', marginTop: '8px' }}>{top3[0]?.username}</h4>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>LVL {top3[0]?.level}</span>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#fbbf24' }}>{top3[0]?.xp?.toLocaleString()} XP</span>
            </div>

            {/* 3rd Place */}
            <div className="glass-panel pedestal-card rank-3">
              <div className="rank-badge badge-3">3</div>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: getAvatarColor(top3[2]?.username), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '800', color: 'white' }}>
                {initials(top3[2]?.username)}
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginTop: '8px' }}>{top3[2]?.username}</h4>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>LVL {top3[2]?.level}</span>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#b45309' }}>{top3[2]?.xp?.toLocaleString()} XP</span>
            </div>
          </div>
        </div>
      )}

      {/* Full Rankings Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '20px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Full Rankings
        </h4>
        {users.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
            No ranking data yet. Start practicing to appear on the leaderboard!
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', fontWeight: '700' }}>Rank</th>
                  <th style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', fontWeight: '700' }}>Learner</th>
                  <th style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', fontWeight: '700' }}>Level</th>
                  <th style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', fontWeight: '700' }}>XP Score</th>
                  <th style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', fontWeight: '700' }}>Streak</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const isCurrentUser = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} style={{ background: isCurrentUser ? 'rgba(99,102,241,0.08)' : 'transparent' }}>
                      <td style={{ width: '60px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px' }}>
                          {getRankIcon(i + 1)}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: getAvatarColor(u.username), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: 'white', flexShrink: 0 }}>
                            {initials(u.username)}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '14px' }}>
                              {u.username}
                              {isCurrentUser && <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--primary)', fontWeight: '700' }}>YOU</span>}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {u.coins || 0} coins
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary)', padding: '3px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                          LVL {u.level || 1}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                          <TrendingUp size={14} style={{ color: '#10b981' }} />
                          <span style={{ fontWeight: '700', fontSize: '14px', color: i === 0 ? '#fbbf24' : 'var(--text-main)' }}>
                            {(u.xp || 0).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                          <Flame size={14} style={{ color: '#f97316' }} />
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#f97316' }}>{u.streak || 0} days</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
