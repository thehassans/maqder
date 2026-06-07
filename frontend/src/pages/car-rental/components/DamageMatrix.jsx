import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';

// ─── Translations ──────────────────────────────────────────────────────────────
const TR = {
  title:        { en: 'Vehicle Damage Inspector', ar: 'فاحص أضرار المركبة' },
  subtitle_edit:{ en: 'Select severity · Click a panel to record damage', ar: 'اختر الشدة · انقر على لوحة لتسجيل الضرر' },
  subtitle_ro:  { en: 'Recorded damage markers — read only', ar: 'علامات الأضرار المسجلة — للقراءة فقط' },
  scratch:      { en: 'Scratch', ar: 'خدش' },
  dent:         { en: 'Dent',    ar: 'حفرة' },
  major:        { en: 'Major',   ar: 'ضرر كبير' },
  damageLog:    { en: 'Damage Log', ar: 'سجل الأضرار' },
  clear:        { en: 'Clear',   ar: 'مسح' },
  noDamage:     { en: 'No damage recorded', ar: 'لا أضرار مسجلة' },
  clickZones:   { en: 'Click zones on the vehicle to mark', ar: 'انقر على مناطق المركبة للتحديد' },
  zonesMarked:  { en: 'zone(s) marked', ar: 'منطقة محددة' },
  hint:         { en: 'Click a panel to mark · Click again to cycle severity · Click ✕ in log to remove', ar: 'انقر لتحديد · انقر مرة أخرى لتغيير الشدة · انقر ✕ في السجل للإزالة' },
  front:        { en: 'FRONT',  ar: 'أمام' },
  rear:         { en: 'REAR',   ar: 'خلف' },
  left:         { en: 'LEFT',   ar: 'يسار' },
  right:        { en: 'RIGHT',  ar: 'يمين' },
};

// Zone label translations
const ZONE_TR = {
  front_bumper:     { en: 'Front Bumper',       ar: 'المصد الأمامي' },
  hood:             { en: 'Hood',               ar: 'الغطاء' },
  windshield:       { en: 'Windshield',         ar: 'الزجاج الأمامي' },
  roof:             { en: 'Roof',               ar: 'السقف' },
  rear_window:      { en: 'Rear Window',        ar: 'الزجاج الخلفي' },
  trunk:            { en: 'Trunk',              ar: 'الصندوق' },
  rear_bumper:      { en: 'Rear Bumper',        ar: 'المصد الخلفي' },
  front_left_door:  { en: 'Front Left Door',    ar: 'الباب الأمامي الأيسر' },
  rear_left_door:   { en: 'Rear Left Door',     ar: 'الباب الخلفي الأيسر' },
  front_right_door: { en: 'Front Right Door',   ar: 'الباب الأمامي الأيمن' },
  rear_right_door:  { en: 'Rear Right Door',    ar: 'الباب الخلفي الأيمن' },
  left_fender_f:    { en: 'Left Front Fender',  ar: 'الرفرف الأمامي الأيسر' },
  right_fender_f:   { en: 'Right Front Fender', ar: 'الرفرف الأمامي الأيمن' },
  left_fender_r:    { en: 'Left Rear Fender',   ar: 'الرفرف الخلفي الأيسر' },
  right_fender_r:   { en: 'Right Rear Fender',  ar: 'الرفرف الخلفي الأيمن' },
};

// ─── Severity config ───────────────────────────────────────────────────────────
const SEVERITY_BASE = [
  { id: 'Scratch', icon: '〜', color: '#FBBF24', bg: 'rgba(251,191,36,0.12)', ring: 'rgba(251,191,36,0.35)', glow: '0 0 14px rgba(251,191,36,0.6)', border: 'rgba(251,191,36,0.4)' },
  { id: 'Dent',    icon: '◉', color: '#F97316', bg: 'rgba(249,115,22,0.12)', ring: 'rgba(249,115,22,0.35)', glow: '0 0 14px rgba(249,115,22,0.6)', border: 'rgba(249,115,22,0.4)' },
  { id: 'Major',   icon: '✕', color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  ring: 'rgba(239,68,68,0.35)',  glow: '0 0 18px rgba(239,68,68,0.7)',  border: 'rgba(239,68,68,0.4)' },
];

