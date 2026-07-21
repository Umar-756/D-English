import React, { useState, useRef, useEffect } from 'react';
import { Download, Check, User, Award, Star, Zap } from 'lucide-react';

// 12 ta SVG avatar emoji (emoji-tabanlı, hech qanday rasm kerak emas)
const AVATARS = [
  { id: 'avatar_1',  emoji: '🧑‍💻', label: 'Coder' },
  { id: 'avatar_2',  emoji: '👩‍🎓', label: 'Graduate' },
  { id: 'avatar_3',  emoji: '🧑‍🏫', label: 'Teacher' },
  { id: 'avatar_4',  emoji: '🦸',   label: 'Hero' },
  { id: 'avatar_5',  emoji: '🧑‍🚀', label: 'Astronaut' },
  { id: 'avatar_6',  emoji: '🎓',   label: 'Scholar' },
  { id: 'avatar_7',  emoji: '🧑‍🔬', label: 'Scientist' },
  { id: 'avatar_8',  emoji: '🦊',   label: 'Fox' },
  { id: 'avatar_9',  emoji: '🐉',   label: 'Dragon' },
  { id: 'avatar_10', emoji: '🌟',   label: 'Star' },
  { id: 'avatar_11', emoji: '⚡',   label: 'Lightning' },
  { id: 'avatar_12', emoji: '🏆',   label: 'Champion' },
];

export function getAvatarEmoji(avatarId) {
  return AVATARS.find(a => a.id === avatarId)?.emoji || '🧑‍💻';
}

