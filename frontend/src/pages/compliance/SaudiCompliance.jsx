import { useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Shield, FileText, Lock, CheckCircle2, AlertCircle,
  Server, Database, Cloud, Globe, ExternalLink
} from 'lucide-react'
import api from '../../lib/api'

// ── animation variants ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
}

// ── helpers ───────────────────────────────────────────────────────────────────
function CheckItem({ text, done = true }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
        done ? 'bg-emerald-500' : 'bg-amber-400'
      }`}>
        {done
          ? <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          : <AlertCircle className="w-3.5 h-3.5 text-white" strokeWidth={3} />
        }
      </div>
      <span className="text-sm text-gray-700 dark:text-gray-300">{text}</span>
    </div>
  )
}

function StatusBadge({ label, active = true }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
      active
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
      {label}
    </span>
  )
}

// ── provider badge ────────────────────────────────────────────────────────────
const PROVIDER_STYLES = {
  GCP: 'bg-blue-600 text-white',
  AWS: 'bg-orange-500 text-white',
  MongoDB: 'bg-emerald-600 text-white',
}

function ProviderBadge({ provider }) {
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-bold tracking-tight ${PROVIDER_STYLES[provider] || 'bg-gray-600 text-white'}`}>
      {provider}
    </span>
  )
}

// ── infra table data ──────────────────────────────────────────────────────────
const INFRA_ROWS = [
  {
    tier: 'Primary Application & API Layer',
    provider: 'GCP',
    region: 'Dammam — me-central2',
    workload: 'Core Node.js/Express APIs, microservices, load balancers. Ultra-low latency for Eastern Province operations.',
    flag: '🇸🇦',
    badge: 'Primary',
  },
  {
    tier: 'Failover & Disaster Recovery',
    provider: 'AWS',
    region: 'Riyadh — me-central-1',
    workload: 'Secondary application servers and cross-region database replication for business continuity.',
    flag: '🇸🇦',
    badge: 'DR',
  },
  {
    tier: 'Core Database Layer',
    provider: 'MongoDB',
    region: 'VPC Peered in GCP Dammam',
    workload: 'Primary NoSQL storage for dynamic inventories, transaction logs, and user management.',
    flag: '🇸🇦',
    badge: 'Data',
  },
]

// ── metric cards data ─────────────────────────────────────────────────────────
const METRICS = [
  { label: 'Data Sovereignty', labelAr: 'سيادة البيانات', value: '100% KSA', icon: Globe, color: 'from-emerald-500 to-teal-500' },
  { label: 'ZATCA Phase 1', labelAr: 'زاتكا المرحلة 1', value: 'Active', icon: CheckCircle2, color: 'from-blue-500 to-indigo-500' },
  { label: 'Encryption', labelAr: 'التشفير', value: 'AES-256 + TLS 1.3', icon: Lock, color: 'from-violet-500 to-purple-500' },
  { label: 'Uptime SLA', labelAr: 'مستوى الخدمة', value: '99.9%', icon: Server, color: 'from-rose-500 to-pink-500' },
]

