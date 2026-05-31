import { useTranslation } from '../../../../../lib/translations.js';
import { useSelector } from 'react-redux';
import React, { useEffect, useMemo, useState } from 'react';

// SVG illustrations for each measurement type
const MeasurementIcons = {
  length: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="lengthGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      {/* Body silhouette */}
      <ellipse cx="24" cy="8" rx="6" ry="6" fill="url(#lengthGrad)" opacity="0.3" />
      <path d="M18 14 L18 42 L30 42 L30 14 Q24 18 18 14" fill="url(#lengthGrad)" opacity="0.3" />
      {/* Measurement arrow */}
      <line x1="36" y1="6" x2="36" y2="42" stroke="#6366f1" strokeWidth="2" strokeDasharray="3,2" />
      <polygon points="36,4 33,10 39,10" fill="#6366f1" />
      <polygon points="36,44 33,38 39,38" fill="#6366f1" />
    </svg>
  ),
  shoulderWidth: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="shoulderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      {/* Torso outline */}
      <ellipse cx="24" cy="10" rx="5" ry="5" fill="url(#shoulderGrad)" opacity="0.3" />
      <path d="M8 20 Q12 16 24 16 Q36 16 40 20 L38 38 L10 38 Z" fill="url(#shoulderGrad)" opacity="0.3" />
      {/* Shoulder line */}
      <line x1="8" y1="20" x2="40" y2="20" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="8" cy="20" r="3" fill="#ec4899" />
      <circle cx="40" cy="20" r="3" fill="#ec4899" />
    </svg>
  ),
  chest: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="chestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      {/* Torso */}
      <ellipse cx="24" cy="8" rx="5" ry="5" fill="url(#chestGrad)" opacity="0.3" />
      <path d="M10 16 Q14 14 24 14 Q34 14 38 16 L36 42 L12 42 Z" fill="url(#chestGrad)" opacity="0.3" />
      {/* Chest measurement circle */}
      <ellipse cx="24" cy="24" rx="14" ry="8" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4,2" />
      <circle cx="10" cy="24" r="2" fill="#10b981" />
      <circle cx="38" cy="24" r="2" fill="#10b981" />
    </svg>
  ),
  sleeveLength: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="sleeveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      {/* Arm */}
      <path d="M12 8 L8 8 L4 36 L12 38 L16 12 Z" fill="url(#sleeveGrad)" opacity="0.3" />
      {/* Measurement line */}
      <line x1="10" y1="10" x2="8" y2="36" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3,2" />
      <polygon points="10,8 7,14 13,14" fill="#f59e0b" />
      <polygon points="8,38 5,32 11,32" fill="#f59e0b" />
      {/* Shoulder dot */}
      <circle cx="10" cy="10" r="3" fill="#f59e0b" />
    </svg>
  ),
  neck: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="neckGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      {/* Head and neck */}
      <ellipse cx="24" cy="14" rx="10" ry="10" fill="url(#neckGrad)" opacity="0.2" />
      <path d="M18 24 L18 36 L30 36 L30 24" fill="url(#neckGrad)" opacity="0.3" />
      {/* Neck circle measurement */}
      <ellipse cx="24" cy="26" rx="7" ry="4" fill="none" stroke="#8b5cf6" strokeWidth="2.5" />
      <circle cx="17" cy="26" r="2" fill="#8b5cf6" />
      <circle cx="31" cy="26" r="2" fill="#8b5cf6" />
    </svg>
  ),
  wrist: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="wristGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
      {/* Forearm and hand */}
      <path d="M12 6 L8 6 L6 28 L14 28 L16 6 Z" fill="url(#wristGrad)" opacity="0.3" />
      <ellipse cx="10" cy="36" rx="6" ry="8" fill="url(#wristGrad)" opacity="0.2" />
      {/* Wrist circle */}
      <ellipse cx="10" cy="28" rx="5" ry="3" fill="none" stroke="#f97316" strokeWidth="2.5" />
      <circle cx="5" cy="28" r="2" fill="#f97316" />
      <circle cx="15" cy="28" r="2" fill="#f97316" />
    </svg>
  ),
  expansion: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="expansionGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      {/* Thobe/Gown bottom */}
      <path d="M16 6 L14 6 L8 42 L40 42 L34 6 L32 6 L24 10 Z" fill="url(#expansionGrad)" opacity="0.3" />
      {/* Bottom expansion line */}
      <line x1="8" y1="40" x2="40" y2="40" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" />
      <polygon points="6,40 12,37 12,43" fill="#0ea5e9" />
      <polygon points="42,40 36,37 36,43" fill="#0ea5e9" />
    </svg>
  ),
  armhole: () => (
    <svg viewBox="0 0 48 48" className="w-full h-full">
      <defs>
        <linearGradient id="armholeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      {/* Torso with armhole */}
      <path d="M10 8 Q14 6 24 6 Q34 6 38 8 L36 42 L12 42 Z" fill="url(#armholeGrad)" opacity="0.2" />
      {/* Armhole curve */}
      <path d="M12 12 Q6 20 12 28" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2.5" fill="#ef4444" />
      <circle cx="12" cy="28" r="2.5" fill="#ef4444" />
      {/* Dotted curve indicator */}
      <path d="M14 14 Q10 20 14 26" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="2,2" />
    </svg>
  ),
  waist: () => <MeasurementIcons.chest />,
  hips: () => <MeasurementIcons.chest />,
  bicep: () => <MeasurementIcons.sleeveLength />,
  forearm: () => <MeasurementIcons.wrist />,
  cuffWidth: () => <MeasurementIcons.wrist />,
  bottom: () => <MeasurementIcons.expansion />
};

