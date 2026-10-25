import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'cyan', badgeText, badgeType = 'info', featured = false }) => {
  const colorMap = {
    cyan: { bg: 'rgba(90, 180, 230, 0.16)', border: 'rgba(90, 180, 230, 0.35)', text: '#0369a1' },
    emerald: { bg: 'rgba(56, 189, 160, 0.14)', border: 'rgba(56, 189, 160, 0.35)', text: '#0f766e' },
    amber: { bg: 'rgba(232, 176, 90, 0.16)', border: 'rgba(232, 176, 90, 0.4)', text: '#b45309' },
    rose: { bg: 'rgba(232, 110, 130, 0.14)', border: 'rgba(232, 110, 130, 0.4)', text: '#be123c' },
    indigo: { bg: 'rgba(123, 108, 200, 0.16)', border: 'rgba(123, 108, 200, 0.35)', text: '#5b4ea8' },
  };

  const scheme = colorMap[color] || colorMap.cyan;

  return (
    <div className={`glass-card ${featured ? 'hero-stat' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</span>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            background: scheme.bg,
            border: `1px solid ${scheme.border}`,
            display: 'grid',
            placeItems: 'center',
            color: scheme.text,
          }}
        >
          {Icon && <Icon size={18} strokeWidth={1.7} />}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: featured ? 36 : 30, fontWeight: 750, letterSpacing: '-0.03em' }}>
          {value}
        </span>
        {badgeText && <span className={`badge badge-${badgeType}`}>{badgeText}</span>}
      </div>
      {subtitle && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</span>}
    </div>
  );
};
