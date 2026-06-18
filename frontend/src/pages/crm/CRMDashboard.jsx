import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Target, Users, BarChart3, ClipboardList, DollarSign, TrendingUp } from 'lucide-react'
import api from '../../lib/api'
import CRMLeadsTab from './CRMLeadsTab'
import CRMDealsTab from './CRMDealsTab'
import CRMActivitiesTab from './CRMActivitiesTab'

export default function CRMDashboard({ tab }) {
  const { language } = useSelector((state) => state.ui)
  const t = (en, ar) => language === 'ar' ? ar : en
  const [activeTab, setActiveTab] = useState(tab || 'dashboard')
  useEffect(() => { if (tab) setActiveTab(tab) }, [tab])

  const { data: stats } = useQuery({ queryKey: ['crm-stats'], queryFn: async () => (await api.get('/crm/stats')).data })

  const tabs = [
    { id: 'dashboard', label: t('Dashboard', 'لوحة'), icon: Target },
    { id: 'leads', label: t('Leads', 'العملاء'), icon: Users },
    { id: 'deals', label: t('Deals', 'الصفقات'), icon: BarChart3 },
    { id: 'activities', label: t('Activities', 'الأنشطة'), icon: ClipboardList },
  ]
  const kpis = [
    { label: t('Total Leads', 'إجمالي العملاء'), value: stats?.leadTotal ?? 0, icon: Users, color: 'bg-blue-500' },
    { label: t('Total Deals', 'إجمالي الصفقات'), value: stats?.dealTotal ?? 0, icon: BarChart3, color: 'bg-indigo-500' },
    { label: t('Pipeline', 'القيمة'), value: `${(stats?.dealValue ?? 0).toLocaleString()} SAR`, icon: DollarSign, color: 'bg-emerald-500' },
    { label: t('Won', 'الفوز'), value: `${(stats?.wonValue ?? 0).toLocaleString()} SAR`, icon: TrendingUp, color: 'bg-teal-500' },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('CRM', 'إدارة العملاء')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('Manage leads, deals, and customer relationships', 'إدارة العملاء المحتملين والصفقات وعلاقات العملاء')}</p>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(tab => { const Icon = tab.icon, active = activeTab === tab.id; return (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${active ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-dark-700'}`}>
            <Icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        )})}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map((k, i) => { const Icon = k.icon; return (
              <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-dark-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark-700">
                <div className={`w-8 h-8 rounded-lg ${k.color} flex items-center justify-center mb-2`}><Icon className="w-4 h-4 text-white" /></div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{k.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{k.value}</p>
              </motion.div>
            )})}
          </div>
          <CRMDealsTab preview />
          <CRMActivitiesTab preview />
        </div>
      )}
      {activeTab === 'leads' && <CRMLeadsTab />}
      {activeTab === 'deals' && <CRMDealsTab />}
      {activeTab === 'activities' && <CRMActivitiesTab />}
    </div>
  )
}