const MeasurementCard = (props) => {
  const { language } = useSelector(state => state.ui) || { language: 'en' };
  const { t } = useTranslation(language);
  const { language } = useSelector(state => state.ui) || { language: 'en' };
  const { t } = useTranslation(language);
  const IconComponent = MeasurementIcons[measurementKey] || MeasurementIcons.length;

  const base = useMemo(() => `/images/measurements/${measurementKey}`, [measurementKey]);
  const [imgSrc, setImgSrc] = useState(imageSrc || `${base}.webp`);
  const [imgOk, setImgOk] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgSrc(imageSrc || `${base}.webp`);
    setImgOk(false);
    setImgFailed(false);
  }, [base, imageSrc]);
  
  const colorMap = {
    length: 'from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-700',
    shoulderWidth: 'from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 border-pink-200 dark:border-pink-700',
    chest: 'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-700',
    waist: 'from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-200 dark:border-teal-700',
    hips: 'from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 border-cyan-200 dark:border-cyan-700',
    sleeveLength: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-700',
    bicep: 'from-lime-50 to-lime-100 dark:from-lime-900/20 dark:to-lime-800/20 border-lime-200 dark:border-lime-700',
    forearm: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700',
    neck: 'from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 border-violet-200 dark:border-violet-700',
    wrist: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700',
    cuffWidth: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700',
    expansion: 'from-sky-50 to-sky-100 dark:from-sky-900/20 dark:to-sky-800/20 border-sky-200 dark:border-sky-700',
    armhole: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700',
    bottom: 'from-sky-50 to-sky-100 dark:from-sky-900/20 dark:to-sky-800/20 border-sky-200 dark:border-sky-700'
  };

  const inputColorMap = {
    length: 'focus:ring-indigo-500 focus:border-indigo-500',
    shoulderWidth: 'focus:ring-pink-500 focus:border-pink-500',
    chest: 'focus:ring-emerald-500 focus:border-emerald-500',
    waist: 'focus:ring-teal-500 focus:border-teal-500',
    hips: 'focus:ring-cyan-500 focus:border-cyan-500',
    sleeveLength: 'focus:ring-amber-500 focus:border-amber-500',
    bicep: 'focus:ring-lime-500 focus:border-lime-500',
    forearm: 'focus:ring-orange-500 focus:border-orange-500',
    neck: 'focus:ring-violet-500 focus:border-violet-500',
    wrist: 'focus:ring-orange-500 focus:border-orange-500',
    cuffWidth: 'focus:ring-orange-500 focus:border-orange-500',
    expansion: 'focus:ring-sky-500 focus:border-sky-500',
    armhole: 'focus:ring-red-500 focus:border-red-500',
    bottom: 'focus:ring-sky-500 focus:border-sky-500'
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${colorMap[measurementKey] || colorMap.length} p-4 transition-all ${disabled ? '' : 'hover:shadow-lg hover:scale-[1.02]'}`}>
      {/* Icon */}
      <div className="relative w-16 h-16 mx-auto mb-3">
        {!imgFailed && (
          <img
            src={imgSrc}
            alt={label}
            className={`absolute inset-0 w-full h-full object-contain transition-opacity ${imgOk ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImgOk(true)}
            onError={() => {
              if (imageSrc) {
                setImgSrc('/images/measurements/placeholder.svg');
                setImgOk(false);
                return;
              }
              if (imgSrc.endsWith('.webp')) {
                setImgSrc(`${base}.png`);
                setImgOk(false);
                return;
              }
              if (imgSrc.endsWith('.png')) {
                setImgSrc('/images/measurements/placeholder.svg');
                setImgOk(false);
                return;
              }
              setImgFailed(true);
              setImgOk(false);
            }}
          />
        )}
        <div className={`w-full h-full opacity-90 transition-opacity ${imgOk ? 'opacity-0' : 'opacity-100'}`}>
          <IconComponent />
        </div>
      </div>
      
      {/* Label */}
      <p className="text-xs font-semibold text-center text-gray-700 dark:text-slate-200 mb-2 truncate">
        {label}
      </p>
      
      {/* Input with unit */}
      <div className="relative">
        <input
          type="number"
          value={value || ''}
          onChange={(e) => {
            if (disabled) return;
            onChange(e.target.value);
          }}
          step="0.1"
          placeholder="0"
          disabled={disabled}
          className={`no-spinner w-full px-3 py-2.5 pr-10 bg-white/80 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-600 rounded-xl text-center text-lg font-medium text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 ${inputColorMap[measurementKey] || inputColorMap.length} transition-all ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 dark:text-slate-500">
          {unit}
        </span>
      </div>
    </div>
  );
};

export default MeasurementCard;