// ── main ──────────────────────────────────────────────────────────────────────
export default function SaudiCompliance() {
  const { language } = useSelector(s => s.ui)
  const isAr = language === 'ar'
  const t = (en, ar) => isAr ? ar : en

  const { data: zatcaData } = useQuery({
    queryKey: ['zatca-status'],
    queryFn: () => api.get('/tenants/zatca/status').then(r => r.data),
    staleTime: 60000,
  })

  const phase1Active = true
  const phase2Active = zatcaData?.isOnboarded || zatcaData?.phase2Active || false

  return (
    <div className={`space-y-10 pb-10 ${isAr ? 'rtl' : 'ltr'}`}>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl min-h-[260px] flex items-center"
        style={{
          background: 'linear-gradient(135deg, #006400 0%, #004d00 40%, #1a1a2e 100%)',
        }}
      >
        {/* Arabic geometric pattern overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg, transparent, transparent 20px,
              rgba(255,255,255,0.15) 20px, rgba(255,255,255,0.15) 21px
            ), repeating-linear-gradient(
              -45deg, transparent, transparent 20px,
              rgba(255,255,255,0.08) 20px, rgba(255,255,255,0.08) 21px
            )`,
          }}
        />
        {/* Glowing orbs */}
        <div className="absolute top-4 right-12 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-8 w-48 h-48 rounded-full bg-white/5 blur-2xl" />

        <div className="relative z-10 px-10 py-12 flex flex-col sm:flex-row items-center gap-8 w-full">
          {/* Saudi flag emoji + shield icon */}
          <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl flex-shrink-0">
            <span className="text-5xl">🇸🇦</span>
          </div>
          <div className="text-center sm:text-start">
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-2">
              {t('Saudi Regulatory Compliance', 'الامتثال التنظيمي السعودي')}
            </h1>
            <p className="text-emerald-200/80 text-lg max-w-2xl">
              {t(
                'Built from the ground up for the Kingdom\'s regulatory, data sovereignty, and cybersecurity requirements.',
                'مبني من الأساس لمتطلبات المملكة التنظيمية وسيادة البيانات والأمن السيبراني.'
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusBadge label="PDPL Compliant" />
              <StatusBadge label="ZATCA Phase 1" />
              <StatusBadge label={phase2Active ? 'ZATCA Phase 2' : 'ZATCA Phase 2 — Pending'} active={phase2Active} />
              <StatusBadge label="NCA ECC-1:2018" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── SECTION 1: Regulatory Pillars ─────────────────────────────────── */}
      <section>
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-6"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            {t('Regulatory Pillars', 'الركائز التنظيمية')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('Core compliance frameworks built into the platform', 'أُطر الامتثال الأساسية المدمجة في المنصة')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* PDPL Card */}
          <motion.div
            custom={1}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="card-glass rounded-3xl p-6 border border-gray-100 dark:border-dark-700 hover:shadow-xl transition-all group"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <StatusBadge label={t('Active', 'نشط')} active />
            </div>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">PDPL</p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {t('Personal Data Protection Law', 'قانون حماية البيانات الشخصية')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 italic">
              {isAr ? 'PDPL — Personal Data Protection Law' : 'قانون حماية البيانات الشخصية'}
            </p>
            <div className="space-y-2.5">
              <CheckItem text={t('All user/employee/customer data stored in KSA data centers', 'جميع البيانات محفوظة في مراكز بيانات داخل المملكة')} />
              <CheckItem text={t('Primary DB and backups within Saudi borders', 'قاعدة البيانات الأساسية والنسخ الاحتياطية داخل حدود المملكة')} />
              <CheckItem text={t('Encrypted at rest — AES-256', 'مشفرة في حالة التخزين — AES-256')} />
            </div>
          </motion.div>

          {/* ZATCA Card */}
          <motion.div
            custom={2}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="card-glass rounded-3xl p-6 border border-gray-100 dark:border-dark-700 hover:shadow-xl transition-all group"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900/30 group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div className="space-y-1 flex flex-col items-end">
                <StatusBadge label={t('Phase 1 Active', 'المرحلة 1 نشطة')} active={phase1Active} />
                <StatusBadge label={t('Phase 2', 'المرحلة 2')} active={phase2Active} />
              </div>
            </div>
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">ZATCA</p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {t('E-Invoicing (Fatoorah)', 'الفوترة الإلكترونية (فاتورة)')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 italic">
              {isAr ? 'ZATCA — E-Invoicing' : 'نظام الفوترة الإلكترونية (فاتورة)'}
            </p>
            <div className="space-y-2.5">
              <CheckItem text={t('Encrypted XML invoice format', 'صيغة فاتورة XML مشفرة')} />
              <CheckItem text={t('Cryptographic stamps (QR / ECDSA)', 'طوابع تشفيرية (QR / ECDSA)')} />
              <CheckItem text={t('Real-time clearance via ZATCA API', 'موافقة فورية عبر واجهة ZATCA')} done={phase2Active} />
              <CheckItem text={t('UUID-based invoice referencing', 'مرجع الفاتورة بمعرف UUID')} />
            </div>
          </motion.div>

          {/* NCA Card */}
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="card-glass rounded-3xl p-6 border border-gray-100 dark:border-dark-700 hover:shadow-xl transition-all group"
          >
            <div className="flex items-start justify-between mb-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200 dark:shadow-violet-900/30 group-hover:scale-110 transition-transform">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <StatusBadge label={t('ECC-1:2018', 'ECC-1:2018')} active />
            </div>
            <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-1">NCA</p>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {t('National Cybersecurity Authority', 'الهيئة الوطنية للأمن السيبراني')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 italic">
              {isAr ? 'NCA — National Cybersecurity Authority' : 'الهيئة الوطنية للأمن السيبراني'}
            </p>
            <div className="space-y-2.5">
              <CheckItem text={t('Data encryption at rest: AES-256', 'تشفير البيانات المخزنة: AES-256')} />
              <CheckItem text={t('Data in transit: TLS 1.3', 'تشفير البيانات أثناء النقل: TLS 1.3')} />
              <CheckItem text={t('IAM protocols — role-based access', 'بروتوكولات IAM — التحكم بالوصول')} />
              <CheckItem text={t('Full access logging & audit trails', 'سجلات وصول وتدقيق كاملة')} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 2: Cloud Infrastructure ───────────────────────────────── */}
      <section>
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-6"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Server className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {t('Cloud Infrastructure', 'البنية التحتية السحابية')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('All infrastructure deployed within the Kingdom of Saudi Arabia', 'جميع البنية التحتية موزعة داخل المملكة العربية السعودية')}
          </p>
        </motion.div>

        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="card-glass rounded-3xl overflow-hidden border border-gray-100 dark:border-dark-700"
        >
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-dark-800/50 border-b border-gray-100 dark:border-dark-700">
            <div className="col-span-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('Infrastructure Tier', 'طبقة البنية التحتية')}
              </span>
            </div>
            <div className="col-span-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('Provider & Region', 'المزود والمنطقة')}
              </span>
            </div>
            <div className="col-span-6">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t('Workload', 'الحمل الوظيفي')}
              </span>
            </div>
          </div>

          {INFRA_ROWS.map((row, idx) => (
            <motion.div
              key={row.tier}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`grid grid-cols-12 gap-4 px-6 py-5 items-start border-b border-gray-50 dark:border-dark-700 last:border-b-0 hover:bg-gray-50/80 dark:hover:bg-dark-800/30 transition-colors ${
                idx % 2 === 0 ? '' : 'bg-gray-50/30 dark:bg-dark-800/20'
              }`}
            >
              <div className="col-span-3">
                <div className="flex items-start gap-2">
                  <span className="mt-1 flex-shrink-0">{row.flag}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{row.tier}</p>
                    <span className="text-xs bg-gray-200 dark:bg-dark-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full font-medium">
                      {row.badge}
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-span-3">
                <ProviderBadge provider={row.provider} />
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1.5">{row.region}</p>
              </div>
              <div className="col-span-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{row.workload}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Architecture diagram note */}
        <motion.div
          custom={6}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-4 flex items-center gap-3 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800"
        >
          <Cloud className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {t(
              'All deployments are within Saudi Arabia borders. No customer data leaves the Kingdom. VPC peering ensures secure, low-latency database connectivity.',
              'جميع النشرات داخل حدود المملكة. لا تغادر بيانات العملاء المملكة. يضمن ربط VPC اتصالاً آمناً وسريعاً بقاعدة البيانات.'
            )}
          </p>
        </motion.div>
      </section>

      {/* ── SECTION 3: Compliance Status Dashboard ────────────────────────── */}
      <section>
        <motion.div
          custom={7}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-6"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            {t('Compliance Status', 'حالة الامتثال')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('Live compliance metrics for your organization', 'مقاييس الامتثال الحية لمؤسستك')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {METRICS.map((metric, idx) => {
            const Icon = metric.icon
            return (
              <motion.div
                key={metric.label}
                custom={8 + idx}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="card-glass rounded-3xl p-6 border border-gray-100 dark:border-dark-700 text-center hover:shadow-xl transition-all group overflow-hidden relative"
              >
                {/* Gradient orb background */}
                <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${metric.color} opacity-10 group-hover:opacity-20 transition-opacity blur-xl`} />

                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${metric.color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Animated checkmark */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + idx * 0.1, type: 'spring', stiffness: 300 }}
                  className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-200 dark:shadow-emerald-900/30"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />
                </motion.div>

                <p className="text-lg font-black text-gray-900 dark:text-white mb-1">{metric.value}</p>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {isAr ? metric.labelAr : metric.label}
                </p>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ── Footer note ───────────────────────────────────────────────────── */}
      <motion.div
        custom={12}
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="rounded-3xl p-6 border border-gray-100 dark:border-dark-700 bg-gradient-to-br from-gray-50 to-white dark:from-dark-800 dark:to-dark-800/50 flex flex-col sm:flex-row items-center gap-5"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
          <Globe className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 text-center sm:text-start">
          <p className="font-bold text-gray-900 dark:text-white">
            {t('Questions about compliance?', 'أسئلة حول الامتثال؟')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t(
              'Our team can provide detailed compliance documentation and audit reports on request.',
              'يمكن لفريقنا تقديم وثائق امتثال مفصلة وتقارير تدقيق عند الطلب.'
            )}
          </p>
        </div>
        <a
          href="mailto:compliance@maqder.com"
          className="btn btn-secondary gap-2 flex-shrink-0"
        >
          <ExternalLink className="w-4 h-4" />
          {t('Contact Us', 'تواصل معنا')}
        </a>
      </motion.div>
    </div>
  )
}
