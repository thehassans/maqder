import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Users, Search, Scissors, Star } from 'lucide-react'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import api from '../../lib/api'

export default function SaloonBarbers() {
  const { language } = useSelector(state => state.ui)
  const isRtl = language === 'ar'
  const queryClient = useQueryClient()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newStaffName, setNewStaffName] = useState('')

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['saloonStaff'],
    queryFn: async () => {
      const res = await api.get('/saloon/staff')
      return res.data
    }
  })

  const createStaffMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/saloon/staff', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['saloonStaff'])
      toast.success(isRtl ? 'تم إضافة الحلاق بنجاح' : 'Barber added successfully')
      setShowAddModal(false)
      setNewStaffName('')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add barber')
    }
  })

  const deleteStaffMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/saloon/staff/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['saloonStaff'])
      toast.success(isRtl ? 'تم حذف الحلاق بنجاح' : 'Barber deleted successfully')
    }
  })

  const filteredStaff = staff.filter(s => 
    s.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.nameAr && s.nameAr.includes(searchTerm))
  )

  const handleCreate = (e) => {
    e.preventDefault()
    if (!newStaffName.trim()) return
    createStaffMutation.mutate({ nameEn: newStaffName.trim() })
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-amber-500" />
            {isRtl ? 'الحلاقين' : 'Barbers'}
          </h1>
          <p className="text-gray-500 mt-2">{isRtl ? 'إدارة طاقم الحلاقين' : 'Manage your barbers and staff'}</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2 px-6 py-3"
        >
          <Plus className="w-5 h-5" />
          {isRtl ? 'إضافة حلاق' : 'Add Barber'}
        </button>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-6 mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={isRtl ? 'ابحث عن حلاق...' : 'Search barbers...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 bg-gray-50 dark:bg-dark-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((person) => (
          <div key={person._id} className="bg-white dark:bg-dark-800 rounded-2xl p-6 border border-gray-100 dark:border-dark-700 shadow-sm hover:shadow-md transition-shadow group flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Scissors className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{person.nameEn}</h3>
              {person.nameAr && person.nameAr !== person.nameEn && (
                <p className="text-sm text-gray-500 mb-2">{person.nameAr}</p>
              )}
              <div className="flex items-center gap-1 text-amber-500 text-sm">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
            </div>
            <button 
              onClick={() => {
                if (window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا الحلاق؟' : 'Are you sure you want to delete this barber?')) {
                  deleteStaffMutation.mutate(person._id)
                }
              }}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
        {filteredStaff.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400">
            {isRtl ? 'لا يوجد حلاقين' : 'No barbers found'}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-md p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              {isRtl ? 'إضافة حلاق جديد' : 'Add New Barber'}
            </h2>
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRtl ? 'اسم الحلاق' : 'Barber Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="input"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  type="submit"
                  disabled={createStaffMutation.isPending}
                  className="btn bg-amber-500 hover:bg-amber-600 text-white flex-1"
                >
                  {createStaffMutation.isPending ? '...' : (isRtl ? 'حفظ' : 'Save')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 flex-1"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
