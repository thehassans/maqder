import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Car, User, FileText, CheckCircle, Search, ChevronRight, AlertTriangle, X, Fuel, Gauge, Clock, Shield, Zap } from 'lucide-react'
import api from '../../lib/api'
import DamageMatrix from './components/DamageMatrix'

const STEPS = ['car', 'customer', 'terms', 'confirm']
const FUEL_LEVELS = ['empty', 'quarter', 'half', 'three_quarters', 'full']
const FUEL_ICONS = { empty: '○○○○○', quarter: '●○○○○', half: '●●○○○', three_quarters: '●●●○○', full: '●●●●●' }
const FUEL_LABEL = { empty: 'Empty', quarter: '¼ Tank', half: '½ Tank', three_quarters: '¾ Tank', full: 'Full' }

const STEP_CONFIG = [
  { id: 'car',      label: 'Select Car',   sub: 'Choose available vehicle', icon: Car },
  { id: 'customer', label: 'Customer',      sub: 'Find or add renter',       icon: User },
  { id: 'terms',    label: 'Terms',         sub: 'Set rates & conditions',    icon: FileText },
  { id: 'confirm',  label: 'Confirm',       sub: 'Review & finalise',         icon: CheckCircle },
]

// ─── Vertical Stepper ──────────────────────────────────────────────────────────
const Stepper = ({ step, isAr }) => {
  const current = STEPS.indexOf(step)
  return (
    <div className="flex flex-col gap-0 py-2">
      {STEP_CONFIG.map((s, i) => {
        const Icon = s.icon
        const done    = i < current
        const active  = i === current
        const pending = i > current
        return (
          <div key={s.id} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={`
                w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 flex-shrink-0
                ${active  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-500/20' : ''}
                ${done    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : ''}
                ${pending ? 'bg-gray-100 text-gray-400 dark:bg-dark-700 dark:text-gray-600' : ''}
              `}>
                {done ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              {i < STEP_CONFIG.length - 1 && (
                <div className={`w-0.5 h-10 my-1 rounded-full transition-all duration-500 ${done ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-gray-200 dark:bg-dark-600'}`} />
              )}
            </div>
            <div className="pt-1.5">
              <p className={`text-sm font-semibold leading-none transition-colors ${active ? 'text-gray-900 dark:text-white' : done ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-600'}`}>
                {s.label}
              </p>
              {active && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.sub}</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Shared input atoms ────────────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
  </div>
)

const Input = (props) => (
  <input {...props}
    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-400 transition-all" />
)

const Select = ({ value, onChange, children }) => (
  <select value={value} onChange={onChange}
    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-400 transition-all">
    {children}
  </select>
)

// ─── Fuel bar visual ───────────────────────────────────────────────────────────
const FuelBar = ({ level }) => {
  const idx = FUEL_LEVELS.indexOf(level)
  const pct  = idx >= 0 ? (idx / (FUEL_LEVELS.length - 1)) * 100 : 100
  const color = pct > 60 ? 'bg-emerald-500' : pct > 25 ? 'bg-amber-400' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <Fuel className="w-3.5 h-3.5 text-gray-400" />
    </div>
  )
}

// ─── Pill badge ────────────────────────────────────────────────────────────────
const Pill = ({ icon: Icon, text, muted }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${muted ? 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-dark-700' : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'}`}>
    {Icon && <Icon className="w-3 h-3" />}{text}
  </span>
)

export default function CheckoutPOS() {
  const navigate     = useNavigate()
  const [searchParams] = useSearchParams()
  const { language } = useSelector(s => s.ui)
  const isAr  = language === 'ar'
  const t     = (en, ar) => isAr ? ar : en

  const [step, setStep]                   = useState('car')
  const [selectedCar, setSelectedCar]     = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [carSearch, setCarSearch]         = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [cars, setCars]                   = useState([])
  const [customerResults, setCustomerResults] = useState([])
  const [loading, setLoading]             = useState(false)
  const [submitting, setSubmitting]       = useState(false)
  const [error, setError]                 = useState('')
  const customerTimer = useRef(null)

  const [terms, setTerms] = useState({
    startDateTime: new Date().toISOString().slice(0, 16),
    expectedReturnDateTime: '',
    dailyRate: '', allowedKmPerDay: 200, perKmOverageRate: '', hourlyLateRate: '', securityDeposit: '',
  })
  const [condition, setCondition] = useState({
    odometerOut: '', fuelLevelOut: 'full', damageNotes: '', damagePins: []
  })

  // Pre-select car from URL
  useEffect(() => {
    const carId = searchParams.get('carId')
    if (carId) {
      api.get(`/rental/cars/${carId}`).then(r => {
        setSelectedCar(r.data); prefillTerms(r.data); setStep('customer')
      }).catch(() => {})
    }
  }, [])

  const prefillTerms = (car) => {
    setTerms(p => ({ ...p, dailyRate: car.dailyRateDefault || '', allowedKmPerDay: car.allowedKmPerDayDefault || 200, perKmOverageRate: car.perKmOverageRateDefault || '', hourlyLateRate: car.hourlyLateRateDefault || '', securityDeposit: car.securityDepositDefault || '' }))
    setCondition(p => ({ ...p, odometerOut: car.currentOdometer || 0 }))
  }

  useEffect(() => {
    if (step !== 'car') return
    setLoading(true)
    api.get('/rental/cars', { params: { status: 'AVAILABLE', search: carSearch, limit: 30 } })
      .then(r => setCars(r.data.cars || [])).catch(() => {}).finally(() => setLoading(false))
  }, [step, carSearch])

  useEffect(() => {
    if (step !== 'customer') return
    if (customerTimer.current) clearTimeout(customerTimer.current)
    customerTimer.current = setTimeout(async () => {
      if (customerSearch.length < 2) return setCustomerResults([])
      try { const { data } = await api.get('/rental/customers/search', { params: { q: customerSearch } }); setCustomerResults(data) } catch (_) {}
    }, 300)
  }, [customerSearch, step])

  const selectCar = (car) => { setSelectedCar(car); prefillTerms(car); setStep('customer') }
  const selectCustomer = (c) => { setSelectedCustomer(c); setCustomerResults([]); setCustomerSearch(c.fullName); setStep('terms') }

  const calcDays = () => {
    if (!terms.startDateTime || !terms.expectedReturnDateTime) return 0
    return Math.max(1, Math.ceil((new Date(terms.expectedReturnDateTime) - new Date(terms.startDateTime)) / 86400000))
  }
  const estimatedBase = calcDays() * (parseFloat(terms.dailyRate) || 0)

  const handleCheckout = async () => {
    if (!selectedCar || !selectedCustomer) return setError(t('Please select a car and customer', 'يرجى اختيار سيارة وعميل'))
    try {
      setSubmitting(true); setError('')
      const { data } = await api.post('/rental/contracts/checkout', { carId: selectedCar._id, customerId: selectedCustomer._id, ...terms, ...condition })
      navigate(`/app/rental/contracts/${data.contract._id}`)
    } catch (e) { setError(e.response?.data?.error || t('Checkout failed', 'فشل التأجير')) }
    finally { setSubmitting(false) }
  }

  const pageVariants = { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' } }, exit: { opacity: 0, x: -24, transition: { duration: 0.18 } } }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 -m-6 p-6">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{t('New Rental', 'تأجير جديد')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('Complete all steps to check out a vehicle', 'أتمم جميع الخطوات لتأجير المركبة')}</p>
          </div>
          <button onClick={() => navigate('/app/rental/active')}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-dark-600 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-dark-700 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Main layout: sidebar + content ─────────────────────────────────── */}
        <div className="flex gap-6 items-start">

          {/* Stepper sidebar */}
          <div className="hidden md:block w-52 flex-shrink-0 bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-5 sticky top-6">
            <Stepper step={step} isAr={isAr} />
          </div>

          {/* Content area */}
          <div className="flex-1 min-w-0 space-y-4">
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
                <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
              </motion.div>
            )}

            <AnimatePresence mode="wait">

              {/* ══ STEP 1 · Car ══════════════════════════════════════════════════ */}
              {step === 'car' && (
                <motion.div key="car" variants={pageVariants} initial="initial" animate="animate" exit="exit"
                  className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 overflow-hidden">
                  <div className="p-6 border-b border-gray-50 dark:border-dark-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('Select Vehicle', 'اختر المركبة')}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('Only available cars are shown', 'تظهر فقط السيارات المتاحة')}</p>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input value={carSearch} onChange={e => setCarSearch(e.target.value)}
                        placeholder={t('Plate number, make, model…', 'رقم اللوحة، الماركة، الموديل…')}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-400 transition-all" />
                    </div>
                    {loading ? (
                      <div className="grid gap-2.5">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-dark-700 animate-pulse" />)}
                      </div>
                    ) : (
                      <div className="grid gap-2.5 max-h-[26rem] overflow-y-auto pr-1">
                        {cars.map(car => (
                          <button key={car._id} onClick={() => selectCar(car)}
                            className="group w-full text-start p-4 rounded-xl border border-gray-100 dark:border-dark-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all duration-200">
                            <div className="flex items-center gap-4">
                              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors">
                                <Car className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 dark:text-white truncate">
                                  {car.make} {car.model} <span className="text-gray-400 font-normal text-sm">{car.year}</span>
                                </p>
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  <Pill text={`${car.plateNumber} ${car.plateEnglishLetters || ''}`} muted />
                                  {car.color && <Pill text={car.color} muted />}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{(car.dailyRateDefault || 0).toLocaleString()}</p>
                                <p className="text-xs text-gray-400">SAR / day</p>
                                <p className="text-xs text-gray-400 mt-0.5">{car.allowedKmPerDayDefault} km</p>
                              </div>
                            </div>
                          </button>
                        ))}
                        {!loading && cars.length === 0 && (
                          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
                            <Car className="w-10 h-10 opacity-30" />
                            <p className="text-sm">{t('No available cars', 'لا توجد سيارات متاحة')}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ══ STEP 2 · Customer ══════════════════════════════════════════ */}
              {step === 'customer' && (
                <motion.div key="customer" variants={pageVariants} initial="initial" animate="animate" exit="exit"
                  className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 overflow-hidden">
                  <div className="p-6 border-b border-gray-50 dark:border-dark-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('Select Customer', 'اختر العميل')}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('Search KYC registry', 'ابحث في سجل العملاء')}</p>
                      </div>
                      {selectedCar && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                          <Car className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{selectedCar.make} {selectedCar.model}</span>
                          <button onClick={() => { setSelectedCar(null); setStep('car') }} className="text-emerald-500 hover:text-emerald-700 ml-1"><X className="w-3 h-3" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
                        placeholder={t('Name, mobile, ID number…', 'الاسم أو الجوال أو رقم الهوية…')}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-400 transition-all" />
                    </div>

                    {customerResults.length > 0 && (
                      <div className="rounded-xl border border-gray-200 dark:border-dark-600 overflow-hidden">
                        {customerResults.map((c, i) => (
                          <button key={c._id} onClick={() => c.isBlacklisted ? setError(t('Customer is blacklisted', 'العميل محظور')) : selectCustomer(c)}
                            className={`w-full text-start px-4 py-3.5 ${i > 0 ? 'border-t border-gray-100 dark:border-dark-700' : ''} flex items-center gap-3 transition-colors
                              ${c.isBlacklisted ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-dark-700' : 'hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10'}`}>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0
                              ${c.isBlacklisted ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                              {c.fullName?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white text-sm">{c.fullName}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{c.mobile} · {c.idNumber}</p>
                            </div>
                            {c.isBlacklisted && (
                              <span className="ml-auto text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-lg">Blacklisted</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedCustomer && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
                        <div className="w-10 h-10 rounded-xl bg-emerald-200 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                          {selectedCustomer.fullName?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">{selectedCustomer.fullName}</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-500">{selectedCustomer.mobile} · {selectedCustomer.idNumber}</p>
                        </div>
                        <button onClick={() => { setSelectedCustomer(null); setCustomerSearch('') }} className="ml-auto text-emerald-500 hover:text-emerald-700 p-1"><X className="w-4 h-4" /></button>
                      </motion.div>
                    )}

                    <div className="flex gap-3 pt-1">
                      <button onClick={() => setStep('car')}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                        ← {t('Back', 'رجوع')}
                      </button>
                      <button onClick={() => navigate('/app/rental/customers/new')}
                        className="px-4 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                        + {t('New Customer', 'عميل جديد')}
                      </button>
                      {selectedCustomer && (
                        <button onClick={() => setStep('terms')}
                          className="ml-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all">
                          {t('Next', 'التالي')} →
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ══ STEP 3 · Terms ════════════════════════════════════════════ */}
              {step === 'terms' && (
                <motion.div key="terms" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">

                  {/* Dates & Rates */}
                  <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-6">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">{t('Rental Terms', 'شروط التأجير')}</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label={t('Start Date/Time', 'تاريخ البدء')} required>
                        <Input type="datetime-local" value={terms.startDateTime} onChange={e => setTerms(p => ({ ...p, startDateTime: e.target.value }))} />
                      </Field>
                      <Field label={t('Expected Return', 'الإرجاع المتوقع')} required>
                        <Input type="datetime-local" value={terms.expectedReturnDateTime} onChange={e => setTerms(p => ({ ...p, expectedReturnDateTime: e.target.value }))} />
                      </Field>
                      <Field label={t('Daily Rate (SAR)', 'السعر اليومي')}>
                        <Input type="number" value={terms.dailyRate} onChange={e => setTerms(p => ({ ...p, dailyRate: e.target.value }))} placeholder="0" />
                      </Field>
                      <Field label={t('Allowed KM / Day', 'كم مسموح / يوم')}>
                        <Input type="number" value={terms.allowedKmPerDay} onChange={e => setTerms(p => ({ ...p, allowedKmPerDay: e.target.value }))} />
                      </Field>
                      <Field label={t('Extra KM Rate (SAR)', 'سعر الكم الإضافي')}>
                        <Input type="number" step="0.5" value={terms.perKmOverageRate} onChange={e => setTerms(p => ({ ...p, perKmOverageRate: e.target.value }))} placeholder="0" />
                      </Field>
                      <Field label={t('Late Fee / Hour (SAR)', 'غرامة التأخير / ساعة')}>
                        <Input type="number" value={terms.hourlyLateRate} onChange={e => setTerms(p => ({ ...p, hourlyLateRate: e.target.value }))} placeholder="0" />
                      </Field>
                      <Field label={t('Security Deposit (SAR)', 'مبلغ الضمان')}>
                        <Input type="number" value={terms.securityDeposit} onChange={e => setTerms(p => ({ ...p, securityDeposit: e.target.value }))} placeholder="0" />
                      </Field>
                    </div>
                    {calcDays() > 0 && (
                      <div className="mt-4 flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
                        <div>
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">{t('Estimated Base', 'التقدير الأساسي')}</p>
                          <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70 mt-0.5">{calcDays()} {t('day(s)', 'يوم')} × {parseFloat(terms.dailyRate) || 0} SAR</p>
                        </div>
                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{estimatedBase.toLocaleString()} <span className="text-sm font-medium">SAR</span></p>
                      </div>
                    )}
                  </div>

                  {/* Outbound condition */}
                  <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-6 space-y-4">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">{t('Outbound Condition', 'حالة الخروج')}</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label={t('Odometer Out (km)', 'العداد عند الخروج')}>
                        <Input type="number" value={condition.odometerOut} onChange={e => setCondition(p => ({ ...p, odometerOut: e.target.value }))} />
                      </Field>
                      <Field label={t('Fuel Level', 'مستوى الوقود')}>
                        <Select value={condition.fuelLevelOut} onChange={e => setCondition(p => ({ ...p, fuelLevelOut: e.target.value }))}>
                          {FUEL_LEVELS.map(f => <option key={f} value={f}>{FUEL_ICONS[f]} {FUEL_LABEL[f]}</option>)}
                        </Select>
                        <FuelBar level={condition.fuelLevelOut} />
                      </Field>
                    </div>
                    <Field label={t('Pre-existing Damage', 'أضرار مسبقة')}>
                      <div className="rounded-xl border border-gray-200 dark:border-dark-600 p-4 bg-gray-50 dark:bg-dark-700/50 mb-3">
                        <DamageMatrix initialPins={condition.damagePins} onPinsChange={pins => setCondition(p => ({ ...p, damagePins: pins }))} />
                      </div>
                      <textarea value={condition.damageNotes} onChange={e => setCondition(p => ({ ...p, damageNotes: e.target.value }))} rows={2}
                        placeholder={t('Additional notes…', 'ملاحظات إضافية…')}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 resize-none transition-all" />
                    </Field>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep('customer')}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                      ← {t('Back', 'رجوع')}
                    </button>
                    <button onClick={() => setStep('confirm')}
                      className="ml-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all">
                      {t('Review & Confirm', 'مراجعة وتأكيد')} →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ══ STEP 4 · Confirm ══════════════════════════════════════════ */}
              {step === 'confirm' && (
                <motion.div key="confirm" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
                  <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 dark:border-dark-700">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('Confirm Rental', 'تأكيد التأجير')}</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('Review all details before confirming', 'راجع جميع التفاصيل قبل التأكيد')}</p>
                    </div>

                    {/* Summary grid */}
                    <div className="divide-y divide-gray-50 dark:divide-dark-700">
                      {[
                        { label: t('Vehicle', 'المركبة'), value: `${selectedCar?.make} ${selectedCar?.model} · ${selectedCar?.plateNumber} ${selectedCar?.plateEnglishLetters || ''}`, icon: Car },
                        { label: t('Customer', 'العميل'), value: selectedCustomer?.fullName, icon: User },
                        { label: t('Start', 'البدء'), value: terms.startDateTime ? new Date(terms.startDateTime).toLocaleString() : '—', icon: Clock },
                        { label: t('Expected Return', 'الإرجاع'), value: terms.expectedReturnDateTime ? new Date(terms.expectedReturnDateTime).toLocaleString() : '—', icon: Clock },
                        { label: t('Daily Rate', 'السعر اليومي'), value: `${terms.dailyRate || 0} SAR`, icon: Zap },
                        { label: t('Security Deposit', 'الضمان'), value: `${terms.securityDeposit || 0} SAR`, icon: Shield },
                        { label: t('Odometer Out', 'العداد'), value: `${condition.odometerOut} km`, icon: Gauge },
                        { label: t('Fuel Level', 'الوقود'), value: FUEL_LABEL[condition.fuelLevelOut], icon: Fuel },
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="flex items-center gap-4 px-6 py-3.5">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400 w-36 flex-shrink-0">{label}</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Total card */}
                    <div className="m-6 p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                      <p className="text-sm font-medium opacity-80">{t('Estimated Base Charge', 'التقدير الأساسي')}</p>
                      <p className="text-4xl font-black mt-1">{estimatedBase.toLocaleString()} <span className="text-lg font-medium opacity-80">SAR</span></p>
                      <p className="text-xs opacity-70 mt-1.5">{calcDays()} {t('day(s)', 'يوم')} · {t('Excludes penalties & extras', 'لا يشمل الغرامات والإضافات')}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep('terms')}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                      ← {t('Back', 'رجوع')}
                    </button>
                    <button onClick={handleCheckout} disabled={submitting}
                      className="flex-1 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold text-base shadow-xl shadow-emerald-500/30 transition-all active:scale-[0.98]">
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                          {t('Processing…', 'جاري المعالجة…')}
                        </span>
                      ) : `🚗 ${t('Confirm Checkout', 'تأكيد التأجير')}`}
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
