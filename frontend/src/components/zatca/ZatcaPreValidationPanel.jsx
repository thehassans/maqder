import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle,
  Loader2, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'

export default function ZatcaPreValidationPanel({ invoiceData, language = 'en' }) {
  const { t } = useTranslation(language)
  const [expanded, setExpanded] = useState(false)

  const validateMutation = useMutation({
    mutationFn: () => api.post('/tenant/compliance/config/zatca-validate', { invoiceData }).then(res => res.data),
  })

  const handleValidate = useCallback(() => {
    validateMutation.mutate()
    if (!expanded) setExpanded(true)
  }, [validateMutation, expanded])

  const result = validateMutation.data
  const isValidating = validateMutation.isPending
  const hasResult = !!result

  const statusColor = !hasResult
    ? 'bg-gray-100 dark:bg-dark-800 text-gray-500'
    : result.valid
    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'

  const StatusIcon = !hasResult ? ShieldCheck : result.valid ? CheckCircle2 : AlertTriangle

  return (
    <div className={`rounded-xl border ${hasResult ? statusColor : 'border-gray-200 dark:border-dark-600'} ${hasResult ? statusColor : ''}`}>
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <StatusIcon className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">
            {language === 'ar' ? 'فحص الامتثال ZATCA' : 'ZATCA Compliance Check'}
          </span>
          {hasResult && (
            <span className="text-xs font-medium">
              {result.valid
                ? (language === 'ar' ? 'مطابق' : 'Compliant')
                : `${result.errors.length} ${language === 'ar' ? 'خطأ' : 'errors'}`}
              {result.warnings.length > 0 && ` · ${result.warnings.length} ${language === 'ar' ? 'تحذير' : 'warnings'}`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleValidate}
            disabled={isValidating}
            className="btn btn-secondary btn-sm flex items-center gap-1.5"
          >
            {isValidating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {language === 'ar' ? 'فحص' : 'Validate'}
          </button>
          {hasResult && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {expanded && hasResult && (
        <div className="px-3 pb-3 space-y-2">
          {result.errors.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                {language === 'ar' ? 'أخطاء يجب إصلاحها:' : 'Errors to fix:'}
              </p>
              {result.errors.map((err, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
                  <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}
          {result.warnings.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                {language === 'ar' ? 'تحذيرات:' : 'Warnings:'}
              </p>
              {result.warnings.map((warn, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>{warn}</span>
                </div>
              ))}
            </div>
          )}
          {result.valid && result.warnings.length === 0 && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" />
              {language === 'ar' ? 'الفاتورة مطابقة تماماً لمتطلبات ZATCA' : 'Invoice fully compliant with ZATCA requirements'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