// ─── Zone definitions ──────────────────────────────────────────────────────────
const ZONES = [
  { id: 'front_bumper',     points: '152,22 248,22 268,54 132,54',       cx: 200, cy: 38 },
  { id: 'hood',             points: '132,54 268,54 278,132 122,132',     cx: 200, cy: 93 },
  { id: 'windshield',       points: '122,132 278,132 272,178 128,178',   cx: 200, cy: 155 },
  { id: 'roof',             points: '128,178 272,178 272,258 128,258',   cx: 200, cy: 218 },
  { id: 'rear_window',      points: '128,258 272,258 278,298 122,298',   cx: 200, cy: 278 },
  { id: 'trunk',            points: '122,298 278,298 268,368 132,368',   cx: 200, cy: 333 },
  { id: 'rear_bumper',      points: '132,368 268,368 248,396 152,396',   cx: 200, cy: 382 },
  { id: 'front_left_door',  points: '86,148 122,148 122,238 84,238',     cx: 103, cy: 193 },
  { id: 'rear_left_door',   points: '84,238 122,238 122,298 82,298',     cx: 102, cy: 268 },
  { id: 'front_right_door', points: '278,148 314,148 316,238 278,238',   cx: 297, cy: 193 },
  { id: 'rear_right_door',  points: '278,238 316,238 318,298 278,298',   cx: 298, cy: 268 },
  { id: 'left_fender_f',    points: '86,56 122,56 122,148 84,148',       cx: 103, cy: 102 },
  { id: 'right_fender_f',   points: '278,56 314,56 316,148 278,148',     cx: 297, cy: 102 },
  { id: 'left_fender_r',    points: '82,298 122,298 122,368 84,368',     cx: 102, cy: 333 },
  { id: 'right_fender_r',   points: '278,298 318,298 316,368 278,368',   cx: 298, cy: 333 },
];

const WHEELS = [
  { x: 60,  y: 76,  w: 28, h: 58, rx: 10 },
  { x: 312, y: 76,  w: 28, h: 58, rx: 10 },
  { x: 58,  y: 308, w: 28, h: 58, rx: 10 },
  { x: 314, y: 308, w: 28, h: 58, rx: 10 },
];

