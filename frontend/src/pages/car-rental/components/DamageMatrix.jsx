import React, { useState } from 'react';

const SEVERITY = [
  { id: 'Scratch', label: 'Scratch', color: '#FBBF24', glow: '#FDE68A', ring: '#F59E0B' },
  { id: 'Dent',    label: 'Dent',    color: '#F97316', glow: '#FDBA74', ring: '#EA580C' },
  { id: 'Major',   label: 'Major Damage', color: '#EF4444', glow: '#FCA5A5', ring: '#DC2626' },
];

// Zone definitions: each zone is a clickable SVG polygon with a label
const ZONES = [
  { id: 'front_bumper',    label: 'Front Bumper',    points: '155,30 245,30 265,58 135,58',       cx: 200, cy: 44 },
  { id: 'hood',            label: 'Hood',             points: '135,58 265,58 275,130 125,130',     cx: 200, cy: 94 },
  { id: 'windshield',      label: 'Windshield',       points: '125,130 275,130 270,175 130,175',   cx: 200, cy: 152 },
  { id: 'roof',            label: 'Roof',             points: '130,175 270,175 270,255 130,255',   cx: 200, cy: 215 },
  { id: 'rear_window',     label: 'Rear Window',      points: '130,255 270,255 275,295 125,295',   cx: 200, cy: 275 },
  { id: 'trunk',           label: 'Trunk',            points: '125,295 275,295 265,360 135,360',   cx: 200, cy: 327 },
  { id: 'rear_bumper',     label: 'Rear Bumper',      points: '135,360 265,360 245,385 155,385',   cx: 200, cy: 372 },
  { id: 'front_left_door', label: 'Front Left Door',  points: '90,148 130,148 130,235 88,235',     cx: 109, cy: 191 },
  { id: 'rear_left_door',  label: 'Rear Left Door',   points: '88,235 130,235 130,295 85,295',     cx: 107, cy: 265 },
  { id: 'front_right_door',label: 'Front Right Door', points: '270,148 310,148 312,235 270,235',   cx: 291, cy: 191 },
  { id: 'rear_right_door', label: 'Rear Right Door',  points: '270,235 312,235 315,295 270,295',   cx: 293, cy: 265 },
  { id: 'left_fender_f',   label: 'Left Front Fender',points: '90,58 130,58 130,148 88,148',       cx: 109, cy: 103 },
  { id: 'right_fender_f',  label: 'Right Front Fender',points:'270,58 310,58 312,148 270,148',     cx: 291, cy: 103 },
  { id: 'left_fender_r',   label: 'Left Rear Fender', points: '85,295 130,295 130,360 88,360',     cx: 107, cy: 327 },
  { id: 'right_fender_r',  label: 'Right Rear Fender',points: '270,295 315,295 312,360 270,360',   cx: 293, cy: 327 },
];

const WHEEL_RECTS = [
  { x: 64, y: 78, w: 30, h: 55, rx: 8, label: 'FL Wheel' },
  { x: 306, y: 78, w: 30, h: 55, rx: 8, label: 'FR Wheel' },
  { x: 60, y: 310, w: 30, h: 55, rx: 8, label: 'RL Wheel' },
  { x: 310, y: 310, w: 30, h: 55, rx: 8, label: 'RR Wheel' },
];

const severityMap = Object.fromEntries(SEVERITY.map(s => [s.id, s]));

