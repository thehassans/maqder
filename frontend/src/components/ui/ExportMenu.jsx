import { Fragment, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { buildDefaultFileName, exportToCsv, exportToExcel, exportToPdf, printTable } from '../../lib/export'

export default function ExportMenu({
  language,
  t,
  rows,
  getRows,
  columns,
  fileBaseName,
  title,
  disabled,
  className = '',
}) {
  const [exporting, setExporting] = useState('')

  const label = typeof t === 'function' ? t('export') : language === 'ar' ? 'تصدير' : 'Export'
  const csvLabel = language === 'ar' ? 'CSV' : 'CSV'
  const excelLabel = language === 'ar' ? 'Excel' : 'Excel'
  const pdfLabel = language === 'ar' ? 'PDF' : 'PDF'
  const printLabel = language === 'ar' ? 'طباعة' : 'Print'

  const base = buildDefaultFileName(fileBaseName || 'export')

  const resolveRows = async () => {
    if (typeof getRows === 'function') {
      const r = await getRows()
      return Array.isArray(r) ? r : []
    }
    return Array.isArray(rows) ? rows : []
  }

  const onCsv = async () => {
    if (disabled) return
    try {
      setExporting('csv')
      const resolved = await resolveRows()
      exportToCsv({ fileName: base, rows: resolved, columns })
    } catch (e) {
      toast.error(language === 'ar' ? 'فشل التصدير' : 'Export failed')
    } finally {
      setExporting('')
    }
  }

  const onExcel = async () => {
    if (disabled) return
    try {
      setExporting('excel')
      const resolved = await resolveRows()
      await exportToExcel({ fileName: base, rows: resolved, columns, sheetName: String(fileBaseName || 'Export') })
    } catch (e) {
      toast.error(language === 'ar' ? 'فشل التصدير' : 'Export failed')
    } finally {
      setExporting('')
    }
  }

  const onPdf = async () => {
    if (disabled) return
    try {
      setExporting('pdf')
      const resolved = await resolveRows()
      await exportToPdf({ fileName: base, title: title || fileBaseName || 'Export', rows: resolved, columns })
    } catch (e) {
      toast.error(language === 'ar' ? 'فشل التصدير' : 'Export failed')
    } finally {
      setExporting('')
    }
  }

  const onPrint = async () => {
    if (disabled) return
    try {
      setExporting('print')
      const resolved = await resolveRows()
      printTable({ title: title || fileBaseName || 'Export', rows: resolved, columns })
    } catch (e) {
      toast.error(language === 'ar' ? 'فشل التصدير' : 'Export failed')
    } finally {
      setExporting('')
    }
  }

  const isBusy = Boolean(exporting)

  return (
    <Menu as="div" className={`relative inline-block text-left ${className}`.trim()}>
      <Menu.Button
        disabled={disabled || isBusy}
        className="btn btn-secondary"
      >
        {isBusy ? (
          <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {label}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute end-0 mt-2 w-56 bg-white dark:bg-dark-800 rounded-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none z-20">
          <div className="p-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={onCsv}
                  className={`${active ? 'bg-gray-100 dark:bg-dark-700' : ''} flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-lg w-full`}
                >
                  {csvLabel}
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={onExcel}
                  className={`${active ? 'bg-gray-100 dark:bg-dark-700' : ''} flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-lg w-full`}
                >
                  {excelLabel}
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={onPdf}
                  className={`${active ? 'bg-gray-100 dark:bg-dark-700' : ''} flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-lg w-full`}
                >
                  {pdfLabel}
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  type="button"
                  onClick={onPrint}
                  className={`${active ? 'bg-gray-100 dark:bg-dark-700' : ''} flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-lg w-full`}
                >
                  {printLabel}
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
