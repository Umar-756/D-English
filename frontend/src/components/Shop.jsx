import React, { useState, useEffect } from 'react';
import { ShoppingBag, BookOpen, FileText, Mic, Sparkles, Award, Heart, CheckCircle, Loader, Lock, Star } from 'lucide-react';

const ICON_MAP = {
  BookOpen: <BookOpen size={28} />,
  FileText: <FileText size={28} />,
  Mic: <Mic size={28} />,
  Sparkles: <Sparkles size={28} />,
  Award: <Award size={28} />,
  Heart: <Heart size={28} />,
  ShoppingBag: <ShoppingBag size={28} />,
};

const CATEGORY_STYLES = {
  Course: { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  Feature: { color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  Skin: { color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
};

export default function Shop({ token, API_URL, user, updateCoinsAndXP, triggerAchievementModal, activeThemeSkin, setActiveThemeSkin }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [message, setMessage] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/shop/items`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setItems(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (item) => {
    if (purchasing || item.purchased) return;
    if (user.coins < item.price) {
      setMessage({ type: 'error', text: `Tangalar yetarli emas! Sizda ${user.coins} tanga bor, kerak ${item.price} tanga.` });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setPurchasing(item.id);
    try {
      const res = await fetch(`${API_URL}/shop/purchase/${item.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `✅ "${item.title}" muvaffaqiyatli sotib olindi!` });
        updateCoinsAndXP(data.newCoins, data.newXP, data.newLevel);
        fetchItems();
        if (data.unlockedAchievement) triggerAchievementModal(data.unlockedAchievement);
      } else {
        setMessage({ type: 'error', text: data.error || 'Xato yuz berdi' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Tarmoq xatosi yuz berdi' });
    } finally {
      setPurchasing(null);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const equipTheme = (itemId) => {
    const themeId = itemId.replace('theme_', '');
    if (activeThemeSkin === themeId) {
      localStorage.removeItem('equipped_theme');
      setActiveThemeSkin('');
      setMessage({ type: 'success', text: '🎨 Default theme equipped!' });
    } else {
      localStorage.setItem('equipped_theme', itemId);
      setActiveThemeSkin(itemId);
      setMessage({ type: 'success', text: `🎨 ${themeId.replace('_', ' ')} theme equipped!` });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const categories = ['All', 'Course', 'Feature', 'Skin'];
  const filtered = activeFilter === 'All' ? items : items.filter(i => i.category === activeFilter);

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', position: 'relative' }}>
        <div className="scanner-line" />
        <Loader size={24} style={{ animation: 'spin-coin 1s linear infinite', color: 'var(--primary)' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading Premium Shop...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fade-in 0.3s ease' }}>
      
      {/* Shop Header */}
      <div className="glass-panel" style={{ padding: '24px 28px', background: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(168,85,247,0.05) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: 'linear-gradient(135deg, #fbbf24, #d4af37)', padding: '12px', borderRadius: '14px', display: 'flex', boxShadow: '0 0 20px rgba(251,191,36,0.3)' }}>
              <ShoppingBag size={24} color="#000" />
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Premium Shop</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Unlock exclusive IELTS tools and themes</p>
            </div>
          </div>
          <div className="badge-item" style={{ background: 'rgba(251,191,36,0.1)', borderColor: 'rgba(251,191,36,0.3)', fontSize: '16px', padding: '10px 18px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fbbf24" style={{ animation: 'spin-coin 3s linear infinite' }}>
              <circle cx="12" cy="12" r="8" />
            </svg>
            <span style={{ fontWeight: '800', color: '#fbbf24' }}>{user?.coins || 0} Coins</span>
          </div>
        </div>
      </div>

      {/* Message Toast */}
      {message && (
        <div style={{
          padding: '14px 20px',
          background: message.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          animation: 'slide-in 0.3s ease',
          color: message.type === 'success' ? '#10b981' : '#ef4444'
        }}>
          {message.text}
        </div>
      )}

      {/* Category Filters */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginRight: '4px' }}>Filter:</span>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            style={{
              padding: '7px 16px', borderRadius: '20px', border: 'none',
              background: activeFilter === cat ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)',
              color: activeFilter === cat ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer', fontWeight: '600', fontSize: '12px',
              transition: 'all 0.2s ease'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Shop Grid */}
      <div className="shop-grid">
        {filtered.map((item) => {
          const catStyle = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.Feature;
          const isTheme = item.id.startsWith('theme_');
          const themeKey = item.id.replace('theme_', '');
          const isEquipped = isTheme && activeThemeSkin === item.id;
          
          return (
            <div key={item.id} className={`glass-panel shop-card glass-panel-hover`} style={{ position: 'relative', overflow: 'hidden' }}>
              {item.purchased && (
                <div style={{
                  position: 'absolute', top: '0', right: '0',
                  background: '#10b981', padding: '4px 12px',
                  borderBottomLeftRadius: '12px', fontSize: '11px',
                  fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <CheckCircle size={12} /> Owned
                </div>
              )}
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '14px',
                    background: item.purchased ? 'var(--primary-gradient)' : catStyle.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: item.purchased ? 'white' : catStyle.color,
                    boxShadow: item.purchased ? '0 0 15px var(--primary-glow)' : 'none'
                  }}>
                    {ICON_MAP[item.icon] || <Star size={28} />}
                  </div>
                  <span style={{
                    fontSize: '11px', padding: '4px 10px', borderRadius: '12px',
                    background: catStyle.bg, color: catStyle.color, fontWeight: '700'
                  }}>
                    {item.category}
                  </span>
                </div>
                
                <h4 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '8px' }}>{item.title}</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', flex: '1' }}>
                  {item.description}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
                {!item.purchased ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="shop-price-tag">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="8" />
                      </svg>
                      {item.price}
                    </div>
                    <button
                      onClick={() => handlePurchase(item)}
                      disabled={purchasing === item.id || user?.coins < item.price}
                      className="glow-btn"
                      style={{
                        padding: '9px 18px', fontSize: '13px',
                        opacity: user?.coins < item.price ? 0.5 : 1
                      }}
                    >
                      {purchasing === item.id ? (
                        <Loader size={14} style={{ animation: 'spin-coin 1s linear infinite' }} />
                      ) : user?.coins < item.price ? (
                        <><Lock size={14} /> Need {item.price - (user?.coins || 0)} more</>
                      ) : (
                        'Purchase'
                      )}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={16} /> Unlocked!
                    </span>
                    {isTheme && (
                      <button
                        onClick={() => equipTheme(item.id)}
                        style={{
                          padding: '9px 18px', fontSize: '13px', borderRadius: '10px',
                          background: isEquipped ? 'rgba(168,85,247,0.2)' : 'rgba(99,102,241,0.1)',
                          border: isEquipped ? '1px solid #a855f7' : '1px solid var(--border-color)',
                          color: isEquipped ? '#a855f7' : 'var(--text-muted)',
                          cursor: 'pointer', fontWeight: '700',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {isEquipped ? '✓ Equipped' : 'Equip Theme'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* How to Earn Coins */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          How to Earn Coins 🪙
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            { icon: '✅', text: 'Answer questions correctly', reward: '+5 to +20' },
            { icon: '🔥', text: 'Maintain daily streak', reward: '+10 bonus' },
            { icon: '🏆', text: 'Unlock achievements', reward: 'Varies' },
            { icon: '✍️', text: 'Submit writing/speaking', reward: '+30 bonus' },
          ].map((tip, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '20px' }}>{tip.icon}</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600' }}>{tip.text}</p>
                <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: '700' }}>{tip.reward} coins</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
