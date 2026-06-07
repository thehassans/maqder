import React, { useState, useCallback } from 'react';

// ─── Severity config ───────────────────────────────────────────────────────────
const SEVERITY = [
  {
    id: 'Scratch',
    label: 'Scratch',
    icon: '〜',
    color: '#FBBF24',
    bg: 'rgba(251,191,36,0.12)',
    ring: 'rgba(251,191,36,0.35)',
    glow: '0 0 14px rgba(251,191,36,0.6)',
    border: 'rgba(251,191,36,0.4)',
  },
  {
    id: 'Dent',
    label: 'Dent',
    icon: '◉',
    color: '#F97316',
    bg: 'rgba(249,115,22,0.12)',
    ring: 'rgba(249,115,22,0.35)',
    glow: '0 0 14px rgba(249,115,22,0.6)',
    border: 'rgba(249,115,22,0.4)',
  },
  {
    id: 'Major',
    label: 'Major',
    icon: '✕',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.12)',
    ring: 'rgba(239,68,68,0.35)',
    glow: '0 0 18px rgba(239,68,68,0.7)',
    border: 'rgba(239,68,68,0.4)',
  },
];

const severityMap = Object.fromEntries(SEVERITY.map(s => [s.id, s]));

// ─── Zone definitions (top-down sedan) ────────────────────────────────────────
const ZONES = [
  { id: 'front_bumper',     label: 'Front Bumper',       points: '152,22 248,22 268,54 132,54',       cx: 200, cy: 38 },
  { id: 'hood',             label: 'Hood',                points: '132,54 268,54 278,132 122,132',     cx: 200, cy: 93 },
  { id: 'windshield',       label: 'Windshield',          points: '122,132 278,132 272,178 128,178',   cx: 200, cy: 155 },
  { id: 'roof',             label: 'Roof',                points: '128,178 272,178 272,258 128,258',   cx: 200, cy: 218 },
  { id: 'rear_window',      label: 'Rear Window',         points: '128,258 272,258 278,298 122,298',   cx: 200, cy: 278 },
  { id: 'trunk',            label: 'Trunk',               points: '122,298 278,298 268,368 132,368',   cx: 200, cy: 333 },
  { id: 'rear_bumper',      label: 'Rear Bumper',         points: '132,368 268,368 248,396 152,396',   cx: 200, cy: 382 },
  { id: 'front_left_door',  label: 'Front Left Door',     points: '86,148 122,148 122,238 84,238',     cx: 103, cy: 193 },
  { id: 'rear_left_door',   label: 'Rear Left Door',      points: '84,238 122,238 122,298 82,298',     cx: 102, cy: 268 },
  { id: 'front_right_door', label: 'Front Right Door',    points: '278,148 314,148 316,238 278,238',   cx: 297, cy: 193 },
  { id: 'rear_right_door',  label: 'Rear Right Door',     points: '278,238 316,238 318,298 278,298',   cx: 298, cy: 268 },
  { id: 'left_fender_f',    label: 'Left Front Fender',   points: '86,56 122,56 122,148 84,148',       cx: 103, cy: 102 },
  { id: 'right_fender_f',   label: 'Right Front Fender',  points: '278,56 314,56 316,148 278,148',     cx: 297, cy: 102 },
  { id: 'left_fender_r',    label: 'Left Rear Fender',    points: '82,298 122,298 122,368 84,368',     cx: 102, cy: 333 },
  { id: 'right_fender_r',   label: 'Right Rear Fender',   points: '278,298 318,298 316,368 278,368',   cx: 298, cy: 333 },
];

// Wheels
const WHEELS = [
  { x: 60, y: 76,  w: 28, h: 58, rx: 10, label: 'FL' },
  { x: 312, y: 76, w: 28, h: 58, rx: 10, label: 'FR' },
  { x: 58, y: 308, w: 28, h: 58, rx: 10, label: 'RL' },
  { x: 314, y: 308, w: 28, h: 58, rx: 10, label: 'RR' },
];

