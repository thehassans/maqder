import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Car, User, FileText, CheckCircle, Search, ChevronRight, AlertTriangle, X } from 'lucide-react'
import api from '../../lib/api'
import DamageMatrix from './components/DamageMatrix'

const STEPS = ['car', 'customer', 'terms', 'confirm']
const FUEL_LEVELS = ['empty', 'quarter', 'half', 'three_quarters', 'full']
const FUEL_ICONS = { empty: '○○○○○', quarter: '●○○○○', half: '●●○○○', three_quarters: '●●●○○', full: '●●●●●' }

const StepIndicator = ({ step, isAr }) => {
  const steps = [
    { id: 'car', label: isAr ? 'السيارة' : 'Select Car', icon: Car },
    { id: 'customer', label: isAr ? 'العميل' : 'Customer', icon: User },
    { id: 'terms', label: isAr ? 'الشروط' : 'Terms', icon: FileText },
    { id: 'confirm', label: isAr ? 'تأكيد' : 'Confirm', icon: CheckCircle },
  ]
  const current = STEPS.indexOf(step)
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => {
        const Icon = s.icon
        const done = i < current
        const active = i === current
        return (
          <div key={s.id} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${active ? 'bg-emerald-500 text-white' : done ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-gray-100 text-gray-400 dark:bg-dark-700 dark:text-gray-500'}`}>
              <Icon className="w-4 h-4" />
              <span className="hidden sm:block">{s.label}</span>
            </div>
            {i < steps.length - 1 && <ChevronRight className={`w-4 h-4 mx-1 ${done ? 'text-emerald-400' : 'text-gray-300'}`} />}
          </div>
        )
      })}
    </div>
  )
}

const InputField = ({ label, children, required }) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
    {children}
  </div>
)
const Input = (props) => (
  <input {...props} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
)