// ─── CSS animations (injected once) ───────────────────────────────────────────
const PULSE_CSS = `
@keyframes dmg-pulse {
  0%   { opacity: 0.7; r: 10; }
  70%  { opacity: 0;   r: 20; }
  100% { opacity: 0;   r: 20; }
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

  const { language } = useSelector(s => s.ui);
  const isAr = language === 'ar';
  const t = (key) => TR[key]?.[isAr ? 'ar' : 'en'] ?? key;
  const tz = (zoneId) => ZONE_TR[zoneId]?.[isAr ? 'ar' : 'en'] ?? zoneId;

  // Build severity array with translated labels
  const SEVERITY = SEVERITY_BASE.map(s => ({
    ...s,
    label: s.id === 'Scratch' ? t('scratch') : s.id === 'Dent' ? t('dent') : t('major'),
  }));
  const severityMap = Object.fromEntries(SEVERITY.map(s => [s.id, s]));

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
      updated = pins.map((p, i) => i === idx ? { ...p, severity: sel, panel: tz(zone.id) } : p);
    } else {
      updated = [...pins, { zoneId: zone.id, panel: tz(zone.id), severity: sel, x: zone.cx, y: zone.cy }];
    }
    setPins(updated);
    onPinsChange?.(updated);
  }, [pins, sel, readOnly, onPinsChange, isAr]);

  const removePin = useCallback(zoneId => {
    if (readOnly) return;
    const updated = pins.filter(p => p.zoneId !== zoneId);
    setPins(updated);
    onPinsChange?.(updated);
  }, [pins, readOnly, onPinsChange]);

  const clearAll = useCallback(() => { setPins([]); onPinsChange?.([]); }, [onPinsChange]);

  return (
    <div dir="ltr" style={{
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
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(99,179,237,0.2), rgba(59,130,246,0.1))',
              border: '1px solid rgba(99,179,237,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 12px rgba(59,130,246,0.2)', flexShrink: 0,
            }}>
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
                <path d="M10 2L4 6v8l6 4 6-4V6L10 2z" stroke="rgba(147,197,253,0.8)" strokeWidth="1.2" fill="rgba(59,130,246,0.15)" strokeLinejoin="round"/>
                <circle cx="10" cy="10" r="2" fill="rgba(147,197,253,0.7)"/>
              </svg>
            </div>
            <div>
              <p style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 14, letterSpacing: '-0.2px', margin: 0 }}>
                {t('title')}
              </p>
              <p style={{ color: 'rgba(148,163,184,0.7)', fontSize: 11, margin: 0, marginTop: 1 }}>
                {readOnly ? t('subtitle_ro') : t('subtitle_edit')}
              </p>
            </div>
          </div>

          {!readOnly && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SEVERITY.map(s => (
                <button key={s.id} onClick={() => setSel(s.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 10,
                  border: `1.5px solid ${sel === s.id ? s.color : 'rgba(255,255,255,0.08)'}`,
                  background: sel === s.id ? s.bg : 'rgba(255,255,255,0.03)',
                  color: sel === s.id ? s.color : 'rgba(148,163,184,0.6)',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: sel === s.id ? s.glow : 'none', outline: 'none',
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, boxShadow: sel === s.id ? `0 0 8px ${s.color}` : 'none', flexShrink: 0, display: 'inline-block' }} />
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'stretch', flexWrap: 'wrap' }}>

        {/* SVG */}
        <div style={{ flex: '1 1 260px', padding: '20px 12px 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.8))' }}>
            <svg viewBox="0 0 400 430" style={{ width: '100%', maxWidth: 360, minWidth: 220 }}>
              <defs>
                <linearGradient id="di-body" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%"   stopColor="#3b82f6" stopOpacity="0.22"/>
                  <stop offset="50%"  stopColor="#2563eb" stopOpacity="0.10"/>
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.06"/>
                </linearGradient>
                <linearGradient id="di-side" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#60a5fa" stopOpacity="0.22"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.07"/>
                </linearGradient>
                <linearGradient id="di-glass" x1="0%" y1="0%" x2="80%" y2="100%">
                  <stop offset="0%"   stopColor="#bae6fd" stopOpacity="0.45"/>
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.10"/>
                </linearGradient>
                <linearGradient id="di-roof" x1="0%" y1="0%" x2="10%" y2="100%">
                  <stop offset="0%"   stopColor="#e0f2fe" stopOpacity="0.18"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
                </linearGradient>
                <linearGradient id="di-wheel" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%"   stopColor="#475569"/>
                  <stop offset="100%" stopColor="#0f172a"/>
                </linearGradient>
                <radialGradient id="di-rim" cx="50%" cy="35%" r="60%">
                  <stop offset="0%"   stopColor="#94a3b8" stopOpacity="0.5"/>
                  <stop offset="100%" stopColor="#1e293b" stopOpacity="0.1"/>
                </radialGradient>
                <linearGradient id="di-hood-hi" x1="20%" y1="0%" x2="80%" y2="100%">
                  <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.10"/>
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.00"/>
                </linearGradient>
                <filter id="di-pin-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3.5" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="di-shadow">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.5"/>
                </filter>
              </defs>

              {/* Ground shadow */}
              <ellipse cx="200" cy="415" rx="120" ry="8" fill="rgba(0,0,0,0.4)" filter="url(#di-shadow)"/>

              {/* Car silhouette */}
              <polygon points="150,20 250,20 318,58 322,378 252,405 148,405 78,378 82,58"
                fill="url(#di-body)" stroke="rgba(147,197,253,0.18)" strokeWidth="1.5"/>

              {/* Interactive zones */}
              {ZONES.map(zone => {
                const pin   = getPinForZone(zone.id);
                const sev   = pin ? severityMap[pin.severity] : null;
                const isHov = hovered === zone.id;
                const isSide = zone.id.includes('door') || zone.id.includes('fender');
                return (
                  <g key={zone.id}>
                    <polygon
                      points={zone.points}
                      fill={pin ? `${sev.color}26` : isHov ? 'rgba(147,197,253,0.14)' : `url(#${isSide ? 'di-side' : 'di-body'})`}
                      stroke={pin ? sev.color : isHov ? 'rgba(147,197,253,0.8)' : 'rgba(147,197,253,0.14)'}
                      strokeWidth={pin ? 1.5 : isHov ? 1.2 : 0.7}
                      style={{ cursor: readOnly ? 'default' : 'pointer', transition: 'fill 0.15s, stroke 0.15s', filter: pin ? `drop-shadow(0 0 7px ${sev.color}88)` : 'none' }}
                      onMouseEnter={() => setHovered(zone.id)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => handleZoneClick(zone)}
                    />
                    {isHov && !pin && !readOnly && (
                      <text x={zone.cx} y={zone.cy} textAnchor="middle" dominantBaseline="middle"
                        fill="rgba(186,230,253,0.95)" fontSize="7" fontWeight="700"
                        style={{ pointerEvents: 'none', letterSpacing: '0.02em' }}>
                        {tz(zone.id)}
                      </text>
                    )}
                    {pin && (
                      <g filter="url(#di-pin-glow)" style={{ pointerEvents: 'none' }} className="dmg-pin-enter">
                        <circle cx={zone.cx} cy={zone.cy} r="10"
                          fill="none" stroke={sev.color} strokeWidth="1.5" opacity="0"
                          className="dmg-pulse-ring"
                          style={{ transformOrigin: `${zone.cx}px ${zone.cy}px` }}/>
                        <circle cx={zone.cx} cy={zone.cy} r="11" fill={sev.color} opacity="0.15"/>
                        <circle cx={zone.cx} cy={zone.cy} r="7"
                          fill={sev.color} stroke="rgba(255,255,255,0.9)" strokeWidth="1.5"
                          style={{ filter: `drop-shadow(0 2px 6px ${sev.color}cc)` }}/>
                        <text x={zone.cx} y={zone.cy + 0.5} textAnchor="middle" dominantBaseline="middle"
                          fill="white" fontSize="7" fontWeight="900" style={{ pointerEvents: 'none' }}>
                          {pin.severity === 'Major' ? '✕' : pin.severity === 'Dent' ? '◉' : '〜'}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Windshield */}
              <polygon points="130,135 270,135 264,176 136,176" fill="url(#di-glass)" stroke="rgba(186,230,253,0.2)" strokeWidth="0.7" style={{ pointerEvents: 'none' }}/>
              <line x1="148" y1="145" x2="252" y2="145" stroke="rgba(255,255,255,0.12)" strokeWidth="4" strokeLinecap="round" style={{ pointerEvents: 'none' }}/>

              {/* Rear window */}
              <polygon points="136,258 264,258 270,297 130,297" fill="url(#di-glass)" stroke="rgba(186,230,253,0.2)" strokeWidth="0.7" style={{ pointerEvents: 'none' }}/>
              <line x1="148" y1="268" x2="252" y2="268" stroke="rgba(255,255,255,0.09)" strokeWidth="3" strokeLinecap="round" style={{ pointerEvents: 'none' }}/>

              {/* Roof */}
              <polygon points="136,178 264,178 264,256 136,256" fill="url(#di-roof)" stroke="rgba(186,230,253,0.10)" strokeWidth="0.5" style={{ pointerEvents: 'none' }}/>
              <line x1="152" y1="183" x2="148" y2="251" stroke="rgba(255,255,255,0.09)" strokeWidth="10" strokeLinecap="round" style={{ pointerEvents: 'none' }}/>

              {/* Hood highlight */}
              <polygon points="145,58 255,58 262,128 138,128" fill="url(#di-hood-hi)" stroke="none" style={{ pointerEvents: 'none' }}/>

              {/* Headlights */}
              <rect x="140" y="24" width="36" height="14" rx="5" fill="rgba(255,255,240,0.08)" stroke="rgba(255,255,200,0.3)" strokeWidth="0.8" style={{ pointerEvents: 'none' }}/>
              <rect x="224" y="24" width="36" height="14" rx="5" fill="rgba(255,255,240,0.08)" stroke="rgba(255,255,200,0.3)" strokeWidth="0.8" style={{ pointerEvents: 'none' }}/>
              <line x1="144" y1="28" x2="172" y2="28" stroke="rgba(255,255,200,0.5)" strokeWidth="1.5" strokeLinecap="round" style={{ pointerEvents: 'none' }}/>
              <line x1="228" y1="28" x2="256" y2="28" stroke="rgba(255,255,200,0.5)" strokeWidth="1.5" strokeLinecap="round" style={{ pointerEvents: 'none' }}/>

              {/* Taillights */}
              <rect x="140" y="382" width="36" height="13" rx="4" fill="rgba(239,68,68,0.12)" stroke="rgba(239,68,68,0.4)" strokeWidth="0.8" style={{ pointerEvents: 'none' }}/>
              <rect x="224" y="382" width="36" height="13" rx="4" fill="rgba(239,68,68,0.12)" stroke="rgba(239,68,68,0.4)" strokeWidth="0.8" style={{ pointerEvents: 'none' }}/>
              <line x1="144" y1="388" x2="172" y2="388" stroke="rgba(239,68,68,0.6)" strokeWidth="1.5" strokeLinecap="round" style={{ pointerEvents: 'none' }}/>
              <line x1="228" y1="388" x2="256" y2="388" stroke="rgba(239,68,68,0.6)" strokeWidth="1.5" strokeLinecap="round" style={{ pointerEvents: 'none' }}/>

              {/* Side mirrors */}
              <ellipse cx="79" cy="134" rx="7" ry="4" fill="rgba(96,165,250,0.15)" stroke="rgba(147,197,253,0.3)" strokeWidth="0.7" style={{ pointerEvents: 'none' }}/>
              <ellipse cx="321" cy="134" rx="7" ry="4" fill="rgba(96,165,250,0.15)" stroke="rgba(147,197,253,0.3)" strokeWidth="0.7" style={{ pointerEvents: 'none' }}/>

              {/* Door handles */}
              {[{ x: 90, y: 203 }, { x: 90, y: 272 }, { x: 296, y: 203 }, { x: 296, y: 272 }].map((h, i) => (
                <rect key={i} x={h.x} y={h.y} width={14} height={4} rx={2} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" style={{ pointerEvents: 'none' }}/>
              ))}

              {/* Door seams */}
              <line x1="86"  y1="148" x2="122" y2="148" stroke="rgba(147,197,253,0.20)" strokeWidth="0.6"/>
              <line x1="84"  y1="238" x2="122" y2="238" stroke="rgba(147,197,253,0.20)" strokeWidth="0.6"/>
              <line x1="278" y1="148" x2="314" y2="148" stroke="rgba(147,197,253,0.20)" strokeWidth="0.6"/>
              <line x1="278" y1="238" x2="316" y2="238" stroke="rgba(147,197,253,0.20)" strokeWidth="0.6"/>

              {/* Wheels */}
              {WHEELS.map((w, i) => (
                <g key={i}>
                  <rect x={w.x} y={w.y} width={w.w} height={w.h} rx={w.rx} fill="url(#di-wheel)" stroke="rgba(71,85,105,0.6)" strokeWidth="1.2"/>
                  <rect x={w.x+4} y={w.y+6} width={w.w-8} height={w.h-12} rx={w.rx-3} fill="url(#di-rim)" stroke="rgba(148,163,184,0.3)" strokeWidth="0.8"/>
                  <circle cx={w.x+w.w/2} cy={w.y+w.h/2} r="5" fill="rgba(30,41,59,0.9)" stroke="rgba(148,163,184,0.4)" strokeWidth="0.8"/>
                  <circle cx={w.x+w.w/2} cy={w.y+w.h/2} r="2" fill="rgba(148,163,184,0.5)"/>
                  {[0,60,120,180,240,300].map(deg => {
                    const cx = w.x+w.w/2, cy = w.y+w.h/2, r = 4, rad = (deg*Math.PI)/180;
                    return <line key={deg} x1={cx} y1={cy} x2={cx+Math.cos(rad)*r} y2={cy+Math.sin(rad)*r} stroke="rgba(148,163,184,0.25)" strokeWidth="0.6"/>;
                  })}
                </g>
              ))}

              {/* Cardinal labels — always English/directional, standard in auto industry */}
              <text x="200" y="11"  textAnchor="middle" fill="rgba(148,163,184,0.45)" fontSize="6.5" fontWeight="700" letterSpacing="2.5">{t('front')}</text>
              <text x="200" y="422" textAnchor="middle" fill="rgba(148,163,184,0.45)" fontSize="6.5" fontWeight="700" letterSpacing="2.5">{t('rear')}</text>
              <text x="24"  y="215" textAnchor="middle" fill="rgba(148,163,184,0.40)" fontSize="6"   fontWeight="700" letterSpacing="2" transform="rotate(-90,24,215)">{t('left')}</text>
              <text x="376" y="215" textAnchor="middle" fill="rgba(148,163,184,0.40)" fontSize="6"   fontWeight="700" letterSpacing="2" transform="rotate(90,376,215)">{t('right')}</text>
            </svg>
            <div style={{ position: 'absolute', bottom: -14, left: '20%', right: '20%', height: 14, background: 'radial-gradient(ellipse, rgba(59,130,246,0.18) 0%, transparent 70%)', filter: 'blur(8px)' }}/>
          </div>
        </div>

        {/* ── Damage Log ──────────────────────────────────────────────────── */}
        <div style={{ width: 220, flexShrink: 0, borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', padding: '20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ color: 'rgba(148,163,184,0.8)', fontWeight: 700, fontSize: 10, letterSpacing: '2px', margin: 0, textTransform: 'uppercase' }}>
              {t('damageLog')}
            </p>
            {pins.length > 0 && !readOnly && (
              <button onClick={clearAll} style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 6, color: 'rgba(239,68,68,0.7)', fontSize: 10, fontWeight: 700,
                padding: '2px 8px', cursor: 'pointer', lineHeight: 1.6,
              }}>{t('clear')}</button>
            )}
          </div>

          {pins.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '12px 0' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, marginBottom: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(148,163,184,0.35)" strokeWidth="1.5">
                  <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p style={{ color: 'rgba(100,116,139,0.9)', fontSize: 12, fontWeight: 600, margin: 0 }}>{t('noDamage')}</p>
              {!readOnly && <p style={{ color: 'rgba(71,85,105,0.8)', fontSize: 10, margin: '4px 0 0', lineHeight: 1.5 }}>{t('clickZones')}</p>}
            </div>
          ) : (
            <>
              {/* Severity pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                {SEVERITY.map(s => {
                  const cnt = pins.filter(p => p.severity === s.id).length;
                  if (!cnt) return null;
                  return (
                    <div key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontSize: 10, fontWeight: 700 }}>
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
                  // Always show the panel label in current language
                  const panelLabel = tz(pin.zoneId) || pin.panel;
                  return (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 11px', borderRadius: 11, background: sev.bg, border: `1px solid ${sev.border}` }}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, background: `${sev.color}22`, border: `1.5px solid ${sev.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: sev.color, fontSize: 9, fontWeight: 900, marginTop: 1 }}>
                        {sev.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: '#f1f5f9', fontSize: 11, fontWeight: 600, margin: 0, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {panelLabel}
                        </p>
                        <p style={{ color: sev.color, fontSize: 10, fontWeight: 700, margin: '2px 0 0', opacity: 0.85 }}>
                          {sev.label}
                        </p>
                      </div>
                      {!readOnly && (
                        <button onClick={() => removePin(pin.zoneId)} style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(148,163,184,0.4)', cursor: 'pointer', fontSize: 13, lineHeight: 1, flexShrink: 0, transition: 'color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'rgba(239,68,68,0.8)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(148,163,184,0.4)'}
                          title="Remove">✕</button>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 12, paddingTop: 10 }}>
                <p style={{ color: 'rgba(100,116,139,0.8)', fontSize: 10, margin: 0 }}>
                  {pins.length} {t('zonesMarked')}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Footer hint ──────────────────────────────────────────────────────── */}
      {!readOnly && (
        <div style={{ padding: '10px 22px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(148,163,184,0.5)', fontSize: 8, fontWeight: 900 }}>i</div>
          <span style={{ color: 'rgba(100,116,139,0.7)', fontSize: 10.5, direction: isAr ? 'rtl' : 'ltr' }}>
            {t('hint')}
          </span>
        </div>
      )}
    </div>
  );
}