// ─── Pulsing ring animation (CSS keyframes injected once) ─────────────────────
const PULSE_CSS = `
@keyframes dmg-pulse {
  0%   { opacity: 0.7; r: 10; }
  70%  { opacity: 0;   r: 20; }
  100% { opacity: 0;   r: 20; }
}
@keyframes dmg-spin {
  from { transform-origin: center; transform: rotate(0deg); }
  to   { transform-origin: center; transform: rotate(360deg); }
}
@keyframes dmg-fade-in {
  from { opacity: 0; transform: scale(0.5); }
  to   { opacity: 1; transform: scale(1); }
}
.dmg-pin-enter { animation: dmg-fade-in 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards; }
.dmg-pulse-ring { animation: dmg-pulse 1.8s ease-out infinite; }
`;

let cssInjected = false;
function injectCSS() {
  if (cssInjected || typeof document === 'undefined') return;
  const tag = document.createElement('style');
  tag.textContent = PULSE_CSS;
  document.head.appendChild(tag);
  cssInjected = true;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function DamageMatrix({ initialPins = [], onPinsChange, readOnly = false }) {
  injectCSS();
  const [pins,    setPins]    = useState(initialPins);
  const [sel,     setSel]     = useState('Scratch');
  const [hovered, setHovered] = useState(null);

  const getPinForZone = useCallback(id => pins.find(p => p.zoneId === id), [pins]);

  const handleZoneClick = useCallback(zone => {
    if (readOnly) return;
    const idx = pins.findIndex(p => p.zoneId === zone.id);
    let updated;
    if (idx !== -1 && pins[idx].severity === sel) {
      updated = pins.filter((_, i) => i !== idx);
    } else if (idx !== -1) {
      updated = pins.map((p, i) => i === idx ? { ...p, severity: sel } : p);
    } else {
      updated = [...pins, { zoneId: zone.id, panel: zone.label, severity: sel, x: zone.cx, y: zone.cy }];
    }
    setPins(updated);
    onPinsChange?.(updated);
  }, [pins, sel, readOnly, onPinsChange]);

  const removePin = useCallback(zoneId => {
    if (readOnly) return;
    const updated = pins.filter(p => p.zoneId !== zoneId);
    setPins(updated);
    onPinsChange?.(updated);
  }, [pins, readOnly, onPinsChange]);

  const clearAll = useCallback(() => {
    setPins([]); onPinsChange?.([]);
  }, [onPinsChange]);

  return (
    <div style={{
      background: 'linear-gradient(160deg, #0a0f1e 0%, #0d1525 40%, #0a1020 100%)',
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: '0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '18px 22px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Badge */}
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(99,179,237,0.2), rgba(59,130,246,0.1))',
              border: '1px solid rgba(99,179,237,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 12px rgba(59,130,246,0.2)',
            }}>
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                <path d="M10 2L4 6v8l6 4 6-4V6L10 2z" stroke="rgba(147,197,253,0.8)" strokeWidth="1.2" fill="rgba(59,130,246,0.15)" strokeLinejoin="round"/>
                <circle cx="10" cy="10" r="2" fill="rgba(147,197,253,0.7)"/>
              </svg>
            </div>
            <div>
              <p style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 14, letterSpacing: '-0.2px', margin: 0 }}>
                Vehicle Damage Inspector
              </p>
              <p style={{ color: 'rgba(148,163,184,0.7)', fontSize: 11, margin: 0, marginTop: 1 }}>
                {readOnly ? 'Recorded damage markers — read only' : 'Select severity · Click a panel to record damage'}
              </p>
            </div>
          </div>

          {/* Severity selector */}
          {!readOnly && (
            <div style={{ display: 'flex', gap: 6 }}>
              {SEVERITY.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSel(s.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px',
                    borderRadius: 10,
                    border: `1.5px solid ${sel === s.id ? s.color : 'rgba(255,255,255,0.08)'}`,
                    background: sel === s.id ? s.bg : 'rgba(255,255,255,0.03)',
                    color: sel === s.id ? s.color : 'rgba(148,163,184,0.6)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: sel === s.id ? s.glow : 'none',
                    outline: 'none',
                  }}
                >
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: s.color,
                    boxShadow: sel === s.id ? `0 0 8px ${s.color}` : 'none',
                    flexShrink: 0,
                    display: 'inline-block',
                  }} />
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Body: SVG + Log ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'stretch', flexWrap: 'wrap' }}>

        {/* SVG Panel */}
        <div style={{ flex: '1 1 260px', padding: '20px 12px 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.8))' }}>
            <svg viewBox="0 0 400 430" style={{ width: '100%', maxWidth: 360, minWidth: 220 }}>
              <defs>
                {/* Body panel gradient — cool steel blue */}
                <linearGradient id="di-body" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.22"/>
                  <stop offset="50%"  stopColor="#2563eb" stopOpacity="0.10"/>
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.06"/>
                </linearGradient>
                {/* Side panel slightly lighter */}
                <linearGradient id="di-side" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#60a5fa" stopOpacity="0.22"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.07"/>
                </linearGradient>
                {/* Glass */}
                <linearGradient id="di-glass" x1="0%" y1="0%" x2="80%" y2="100%">
                  <stop offset="0%"   stopColor="#bae6fd" stopOpacity="0.45"/>
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.10"/>
                </linearGradient>
                {/* Roof highlight */}
                <linearGradient id="di-roof" x1="0%" y1="0%" x2="10%" y2="100%">
                  <stop offset="0%"   stopColor="#e0f2fe" stopOpacity="0.18"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
                </linearGradient>
                {/* Wheel */}
                <linearGradient id="di-wheel" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%"   stopColor="#475569"/>
                  <stop offset="100%" stopColor="#0f172a"/>
                </linearGradient>
                {/* Wheel rim */}
                <radialGradient id="di-rim" cx="50%" cy="35%" r="60%">
                  <stop offset="0%"   stopColor="#94a3b8" stopOpacity="0.5"/>
                  <stop offset="100%" stopColor="#1e293b" stopOpacity="0.1"/>
                </radialGradient>
                {/* Hood highlight */}
                <linearGradient id="di-hood-hi" x1="20%" y1="0%" x2="80%" y2="100%">
                  <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.10"/>
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.00"/>
                </linearGradient>
                {/* Glow filter for pins */}
                <filter id="di-pin-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3.5" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                {/* Body shadow */}
                <filter id="di-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.5"/>
                </filter>
                {/* Ambient light on body */}
                <filter id="di-ambient">
                  <feColorMatrix type="matrix" values="1 0 0 0 0.02  0 1 0 0 0.04  0 0 1 0 0.08  0 0 0 1 0"/>
                </filter>
              </defs>

              {/* ── Ground shadow ── */}
              <ellipse cx="200" cy="415" rx="120" ry="8"
                fill="rgba(0,0,0,0.4)" filter="url(#di-shadow)"/>

              {/* ── Car silhouette (outer body) ── */}
              <polygon
                points="150,20 250,20 318,58 322,378 252,405 148,405 78,378 82,58"
                fill="url(#di-body)"
                stroke="rgba(147,197,253,0.18)"
                strokeWidth="1.5"
                filter="url(#di-ambient)"
              />

              {/* ── Interactive Zones ── */}
              {ZONES.map(zone => {
                const pin   = getPinForZone(zone.id);
                const sev   = pin ? severityMap[pin.severity] : null;
                const isHov = hovered === zone.id;
                const isSide = zone.id.includes('door') || zone.id.includes('fender');
                return (
                  <g key={zone.id}>
                    <polygon
                      points={zone.points}
                      fill={
                        pin
                          ? `${sev.color}26`
                          : isHov
                          ? 'rgba(147,197,253,0.14)'
                          : `url(#${isSide ? 'di-side' : 'di-body'})`
                      }
                      stroke={
                        pin
                          ? sev.color
                          : isHov
                          ? 'rgba(147,197,253,0.8)'
                          : 'rgba(147,197,253,0.14)'
                      }
                      strokeWidth={pin ? 1.5 : isHov ? 1.2 : 0.7}
                      style={{
                        cursor: readOnly ? 'default' : 'pointer',
                        transition: 'fill 0.15s, stroke 0.15s',
                        filter: pin ? `drop-shadow(0 0 7px ${sev.color}88)` : 'none',
                      }}
                      onMouseEnter={() => setHovered(zone.id)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => handleZoneClick(zone)}
                    />

                    {/* Zone label on hover */}
                    {isHov && !pin && !readOnly && (
                      <text
                        x={zone.cx} y={zone.cy}
                        textAnchor="middle" dominantBaseline="middle"
                        fill="rgba(186,230,253,0.95)" fontSize="7.5" fontWeight="700"
                        style={{ pointerEvents: 'none', letterSpacing: '0.04em' }}
                      >
                        {zone.label}
                      </text>
                    )}

                    {/* Damage pin with pulse */}
                    {pin && (
                      <g filter="url(#di-pin-glow)" style={{ pointerEvents: 'none' }} className="dmg-pin-enter">
                        {/* Outer pulse ring */}
                        <circle cx={zone.cx} cy={zone.cy} r="10"
                          fill="none" stroke={sev.color} strokeWidth="1.5" opacity="0"
                          className="dmg-pulse-ring"
                          style={{ transformOrigin: `${zone.cx}px ${zone.cy}px` }}
                        />
                        {/* Halo */}
                        <circle cx={zone.cx} cy={zone.cy} r="11"
                          fill={sev.color} opacity="0.15"/>
                        {/* Pin body */}
                        <circle cx={zone.cx} cy={zone.cy} r="7"
                          fill={sev.color}
                          stroke="rgba(255,255,255,0.9)" strokeWidth="1.5"
                          style={{ filter: `drop-shadow(0 2px 6px ${sev.color}cc)` }}
                        />
                        {/* Pin icon */}
                        <text
                          x={zone.cx} y={zone.cy + 0.5}
                          textAnchor="middle" dominantBaseline="middle"
                          fill="white" fontSize="7" fontWeight="900"
                          style={{ pointerEvents: 'none' }}
                        >
                          {pin.severity === 'Major' ? '✕' : pin.severity === 'Dent' ? '◉' : '〜'}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* ── Windshield ── */}
              <polygon points="130,135 270,135 264,176 136,176"
                fill="url(#di-glass)" stroke="rgba(186,230,253,0.2)" strokeWidth="0.7"
                style={{ pointerEvents: 'none' }}/>
              {/* Glass horizontal reflection streak */}
              <line x1="148" y1="145" x2="252" y2="145"
                stroke="rgba(255,255,255,0.12)" strokeWidth="4" strokeLinecap="round"
                style={{ pointerEvents: 'none' }}/>

              {/* ── Rear window ── */}
              <polygon points="136,258 264,258 270,297 130,297"
                fill="url(#di-glass)" stroke="rgba(186,230,253,0.2)" strokeWidth="0.7"
                style={{ pointerEvents: 'none' }}/>
              <line x1="148" y1="268" x2="252" y2="268"
                stroke="rgba(255,255,255,0.09)" strokeWidth="3" strokeLinecap="round"
                style={{ pointerEvents: 'none' }}/>

              {/* ── Roof ── */}
              <polygon points="136,178 264,178 264,256 136,256"
                fill="url(#di-roof)" stroke="rgba(186,230,253,0.10)" strokeWidth="0.5"
                style={{ pointerEvents: 'none' }}/>
              {/* Roof highlight streak */}
              <line x1="152" y1="183" x2="148" y2="251"
                stroke="rgba(255,255,255,0.09)" strokeWidth="10" strokeLinecap="round"
                style={{ pointerEvents: 'none' }}/>

              {/* ── Hood highlight ── */}
              <polygon points="145,58 255,58 262,128 138,128"
                fill="url(#di-hood-hi)" stroke="none"
                style={{ pointerEvents: 'none' }}/>

              {/* ── Headlights ── */}
              <rect x="140" y="24" width="36" height="14" rx="5"
                fill="rgba(255,255,240,0.08)" stroke="rgba(255,255,200,0.3)" strokeWidth="0.8"
                style={{ pointerEvents: 'none' }}/>
              <rect x="224" y="24" width="36" height="14" rx="5"
                fill="rgba(255,255,240,0.08)" stroke="rgba(255,255,200,0.3)" strokeWidth="0.8"
                style={{ pointerEvents: 'none' }}/>
              {/* Headlight DRL lines */}
              <line x1="144" y1="28" x2="172" y2="28" stroke="rgba(255,255,200,0.5)" strokeWidth="1.5" strokeLinecap="round" style={{ pointerEvents: 'none' }}/>
              <line x1="228" y1="28" x2="256" y2="28" stroke="rgba(255,255,200,0.5)" strokeWidth="1.5" strokeLinecap="round" style={{ pointerEvents: 'none' }}/>

              {/* ── Taillights ── */}
              <rect x="140" y="382" width="36" height="13" rx="4"
                fill="rgba(239,68,68,0.12)" stroke="rgba(239,68,68,0.4)" strokeWidth="0.8"
                style={{ pointerEvents: 'none' }}/>
              <rect x="224" y="382" width="36" height="13" rx="4"
                fill="rgba(239,68,68,0.12)" stroke="rgba(239,68,68,0.4)" strokeWidth="0.8"
                style={{ pointerEvents: 'none' }}/>
              <line x1="144" y1="388" x2="172" y2="388" stroke="rgba(239,68,68,0.6)" strokeWidth="1.5" strokeLinecap="round" style={{ pointerEvents: 'none' }}/>
              <line x1="228" y1="388" x2="256" y2="388" stroke="rgba(239,68,68,0.6)" strokeWidth="1.5" strokeLinecap="round" style={{ pointerEvents: 'none' }}/>

              {/* ── Side mirror hints ── */}
              <ellipse cx="79" cy="134" rx="7" ry="4" fill="rgba(96,165,250,0.15)" stroke="rgba(147,197,253,0.3)" strokeWidth="0.7" style={{ pointerEvents: 'none' }}/>
              <ellipse cx="321" cy="134" rx="7" ry="4" fill="rgba(96,165,250,0.15)" stroke="rgba(147,197,253,0.3)" strokeWidth="0.7" style={{ pointerEvents: 'none' }}/>

              {/* ── Door handle hints ── */}
              {[{ x: 90, y: 203 }, { x: 90, y: 272 }, { x: 296, y: 203 }, { x: 296, y: 272 }].map((h, i) => (
                <rect key={i} x={h.x} y={h.y} width={14} height={4} rx={2}
                  fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"
                  style={{ pointerEvents: 'none' }}/>
              ))}

              {/* ── Door panel seam lines ── */}
              {/* Left */}
              <line x1="86" y1="148" x2="122" y2="148" stroke="rgba(147,197,253,0.20)" strokeWidth="0.6"/>
              <line x1="84" y1="238" x2="122" y2="238" stroke="rgba(147,197,253,0.20)" strokeWidth="0.6"/>
              {/* Right */}
              <line x1="278" y1="148" x2="314" y2="148" stroke="rgba(147,197,253,0.20)" strokeWidth="0.6"/>
              <line x1="278" y1="238" x2="316" y2="238" stroke="rgba(147,197,253,0.20)" strokeWidth="0.6"/>

              {/* ── Wheels ── */}
              {WHEELS.map((w, i) => (
                <g key={i}>
                  {/* Tyre */}
                  <rect x={w.x} y={w.y} width={w.w} height={w.h} rx={w.rx}
                    fill="url(#di-wheel)" stroke="rgba(71,85,105,0.6)" strokeWidth="1.2"/>
                  {/* Rim */}
                  <rect x={w.x+4} y={w.y+6} width={w.w-8} height={w.h-12} rx={w.rx-3}
                    fill="url(#di-rim)" stroke="rgba(148,163,184,0.3)" strokeWidth="0.8"/>
                  {/* Hub */}
                  <circle cx={w.x+w.w/2} cy={w.y+w.h/2} r="5"
                    fill="rgba(30,41,59,0.9)" stroke="rgba(148,163,184,0.4)" strokeWidth="0.8"/>
                  <circle cx={w.x+w.w/2} cy={w.y+w.h/2} r="2"
                    fill="rgba(148,163,184,0.5)"/>
                  {/* Spoke hints */}
                  {[0,60,120,180,240,300].map(deg => {
                    const cx = w.x+w.w/2, cy = w.y+w.h/2;
                    const r  = 4;
                    const rad = (deg * Math.PI) / 180;
                    return (
                      <line key={deg}
                        x1={cx} y1={cy}
                        x2={cx + Math.cos(rad)*r} y2={cy + Math.sin(rad)*r}
                        stroke="rgba(148,163,184,0.25)" strokeWidth="0.6"/>
                    );
                  })}
                </g>
              ))}

              {/* ── Cardinal labels ── */}
              <text x="200" y="11" textAnchor="middle" fill="rgba(148,163,184,0.45)" fontSize="6.5" fontWeight="700" letterSpacing="2.5">FRONT</text>
              <text x="200" y="422" textAnchor="middle" fill="rgba(148,163,184,0.45)" fontSize="6.5" fontWeight="700" letterSpacing="2.5">REAR</text>
              <text x="24" y="215" textAnchor="middle" fill="rgba(148,163,184,0.40)" fontSize="6" fontWeight="700" letterSpacing="2" transform="rotate(-90,24,215)">LEFT</text>
              <text x="376" y="215" textAnchor="middle" fill="rgba(148,163,184,0.40)" fontSize="6" fontWeight="700" letterSpacing="2" transform="rotate(90,376,215)">RIGHT</text>
            </svg>

            {/* Floor reflection */}
            <div style={{
              position: 'absolute', bottom: -14, left: '20%', right: '20%', height: 14,
              background: 'radial-gradient(ellipse, rgba(59,130,246,0.18) 0%, transparent 70%)',
              filter: 'blur(8px)',
            }}/>
          </div>
        </div>

        {/* ── Damage Log ──────────────────────────────────────────────────── */}
        <div style={{
          width: 220, flexShrink: 0,
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column',
          padding: '20px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ color: 'rgba(148,163,184,0.8)', fontWeight: 700, fontSize: 10, letterSpacing: '2px', margin: 0, textTransform: 'uppercase' }}>
              Damage Log
            </p>
            {pins.length > 0 && !readOnly && (
              <button
                onClick={clearAll}
                style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 6, color: 'rgba(239,68,68,0.7)', fontSize: 10, fontWeight: 700,
                  padding: '2px 8px', cursor: 'pointer', lineHeight: 1.6,
                }}
              >Clear</button>
            )}
          </div>

          {pins.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '12px 0' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, marginBottom: 10,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(148,163,184,0.35)" strokeWidth="1.5">
                  <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p style={{ color: 'rgba(100,116,139,0.9)', fontSize: 12, fontWeight: 600, margin: 0 }}>No damage recorded</p>
              {!readOnly && <p style={{ color: 'rgba(71,85,105,0.8)', fontSize: 10, margin: '4px 0 0', lineHeight: 1.5 }}>Click zones on the vehicle to mark</p>}
            </div>
          ) : (
            <>
              {/* Severity summary pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                {SEVERITY.map(s => {
                  const cnt = pins.filter(p => p.severity === s.id).length;
                  if (!cnt) return null;
                  return (
                    <div key={s.id} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 20,
                      background: s.bg, border: `1px solid ${s.border}`,
                      color: s.color, fontSize: 10, fontWeight: 700,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, display: 'inline-block' }}/>
                      {cnt}× {s.label}
                    </div>
                  );
                })}
              </div>

              {/* Pin list */}
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, overflowY: 'auto', maxHeight: 280, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pins.map((pin, idx) => {
                  const sev = severityMap[pin.severity];
                  return (
                    <li key={idx} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 9,
                      padding: '9px 11px', borderRadius: 11,
                      background: sev.bg, border: `1px solid ${sev.border}`,
                    }}>
                      {/* Severity dot */}
                      <div style={{
                        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                        background: `${sev.color}22`, border: `1.5px solid ${sev.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: sev.color, fontSize: 9, fontWeight: 900,
                        marginTop: 1,
                      }}>
                        {sev.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: '#f1f5f9', fontSize: 11, fontWeight: 600, margin: 0, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {pin.panel}
                        </p>
                        <p style={{ color: sev.color, fontSize: 10, fontWeight: 700, margin: '2px 0 0', opacity: 0.85 }}>
                          {pin.severity}
                        </p>
                      </div>
                      {!readOnly && (
                        <button
                          onClick={() => removePin(pin.zoneId)}
                          style={{
                            background: 'none', border: 'none', padding: 0,
                            color: 'rgba(148,163,184,0.4)', cursor: 'pointer',
                            fontSize: 13, lineHeight: 1, flexShrink: 0,
                            transition: 'color 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = 'rgba(239,68,68,0.8)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(148,163,184,0.4)'}
                          title="Remove"
                        >✕</button>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 12, paddingTop: 10 }}>
                <p style={{ color: 'rgba(100,116,139,0.8)', fontSize: 10, margin: 0 }}>
                  {pins.length} zone{pins.length !== 1 ? 's' : ''} marked
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Footer hint ──────────────────────────────────────────────────────── */}
      {!readOnly && (
        <div style={{
          padding: '10px 22px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(148,163,184,0.5)', fontSize: 8, fontWeight: 900,
          }}>i</div>
          <span style={{ color: 'rgba(100,116,139,0.7)', fontSize: 10.5 }}>
            Click a panel to mark · Click again to cycle severity · Click ✕ in log to remove
          </span>
        </div>
      )}
    </div>
  );
}
