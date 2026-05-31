import { useTranslation } from '../../../../lib/translations.js';
import { useSelector } from 'react-redux';
import React, { useMemo } from 'react';
import { Building2, CalendarDays, PencilRuler, Phone, Ruler, Shirt, Sparkles } from 'lucide-react';
import MeasurementImageInput from './MeasurementImageInput';

const thawbImageMap = {
  saudi: '/images/saudi.png',
  qatari: '/images/qatari.png',
  emirati: '/images/emirati.png',
  kuwaiti: '/images/kuwati.png',
  omani: '/images/omani.png',
  bahraini: '/images/Bahrini.png',
  noum: '/images/noum.png'
};

const groupedKeys = {
  core: ['length', 'shoulderWidth', 'chest', 'waist', 'hips', 'bottom'],
  sleeve: ['sleeveLength', 'armhole', 'bicep', 'forearm', 'wrist', 'cuffWidth', 'neck', 'expansion']
};

const styleGroupOrder = ['collar', 'bain', 'cuff', 'pocket', 'buttons', 'embroidery'];

const styleOptionOrder = {
  collar: ['classic', 'round', 'mandarin', 'open'],
  bain: ['hidden', 'visible', 'zip', 'half'],
  cuff: ['single', 'double', 'round', 'angled'],
  pocket: ['none', 'chest', 'side', 'both'],
  buttons: ['classic', 'hidden', 'snap', 'premium'],
  embroidery: ['none', 'name', 'logo', 'premium']
};

const toneMap = {
  slate: {
    shell: 'border-slate-300/70 dark:border-slate-700',
    soft: 'bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200',
    muted: 'text-slate-500 dark:text-slate-400',
    focus: 'focus:ring-slate-400/30 focus:border-slate-400/30',
    tile: 'border-slate-200 dark:border-slate-700 bg-white/85 dark:bg-slate-900/60',
    selected: 'border-slate-900 dark:border-slate-200 ring-2 ring-slate-900/10 dark:ring-white/10',
    accent: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
  },
  amber: {
    shell: 'border-amber-300/70 dark:border-amber-800/50',
    soft: 'bg-amber-100/80 dark:bg-amber-900/30 text-amber-800 dark:text-amber-100',
    muted: 'text-amber-800/70 dark:text-amber-200/70',
    focus: 'focus:ring-amber-400/30 focus:border-amber-400/30',
    tile: 'border-amber-200 dark:border-amber-800/40 bg-white/85 dark:bg-slate-900/60',
    selected: 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-400/20',
    accent: 'bg-amber-500 text-white'
  }
};

const defaultTone = toneMap.slate;

const formatValue = (value) => {
  const { language } = useSelector(state => state.ui) || { language: 'en' };
  const { t } = useTranslation(language);
  if (value === undefined || value === null || value === '') return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return `${Number(num.toFixed(1))} cm`;
};

const formatTypeLabel = (value) => String(value || 'saudi').replace(/(^.|-.)/g, (m) => m.replace('-', ' ').toUpperCase());

const BrandBlock = ({ logoSrc, businessName, businessPhone }) => (
  <div className="flex items-center gap-4 min-w-0">
    <div className="h-16 w-16 rounded-[1.35rem] border border-black/5 dark:border-white/10 bg-white/90 dark:bg-slate-900/80 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
      {logoSrc ? (
        <img src={logoSrc} alt={businessName || 'logo'} className="h-full w-full object-contain p-2" />
      ) : (
        <Building2 className="w-7 h-7 text-slate-400 dark:text-slate-500" />
      )}
    </div>
    <div className="min-w-0">
      <div className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{businessName || 'Tailor Shop'}</div>
      {businessPhone ? (
        <div className="mt-1 inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Phone className="w-4 h-4" />
          <span className="truncate">{businessPhone}</span>
        </div>
      ) : (
        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Measurement workspace</div>
      )}
    </div>
  </div>
);

