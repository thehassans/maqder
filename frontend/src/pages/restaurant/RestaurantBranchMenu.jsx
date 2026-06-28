import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Store, Search, Check, Save, Loader2, UtensilsCrossed,
  ChevronDown, ChevronRight, Filter, X, CheckSquare, Square,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import Money from '../../components/ui/Money'

export default function RestaurantBranchMenu() {
  const { language } = useSelector((state) => state.ui)
  const isRtl = language === 'ar'
  const qc = useQueryClient()

  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [expandedCategories, setExpandedCategories] = useState(new Set())
  const [assignedIds, setAssignedIds] = useState(new Set())
  const [hasChanges, setHasChanges] = useState(false)

  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/branches').then(r => r.data),
  })

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['branch-menu-items', selectedBranchId],
    queryFn: () => selectedBranchId
      ? api.get(`/branches/${selectedBranchId}/menu-items`).then(r => r.data)
      : [],
    enabled: !!selectedBranchId,
  })

  // Sync assignedIds from fetched items when branch changes
  useMemo(() => {
    if (items.length) {
      const ids = new Set(items.filter(it => it.isAssigned).map(it => it._id))
      setAssignedIds(ids)
      setHasChanges(false)
      // Expand all categories initially
      setExpandedCategories(new Set([...new Set(items.map(it => it.category))]))
    }
  }, [items, selectedBranchId])

  const categories = useMemo(() => [...new Set(items.map(it => it.category || 'Uncategorized'))].sort(), [items])

  const filteredItems = useMemo(() => {
    return items.filter(it => {
      const name = (isRtl ? it.nameAr : it.nameEn) || it.nameEn || it.nameAr || ''
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || (it.sku || '').toLowerCase().includes(search.toLowerCase())
      const matchesCategory = !categoryFilter || it.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [items, search, categoryFilter, isRtl])

  const itemsByCategory = useMemo(() => {
    const groups = {}
    filteredItems.forEach(it => {
      const key = it.category || 'Uncategorized'
      if (!groups[key]) groups[key] = []
      groups[key].push(it)
    })
    return groups
  }, [filteredItems])

  const stats = useMemo(() => {
    const total = items.length
    const assigned = assignedIds.size
    return { total, assigned, unassigned: total - assigned }
  }, [items, assignedIds])

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  const toggleItem = (id) => {
    setAssignedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setHasChanges(true)
  }

  const selectAllInCategory = (cat, select) => {
    const ids = itemsByCategory[cat]?.map(it => it._id) || []
    setAssignedIds(prev => {
      const next = new Set(prev)
      ids.forEach(id => select ? next.add(id) : next.delete(id))
      return next
    })
    setHasChanges(true)
  }

  const selectAll = (select) => {
    const ids = filteredItems.map(it => it._id)
    setAssignedIds(prev => {
      const next = new Set(prev)
      ids.forEach(id => select ? next.add(id) : next.delete(id))
      return next
    })
    setHasChanges(true)
  }

  const saveMutation = useMutation({
    mutationFn: () => api.put(`/branches/${selectedBranchId}/menu-items`, {
      assignedItemIds: Array.from(assignedIds),
    }),
    onSuccess: () => {
      toast.success(isRtl ? 'تم حفظ قائمة الفرع' : 'Branch menu saved')
      qc.invalidateQueries({ queryKey: ['branch-menu-items', selectedBranchId] })
      qc.invalidateQueries({ queryKey: ['restaurant-menu-items'] })
      setHasChanges(false)
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Error saving branch menu'),
  })

  const selectedBranch = branches.find(b => b._id === selectedBranchId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isRtl ? 'قائمة الطعام حسب الفرع' : 'Branch Menu Assignment'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isRtl ? 'حدد الأصناف المتاحة لكل فرع' : 'Choose which menu items are available for each branch'}
          </p>
        </div>
      </div>

      {/* Branch selector card */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-100 to-emerald-50 dark:from-primary-900/30 dark:to-emerald-900/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{isRtl ? 'الفرع' : 'Branch'}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {selectedBranch ? selectedBranch.name : isRtl ? 'اختر فرعاً' : 'Select a branch'}
              </p>
            </div>
          </div>
          <div className="flex-1 sm:max-w-md">
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="select w-full"
            >
              <option value="">{isRtl ? 'اختر فرعاً...' : 'Select a branch...'}</option>
              {branches.map(b => (
                <option key={b._id} value={b._id}>{b.name}{b.nameAr ? ` / ${b.nameAr}` : ''}</option>
              ))}
            </select>
          </div>
          {branchesLoading && <Loader2 className="w-5 h-5 animate-spin text-primary-500" />}
        </div>
      </div>

      {!selectedBranchId ? (
        <div className="text-center py-16">
          <div className="inline-flex p-4 rounded-2xl bg-gray-100 dark:bg-dark-700 mb-3">
            <Store className="w-8 h-8 text-gray-300 dark:text-dark-600" />
          </div>
          <p className="text-gray-400 font-medium">{isRtl ? 'اختر فرعاً لإدارة قائمته' : 'Select a branch to manage its menu'}</p>
        </div>
      ) : itemsLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
      ) : (
        <>
          {/* Stats + filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/30"><UtensilsCrossed className="w-5 h-5 text-primary-600" /></div>
              <div><p className="text-xs text-gray-400">{isRtl ? 'إجمالي الأصناف' : 'Total Items'}</p><p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</p></div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30"><Check className="w-5 h-5 text-emerald-600" /></div>
              <div><p className="text-xs text-gray-400">{isRtl ? 'المتاحة' : 'Assigned'}</p><p className="text-xl font-bold text-gray-900 dark:text-white">{stats.assigned}</p></div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gray-100 dark:bg-dark-700"><X className="w-5 h-5 text-gray-500" /></div>
              <div><p className="text-xs text-gray-400">{isRtl ? 'غير المتاحة' : 'Unassigned'}</p><p className="text-xl font-bold text-gray-900 dark:text-white">{stats.unassigned}</p></div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={isRtl ? 'بحث بالاسم أو SKU...' : 'Search by name or SKU...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input ps-10 w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="select w-auto">
                <option value="">{isRtl ? 'كل التصنيفات' : 'All Categories'}</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => selectAll(true)} className="btn btn-secondary btn-sm">
                <CheckSquare className="w-4 h-4" /> {isRtl ? 'تحديد الكل' : 'Select All'}
              </button>
              <button onClick={() => selectAll(false)} className="btn btn-secondary btn-sm">
                <Square className="w-4 h-4" /> {isRtl ? 'إلغاء الكل' : 'Clear All'}
              </button>
            </div>
          </div>

          {/* Category accordions */}
          <div className="space-y-3">
            {categories.filter(cat => itemsByCategory[cat]?.length).map(cat => {
              const catItems = itemsByCategory[cat]
              const allSelected = catItems.every(it => assignedIds.has(it._id))
              const someSelected = catItems.some(it => assignedIds.has(it._id)) && !allSelected
              const isExpanded = expandedCategories.has(cat)

              return (
                <div key={cat} className="card overflow-hidden">
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-dark-700/50 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); selectAllInCategory(cat, !allSelected) }}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-600"
                      >
                        {allSelected ? <CheckSquare className="w-4 h-4 text-emerald-500" /> : someSelected ? (
                          <div className="w-4 h-4 rounded border-2 border-emerald-500 bg-emerald-500/30" />
                        ) : <Square className="w-4 h-4 text-gray-400" />}
                      </button>
                      <span className="font-semibold text-gray-900 dark:text-white">{cat}</span>
                      <span className="text-xs text-gray-400">{catItems.length} {isRtl ? 'صنف' : 'items'}</span>
                    </div>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="divide-y divide-gray-100 dark:divide-dark-700">
                          {catItems.map(it => {
                            const isAssigned = assignedIds.has(it._id)
                            return (
                              <div
                                key={it._id}
                                onClick={() => toggleItem(it._id)}
                                className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${isAssigned ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : 'hover:bg-gray-50 dark:hover:bg-dark-700/50'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isAssigned ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-dark-600'}`}>
                                    {isAssigned && <Check className="w-3.5 h-3.5 text-white" />}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm text-gray-900 dark:text-white">{isRtl ? it.nameAr || it.nameEn : it.nameEn || it.nameAr}</p>
                                    <p className="text-xs text-gray-400">{it.sku || '-'}</p>
                                  </div>
                                </div>
                                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                  <Money value={it.sellingPrice} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>

          {/* Save bar */}
          <AnimatePresence>
            {hasChanges && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40"
              >
                <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {isRtl ? 'لديك تغييرات غير محفوظة' : 'You have unsaved changes'}
                  </span>
                  <button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-60"
                  >
                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isRtl ? 'حفظ' : 'Save'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
