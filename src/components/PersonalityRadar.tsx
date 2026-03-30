'use client';

import type { ScoringFeatures } from '@/lib/types';

// Map discrete values to numeric for radar axes
function attachmentToNum(v: string): number {
  switch (v) {
    case 'secure': return 85;
    case 'anxious': return 55;
    case 'avoidant': return 40;
    case 'mixed': return 50;
    default: return 50;
  }
}

function conflictToNum(v: string): number {
  switch (v) {
    case 'collaborator': return 90;
    case 'compromiser': return 70;
    case 'confronter': return 50;
    case 'avoider': return 30;
    default: return 50;
  }
}

function paceToNum(v: string): number {
  switch (v) {
    case 'slow': return 30;
    case 'moderate': return 60;
    case 'fast': return 90;
    default: return 50;
  }
}

const LABELS = ['社交能量', '情感深度', '安全感', '溝通力', '生活步調'];

interface Props {
  features: ScoringFeatures;
  size?: number;
}

export default function PersonalityRadar({ features, size = 180 }: Props) {
  const values = [
    features.socialEnergy,
    features.emotionalDepth,
    attachmentToNum(features.attachmentStyle),
    conflictToNum(features.conflictStyle),
    paceToNum(features.lifePace),
  ];

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  const rings = [0.33, 0.66, 1];
  const n = values.length;
  const angleStep = (Math.PI * 2) / n;
  const startAngle = -Math.PI / 2; // top

  const getPoint = (i: number, scale: number) => {
    const angle = startAngle + i * angleStep;
    return { x: cx + r * scale * Math.cos(angle), y: cy + r * scale * Math.sin(angle) };
  };

  // Polygon path for values
  const valuePath = values
    .map((v, i) => {
      const p = getPoint(i, v / 100);
      return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(' ') + ' Z';

  // Love language tag
  const loveLangMap: Record<string, string> = {
    'quality_time': '優質相處',
    'words_of_affirmation': '肯定話語',
    'physical_touch': '肢體接觸',
    'acts_of_service': '服務行動',
    'receiving_gifts': '收禮物',
  };
  const loveLang = loveLangMap[features.loveLanguage] || features.loveLanguage;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="個性雷達圖">
        {/* Grid rings */}
        {rings.map((scale) => (
          <polygon
            key={scale}
            points={Array.from({ length: n }, (_, i) => {
              const p = getPoint(i, scale);
              return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
            }).join(' ')}
            fill="none"
            stroke="rgba(255,140,107,0.12)"
            strokeWidth="0.8"
          />
        ))}
        {/* Axis lines */}
        {Array.from({ length: n }, (_, i) => {
          const p = getPoint(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,140,107,0.1)" strokeWidth="0.6" />;
        })}
        {/* Value polygon */}
        <path d={valuePath} fill="rgba(255,140,107,0.15)" stroke="var(--primary)" strokeWidth="1.5" strokeLinejoin="round" />
        {/* Value dots */}
        {values.map((v, i) => {
          const p = getPoint(i, v / 100);
          return <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--primary)" />;
        })}
        {/* Labels */}
        {LABELS.map((label, i) => {
          const p = getPoint(i, 1.22);
          return (
            <text
              key={label}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--text-secondary)"
              fontSize="10"
              fontWeight="500"
            >
              {label}
            </text>
          );
        })}
      </svg>
      {/* Love language badge */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-text-secondary">愛的語言：</span>
        <span className="pill text-[11px]">💕 {loveLang}</span>
      </div>
    </div>
  );
}