const OptionArtwork = ({ groupKey, optionKey }) => {
  const svgClass = 'w-12 h-12 text-slate-700 dark:text-slate-200';

  if (groupKey === 'collar') {
    if (optionKey === 'classic') {
      return (
        <svg viewBox="0 0 64 64" className={svgClass} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 20H50" />
          <path d="M20 20L31 31" />
          <path d="M44 20L33 31" />
          <path d="M25 20L32 26L39 20" />
          <path d="M30 31H34" />
        </svg>
      );
    }
    if (optionKey === 'round') {
      return (
        <svg viewBox="0 0 64 64" className={svgClass} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 25C20 18 25 15 32 15C39 15 44 18 46 25" />
          <path d="M18 25C20 32 25 36 32 36C39 36 44 32 46 25" />
          <path d="M22 22C24 20 27 19 32 19C37 19 40 20 42 22" />
        </svg>
      );
    }
    if (optionKey === 'mandarin') {
      return (
        <svg viewBox="0 0 64 64" className={svgClass} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 18H42" />
          <path d="M20 18C20 13 24 10 32 10C40 10 44 13 44 18" />
          <path d="M22 18V31" />
          <path d="M42 18V31" />
          <path d="M24 31H40" />
        </svg>
      );
    }
    if (optionKey === 'open') {
      return (
        <svg viewBox="0 0 64 64" className={svgClass} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 20H48" />
          <path d="M21 20L31 34" />
          <path d="M43 20L33 34" />
          <path d="M31 34V39" />
          <path d="M33 34V39" />
        </svg>
      );
    }
  }

  if (groupKey === 'pocket') {
    if (optionKey === 'none') {
      return (
        <svg viewBox="0 0 64 64" className={svgClass} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="18" y="16" width="28" height="32" rx="8" />
          <path d="M23 41L41 23" />
        </svg>
      );
    }
    if (optionKey === 'chest') {
      return (
        <svg viewBox="0 0 64 64" className={svgClass} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="18" y="14" width="28" height="36" rx="8" />
          <path d="M24 22H40" />
          <path d="M24 22V32H40V22" />
        </svg>
      );
    }
    if (optionKey === 'side') {
      return (
        <svg viewBox="0 0 64 64" className={svgClass} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="18" y="14" width="28" height="36" rx="8" />
          <path d="M22 35H31" />
          <path d="M33 35H42" />
          <path d="M23 39H41" />
        </svg>
      );
    }
    if (optionKey === 'both') {
      return (
        <svg viewBox="0 0 64 64" className={svgClass} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="18" y="14" width="28" height="36" rx="8" />
          <path d="M24 22H40" />
          <path d="M24 22V30H40V22" />
          <path d="M22 38H31" />
          <path d="M33 38H42" />
        </svg>
      );
    }
  }

  if (groupKey === 'bain') {
    if (optionKey === 'hidden') {
      return (
        <svg viewBox="0 0 64 64" className={svgClass} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 18H50" />
          <path d="M18 18V46" />
          <path d="M32 18V46" />
          <path d="M46 18V46" />
        </svg>
      );
    }
    if (optionKey === 'visible') {
      return (
        <svg viewBox="0 0 64 64" className={svgClass} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 18H50" />
          <path d="M24 18V46" />
          <path d="M32 18V46" />
          <path d="M28 24H36" />
          <path d="M28 32H36" />
          <path d="M28 40H36" />
        </svg>
      );
    }
    if (optionKey === 'zip') {
      return (
        <svg viewBox="0 0 64 64" className={svgClass} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 18H50" />
          <path d="M32 18V46" />
          <path d="M28 22H36" />
          <path d="M28 27H36" />
          <path d="M28 32H36" />
          <path d="M28 37H36" />
          <path d="M28 42H36" />
        </svg>
      );
    }
    if (optionKey === 'half') {
      return (
        <svg viewBox="0 0 64 64" className={svgClass} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 18H50" />
          <path d="M32 18V34" />
          <path d="M28 22H36" />
          <path d="M28 27H36" />
          <path d="M28 32H36" />
        </svg>
      );
    }
  }

  if (groupKey === 'cuff') {
    if (optionKey === 'single') {
      return (
        <svg viewBox="0 0 64 64" className={svgClass} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 16V44" />
          <path d="M46 16V44" />
          <path d="M18 44H46" />
        </svg>
      );
    }
    if (optionKey === 'double') {
      return (
        <svg viewBox="0 0 64 64" className={svgClass} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 16V42" />
          <path d="M46 16V42" />
          <path d="M18 36H46" />
          <path d="M18 42H46" />
        </svg>
      );
    }
    if (optionKey === 'round') {
      return (
        <svg viewBox="0 0 64 64" className={svgClass} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 16V34" />
          <path d="M46 16V34" />
          <path d="M18 34C22 42 42 42 46 34" />
        </svg>
      );
    }
    if (optionKey === 'angled') {
      return (
        <svg viewBox="0 0 64 64" className={svgClass} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 16V42" />
          <path d="M46 16V34" />
          <path d="M18 42L46 34" />
        </svg>
      );
    }
  }

  if (groupKey === 'buttons') {
    if (optionKey === 'classic') {
      return (
        <svg viewBox="0 0 64 64" className={svgClass} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M32 14V50" />
          <circle cx="32" cy="22" r="2.5" />
          <circle cx="32" cy="32" r="2.5" />
          <circle cx="32" cy="42" r="2.5" />
        </svg>
      );
    }
    if (optionKey === 'hidden') {
      return (
        <svg viewBox="0 0 64 64" className={svgClass} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M28 14V50" />
          <path d="M36 14V50" />
        </svg>
      );
    }
    if (optionKey === 'snap') {
      return (
        <svg viewBox="0 0 64 64" className={svgClass} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M32 14V50" />
          <circle cx="32" cy="22" r="3.5" />
          <circle cx="32" cy="32" r="3.5" />
          <circle cx="32" cy="42" r="3.5" />
        </svg>
      );
    }
    if (optionKey === 'premium') {
      return (
        <svg viewBox="0 0 64 64" className={svgClass} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M32 14V50" />
          <circle cx="32" cy="22" r="2.5" />
          <circle cx="32" cy="32" r="2.5" />
          <circle cx="32" cy="42" r="2.5" />
          <path d="M24 18H40" />
        </svg>
      );
    }
  }

  if (groupKey === 'embroidery') {
    if (optionKey === 'none') {
      return (
        <svg viewBox="0 0 64 64" className={svgClass} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="18" y="16" width="28" height="32" rx="8" />
          <path d="M24 40L40 24" />
        </svg>
      );
    }
    if (optionKey === 'name') {
      return (
        <svg viewBox="0 0 64 64" className={svgClass} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="18" y="16" width="28" height="32" rx="8" />
          <path d="M24 35L29 26L34 35" />
          <path d="M26 31H32" />
        </svg>
      );
    }
    if (optionKey === 'logo') {
      return (
        <svg viewBox="0 0 64 64" className={svgClass} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="18" y="16" width="28" height="32" rx="8" />
          <path d="M32 24L35 30L42 31L37 36L38 43L32 40L26 43L27 36L22 31L29 30Z" />
        </svg>
      );
    }
    if (optionKey === 'premium') {
      return (
        <svg viewBox="0 0 64 64" className={svgClass} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="18" y="16" width="28" height="32" rx="8" />
          <path d="M24 35L29 26L34 35" />
          <path d="M26 31H32" />
          <path d="M36 26L40 30L36 34" />
        </svg>
      );
    }
  }

  return (
    <div className="w-11 h-11 rounded-2xl border border-current/20 flex items-center justify-center text-sm font-bold">
      {String(optionKey || '').slice(0, 1).toUpperCase()}
    </div>
  );
};

