import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useForm, useFieldArray } from 'react-hook-form'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'

export default function ManpowerWorkersBulk() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const trades = ['carpenter', 'plumber', 'mason', 'electrician', 'welder', 'helper', 'driver', 'operator', 'other']

  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      workers: [
        { name: '', nameAr: '', iqamaNumber: '', nationality: '', trade: 'helper', dailyRate: 0, monthlyRate: 0 }
      ]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "workers"
  })

  const saveMutation = useMutation({
    mutationFn: (data) => api.post('/manpower/workers/bulk', data),
    onSuccess: (res) => {
      toast.success(language === 'ar' ? `تمت إضافة ${res.data.count} عامل بنجاح` : `Successfully added ${res.data.count} workers`)
      queryClient.invalidateQueries(['manpower-workers'])
      navigate('/app/dashboard/manpower/workers')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error saving workers')
  })

  const onSubmit = (data) => {
    // Filter out rows where name is empty
    const validWorkers = data.workers.filter(w => w.name.trim() !== '')
    if (validWorkers.length === 0) {
      toast.error(language === 'ar' ? 'يرجى إدخال عامل واحد على الأقل' : 'Please enter at least one worker')
      return
    }
    saveMutation.mutate({ workers: validWorkers })
  }

  const getTradeLabel = (tr) => {
    if (language === 'en') return tr.charAt(0).toUpperCase() + tr.slice(1)
    const arTrades = { carpenter: 'نجار', plumber: 'سباك', mason: 'بناء', electrician: 'كهربائي', welder: 'لحام', helper: 'مساعد', driver: 'سائق', operator: 'مشغل', other: 'أخرى' }
    return arTrades[tr] || tr
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-icon">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {language === 'ar' ? 'إضافة عمالة متعددة' : 'Add Bulk Workers'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {language === 'ar' ? 'إضافة سريعة لعدة عمال في نفس الوقت' : 'Quickly add multiple workers at once'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => append({ name: '', nameAr: '', iqamaNumber: '', nationality: '', trade: 'helper', dailyRate: 0, monthlyRate: 0 })} type="button" className="btn btn-secondary">
            <Plus className="w-4 h-4" />
            {language === 'ar' ? 'إضافة صف' : 'Add Row'}
          </button>
          <button onClick={handleSubmit(onSubmit)} disabled={saveMutation.isPending} className="btn btn-primary">
            {saveMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t('save')}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-dark-700 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3">{language === 'ar' ? 'الاسم' : 'Name'} *</th>
                <th className="px-4 py-3">{language === 'ar' ? 'الاسم بالعربي' : 'Name (Ar)'}</th>
                <th className="px-4 py-3">{language === 'ar' ? 'رقم الإقامة' : 'Iqama'}</th>
                <th className="px-4 py-3">{language === 'ar' ? 'الجنسية' : 'Nationality'}</th>
                <th className="px-4 py-3 w-40">{language === 'ar' ? 'المهنة' : 'Trade'}</th>
                <th className="px-4 py-3 w-28">{language === 'ar' ? 'يومي' : 'Daily'}</th>
                <th className="px-4 py-3 w-28">{language === 'ar' ? 'شهري' : 'Monthly'}</th>
                <th className="px-4 py-3 w-16 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
              {fields.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50">
                  <td className="p-2">
                    <input 
                      {...register(`workers.${index}.name`, { required: true })} 
                      className={`input py-1.5 px-2 text-sm h-auto ${errors.workers?.[index]?.name ? 'border-red-500' : 'border-transparent hover:border-gray-300 focus:border-primary-500 bg-transparent focus:bg-white dark:focus:bg-dark-800'}`} 
                      placeholder={language === 'ar' ? 'الاسم' : 'Name'}
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      {...register(`workers.${index}.nameAr`)} 
                      dir="rtl"
                      className="input py-1.5 px-2 text-sm h-auto border-transparent hover:border-gray-300 focus:border-primary-500 bg-transparent focus:bg-white dark:focus:bg-dark-800"
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      {...register(`workers.${index}.iqamaNumber`)} 
                      className="input py-1.5 px-2 text-sm h-auto border-transparent hover:border-gray-300 focus:border-primary-500 bg-transparent focus:bg-white dark:focus:bg-dark-800"
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      {...register(`workers.${index}.nationality`)} 
                      className="input py-1.5 px-2 text-sm h-auto border-transparent hover:border-gray-300 focus:border-primary-500 bg-transparent focus:bg-white dark:focus:bg-dark-800"
                    />
                  </td>
                  <td className="p-2">
                    <select 
                      {...register(`workers.${index}.trade`)} 
                      className="select py-1.5 px-2 text-sm h-auto border-transparent hover:border-gray-300 focus:border-primary-500 bg-transparent focus:bg-white dark:focus:bg-dark-800"
                    >
                      {trades.map(t => <option key={t} value={t}>{getTradeLabel(t)}</option>)}
                    </select>
                  </td>
                  <td className="p-2">
                    <input 
                      type="number" step="0.01" 
                      {...register(`workers.${index}.dailyRate`, { valueAsNumber: true })} 
                      className="input py-1.5 px-2 text-sm h-auto border-transparent hover:border-gray-300 focus:border-primary-500 bg-transparent focus:bg-white dark:focus:bg-dark-800"
                    />
                  </td>
                  <td className="p-2">
                    <input 
                      type="number" step="0.01" 
                      {...register(`workers.${index}.monthlyRate`, { valueAsNumber: true })} 
                      className="input py-1.5 px-2 text-sm h-auto border-transparent hover:border-gray-300 focus:border-primary-500 bg-transparent focus:bg-white dark:focus:bg-dark-800"
                    />
                  </td>
                  <td className="p-2 text-center">
                    {fields.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => remove(index)} 
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-dark-700/30 border-t border-gray-100 dark:border-dark-700 flex justify-center">
          <button 
            type="button" 
            onClick={() => append({ name: '', nameAr: '', iqamaNumber: '', nationality: '', trade: 'helper', dailyRate: 0, monthlyRate: 0 })} 
            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            {language === 'ar' ? 'إضافة صف جديد' : 'Add another row'}
          </button>
        </div>
      </div>
    </div>
  )
}
