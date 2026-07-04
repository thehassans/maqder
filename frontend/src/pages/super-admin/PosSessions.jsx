import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Monitor, Smartphone, Printer, Archive, Scale, RefreshCw, Building2, User, Clock } from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'

const DeviceBadge = ({ label, icon: Icon, status }) => {
  const isConnected = status === 'connected'
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
        isConnected
          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
          : status === 'checking'
          ? 'bg-amber-50 text-amber-600 border-amber-100'
          : 'bg-gray-100 text-gray-400 border-gray-200'
      }`}
      title={status}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

export default function PosSessions() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['super-admin-pos-sessions'],
    queryFn: () => api.get('/pos-terminal/super-admin/sessions').then((res) => res.data),
    refetchInterval: 30000,
  })

  useEffect(() => {
    const id = setInterval(() => refetch(), 30000)
    return () => clearInterval(id)
  }, [refetch])

  const sessions = data?.sessions || []
  const count = data?.count ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'ar' ? 'جلسات نقاط البيع الحية' : 'Live POS Sessions'}
          </h1>
          <p className="text-gray-500 mt-1">
            {language === 'ar'
              ? `${count} نقاط بيع نشطة حالياً`
              : `${count} active POS terminal${count === 1 ? '' : 's'}`}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {language === 'ar' ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card overflow-hidden"
      >
        {sessions.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Monitor className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">
              {language === 'ar' ? 'لا توجد جلسات نقاط بيع نشطة حالياً' : 'No active POS sessions right now'}
            </p>
            <p className="text-sm mt-1">
              {language === 'ar'
                ? 'يفتح المستخدمون نقاط البيع وترسل كل علامة تبويب نبضة كل 30 ثانية.'
                : 'Users open the POS and each browser tab sends a heartbeat every 30 seconds.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-700/50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                    {language === 'ar' ? 'المستأجر' : 'Tenant'}
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                    {language === 'ar' ? 'المستخدم' : 'User'}
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                    {language === 'ar' ? 'الأجهزة المتصلة' : 'Connected Devices'}
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                    {language === 'ar' ? 'مفتوح منذ' : 'Opened'}
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                    {language === 'ar' ? 'آخر نبضة' : 'Last Seen'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                {sessions.map((session) => (
                  <tr key={session._id} className="hover:bg-gray-50 dark:hover:bg-dark-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-xs">
                          {session.tenant?.name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{session.tenant?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{session.tenant?.business?.legalNameEn || session.tenant?.slug || ''}</p>
                          <p className="text-xs text-primary-600">{session.tenant?.subscription?.plan || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {session.user?.firstName} {session.user?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{session.user?.email}</p>
                          <p className="text-xs text-gray-400 capitalize">{session.user?.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <DeviceBadge label={language === 'ar' ? 'ماسح' : 'Scanner'} icon={Smartphone} status={session.deviceStatus?.scanner} />
                        <DeviceBadge label={language === 'ar' ? 'طابعة' : 'Printer'} icon={Printer} status={session.deviceStatus?.printer} />
                        <DeviceBadge label={language === 'ar' ? 'درج' : 'Drawer'} icon={Archive} status={session.deviceStatus?.cashDrawer} />
                        <DeviceBadge label={language === 'ar' ? 'ميزان' : 'Scale'} icon={Scale} status={session.deviceStatus?.scale} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {session.openedAt ? new Date(session.openedAt).toLocaleString() : '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {session.lastSeenAt ? new Date(session.lastSeenAt).toLocaleTimeString() : '—'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <div className="text-xs text-gray-400">
        {language === 'ar'
          ? 'يتم مسح الجلسات غير النشطة تلقائياً بعد 3 دقائق من عدم إرسال نبضة.'
          : 'Inactive sessions are automatically cleaned up 3 minutes after the last heartbeat.'}
      </div>
    </div>
  )
}