const MeasurementCell = ({ field, value, onChange, disabled, palette, compact = false }) => {
  
  return (
    <div className={`rounded-2xl border ${palette.tile} px-3 py-3 shadow-sm`}>
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
        {(language === 'ar' ? 'المقاس' : 'Measurement')}
      </div>
      <div className={`mt-1 font-semibold text-slate-900 dark:text-slate-100 ${compact ? 'text-xs' : 'text-sm'}`}>{field.label}</div>
      <div className="relative mt-2">
        <input
          type="number"
          step="0.1"
          value={value ?? ''}
          onChange={(e) => onChange(field.key, e.target.value)}
          disabled={disabled}
          placeholder="0"
          className={`no-spinner w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-stone-50/90 dark:bg-slate-950/80 px-3 py-2.5 pr-10 text-center font-semibold text-slate-900 dark:text-slate-100 outline-none transition-all ${palette.focus} ${compact ? 'text-sm' : 'text-base'} ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">cm</span>
      </div>
    </div>
  );
};

const PreviewGarment = ({ thawbType, thawbTypeLabel, selectedCollar, selectedPocket, variant = 'sheet' }) => {
    const imageSrc = thawbImageMap[thawbType] || thawbImageMap.saudi;
  return (
    <div className={`relative mx-auto overflow-hidden rounded-[2rem] border border-black/5 dark:border-white/10 bg-gradient-to-b from-white to-stone-100 dark:from-slate-800 dark:to-slate-900 shadow-inner ${variant === 'board' ? 'w-full max-w-[300px] aspect-[4/5]' : 'w-full max-w-[240px] aspect-[4/5]'}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.82),_transparent_58%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.1),_transparent_55%)]" />
      <div className="absolute inset-0 flex items-center justify-center p-5">
        <img src={imageSrc} alt={thawbType || 'thawb'} className="h-full w-full object-contain drop-shadow-[0_18px_28px_rgba(15,23,42,0.12)]" />
      </div>
      <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/90 dark:bg-slate-900/85 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 shadow-sm">
        <Shirt className="w-3.5 h-3.5" />
        {thawbTypeLabel || formatTypeLabel(thawbType)}
      </div>
      {(selectedCollar || selectedPocket) ? (
        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
          {selectedCollar ? (
            <div className="rounded-full bg-white/88 dark:bg-slate-900/85 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 shadow-sm">
              {(language === 'ar' ? 'الياقة' : 'Collar')}: {selectedCollar}
            </div>
          ) : null}
          {selectedPocket ? (
            <div className="rounded-full bg-white/88 dark:bg-slate-900/85 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 shadow-sm">
              {(language === 'ar' ? 'الجيب' : 'Pocket')}: {selectedPocket}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const DesignOptionsRow = ({ title, groupKey, options = [], value, onChange, disabled = false, palette, columns = 'grid-cols-2 sm:grid-cols-4' }) => {
    if (!options.length) return null;
  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className={`rounded-[1.6rem] border ${palette.tile} p-4 shadow-sm`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
          {selectedOption?.label || (language === 'ar' ? 'غير محدد' : 'Not selected')}
        </div>
      </div>
      {selectedOption ? (
        <div className={`mt-3 flex items-center gap-3 rounded-[1.15rem] border ${palette.selected} bg-white/70 dark:bg-slate-950/50 px-3 py-2`}>
          <div className="shrink-0 h-16 w-16 flex items-center justify-center">
            {selectedOption.imageSrc ? (
              <img src={selectedOption.imageSrc} alt={selectedOption.label} className="h-16 w-16 object-contain" />
            ) : (
              <OptionArtwork groupKey={groupKey} optionKey={selectedOption.value} />
            )}
          </div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedOption.label}</div>
        </div>
      ) : null}
      <div className={`mt-4 grid ${columns} gap-3`}>
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <button
              key={`${groupKey}-${option.value}`}
              type="button"
              onClick={() => onChange?.(groupKey, option.value)}
              disabled={disabled}
              className={`rounded-[1.35rem] border p-3 text-center transition-all ${isSelected ? `${palette.selected} bg-white dark:bg-slate-950/70` : `${palette.tile} hover:border-slate-300 dark:hover:border-slate-600`} ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
            >
              <div className="h-20 flex items-center justify-center text-slate-700 dark:text-slate-200">
                {option.imageSrc ? (
                  <img src={option.imageSrc} alt={option.label} className="h-16 w-16 object-contain" />
                ) : (
                  <OptionArtwork groupKey={groupKey} optionKey={option.value} />
                )}
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">{option.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ThawbTypeSelector = ({ options = [], value, onChange, disabled = false, vertical = false, palette }) => {
    if (!options.length) return null;

  return (
    <div className={`rounded-[1.6rem] border ${palette.tile} p-4 shadow-sm`}>
      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{(language === 'ar' ? 'نوع الثوب' : 'Thawb Type')}</div>
      <div className={`mt-4 grid gap-3 ${vertical ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-1'}`}>
        {options.map((option) => {
          const isSelected = option.key === value;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onChange?.(option.key)}
              disabled={disabled}
              className={`flex items-center gap-3 rounded-[1.25rem] border px-3 py-3 text-left transition-all ${isSelected ? `${palette.selected} bg-white dark:bg-slate-950/70` : `${palette.tile} hover:border-slate-300 dark:hover:border-slate-600`} ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
            >
              <div className="h-12 w-12 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-950 overflow-hidden shrink-0 flex items-center justify-center">
                {option.imageSrc ? <img src={option.imageSrc} alt={option.label} className="h-full w-full object-contain" /> : <Shirt className="w-5 h-5 text-slate-400" />}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{option.label}</div>
                {option.subtitle ? <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{option.subtitle}</div> : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const MaterialsPanel = ({
  fabricOptions = [],
  selectedFabricId = '',
  onFabricChange,
  customFabricName = '',
  onCustomFabricNameChange,
  rollsUsed = '',
  onRollsUsedChange,
  fabricColors = [],
  selectedFabricColor = '',
  onFabricColorChange,
  disabled = false,
  loading = false,
  palette
}) => {
    const fabricChoices = [
    { value: '', label: (language === 'ar' ? 'غير محدد' : 'Not specified') },
    ...(fabricOptions || []).map((fabric) => ({
      value: fabric?._id || '',
      label: `${fabric?.name || '—'} · ${(language === 'ar' ? 'المخزون' : 'Stock')}: ${Number(fabric?.rollsInStock) || 0}`
    }))
  ];

  return (
    <div className={`rounded-[1.6rem] border ${palette.tile} p-4 shadow-sm`}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{(language === 'ar' ? 'القماش والخامات' : 'Fabric & Materials')}</div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{(language === 'ar' ? 'اختياري' : 'Optional')}</div>
      </div>
      {loading ? <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">{(language === 'ar' ? 'جارٍ التحميل...' : 'Loading...')}</div> : null}
      <div className="mt-4 space-y-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{(language === 'ar' ? 'القماش' : 'Fabric')}</div>
          <select
            value={selectedFabricId}
            onChange={(e) => onFabricChange?.(e.target.value)}
            disabled={disabled}
            className={`mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-stone-50/90 dark:bg-slate-950/80 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none transition-all ${palette.focus} ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {fabricChoices.map((choice) => (
              <option key={`fabric-${choice.value || 'none'}`} value={choice.value}>{choice.label}</option>
            ))}
          </select>
          <input
            type="text"
            value={customFabricName}
            onChange={(e) => onCustomFabricNameChange?.(e.target.value)}
            disabled={disabled}
            placeholder={(language === 'ar' ? 'measurementWorkspace.customFabricPlaceholder' : 'measurementWorkspace.customFabricPlaceholder')}
            className={`mt-3 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-stone-50/90 dark:bg-slate-950/80 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none transition-all ${palette.focus} ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
          />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{(language === 'ar' ? 'الرولات المستخدمة' : 'Rolls Used')}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {['0.25', '0.50', '0.75', '1'].map((preset) => {
              const isSelected = String(rollsUsed || '') === preset;
              return (
                <button
                  key={`roll-${preset}`}
                  type="button"
                  onClick={() => onRollsUsedChange?.(preset)}
                  disabled={disabled}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${isSelected ? `${palette.selected} bg-white dark:bg-slate-950/70` : `${palette.tile} hover:border-slate-300 dark:hover:border-slate-600`} ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                  {preset}
                </button>
              );
            })}
          </div>
          <input
            type="number"
            min="0"
            step="0.01"
            value={rollsUsed}
            onChange={(e) => onRollsUsedChange?.(e.target.value)}
            disabled={disabled}
            placeholder="0"
            className={`mt-3 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-stone-50/90 dark:bg-slate-950/80 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none transition-all ${palette.focus} ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
          />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{(language === 'ar' ? 'لون القماش' : 'Fabric Color')}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onFabricColorChange?.('')}
              disabled={disabled}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${!selectedFabricColor ? `${palette.selected} bg-white dark:bg-slate-950/70` : `${palette.tile} hover:border-slate-300 dark:hover:border-slate-600`} ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
            >
              {(language === 'ar' ? 'غير محدد' : 'Not specified')}
            </button>
            {(fabricColors || []).map((color) => {
              const isSelected = selectedFabricColor === color.key;
              return (
                <button
                  key={`fabric-color-${color.key}`}
                  type="button"
                  onClick={() => onFabricColorChange?.(color.key)}
                  disabled={disabled}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${isSelected ? `${palette.selected} bg-white dark:bg-slate-950/70` : `${palette.tile} hover:border-slate-300 dark:hover:border-slate-600`} ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                  <span className="h-4 w-4 rounded-full border border-black/10 dark:border-white/10" style={{ backgroundColor: color.hex }} />
                  <span>{color.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const SnapshotPanel = ({ items = [], palette }) => {
    const spotlight = useMemo(() => (items || []).filter((item) => item && item.value !== undefined && item.value !== null && String(item.value).trim() !== ''), [items]);

  return (
    <div className={`rounded-[1.6rem] border ${palette.tile} p-4 shadow-sm`}>
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
        <Ruler className="w-4 h-4" />
        {(language === 'ar' ? 'ملخص المقاس' : 'Fit snapshot')}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {spotlight.length > 0 ? spotlight.map((item) => (
          <div key={`${item.label}-${item.value}`} className="rounded-2xl bg-stone-50/90 dark:bg-slate-950/70 px-3 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500 truncate">{item.label}</div>
            <div className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">{item.value}</div>
          </div>
        )) : (
          <div className="col-span-2 rounded-2xl bg-stone-50/90 dark:bg-slate-950/70 px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
            {(language === 'ar' ? 'ابدأ بإدخال المقاسات لعرض ملخص المقاس.' : 'Start entering measurements to build the fit summary.')}
          </div>
        )}
      </div>
    </div>
  );
};

const MeasurementAtelierPanel = ({
  title,
  subtitle,
  fields,
  values,
  onChange,
  disabled = false,
  loading = false,
  thawbType = 'saudi',
  badges = [],
  tone = 'slate',
  variant = 'sheet',
  logoSrc = null,
  businessName = '',
  businessPhone = '',
  styleGroups = [],
  styleValues = {},
  onStyleChange,
  showStyleControls = false,
  thawbTypes = [],
  onThawbTypeChange,
  fabricOptions = [],
  selectedFabricId = '',
  onFabricChange,
  customFabricName = '',
  onCustomFabricNameChange,
  rollsUsed = '',
  onRollsUsedChange,
  fabricColors = [],
  selectedFabricColor = '',
  onFabricColorChange,
  materialsLoading = false,
  measurementImageSrc = '',
  measurementImageName = '',
  onMeasurementImageChange,
  onMeasurementImageRemove,
  showMeasurementImageControl = true
}) => {
    const palette = toneMap[tone] || defaultTone;
  const normalizedStyleGroups = useMemo(() => (
    (styleGroups || [])
      .map((group, groupIndex) => {
        const groupKey = group?.key || styleGroupOrder[groupIndex];
        if (!groupKey) return null;
        const fallbackOptions = styleOptionOrder[groupKey] || [];
        return {
          ...group,
          key: groupKey,
          label: group?.label || group?.name || t(`styleOptions.${groupKey}`, { defaultValue: groupKey }),
          options: (group?.options || [])
            .map((option, optionIndex) => {
              const optionValue = option?.value || option?.key || fallbackOptions[optionIndex];
              if (!optionValue) return null;
              return {
                ...option,
                value: optionValue,
                label: option?.label || option?.name || t(`styleOptions.options.${groupKey}.${optionValue}`, { defaultValue: optionValue })
              };
            })
            .filter(Boolean)
        };
      })
      .filter(Boolean)
  ), [styleGroups, t]);

  const orderedFields = useMemo(() => {
    const map = new Map((fields || []).map((field) => [field.key, field]));
    const makeGroup = (keys) => keys.map((key) => map.get(key)).filter(Boolean);
    const used = new Set([...groupedKeys.core, ...groupedKeys.sleeve]);
    const remaining = (fields || []).filter((field) => !used.has(field.key));
    return {
      core: makeGroup(groupedKeys.core),
      sleeve: makeGroup(groupedKeys.sleeve).concat(remaining)
    };
  }, [fields]);

  const completion = useMemo(() => {
    const total = Array.isArray(fields) ? fields.length : 0;
    if (!total) return 0;
    const filled = (fields || []).filter((field) => {
      const value = values?.[field.key];
      return value !== undefined && value !== null && String(value).trim() !== '';
    }).length;
    return Math.round((filled / total) * 100);
  }, [fields, values]);

  const collarGroup = normalizedStyleGroups.find((group) => group.key === 'collar');
  const pocketGroup = normalizedStyleGroups.find((group) => group.key === 'pocket');
  const primaryStyleGroups = [collarGroup, pocketGroup].filter(Boolean);
  const secondaryStyleGroups = normalizedStyleGroups.filter((group) => !['collar', 'pocket'].includes(group.key));
  const selectedCollar = collarGroup?.options?.find((option) => option.value === styleValues?.collar)?.label || '';
  const selectedPocket = pocketGroup?.options?.find((option) => option.value === styleValues?.pocket)?.label || '';
  const selectedThawbTypeLabel = thawbTypes.find((option) => option.key === thawbType)?.label || formatTypeLabel(thawbType);
  const measurementSnapshotItems = (fields || [])
    .filter((field) => values?.[field.key] !== undefined && values?.[field.key] !== null && String(values?.[field.key]).trim() !== '')
    .map((field) => ({ label: field.label, value: formatValue(values?.[field.key]) }));
  const snapshotItems = measurementSnapshotItems.slice(0, 4);
  const currentDate = new Date().toLocaleDateString();
  const headerChips = badges.slice(0, 3);
  const shouldShowMeasurementImage = showMeasurementImageControl && (typeof onMeasurementImageChange === 'function' || !!measurementImageSrc);
  const measurementImagePanel = shouldShowMeasurementImage ? (
    <MeasurementImageInput
      label={(language === 'ar' ? 'measurementWorkspace.measurementImage' : 'measurementWorkspace.measurementImage')}
      hint={(language === 'ar' ? 'measurementWorkspace.measurementImageHint' : 'measurementWorkspace.measurementImageHint')}
      previewSrc={measurementImageSrc}
      fileName={measurementImageName}
      onFileChange={onMeasurementImageChange}
      onRemove={onMeasurementImageRemove}
      disabled={disabled}
      className="border-slate-200 dark:border-slate-700 bg-white/85 dark:bg-slate-900/60"
    />
  ) : null;

  if (variant === 'board') {
    return (
      <div className={`relative overflow-hidden rounded-[2rem] border ${palette.shell} bg-gradient-to-br from-stone-100 via-stone-50 to-white dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-800 p-5 sm:p-6 shadow-[0_24px_60px_rgba(15,23,42,0.12)]`}>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/85 dark:bg-slate-900/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300 shadow-sm">
                <PencilRuler className="w-3.5 h-3.5" />
                {(language === 'ar' ? 'لوحة المقاسات' : 'Measurement Board')}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm bg-white/85 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200">
                <Sparkles className="w-4 h-4" />
                {completion}% {(language === 'ar' ? 'مكتمل' : 'complete')}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
              {(fields || []).map((field) => (
                <MeasurementCell
                  key={`board-${field.key}`}
                  field={field}
                  value={values?.[field.key]}
                  onChange={onChange}
                  disabled={disabled}
                  palette={palette}
                  compact
                />
              ))}
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_320px] items-start">
              <div className="space-y-4">
                <div className={`rounded-[1.6rem] border ${palette.tile} p-4 shadow-sm`}>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{(language === 'ar' ? 'مؤشرات المقاس' : 'Fit markers')}</div>
                  <div className="mt-4 space-y-3">
                    {orderedFields.core.slice(0, 4).map((field, index) => (
                      <div key={`marker-${field.key}`} className="grid grid-cols-[14px_minmax(0,1fr)] items-center gap-3">
                        <div className="h-16 rounded-full bg-gradient-to-b from-slate-700 to-slate-300 dark:from-slate-300 dark:to-slate-700 opacity-80" />
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{String.fromCharCode(65 + index)}</div>
                          <div className="mt-1 text-xs font-semibold text-slate-900 dark:text-slate-100">{field.label}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{formatValue(values?.[field.key])}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-black/5 dark:border-white/10 bg-white/55 dark:bg-slate-900/50 p-4 shadow-sm">
                <PreviewGarment thawbType={thawbType} thawbTypeLabel={selectedThawbTypeLabel} selectedCollar={selectedCollar} selectedPocket={selectedPocket} variant="board" />
              </div>

              <div className="space-y-4">
                <ThawbTypeSelector
                  options={thawbTypes}
                  value={thawbType}
                  onChange={onThawbTypeChange}
                  disabled={disabled || !showStyleControls}
                  vertical
                  palette={palette}
                />
                <SnapshotPanel items={snapshotItems} palette={palette} />
                {measurementImagePanel}
              </div>
            </div>

            {(primaryStyleGroups.length || secondaryStyleGroups.length || showStyleControls) ? (
              <div className="mt-5 space-y-4">
                {primaryStyleGroups.length ? (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {primaryStyleGroups.map((group) => (
                      <DesignOptionsRow
                        key={`primary-board-${group.key}`}
                        title={group.label}
                        groupKey={group.key}
                        options={group.options || []}
                        value={styleValues?.[group.key] || ''}
                        onChange={onStyleChange}
                        disabled={disabled || !showStyleControls}
                        palette={palette}
                      />
                    ))}
                  </div>
                ) : null}
                {secondaryStyleGroups.length ? (
                  <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {secondaryStyleGroups.map((group) => (
                      <DesignOptionsRow
                        key={`secondary-board-${group.key}`}
                        title={group.label}
                        groupKey={group.key}
                        options={group.options || []}
                        value={styleValues?.[group.key] || ''}
                        onChange={onStyleChange}
                        disabled={disabled || !showStyleControls}
                        palette={palette}
                      />
                    ))}
                  </div>
                ) : null}
                {showStyleControls ? (
                  <MaterialsPanel
                    fabricOptions={fabricOptions}
                    selectedFabricId={selectedFabricId}
                    onFabricChange={onFabricChange}
                    customFabricName={customFabricName}
                    onCustomFabricNameChange={onCustomFabricNameChange}
                    rollsUsed={rollsUsed}
                    onRollsUsedChange={onRollsUsedChange}
                    fabricColors={fabricColors}
                    selectedFabricColor={selectedFabricColor}
                    onFabricColorChange={onFabricColorChange}
                    disabled={disabled}
                    loading={materialsLoading}
                    palette={palette}
                  />
                ) : null}
              </div>
            ) : null}
          </div>

          <div className={`rounded-[1.85rem] border ${palette.tile} p-5 shadow-sm`}>
            <BrandBlock logoSrc={logoSrc} businessName={businessName} businessPhone={businessPhone} />
            <div className="mt-5 text-xl font-bold text-slate-900 dark:text-slate-100">{title}</div>
            {subtitle ? <div className={`mt-2 text-sm leading-6 ${palette.muted}`}>{subtitle}</div> : null}
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl bg-stone-50/90 dark:bg-slate-950/70 px-4 py-3">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{(language === 'ar' ? 'التاريخ' : 'Date')}</div>
                <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <CalendarDays className="w-4 h-4" />
                  {currentDate}
                </div>
              </div>
              <div className="rounded-2xl bg-stone-50/90 dark:bg-slate-950/70 px-4 py-3">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{(language === 'ar' ? 'الحالة' : 'Status')}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {headerChips.map((badge) => (
                    <div key={badge} className={`rounded-full px-3 py-1 text-xs font-semibold ${palette.soft}`}>
                      {badge}
                    </div>
                  ))}
                  <div className={`rounded-full px-3 py-1 text-xs font-semibold ${palette.soft}`}>{completion}% {(language === 'ar' ? 'مكتمل' : 'complete')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {loading ? <div className={`mt-4 text-sm ${palette.muted}`}>{(language === 'ar' ? 'جارٍ التحميل...' : 'Loading...')}</div> : null}
      </div>
    );
  }

  if (variant === 'board-minimal') {
    return (
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-5 sm:p-6 shadow-[0_28px_80px_rgba(2,6,23,0.45)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.08),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(245,158,11,0.08),_transparent_24%)]" />
        <div className="relative flex flex-col gap-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <BrandBlock logoSrc={logoSrc} businessName={businessName} businessPhone={businessPhone} />
              <div className="mt-4 text-2xl font-semibold tracking-tight text-white">{title}</div>
              {subtitle ? <div className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{subtitle}</div> : null}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{(language === 'ar' ? 'التاريخ' : 'Date')}</div>
                <div className="mt-2 text-sm font-semibold text-white">{currentDate}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{(language === 'ar' ? 'نوع الثوب' : 'Thawb Type')}</div>
                <div className="mt-2 text-sm font-semibold text-white">{selectedThawbTypeLabel}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{(language === 'ar' ? 'مكتمل' : 'complete')}</div>
                <div className="mt-2 text-sm font-semibold text-white">{completion}%</div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)_300px]">
            <div className="rounded-[1.85rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="text-sm font-semibold text-white">{(language === 'ar' ? 'مؤشرات المقاس' : 'Fit markers')}</div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {(fields || []).map((field) => (
                  <MeasurementCell
                    key={`board-minimal-${field.key}`}
                    field={field}
                    value={values?.[field.key]}
                    onChange={onChange}
                    disabled={disabled}
                    palette={palette}
                    compact
                  />
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[1.95rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <PreviewGarment thawbType={thawbType} thawbTypeLabel={selectedThawbTypeLabel} selectedCollar={selectedCollar} selectedPocket={selectedPocket} variant="board" />
              </div>
            </div>

            <div className="space-y-4">
              <ThawbTypeSelector
                options={thawbTypes}
                value={thawbType}
                onChange={onThawbTypeChange}
                disabled={disabled || !showStyleControls}
                vertical
                palette={palette}
              />
              <SnapshotPanel items={snapshotItems} palette={palette} />
              {measurementImagePanel}
              {showStyleControls ? (
                <MaterialsPanel
                  fabricOptions={fabricOptions}
                  selectedFabricId={selectedFabricId}
                  onFabricChange={onFabricChange}
                  customFabricName={customFabricName}
                  onCustomFabricNameChange={onCustomFabricNameChange}
                  rollsUsed={rollsUsed}
                  onRollsUsedChange={onRollsUsedChange}
                  fabricColors={fabricColors}
                  selectedFabricColor={selectedFabricColor}
                  onFabricColorChange={onFabricColorChange}
                  disabled={disabled}
                  loading={materialsLoading}
                  palette={palette}
                />
              ) : null}
            </div>
          </div>

          {(primaryStyleGroups.length || secondaryStyleGroups.length) ? (
            <div className="space-y-4">
              {primaryStyleGroups.length ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  {primaryStyleGroups.map((group) => (
                    <DesignOptionsRow
                      key={`primary-board-minimal-${group.key}`}
                      title={group.label}
                      groupKey={group.key}
                      options={group.options || []}
                      value={styleValues?.[group.key] || ''}
                      onChange={onStyleChange}
                      disabled={disabled || !showStyleControls}
                      palette={palette}
                    />
                  ))}
                </div>
              ) : null}
              {secondaryStyleGroups.length ? (
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {secondaryStyleGroups.map((group) => (
                    <DesignOptionsRow
                      key={`secondary-board-minimal-${group.key}`}
                      title={group.label}
                      groupKey={group.key}
                      options={group.options || []}
                      value={styleValues?.[group.key] || ''}
                      onChange={onStyleChange}
                      disabled={disabled || !showStyleControls}
                      palette={palette}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {loading ? <div className="text-sm text-slate-400">{(language === 'ar' ? 'جارٍ التحميل...' : 'Loading...')}</div> : null}
        </div>
      </div>
    );
  }

  if (variant === 'sheet-minimal') {
    return (
      <div className="relative overflow-hidden rounded-[2rem] border border-violet-100/80 dark:border-violet-900/30 bg-gradient-to-br from-white via-violet-50/60 to-stone-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 p-5 sm:p-7 shadow-[0_24px_70px_rgba(76,29,149,0.12)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.1),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.08),_transparent_22%)]" />
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <BrandBlock logoSrc={logoSrc} businessName={businessName} businessPhone={businessPhone} />
              <div className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</div>
              {subtitle ? <div className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{subtitle}</div> : null}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-violet-100 dark:border-violet-900/30 bg-white/90 dark:bg-slate-900/70 px-4 py-3 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{(language === 'ar' ? 'التاريخ' : 'Date')}</div>
                <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{currentDate}</div>
              </div>
              <div className="rounded-2xl border border-violet-100 dark:border-violet-900/30 bg-white/90 dark:bg-slate-900/70 px-4 py-3 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{(language === 'ar' ? 'نوع الثوب' : 'Thawb Type')}</div>
                <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{selectedThawbTypeLabel}</div>
              </div>
              <div className="rounded-2xl border border-violet-100 dark:border-violet-900/30 bg-white/90 dark:bg-slate-900/70 px-4 py-3 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{(language === 'ar' ? 'مكتمل' : 'complete')}</div>
                <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{completion}%</div>
              </div>
              <div className="rounded-2xl border border-violet-100 dark:border-violet-900/30 bg-white/90 dark:bg-slate-900/70 px-4 py-3 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{(language === 'ar' ? 'الشارات' : 'Badges')}</div>
                <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{headerChips.length}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_360px]">
            <div className="rounded-[1.9rem] border border-violet-100 dark:border-violet-900/30 bg-white/85 dark:bg-slate-900/60 p-5 shadow-sm">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {(fields || []).map((field) => (
                  <MeasurementCell
                    key={`sheet-minimal-${field.key}`}
                    field={field}
                    value={values?.[field.key]}
                    onChange={onChange}
                    disabled={disabled}
                    palette={palette}
                    compact
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.9rem] border border-violet-100 dark:border-violet-900/30 bg-white/85 dark:bg-slate-900/60 p-5 shadow-sm">
                <PreviewGarment thawbType={thawbType} thawbTypeLabel={selectedThawbTypeLabel} selectedCollar={selectedCollar} selectedPocket={selectedPocket} />
              </div>
              <ThawbTypeSelector
                options={thawbTypes}
                value={thawbType}
                onChange={onThawbTypeChange}
                disabled={disabled || !showStyleControls}
                palette={palette}
              />
              <SnapshotPanel items={snapshotItems} palette={palette} />
              {measurementImagePanel}
            </div>
          </div>

          {(primaryStyleGroups.length || secondaryStyleGroups.length || showStyleControls) ? (
            <div className="space-y-4">
              {primaryStyleGroups.length ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  {primaryStyleGroups.map((group) => (
                    <DesignOptionsRow
                      key={`primary-sheet-minimal-${group.key}`}
                      title={group.label}
                      groupKey={group.key}
                      options={group.options || []}
                      value={styleValues?.[group.key] || ''}
                      onChange={onStyleChange}
                      disabled={disabled || !showStyleControls}
                      palette={palette}
                    />
                  ))}
                </div>
              ) : null}
              {secondaryStyleGroups.length ? (
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {secondaryStyleGroups.map((group) => (
                    <DesignOptionsRow
                      key={`secondary-sheet-minimal-${group.key}`}
                      title={group.label}
                      groupKey={group.key}
                      options={group.options || []}
                      value={styleValues?.[group.key] || ''}
                      onChange={onStyleChange}
                      disabled={disabled || !showStyleControls}
                      palette={palette}
                    />
                  ))}
                </div>
              ) : null}
              {showStyleControls ? (
                <MaterialsPanel
                  fabricOptions={fabricOptions}
                  selectedFabricId={selectedFabricId}
                  onFabricChange={onFabricChange}
                  customFabricName={customFabricName}
                  onCustomFabricNameChange={onCustomFabricNameChange}
                  rollsUsed={rollsUsed}
                  onRollsUsedChange={onRollsUsedChange}
                  fabricColors={fabricColors}
                  selectedFabricColor={selectedFabricColor}
                  onFabricColorChange={onFabricColorChange}
                  disabled={disabled}
                  loading={materialsLoading}
                  palette={palette}
                />
              ) : null}
            </div>
          ) : null}

          {loading ? <div className="text-sm text-slate-500 dark:text-slate-400">{(language === 'ar' ? 'جارٍ التحميل...' : 'Loading...')}</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-[2rem] border ${palette.shell} bg-gradient-to-br from-[#f7f1e8] via-stone-50 to-white dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-800 p-5 sm:p-6 shadow-[0_22px_60px_rgba(15,23,42,0.12)]`}>
      <div className="flex flex-col gap-5">
        <div>
          <div>
            <BrandBlock logoSrc={logoSrc} businessName={businessName} businessPhone={businessPhone} />
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/88 dark:bg-slate-900/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300 shadow-sm">
              <PencilRuler className="w-3.5 h-3.5" />
              {(language === 'ar' ? 'ورقة المقاسات' : 'Tailor Measurement Sheet')}
            </div>
            <div className="mt-3 text-xl font-bold text-slate-900 dark:text-slate-100">{title}</div>
            {subtitle ? <div className={`mt-1 max-w-2xl text-sm leading-6 ${palette.muted}`}>{subtitle}</div> : null}
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-black/5 dark:border-white/10 bg-white/60 dark:bg-slate-900/40 p-4 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
            {(fields || []).map((field) => (
              <MeasurementCell
                key={`sheet-${field.key}`}
                field={field}
                value={values?.[field.key]}
                onChange={onChange}
                disabled={disabled}
                palette={palette}
                compact
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)] items-start">
          <ThawbTypeSelector
            options={thawbTypes}
            value={thawbType}
            onChange={onThawbTypeChange}
            disabled={disabled || !showStyleControls}
            palette={palette}
          />

          <div className="space-y-4">
            <div className="rounded-[1.8rem] border border-black/5 dark:border-white/10 bg-white/60 dark:bg-slate-900/40 p-4 shadow-sm">
              <PreviewGarment thawbType={thawbType} thawbTypeLabel={selectedThawbTypeLabel} selectedCollar={selectedCollar} selectedPocket={selectedPocket} />
            </div>
            <SnapshotPanel items={snapshotItems} palette={palette} />
            {measurementImagePanel}
          </div>
        </div>

        {(primaryStyleGroups.length || secondaryStyleGroups.length || showStyleControls) ? (
          <div className="space-y-4">
            {primaryStyleGroups.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {primaryStyleGroups.map((group) => (
                  <DesignOptionsRow
                    key={`primary-sheet-${group.key}`}
                    title={group.label}
                    groupKey={group.key}
                    options={group.options || []}
                    value={styleValues?.[group.key] || ''}
                    onChange={onStyleChange}
                    disabled={disabled || !showStyleControls}
                    palette={palette}
                  />
                ))}
              </div>
            ) : null}
            {secondaryStyleGroups.length ? (
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {secondaryStyleGroups.map((group) => (
                  <DesignOptionsRow
                    key={`secondary-sheet-${group.key}`}
                    title={group.label}
                    groupKey={group.key}
                    options={group.options || []}
                    value={styleValues?.[group.key] || ''}
                    onChange={onStyleChange}
                    disabled={disabled || !showStyleControls}
                    palette={palette}
                  />
                ))}
              </div>
            ) : null}
            {showStyleControls ? (
              <MaterialsPanel
                fabricOptions={fabricOptions}
                selectedFabricId={selectedFabricId}
                onFabricChange={onFabricChange}
                customFabricName={customFabricName}
                onCustomFabricNameChange={onCustomFabricNameChange}
                rollsUsed={rollsUsed}
                onRollsUsedChange={onRollsUsedChange}
                fabricColors={fabricColors}
                selectedFabricColor={selectedFabricColor}
                onFabricColorChange={onFabricColorChange}
                disabled={disabled}
                loading={materialsLoading}
                palette={palette}
              />
            ) : null}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-white/88 dark:bg-slate-900/80 px-4 py-3 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{(language === 'ar' ? 'التاريخ' : 'Date')}</div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{currentDate}</div>
              </div>
              <div className="rounded-2xl bg-white/88 dark:bg-slate-900/80 px-4 py-3 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{(language === 'ar' ? 'نوع الثوب' : 'Thawb Type')}</div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedThawbTypeLabel}</div>
              </div>
              <div className="rounded-2xl bg-white/88 dark:bg-slate-900/80 px-4 py-3 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{(language === 'ar' ? 'مكتمل' : 'complete')}</div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{completion}%</div>
              </div>
              <div className="rounded-2xl bg-white/88 dark:bg-slate-900/80 px-4 py-3 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{(language === 'ar' ? 'الشارات' : 'Badges')}</div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{headerChips.length}</div>
              </div>
            </div>
          </div>
        ) : null}

        {loading ? <div className={`text-sm ${palette.muted}`}>{(language === 'ar' ? 'جارٍ التحميل...' : 'Loading...')}</div> : null}
      </div>
    </div>
  );
};

export default MeasurementAtelierPanel;