export default function DamageMatrix({ initialPins = [], onPinsChange, readOnly = false }) {
  const [pins, setPins] = useState(initialPins);
  const [sel, setSel] = useState('Scratch');
  const [hovered, setHovered] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const handleZoneClick = (zone) => {
    if (readOnly) return;
    // If zone already has a pin of same severity, remove it; else add/update
    const existing = pins.findIndex(p => p.zoneId === zone.id);
    let updated;
    if (existing !== -1 && pins[existing].severity === sel) {
      updated = pins.filter((_, i) => i !== existing);
    } else if (existing !== -1) {
      updated = pins.map((p, i) => i === existing ? { ...p, severity: sel } : p);
    } else {
      updated = [...pins, { zoneId: zone.id, panel: zone.label, severity: sel, x: zone.cx, y: zone.cy }];
    }
    setPins(updated);
    onPinsChange?.(updated);
  };

  const removePin = (zoneId) => {
    if (readOnly) return;
    const updated = pins.filter(p => p.zoneId !== zoneId);
    setPins(updated);
    onPinsChange?.(updated);
  };

  const getPinForZone = (zoneId) => pins.find(p => p.zoneId === zoneId);

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      boxShadow: '0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
    }}>
      {/* Header */}
      <div className="px-6 pt-5 pb-3 border-b border-white/10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-white font-black text-lg tracking-tight">Vehicle Damage Inspector</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              {readOnly ? 'Recorded damage markers' : 'Select severity · Click a zone to mark damage'}
            </p>
          </div>
          {!readOnly && (
            <div className="flex gap-2">
              {SEVERITY.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSel(s.id)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200"
                  style={{
                    background: sel === s.id ? s.color + '22' : 'rgba(255,255,255,0.05)',
                    border: `1.5px solid ${sel === s.id ? s.color : 'rgba(255,255,255,0.1)'}`,
                    color: sel === s.id ? s.color : '#94a3b8',
                    boxShadow: sel === s.id ? `0 0 12px ${s.glow}55` : 'none',
                  }}
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col lg:flex-row gap-0">

        {/* SVG Panel */}
        <div className="flex-1 p-5 flex items-center justify-center">
          <div className="relative" style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.6))' }}>
            <svg viewBox="0 0 400 420" className="w-full" style={{ maxWidth: 380, minWidth: 260 }}>
              <defs>
                {/* Gradients for 3D body panels */}
                <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.06" />
                </linearGradient>
                <linearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.12" />
                </linearGradient>
                <linearGradient id="wheelGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
                <linearGradient id="roofGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.08" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="pinGlow">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                {/* Car body clip */}
                <clipPath id="carClip">
                  <polygon points="130,28 270,28 315,60 315,370 270,392 130,392 85,370 85,60" />
                </clipPath>
              </defs>

              {/* ── Outer car silhouette ── */}
              <polygon
                points="130,28 270,28 315,60 315,370 270,392 130,392 85,370 85,60"
                fill="url(#bodyGrad)"
                stroke="rgba(148,163,184,0.3)"
                strokeWidth="1.5"
              />

              {/* ── Interactive Zones ── */}
              {ZONES.map(zone => {
                const pin = getPinForZone(zone.id);
                const sev = pin ? severityMap[pin.severity] : null;
                const isHov = hovered === zone.id;
                return (
                  <g key={zone.id}>
                    <polygon
                      points={zone.points}
                      fill={
                        pin
                          ? `${sev.color}33`
                          : isHov
                          ? 'rgba(99,179,237,0.15)'
                          : 'transparent'
                      }
                      stroke={
                        pin
                          ? sev.color
                          : isHov
                          ? 'rgba(99,179,237,0.7)'
                          : 'rgba(148,163,184,0.18)'
                      }
                      strokeWidth={pin || isHov ? '1.5' : '0.8'}
                      className={readOnly ? '' : 'cursor-pointer'}
                      style={{
                        transition: 'all 0.15s ease',
                        filter: pin ? `drop-shadow(0 0 6px ${sev.color}88)` : 'none',
                      }}
                      onMouseEnter={() => setHovered(zone.id)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => handleZoneClick(zone)}
                    />
                    {/* Zone label - only shows on hover if no pin */}
                    {isHov && !pin && !readOnly && (
                      <text
                        x={zone.cx} y={zone.cy}
                        textAnchor="middle" dominantBaseline="middle"
                        fill="rgba(186,230,253,0.9)" fontSize="8" fontWeight="700"
                        style={{ pointerEvents: 'none', letterSpacing: '0.05em' }}
                      >
                        {zone.label}
                      </text>
                    )}
                    {/* Damage pin */}
                    {pin && (
                      <g filter="url(#pinGlow)" style={{ pointerEvents: 'none' }}>
                        <circle cx={zone.cx} cy={zone.cy} r="10" fill={sev.color} opacity="0.25" />
                        <circle cx={zone.cx} cy={zone.cy} r="6" fill={sev.color} stroke="white" strokeWidth="1.5" />
                        <text
                          x={zone.cx} y={zone.cy}
                          textAnchor="middle" dominantBaseline="middle"
                          fill="white" fontSize="7" fontWeight="900"
                          style={{ pointerEvents: 'none' }}
                        >
                          {pin.severity === 'Major' ? '!' : pin.severity === 'Dent' ? '◉' : '~'}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* ── Glass panels (non-interactive visual) ── */}
              {/* Windshield */}
              <polygon points="135,133 265,133 260,173 140,173" fill="url(#glassGrad)" stroke="rgba(186,230,253,0.2)" strokeWidth="0.8" style={{ pointerEvents: 'none' }} />
              {/* Rear window */}
              <polygon points="140,255 260,255 265,293 135,293" fill="url(#glassGrad)" stroke="rgba(186,230,253,0.2)" strokeWidth="0.8" style={{ pointerEvents: 'none' }} />
              {/* Roof shine */}
              <polygon points="140,178 260,178 260,252 140,252" fill="url(#roofGrad)" stroke="rgba(186,230,253,0.12)" strokeWidth="0.5" style={{ pointerEvents: 'none' }} />
              {/* Roof highlight streak */}
              <line x1="160" y1="182" x2="155" y2="248" stroke="rgba(255,255,255,0.1)" strokeWidth="8" strokeLinecap="round" style={{ pointerEvents: 'none' }} />

              {/* ── Wheels ── */}
              {WHEEL_RECTS.map((w, i) => (
                <g key={i}>
                  <rect x={w.x} y={w.y} width={w.w} height={w.h} rx={w.rx} fill="url(#wheelGrad)" stroke="rgba(100,116,139,0.5)" strokeWidth="1" />
                  <rect x={w.x + 6} y={w.y + 8} width={w.w - 12} height={w.h - 16} rx={4} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
                  <circle cx={w.x + w.w / 2} cy={w.y + w.h / 2} r="6" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
                </g>
              ))}

              {/* ── Body outline lines (doors, fenders) ── */}
              {/* Left door seam */}
              <line x1="90" y1="148" x2="130" y2="148" stroke="rgba(148,163,184,0.25)" strokeWidth="0.6" />
              <line x1="88" y1="235" x2="130" y2="235" stroke="rgba(148,163,184,0.25)" strokeWidth="0.6" />
              {/* Right door seam */}
              <line x1="270" y1="148" x2="310" y2="148" stroke="rgba(148,163,184,0.25)" strokeWidth="0.6" />
              <line x1="270" y1="235" x2="312" y2="235" stroke="rgba(148,163,184,0.25)" strokeWidth="0.6" />

              {/* ── Labels ── */}
              <text x="200" y="13" textAnchor="middle" fill="rgba(148,163,184,0.5)" fontSize="7" fontWeight="600" letterSpacing="2">FRONT</text>
              <text x="200" y="413" textAnchor="middle" fill="rgba(148,163,184,0.5)" fontSize="7" fontWeight="600" letterSpacing="2">REAR</text>
              <text x="28" y="215" textAnchor="middle" fill="rgba(148,163,184,0.5)" fontSize="6.5" fontWeight="600" letterSpacing="1.5" transform="rotate(-90,28,215)">LEFT</text>
              <text x="372" y="215" textAnchor="middle" fill="rgba(148,163,184,0.5)" fontSize="6.5" fontWeight="600" letterSpacing="1.5" transform="rotate(90,372,215)">RIGHT</text>
            </svg>

            {/* Reflection / floor shadow */}
            <div style={{
              position: 'absolute', bottom: -16, left: '15%', right: '15%', height: 16,
              background: 'radial-gradient(ellipse, rgba(59,130,246,0.15) 0%, transparent 70%)',
              filter: 'blur(6px)',
            }} />
          </div>
        </div>

        {/* Damage Log Panel */}
        <div className="lg:w-64 px-5 pb-5 lg:pt-5 lg:pl-0 lg:border-l lg:border-white/10">
          <h4 className="text-slate-300 font-bold text-sm uppercase tracking-widest mb-3">Damage Log</h4>
          {pins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="rgba(148,163,184,0.4)" strokeWidth="1.5">
                  <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-slate-500 text-xs">No damage recorded</p>
              {!readOnly && <p className="text-slate-600 text-xs mt-1">Click zones on the vehicle</p>}
            </div>
          ) : (
            <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {pins.map((pin, idx) => {
                const sev = severityMap[pin.severity];
                return (
                  <li key={idx} className="rounded-xl p-3 flex items-start gap-3" style={{
                    background: `${sev.color}0d`,
                    border: `1px solid ${sev.color}30`,
                  }}>
                    <span className="w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0" style={{ background: sev.color, boxShadow: `0 0 6px ${sev.color}` }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold leading-tight">{pin.panel}</p>
                      <p className="text-xs mt-0.5" style={{ color: sev.color }}>{pin.severity}</p>
                    </div>
                    {!readOnly && (
                      <button
                        onClick={() => removePin(pin.zoneId)}
                        className="text-slate-500 hover:text-red-400 transition-colors text-xs font-bold flex-shrink-0"
                        title="Remove"
                      >✕</button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {pins.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="flex justify-between text-xs text-slate-500">
                <span>{pins.length} zone{pins.length !== 1 ? 's' : ''} marked</span>
                {!readOnly && (
                  <button
                    onClick={() => { setPins([]); onPinsChange?.([]); }}
                    className="text-red-400/70 hover:text-red-400 transition-colors font-semibold"
                  >Clear all</button>
                )}
              </div>
              <div className="flex gap-1.5 mt-2">
                {SEVERITY.map(s => {
                  const cnt = pins.filter(p => p.severity === s.id).length;
                  if (cnt === 0) return null;
                  return (
                    <div key={s.id} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: `${s.color}18`, color: s.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                      {cnt}×{s.label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer hint */}
      {!readOnly && (
        <div className="px-6 py-3 border-t border-white/10 flex items-center gap-2">
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" fill="currentColor">
            <circle cx="8" cy="8" r="7" fillOpacity="0.15" stroke="currentColor" strokeWidth="1" fill="none" />
            <text x="8" y="11.5" textAnchor="middle" fontSize="9" fontWeight="900" fill="currentColor">i</text>
          </svg>
          <span className="text-slate-500 text-xs">Click a zone to mark · Click again to change severity · Click a log entry ✕ to remove</span>
        </div>
      )}
    </div>
  );
}