export default function CheckoutPOS() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { language } = useSelector(s => s.ui)
  const isAr = language === 'ar'
  const t = (en, ar) => isAr ? ar : en

  const [step, setStep] = useState('car')
  const [selectedCar, setSelectedCar] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [carSearch, setCarSearch] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [cars, setCars] = useState([])
  const [customerResults, setCustomerResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const customerSearchTimer = useRef(null)

  const [terms, setTerms] = useState({
    startDateTime: new Date().toISOString().slice(0, 16),
    expectedReturnDateTime: '',
    dailyRate: '', allowedKmPerDay: 200, perKmOverageRate: '', hourlyLateRate: '', securityDeposit: '',
  })

  const [condition, setCondition] = useState({
    odometerOut: '', fuelLevelOut: 'full', damageNotes: '', damagePins: []
  })

  // Pre-select car from URL param
  useEffect(() => {
    const carId = searchParams.get('carId')
    if (carId) {
      api.get(`/rental/cars/${carId}`).then(r => {
        setSelectedCar(r.data)
        prefillTerms(r.data)
        setStep('customer')
      }).catch(() => {})
    }
  }, [])

  const prefillTerms = (car) => {
    setTerms(t => ({
      ...t,
      dailyRate: car.dailyRateDefault || '',
      allowedKmPerDay: car.allowedKmPerDayDefault || 200,
      perKmOverageRate: car.perKmOverageRateDefault || '',
      hourlyLateRate: car.hourlyLateRateDefault || '',
      securityDeposit: car.securityDepositDefault || '',
    }))
    setCondition(c => ({ ...c, odometerOut: car.currentOdometer || 0 }))
  }

  // Fetch available cars
  useEffect(() => {
    if (step !== 'car') return
    setLoading(true)
    api.get('/rental/cars', { params: { status: 'AVAILABLE', search: carSearch, limit: 30 } })
      .then(r => setCars(r.data.cars || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [step, carSearch])

  // Customer search debounce
  useEffect(() => {
    if (step !== 'customer') return
    if (customerSearchTimer.current) clearTimeout(customerSearchTimer.current)
    customerSearchTimer.current = setTimeout(async () => {
      if (customerSearch.length < 2) return setCustomerResults([])
      try {
        const { data } = await api.get('/rental/customers/search', { params: { q: customerSearch } })
        setCustomerResults(data)
      } catch (_) {}
    }, 300)
  }, [customerSearch, step])

  const selectCar = (car) => {
    setSelectedCar(car)
    prefillTerms(car)
    setStep('customer')
  }

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer)
    setCustomerResults([])
    setCustomerSearch(customer.fullName)
    setStep('terms')
  }

  const calcRentedDays = () => {
    if (!terms.startDateTime || !terms.expectedReturnDateTime) return 0
    return Math.max(1, Math.ceil((new Date(terms.expectedReturnDateTime) - new Date(terms.startDateTime)) / (1000 * 60 * 60 * 24)))
  }
  const estimatedBase = calcRentedDays() * (parseFloat(terms.dailyRate) || 0)

  const handleCheckout = async () => {
    if (!selectedCar || !selectedCustomer) return setError(t('Please select a car and customer', 'يرجى اختيار سيارة وعميل'))
    try {
      setSubmitting(true); setError('')
      const { data } = await api.post('/rental/contracts/checkout', {
        carId: selectedCar._id,
        customerId: selectedCustomer._id,
        ...terms,
        ...condition,
      })
      navigate(`/app/rental/contracts/${data.contract._id}`)
    } catch (e) { setError(e.response?.data?.error || t('Checkout failed', 'فشل التأجير')) }
    finally { setSubmitting(false) }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('New Rental Checkout', 'تأجير جديد')}</h1>
        <button onClick={() => navigate('/app/rental/active')} className="p-2 rounded-xl border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700"><X className="w-5 h-5" /></button>
      </div>

      <StepIndicator step={step} isAr={isAr} />

      {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm border border-red-200 dark:border-red-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}</div>}

      {/* STEP 1: Car Selection */}
      <AnimatePresence mode="wait">
        {step === 'car' && (
          <motion.div key="car" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-6 space-y-4">
            <h2 className="font-bold text-gray-900 dark:text-white">{t('Select an Available Car', 'اختر سيارة متاحة')}</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={carSearch} onChange={e => setCarSearch(e.target.value)} placeholder={t('Search by plate, make, model...', 'بحث بالسيارة أو اللوحة...')}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" />
            </div>
            {loading ? <div className="text-center py-8 text-gray-400">{t('Loading...', 'جاري التحميل...')}</div> : (
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {cars.map(car => (
                  <button key={car._id} onClick={() => selectCar(car)}
                    className="w-full text-start p-4 rounded-xl border border-gray-100 dark:border-dark-700 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 dark:hover:border-emerald-700 transition-all group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
                          <Car className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{car.make} {car.model} <span className="text-gray-400 font-normal">{car.year}</span></p>
                          <p className="text-sm text-gray-500">{car.plateNumber} {car.plateEnglishLetters}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-emerald-600 dark:text-emerald-400">{car.dailyRateDefault?.toLocaleString()} <span className="text-xs font-normal">SAR/day</span></p>
                        <p className="text-xs text-gray-400">{car.allowedKmPerDayDefault} km/day</p>
                      </div>
                    </div>
                  </button>
                ))}
                {!loading && cars.length === 0 && <p className="text-center py-8 text-gray-400">{t('No available cars', 'لا توجد سيارات متاحة')}</p>}
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 2: Customer Selection */}
        {step === 'customer' && (
          <motion.div key="customer" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-6 space-y-4">
            {selectedCar && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                <Car className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-800 dark:text-emerald-300">{selectedCar.make} {selectedCar.model} · {selectedCar.plateNumber} {selectedCar.plateEnglishLetters}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">{selectedCar.dailyRateDefault} SAR/day · {selectedCar.allowedKmPerDayDefault} km/day</p>
                </div>
                <button onClick={() => { setSelectedCar(null); setStep('car') }} className="ml-auto text-emerald-600 hover:text-emerald-700 p-1"><X className="w-4 h-4" /></button>
              </div>
            )}
            <h2 className="font-bold text-gray-900 dark:text-white">{t('Find Customer', 'ابحث عن عميل')}</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
                placeholder={t('Search by name, mobile, ID number...', 'بحث بالاسم أو الجوال أو رقم الهوية...')}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" />
            </div>
            {customerResults.length > 0 && (
              <div className="border border-gray-100 dark:border-dark-700 rounded-xl overflow-hidden">
                {customerResults.map(c => (
                  <button key={c._id} onClick={() => c.isBlacklisted ? setError(t('Customer is blacklisted', 'العميل محظور')) : selectCustomer(c)}
                    className={`w-full text-start p-4 border-b border-gray-50 dark:border-dark-700 last:border-0 hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors flex items-center justify-between ${c.isBlacklisted ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{c.fullName}</p>
                      <p className="text-xs text-gray-500">{c.mobile} · {c.idNumber}</p>
                    </div>
                    {c.isBlacklisted && <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full dark:bg-red-900/30 dark:text-red-400">BLACKLISTED</span>}
                  </button>
                ))}
              </div>
            )}
            {selectedCustomer && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                <User className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-800 dark:text-emerald-300">{selectedCustomer.fullName}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">{selectedCustomer.mobile} · {selectedCustomer.idNumber}</p>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep('car')} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-dark-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700">{t('← Back', '→ رجوع')}</button>
              <button onClick={() => navigate('/app/rental/customers/new')} className="px-4 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">{t('+ New Customer', '+ عميل جديد')}</button>
              {selectedCustomer && <button onClick={() => setStep('terms')} className="ml-auto px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold">{t('Next →', '← التالي')}</button>}
            </div>
          </motion.div>
        )}

        {/* STEP 3: Terms */}
        {step === 'terms' && (
          <motion.div key="terms" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-6 space-y-5">
            <h2 className="font-bold text-gray-900 dark:text-white">{t('Rental Terms & Condition', 'شروط التأجير والحالة')}</h2>
            <div className="grid grid-cols-2 gap-4">
              <InputField label={t('Start Date/Time', 'تاريخ البدء')} required>
                <Input type="datetime-local" value={terms.startDateTime} onChange={e => setTerms(t => ({ ...t, startDateTime: e.target.value }))} />
              </InputField>
              <InputField label={t('Expected Return', 'الإرجاع المتوقع')} required>
                <Input type="datetime-local" value={terms.expectedReturnDateTime} onChange={e => setTerms(t => ({ ...t, expectedReturnDateTime: e.target.value }))} />
              </InputField>
              <InputField label={t('Daily Rate (SAR)', 'السعر اليومي')}>
                <Input type="number" value={terms.dailyRate} onChange={e => setTerms(t => ({ ...t, dailyRate: e.target.value }))} />
              </InputField>
              <InputField label={t('Allowed KM/Day', 'KM مسموح/يوم')}>
                <Input type="number" value={terms.allowedKmPerDay} onChange={e => setTerms(t => ({ ...t, allowedKmPerDay: e.target.value }))} />
              </InputField>
              <InputField label={t('Per Extra KM (SAR)', 'كم إضافي (ر.س)')}>
                <Input type="number" step="0.5" value={terms.perKmOverageRate} onChange={e => setTerms(t => ({ ...t, perKmOverageRate: e.target.value }))} />
              </InputField>
              <InputField label={t('Late Fee/Hour (SAR)', 'تأخير/ساعة (ر.س)')}>
                <Input type="number" value={terms.hourlyLateRate} onChange={e => setTerms(t => ({ ...t, hourlyLateRate: e.target.value }))} />
              </InputField>
              <InputField label={t('Security Deposit (SAR)', 'مبلغ الضمان')}>
                <Input type="number" value={terms.securityDeposit} onChange={e => setTerms(t => ({ ...t, securityDeposit: e.target.value }))} />
              </InputField>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{t('Estimated Base Charge', 'الرسوم الأساسية المتوقعة')}</p>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{estimatedBase.toLocaleString()} <span className="text-base font-medium">SAR</span></p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1">{calcRentedDays()} {t('day(s)', 'يوم')} × {parseFloat(terms.dailyRate) || 0} SAR</p>
            </div>

            <div className="border-t border-gray-100 dark:border-dark-700 pt-4 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{t('Outbound Condition', 'حالة الخروج')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <InputField label={t('Odometer Out (km)', 'العداد عند الخروج')}>
                  <Input type="number" value={condition.odometerOut} onChange={e => setCondition(c => ({ ...c, odometerOut: e.target.value }))} />
                </InputField>
                <InputField label={t('Fuel Level Out', 'مستوى الوقود')}>
                  <select value={condition.fuelLevelOut} onChange={e => setCondition(c => ({ ...c, fuelLevelOut: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {FUEL_LEVELS.map(f => <option key={f} value={f}>{FUEL_ICONS[f]} {f.replace('_', ' ')}</option>)}
                  </select>
                </InputField>
              </div>
              <InputField label={t('Pre-existing Damage Notes', 'ملاحظات الأضرار الموجودة')}>
                <div className="border border-gray-200 dark:border-dark-600 rounded-xl p-4 mb-3 bg-gray-50 dark:bg-dark-700/50">
                  <DamageMatrix initialPins={condition.damagePins} onPinsChange={pins => setCondition(c => ({...c, damagePins: pins}))} />
                </div>
                <textarea value={condition.damageNotes} onChange={e => setCondition(c => ({ ...c, damageNotes: e.target.value }))} rows={2} placeholder={t('Additional text notes...', 'ملاحظات نصية إضافية...')}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none dark:text-white" />
              </InputField>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('customer')} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-dark-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700">{t('← Back', '→ رجوع')}</button>
              <button onClick={() => setStep('confirm')} className="ml-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold">{t('Review & Confirm →', '← مراجعة وتأكيد')}</button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: Confirm */}
        {step === 'confirm' && (
          <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-4">
            <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-6 space-y-4">
              <h2 className="font-bold text-gray-900 dark:text-white">{t('Confirm Rental', 'تأكيد التأجير')}</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-500">{t('Car', 'السيارة')}</p><p className="font-bold text-gray-900 dark:text-white">{selectedCar?.make} {selectedCar?.model} · {selectedCar?.plateNumber}</p></div>
                <div><p className="text-gray-500">{t('Customer', 'العميل')}</p><p className="font-bold text-gray-900 dark:text-white">{selectedCustomer?.fullName}</p></div>
                <div><p className="text-gray-500">{t('Start', 'البدء')}</p><p className="font-bold text-gray-900 dark:text-white">{terms.startDateTime ? new Date(terms.startDateTime).toLocaleString() : '—'}</p></div>
                <div><p className="text-gray-500">{t('Expected Return', 'الإرجاع')}</p><p className="font-bold text-gray-900 dark:text-white">{terms.expectedReturnDateTime ? new Date(terms.expectedReturnDateTime).toLocaleString() : '—'}</p></div>
                <div><p className="text-gray-500">{t('Daily Rate', 'السعر اليومي')}</p><p className="font-bold text-gray-900 dark:text-white">{terms.dailyRate} SAR</p></div>
                <div><p className="text-gray-500">{t('Security Deposit', 'الضمان')}</p><p className="font-bold text-gray-900 dark:text-white">{terms.securityDeposit || 0} SAR</p></div>
                <div><p className="text-gray-500">{t('Odometer', 'العداد')}</p><p className="font-bold text-gray-900 dark:text-white">{condition.odometerOut} km</p></div>
                <div><p className="text-gray-500">{t('Fuel Level', 'مستوى الوقود')}</p><p className="font-bold text-gray-900 dark:text-white">{condition.fuelLevelOut?.replace('_', ' ')}</p></div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
                <p className="font-semibold text-emerald-800 dark:text-emerald-300">{t('Estimated Base (before penalties)', 'التقدير الأساسي (قبل الغرامات)')}</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{estimatedBase.toLocaleString()} SAR</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('terms')} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-dark-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700">{t('← Back', '→ رجوع')}</button>
              <button onClick={handleCheckout} disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base disabled:opacity-60 shadow-xl shadow-emerald-500/30 transition-all">
                {submitting ? t('Processing...', 'جاري المعالجة...') : t('🚗 Confirm Checkout', '🚗 تأكيد التأجير')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
