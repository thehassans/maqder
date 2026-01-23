import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Download, CheckCircle, Clock, Calculator, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import Money from '../../components/ui/Money'
import ExportMenu from '../../components/ui/ExportMenu'

export default function Payroll() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const queryClient = useQueryClient()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const exportColumns = [
    {
      key: 'employeeId',
      label: t('employeeId'),
      value: (r) => r?.employeeId?.employeeId || ''
    },
    {
      key: 'employeeName',
      label: language === 'ar' ? 'الاسم' : 'Name',
      value: (r) => `${r?.employeeId?.firstNameEn || ''} ${r?.employeeId?.lastNameEn || ''}`.trim()
    },
    {
      key: 'basic',
      label: t('basicSalary'),
      value: (r) => r?.earnings?.find(e => e.type === 'basic')?.amount ?? ''
    },
    {
      key: 'allowances',
      label: language === 'ar' ? 'البدلات' : 'Allowances',
      value: (r) => (r?.totalEarnings || 0) - (r?.earnings?.find(e => e.type === 'basic')?.amount || 0)
    },
    {
      key: 'gosi',
      label: language === 'ar' ? 'التأمينات' : 'GOSI',
      value: (r) => r?.gosi?.employeeShare ?? ''
    },
    {
      key: 'netPay',
      label: language === 'ar' ? 'صافي الراتب' : 'Net Pay',
      value: (r) => r?.netPay ?? ''
    },
    {
      key: 'status',
      label: t('status'),
      value: (r) => r?.status || ''
    },
  ]

  const { data, isLoading } = useQuery({
    queryKey: ['payroll', selectedMonth, selectedYear],
    queryFn: () => api.get('/payroll', { params: { month: selectedMonth, year: selectedYear } }).then(res => res.data)
  })

  const generateMutation = useMutation({
    mutationFn: () => api.post('/payroll/generate', { month: selectedMonth, year: selectedYear }),
    onSuccess: (res) => {
      toast.success(`Generated ${res.data.payrolls.length} payroll records`)
      queryClient.invalidateQueries(['payroll'])
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to generate payroll')
  })

  const generateWPSMutation = useMutation({
    mutationFn: () => api.post('/payroll/generate-wps', { month: selectedMonth, year: selectedYear, paymentDate: new Date() }, { responseType: 'blob' }),
    onSuccess: (res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `WPS_${selectedYear}${String(selectedMonth).padStart(2, '0')}.sif`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success(language === 'ar' ? 'تم تحميل ملف WPS' : 'WPS file downloaded')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to generate WPS')
  })

  const totalNet = data?.payrolls?.reduce((sum, p) => sum + p.netPay, 0) || 0
  const totalGOSI = data?.payrolls?.reduce((sum, p) => sum + (p.gosi?.totalContribution || 0), 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('payroll')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'إدارة رواتب الموظفين وملفات WPS' : 'Manage employee salaries and WPS files'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/payroll/calculators" className="btn btn-secondary">
            <Calculator className="w-4 h-4" />
            GOSI/EOSB
          </Link>
          <ExportMenu
            language={language}
            t={t}
            rows={data?.payrolls || []}
            columns={exportColumns}
            fileBaseName={language === 'ar' ? `رواتب_${selectedYear}_${String(selectedMonth).padStart(2, '0')}` : `Payroll_${selectedYear}_${String(selectedMonth).padStart(2, '0')}`}
            title={language === 'ar' ? 'الرواتب' : 'Payroll'}
            disabled={isLoading || !(data?.payrolls || []).length}
          />
          <button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending} className="btn btn-primary">
            {generateMutation.isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Plus className="w-4 h-4" />{language === 'ar' ? 'إنشاء الرواتب' : 'Generate Payroll'}</>}
          </button>
        </div>
      </div>

      {/* Period Selection */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div>
            <label className="label">{language === 'ar' ? 'الشهر' : 'Month'}</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="select w-40">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <option key={m} value={m}>{new Date(2024, m-1).toLocaleString(language === 'ar' ? 'ar' : 'en', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{language === 'ar' ? 'السنة' : 'Year'}</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="select w-32">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={() => generateWPSMutation.mutate()} disabled={generateWPSMutation.isPending || !data?.payrolls?.length} className="btn btn-secondary">
            {generateWPSMutation.isPending ? <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" /> : <><Download className="w-4 h-4" />{t('generateWps')}</>}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">{language === 'ar' ? 'عدد الموظفين' : 'Employees'}</p>
          <p className="text-2xl font-bold">{data?.payrolls?.length || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">{language === 'ar' ? 'إجمالي الرواتب' : 'Total Salaries'}</p>
          <p className="text-2xl font-bold text-primary-600"><Money value={totalNet} /></p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">{language === 'ar' ? 'إجمالي التأمينات' : 'Total GOSI'}</p>
          <p className="text-2xl font-bold"><Money value={totalGOSI} /></p>
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
        {isLoading ? (
          <div className="p-8 text-center"><div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : data?.payrolls?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{language === 'ar' ? 'لا توجد رواتب لهذه الفترة' : 'No payroll records for this period'}</p>
            <p className="text-sm mt-1">{language === 'ar' ? 'اضغط "إنشاء الرواتب" لإنشاء سجلات جديدة' : 'Click "Generate Payroll" to create records'}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('employeeId')}</th>
                  <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
                  <th>{t('basicSalary')}</th>
                  <th>{language === 'ar' ? 'البدلات' : 'Allowances'}</th>
                  <th>{language === 'ar' ? 'التأمينات' : 'GOSI'}</th>
                  <th>{language === 'ar' ? 'صافي الراتب' : 'Net Pay'}</th>
                  <th>{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {data?.payrolls?.map((p) => (
                  <tr key={p._id}>
                    <td className="font-medium">{p.employeeId?.employeeId}</td>
                    <td>{p.employeeId?.firstNameEn} {p.employeeId?.lastNameEn}</td>
                    <td><Money value={p.earnings?.find(e => e.type === 'basic')?.amount} /></td>
                    <td><Money value={p.totalEarnings - (p.earnings?.find(e => e.type === 'basic')?.amount || 0)} /></td>
                    <td className="text-red-600">-<Money value={p.gosi?.employeeShare} /></td>
                    <td className="font-semibold text-primary-600"><Money value={p.netPay} /></td>
                    <td>
                      <span className={`badge ${p.status === 'paid' ? 'badge-success' : p.status === 'approved' ? 'badge-info' : 'badge-warning'}`}>
                        {p.status === 'paid' && <CheckCircle className="w-3 h-3 me-1" />}
                        {p.status === 'draft' && <Clock className="w-3 h-3 me-1" />}
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
