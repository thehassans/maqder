import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Plus, Edit, Trash2, Users, X, Phone, Mail, MapPin, User, Lock, Eye, EyeOff, Sparkles, PhoneCall } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../../lib/api'

export default function RestaurantBranches() {
  const { language } = useSelector(state => state.ui)
  const { tenant, user } = useSelector(state => state.auth)
  const isRtl = language === 'ar'
  const queryClient = useQueryClient()

  const hasBranchAddon = tenant?.subscription?.hasBranchAddon === true
  const maxBranches = tenant?.subscription?.maxBranches || 0
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const [showBranchForm, setShowBranchForm] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  const [branchForm, setBranchForm] = useState({ name: '', nameAr: '', phone: '', email: '', managerName: '', address: { street: '', district: '', city: '', cityAr: '' } })
  const [showUserModal, setShowUserModal] = useState(null)
  const [userForm, setUserForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '', role: 'manager' })
  const [showPassword, setShowPassword] = useState(false)
  const [showBranchUsers, setShowBranchUsers] = useState(null)

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/branches').then(res => res.data),
    enabled: hasBranchAddon,
  })

  const { data: branchUsers = [] } = useQuery({
    queryKey: ['branch-users', showBranchUsers?._id],
    queryFn: () => api.get(`/branches/${showBranchUsers._id}/users`).then(res => res.data),
    enabled: !!showBranchUsers,
  })

  const createBranchMutation = useMutation({
    mutationFn: (data) => editingBranch
      ? api.put(`/branches/${editingBranch._id}`, data)
      : api.post('/branches', data),
    onSuccess: () => {
      toast.success(isRtl ? 'تم الحفظ' : 'Saved')
      queryClient.invalidateQueries(['branches'])
      setShowBranchForm(false)
      setEditingBranch(null)
      setBranchForm({ name: '', nameAr: '', phone: '', email: '', managerName: '', address: { street: '', district: '', city: '', cityAr: '' } })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const deleteBranchMutation = useMutation({
    mutationFn: (id) => api.delete(`/branches/${id}`),
    onSuccess: () => {
      toast.success(isRtl ? 'تم حذف الفرع' : 'Branch deleted')
      queryClient.invalidateQueries(['branches'])
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const createUserMutation = useMutation({
    mutationFn: ({ branchId, data }) => api.post(`/branches/${branchId}/users`, data),
    onSuccess: () => {
      toast.success(isRtl ? 'تم إنشاء المستخدم' : 'User created')
      queryClient.invalidateQueries(['branch-users', showUserModal?._id])
      setShowUserModal(null)
      setUserForm({ email: '', password: '', firstName: '', lastName: '', phone: '', role: 'manager' })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const deleteUserMutation = useMutation({
    mutationFn: ({ branchId, userId }) => api.delete(`/branches/${branchId}/users/${userId}`),
    onSuccess: () => {
      toast.success(isRtl ? 'تم تعطيل المستخدم' : 'User deactivated')
      queryClient.invalidateQueries(['branch-users', showBranchUsers?._id])
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const handleEditBranch = (branch) => {
    setEditingBranch(branch)
    setBranchForm({
      name: branch.name || '',
      nameAr: branch.nameAr || '',
      phone: branch.phone || '',
      email: branch.email || '',
      managerName: branch.managerName || '',
      address: {
        street: branch.address?.street || '',
        district: branch.address?.district || '',
        city: branch.address?.city || '',
        cityAr: branch.address?.cityAr || '',
      },
    })
    setShowBranchForm(true)
  }

  const handleBranchSubmit = () => {
    createBranchMutation.mutate(branchForm)
  }

  const handleUserSubmit = () => {
    createUserMutation.mutate({ branchId: showUserModal._id, data: userForm })
  }

  // Not enabled — show upgrade page
  if (!hasBranchAddon) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4 text-center">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-dark-800 dark:to-dark-900 border border-amber-100 dark:border-dark-700 rounded-3xl p-10 max-w-2xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-amber-400 opacity-20 blur-3xl rounded-full pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-orange-400 opacity-20 blur-3xl rounded-full pointer-events-none"></div>

          <div className="w-24 h-24 bg-white dark:bg-dark-800 rounded-full shadow-lg flex items-center justify-center mx-auto mb-6 relative">
            <Building2 className="w-12 h-12 text-amber-600" />
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full p-1.5 shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
            {isRtl ? 'إدارة الفروع المتعددة' : 'Multi-Branch Management'}
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto leading-relaxed">
            {isRtl
              ? 'نظام إدارة الفروع هو خدمة إضافية متميزة. يتيح لك إدارة القوائم، المخزون، والتقارير لكل فرع على حدة من لوحة تحكم واحدة مركزية.'
              : 'Multi-Branch Management is a premium add-on service. It allows you to manage menus, inventory, and reports for each branch independently from a single centralized dashboard.'}
          </p>

          <a
            href="mailto:support@maqder.com"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-lg shadow-amber-500/30 transition-all hover:scale-105 active:scale-95"
          >
            <PhoneCall className="w-5 h-5" />
            {isRtl ? 'تواصل مع فريق مقدر' : 'Contact Maqder Team'}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isRtl ? 'إدارة الفروع' : 'Branch Management'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isRtl ? `الفروع النشطة: ${branches.length} / ${maxBranches || '∞'}` : `Active branches: ${branches.length} / ${maxBranches || '∞'}`}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditingBranch(null); setBranchForm({ name: '', nameAr: '', phone: '', email: '', managerName: '', address: { street: '', district: '', city: '', cityAr: '' } }); setShowBranchForm(true) }}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            {isRtl ? 'إضافة فرع' : 'Add Branch'}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : branches.length === 0 ? (
        <div className="card p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {isRtl ? 'لا توجد فروع بعد. ابدأ بإضافة فرع جديد.' : 'No branches yet. Start by adding a new branch.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <motion.div
              key={branch._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <Building2 className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{branch.name}</h3>
                    {branch.nameAr && <p className="text-sm text-gray-500">{branch.nameAr}</p>}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEditBranch(branch)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-gray-400 hover:text-blue-500">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm(isRtl ? 'هل أنت متأكد من حذف هذا الفرع؟' : 'Delete this branch?')) deleteBranchMutation.mutate(branch._id) }}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                {branch.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {branch.phone}</div>}
                {branch.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {branch.email}</div>}
                {branch.address?.city && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {branch.address.city}</div>}
                {branch.managerName && <div className="flex items-center gap-2"><User className="w-3.5 h-3.5" /> {branch.managerName}</div>}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-dark-700 flex items-center gap-2">
                <button
                  onClick={() => setShowBranchUsers(branch)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 rounded-lg py-2 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  {isRtl ? 'المستخدمون' : 'Users'}
                </button>
                {isAdmin && (
                  <button
                    onClick={() => { setShowUserModal(branch); setUserForm({ email: '', password: '', firstName: '', lastName: '', phone: '', role: 'manager' }) }}
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg py-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {isRtl ? 'مستخدم' : 'Add User'}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Branch Form Modal */}
      <AnimatePresence>
        {showBranchForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowBranchForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {editingBranch ? (isRtl ? 'تعديل الفرع' : 'Edit Branch') : (isRtl ? 'فرع جديد' : 'New Branch')}
                </h3>
                <button onClick={() => setShowBranchForm(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">{isRtl ? 'الاسم' : 'Name'}</label>
                    <input className="input" value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">{isRtl ? 'الاسم بالعربية' : 'Name (Arabic)'}</label>
                    <input className="input" value={branchForm.nameAr} onChange={(e) => setBranchForm({ ...branchForm, nameAr: e.target.value })} dir="rtl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">{isRtl ? 'الهاتف' : 'Phone'}</label>
                    <input className="input" value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">{isRtl ? 'البريد' : 'Email'}</label>
                    <input className="input" value={branchForm.email} onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="label">{isRtl ? 'اسم المدير' : 'Manager Name'}</label>
                  <input className="input" value={branchForm.managerName} onChange={(e) => setBranchForm({ ...branchForm, managerName: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">{isRtl ? 'المدينة' : 'City'}</label>
                    <input className="input" value={branchForm.address.city} onChange={(e) => setBranchForm({ ...branchForm, address: { ...branchForm.address, city: e.target.value } })} />
                  </div>
                  <div>
                    <label className="label">{isRtl ? 'الحي' : 'District'}</label>
                    <input className="input" value={branchForm.address.district} onChange={(e) => setBranchForm({ ...branchForm, address: { ...branchForm.address, district: e.target.value } })} />
                  </div>
                </div>

                <button
                  onClick={handleBranchSubmit}
                  disabled={createBranchMutation.isPending}
                  className="btn btn-primary w-full"
                >
                  {createBranchMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    isRtl ? 'حفظ' : 'Save'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add User Modal */}
      <AnimatePresence>
        {showUserModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowUserModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {isRtl ? `مستخدم جديد - ${showUserModal.name}` : `New User - ${showUserModal.name}`}
                </h3>
                <button onClick={() => setShowUserModal(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">{isRtl ? 'الاسم الأول' : 'First Name'}</label>
                    <input className="input" value={userForm.firstName} onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">{isRtl ? 'الاسم الأخير' : 'Last Name'}</label>
                    <input className="input" value={userForm.lastName} onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="label">{isRtl ? 'البريد الإلكتروني' : 'Email'}</label>
                  <input className="input" type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
                </div>
                <div>
                  <label className="label">{isRtl ? 'كلمة المرور' : 'Password'}</label>
                  <div className="relative">
                    <input
                      className="input pe-10"
                      type={showPassword ? 'text' : 'password'}
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">{isRtl ? 'الهاتف' : 'Phone'}</label>
                    <input className="input" value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">{isRtl ? 'الدور' : 'Role'}</label>
                    <select className="select" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                      <option value="manager">{isRtl ? 'مدير' : 'Manager'}</option>
                      <option value="sales">{isRtl ? 'مبيعات' : 'Sales'}</option>
                      <option value="kitchen_staff">{isRtl ? 'مطبخ' : 'Kitchen Staff'}</option>
                      <option value="viewer">{isRtl ? 'مشاهد' : 'Viewer'}</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleUserSubmit}
                  disabled={createUserMutation.isPending}
                  className="btn btn-primary w-full"
                >
                  {createUserMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    isRtl ? 'إنشاء مستخدم' : 'Create User'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Branch Users List Modal */}
      <AnimatePresence>
        {showBranchUsers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowBranchUsers(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {isRtl ? `مستخدمو ${showBranchUsers.name}` : `${showBranchUsers.name} Users`}
                </h3>
                <button onClick={() => setShowBranchUsers(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {branchUsers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {isRtl ? 'لا يوجد مستخدمون لهذا الفرع' : 'No users for this branch'}
                </p>
              ) : (
                <div className="space-y-2">
                  {branchUsers.map((u) => (
                    <div key={u._id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-dark-700">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${u.isActive ? 'badge-success' : 'badge-neutral'}`}>{u.role}</span>
                        {isAdmin && u.isActive && (
                          <button
                            onClick={() => deleteUserMutation.mutate({ branchId: showBranchUsers._id, userId: u._id })}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isAdmin && (
                <button
                  onClick={() => { setShowUserModal(showBranchUsers); setUserForm({ email: '', password: '', firstName: '', lastName: '', phone: '', role: 'manager' }); setShowBranchUsers(null) }}
                  className="btn btn-outline w-full mt-4"
                >
                  <Plus className="w-4 h-4" />
                  {isRtl ? 'إضافة مستخدم' : 'Add User'}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