export default function Profile({ token, API_URL, user, onAvatarUpdate }) {
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || 'avatar_1');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [certLoading, setCertLoading] = useState(false);
  const canvasRef = useRef(null);

  const bandScore = user ? Math.min(9, (3 + (user.level - 1) * 0.4 + Math.floor(user.xp / 500) * 0.3)).toFixed(1) : '5.0';

  const saveAvatar = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/auth/avatar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatar: selectedAvatar }),
      });
      if (res.ok) {
        setSaved(true);
        onAvatarUpdate(selectedAvatar);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  const generateCertificate = () => {
    setCertLoading(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = 1200, H = 850;
    canvas.width = W;
    canvas.height = H;

    // ── Background gradient
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0a0f1e');
    bg.addColorStop(0.5, '#0d1b2e');
    bg.addColorStop(1, '#0a0f1e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ── Gold border (outer)
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 8;
    ctx.strokeRect(24, 24, W - 48, H - 48);

    // ── Inner border
    ctx.strokeStyle = 'rgba(212,175,55,0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    // ── Corner decorations
    const corners = [[52, 52], [W - 52, 52], [52, H - 52], [W - 52, H - 52]];
    corners.forEach(([cx, cy]) => {
      ctx.fillStyle = '#d4af37';
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();
    });

    // ── Top glow line
    const glow = ctx.createLinearGradient(0, 0, W, 0);
    glow.addColorStop(0, 'transparent');
    glow.addColorStop(0.5, 'rgba(212,175,55,0.6)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 60, W, 2);

    // ── Logo / Platform name
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = 'rgba(212,175,55,0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('D ENGLISH PLATFORM', W / 2, 110);

    // ── Divider star line
    ctx.fillStyle = '#d4af37';
    ctx.font = '18px Arial';
    ctx.fillText('✦  ✦  ✦', W / 2, 140);

    // ── Certificate of Achievement
    ctx.font = 'bold 52px Georgia, serif';
    const titleGrad = ctx.createLinearGradient(W / 2 - 300, 0, W / 2 + 300, 0);
    titleGrad.addColorStop(0, '#d4af37');
    titleGrad.addColorStop(0.5, '#ffe680');
    titleGrad.addColorStop(1, '#d4af37');
    ctx.fillStyle = titleGrad;
    ctx.fillText('Certificate of Achievement', W / 2, 210);

    // ── "This is to certify that"
    ctx.font = '22px Georgia, serif';
    ctx.fillStyle = 'rgba(203,213,225,0.85)';
    ctx.fillText('This is to certify that', W / 2, 270);

    // ── Username
    const avatarEmoji = getAvatarEmoji(user?.avatar || selectedAvatar);
    ctx.font = `bold 58px Arial`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${avatarEmoji}  ${(user?.username || 'Learner').toUpperCase()}`, W / 2, 350);

    // ── "has successfully completed"
    ctx.font = '22px Georgia, serif';
    ctx.fillStyle = 'rgba(203,213,225,0.85)';
    ctx.fillText('has successfully completed the IELTS Preparation Programme', W / 2, 405);
    ctx.fillText('on the D English Platform with the following results:', W / 2, 435);

    // ── Stats boxes
    const stats = [
      { label: 'Estimated Band', value: bandScore, color: '#10b981' },
      { label: 'Total XP', value: (user?.xp || 0).toLocaleString(), color: '#6366f1' },
      { label: 'Level', value: user?.level || 1, color: '#f59e0b' },
      { label: 'Day Streak', value: user?.streak || 0, color: '#ef4444' },
    ];
    const boxW = 200, boxH = 100, gap = 30;
    const totalW = stats.length * boxW + (stats.length - 1) * gap;
    const startX = (W - totalW) / 2;

    stats.forEach((stat, i) => {
      const bx = startX + i * (boxW + gap);
      const by = 470;

      // Box background
      const boxGrad = ctx.createLinearGradient(bx, by, bx, by + boxH);
      boxGrad.addColorStop(0, 'rgba(255,255,255,0.05)');
      boxGrad.addColorStop(1, 'rgba(255,255,255,0.02)');
      ctx.fillStyle = boxGrad;
      ctx.beginPath();
      ctx.roundRect(bx, by, boxW, boxH, 12);
      ctx.fill();

      // Box border
      ctx.strokeStyle = `${stat.color}55`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bx, by, boxW, boxH, 12);
      ctx.stroke();

      // Value
      ctx.font = 'bold 34px Arial';
      ctx.fillStyle = stat.color;
      ctx.textAlign = 'center';
      ctx.fillText(String(stat.value), bx + boxW / 2, by + 50);

      // Label
      ctx.font = '14px Arial';
      ctx.fillStyle = 'rgba(203,213,225,0.7)';
      ctx.fillText(stat.label, bx + boxW / 2, by + 76);
    });

    ctx.textAlign = 'center';

    // ── Date
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    ctx.font = '18px Georgia, serif';
    ctx.fillStyle = 'rgba(203,213,225,0.6)';
    ctx.fillText(`Issued on: ${date}`, W / 2, 620);

    // ── Bottom divider
    ctx.fillStyle = '#d4af37';
    ctx.font = '18px Arial';
    ctx.fillText('✦  ✦  ✦', W / 2, 660);

    // ── Signature lines
    const sigY = 720;
    [[250, 'Dr. Diana'], [W - 250, 'Platform Director']].forEach(([x, name]) => {
      ctx.strokeStyle = 'rgba(212,175,55,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 80, sigY);
      ctx.lineTo(x + 80, sigY);
      ctx.stroke();
      ctx.font = '14px Arial';
      ctx.fillStyle = 'rgba(203,213,225,0.6)';
      ctx.fillText(name, x, sigY + 22);
    });

    // ── Seal
    ctx.beginPath();
    ctx.arc(W / 2, sigY - 10, 52, 0, Math.PI * 2);
    const sealGrad = ctx.createRadialGradient(W / 2, sigY - 10, 0, W / 2, sigY - 10, 52);
    sealGrad.addColorStop(0, 'rgba(212,175,55,0.4)');
    sealGrad.addColorStop(1, 'rgba(212,175,55,0.05)');
    ctx.fillStyle = sealGrad;
    ctx.fill();
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#d4af37';
    ctx.fillText('🏆', W / 2, sigY + 5);

    // ── Download
    const link = document.createElement('a');
    link.download = `D_English_Certificate_${user?.username || 'learner'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setCertLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ── AVATAR SELECTOR */}
      <div className="glass-panel" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
        <div className="scanner-line" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
            {getAvatarEmoji(selectedAvatar)}
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '700' }}>Avatar tanlang</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>Profilingizda va liderlar jadvalida ko'rinadi</p>
          </div>
        </div>

        {/* Avatar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {AVATARS.map(av => {
            const isActive = selectedAvatar === av.id;
            return (
              <button
                key={av.id}
                onClick={() => setSelectedAvatar(av.id)}
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))'
                    : 'rgba(255,255,255,0.03)',
                  border: isActive ? '2px solid var(--primary)' : '2px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '18px 10px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  transform: isActive ? 'scale(1.06)' : 'scale(1)',
                  boxShadow: isActive ? '0 0 20px rgba(99,102,241,0.4)' : 'none',
                  position: 'relative',
                }}
              >
                {isActive && (
                  <div style={{ position: 'absolute', top: '6px', right: '6px', background: 'var(--primary)', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={11} color="#fff" />
                  </div>
                )}
                <span style={{ fontSize: '36px', lineHeight: 1 }}>{av.emoji}</span>
                <span style={{ fontSize: '11px', color: isActive ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '600' }}>{av.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={saveAvatar}
          disabled={saving || saved}
          className="glow-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {saved ? <><Check size={16} /> Saqlandi!</> : saving ? 'Saqlanmoqda...' : <><User size={16} /> Avatarni saqlash</>}
        </button>
      </div>

      {/* ── CERTIFICATE */}
      <div className="glass-panel" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
        <div className="scanner-line" />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #d4af37, #f0c040)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={22} color="#000" />
              </div>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '700' }}>IELTS Sertifikati</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>Yutuqlaringizni tasdiqlang</p>
              </div>
            </div>

            {/* Mini stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px', marginBottom: '24px' }}>
              {[
                { icon: <Star size={16} />, label: 'Estimated Band', value: bandScore, color: '#10b981' },
                { icon: <Zap size={16} />, label: 'Total XP', value: (user?.xp || 0).toLocaleString(), color: '#6366f1' },
                { icon: <Award size={16} />, label: 'Level', value: user?.level || 1, color: '#f59e0b' },
                { icon: '🔥', label: 'Day Streak', value: `${user?.streak || 0} kun`, color: '#ef4444' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: s.color }}>{typeof s.icon === 'string' ? <span style={{ fontSize: '16px' }}>{s.icon}</span> : s.icon}</span>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={generateCertificate}
              disabled={certLoading}
              className="glow-btn"
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'linear-gradient(135deg, #d4af37, #b8941f)',
                boxShadow: '0 0 24px rgba(212,175,55,0.4)',
                color: '#000', fontWeight: '700',
                border: 'none',
              }}
            >
              <Download size={16} />
              {certLoading ? 'Yaratilmoqda...' : 'Sertifikatni yuklab olish (PNG)'}
            </button>
          </div>

          {/* Preview card */}
          <div style={{
            flex: 1, minWidth: '260px', background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1b2e 100%)',
            border: '3px solid #d4af37', borderRadius: '16px', padding: '28px',
            textAlign: 'center', boxShadow: '0 0 40px rgba(212,175,55,0.2)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, #d4af37, transparent)' }} />
            <div style={{ fontSize: '13px', color: '#d4af37', fontWeight: '800', letterSpacing: '2px', marginBottom: '8px' }}>D ENGLISH PLATFORM</div>
            <div style={{ color: 'rgba(212,175,55,0.6)', fontSize: '12px', marginBottom: '16px' }}>✦  ✦  ✦</div>
            <div style={{ fontSize: '16px', fontWeight: '700', background: 'linear-gradient(135deg, #d4af37, #ffe680)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '10px' }}>
              Certificate of Achievement
            </div>
            <div style={{ fontSize: '40px', margin: '12px 0' }}>{getAvatarEmoji(user?.avatar || selectedAvatar)}</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
              {(user?.username || 'Learner').toUpperCase()}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(203,213,225,0.7)', marginBottom: '16px' }}>
              IELTS Preparation Programme
            </div>
            <div style={{ display: 'inline-block', background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', borderRadius: '20px', padding: '6px 18px' }}>
              <span style={{ color: '#10b981', fontWeight: '700', fontSize: '18px' }}>Band {bandScore}</span>
            </div>
            <div style={{ marginTop: '16px', fontSize: '11px', color: 'rgba(212,175,55,0.6)' }}>
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden canvas for certificate generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
