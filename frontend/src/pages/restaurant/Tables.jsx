import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Plus, Search, Edit2, Trash2, UtensilsCrossed, Users, Hash } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import api from '../../lib/api'

export default function RestaurantTables() {
  const { language } = useSelector(state => state.ui)
  const isRtl = language === 'ar'

  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Form Modal
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    tableNumber: '',
    name: '',
    seats: 4,
    status: 'available' // available, occupied, reserved
  })
  const [editingId, setEditingId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/restaurant/tables')
      setTables(data || [])
    } catch (error) {
      toast.error('Failed to load tables')
    } finally {
      setLoading(false)
    }
  }

  const filteredTables = tables.filter(t => 
    t.tableNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleOpenModal = (table = null) => {
    if (table) {
      setFormData({
        tableNumber: table.tableNumber,
        name: table.name || '',
        seats: table.seats || 4,
        status: table.status
      })
      setEditingId(table._id)
    } else {
      setFormData({ tableNumber: '', name: '', seats: 4, status: 'available' })
      setEditingId(null)
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (editingId) {
        await api.put(`/restaurant/tables/${editingId}`, formData)
        toast.success(isRtl ? 'تم تحديث الطاولة' : 'Table updated')
      } else {
        await api.post('/restaurant/tables', formData)
        toast.success(isRtl ? 'تمت إضافة الطاولة' : 'Table added')
      }
      setShowModal(false)
      fetchTables()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save table')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من حذف هذه الطاولة؟' : 'Are you sure you want to delete this table?')) return
    try {
      await api.delete(`/restaurant/tables/${id}`)
      toast.success(isRtl ? 'تم حذف الطاولة' : 'Table deleted')
      fetchTables()
    } catch (error) {
      toast.error('Failed to delete table')
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'occupied': return 'bg-rose-100 text-rose-800 border-rose-200'
      case 'reserved': return 'bg-amber-100 text-amber-800 border-amber-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch(status) {
      case 'available': return isRtl ? 'متاحة' : 'Available'
      case 'occupied': return isRtl ? 'مشغولة' : 'Occupied'
      case 'reserved': return isRtl ? 'محجوزة' : 'Reserved'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-dark-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <UtensilsCrossed className="w-8 h-8 text-amber-600" />
            {isRtl ? 'إدارة الطاولات' : 'Tables Management'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isRtl ? 'أضف ونظم طاولات المطعم' : 'Add and organize restaurant tables'}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-6 py-2.5 flex items-center gap-2 font-bold shadow-md shadow-amber-500/20"
        >
          <Plus className="w-5 h-5" />
          {isRtl ? 'إضافة طاولة' : 'Add Table'}
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-dark-800 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 ${isRtl ? 'right-4' : 'left-4'}`} />
          <input
            type="text"
            placeholder={isRtl ? "البحث برقم الطاولة..." : "Search table number..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full bg-gray-50 dark:bg-dark-900 border-none rounded-xl py-3 focus:ring-2 focus:ring-amber-500 ${isRtl ? 'pr-12' : 'pl-12'}`}
          />
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="flex justify-center py-20 text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredTables.map(table => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              key={table._id}
              className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden flex flex-col group hover:shadow-lg transition-all"
            >
              <div className="p-5 flex-1 flex flex-col items-center justify-center relative">
                <div className={`absolute top-3 ${isRtl ? 'right-3' : 'left-3'} px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(table.status)}`}>
                  {getStatusText(table.status)}
                </div>
                
                <div className="w-20 h-20 bg-gray-50 dark:bg-dark-900 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl font-black text-amber-600">
                    {table.tableNumber}
                  </span>
                </div>
                
                <h3 className="font-bold text-gray-900 dark:text-white text-lg text-center">
                  {table.name || (isRtl ? `طاولة ${table.tableNumber}` : `Table ${table.tableNumber}`)}
                </h3>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-2 font-medium">
                  <Users className="w-4 h-4" />
                  <span>{table.seats} {isRtl ? 'مقاعد' : 'Seats'}</span>
                </div>
              </div>
              
              <div className="flex border-t border-gray-100 dark:border-dark-700">
                <button 
                  onClick={() => handleOpenModal(table)}
                  className="flex-1 py-3 text-sm font-semibold text-gray-600 hover:bg-amber-50 hover:text-amber-600 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-4 h-4" />
                  {isRtl ? 'تعديل' : 'Edit'}
                </button>
                <div className="w-[1px] bg-gray-100 dark:bg-dark-700"></div>
                <button 
                  onClick={() => handleDelete(table._id)}
                  className="flex-1 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  {isRtl ? 'حذف' : 'Delete'}
                </button>
              </div>
            </motion.div>
          ))}
          
          {filteredTables.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-500">
              {isRtl ? 'لم يتم العثور على طاولات.' : 'No tables found.'}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 dark:border-dark-700 flex justify-between items-center bg-gray-50/50 dark:bg-dark-900/50">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingId 
                  ? (isRtl ? 'تعديل الطاولة' : 'Edit Table') 
                  : (isRtl ? 'إضافة طاولة جديدة' : 'Add New Table')}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-amber-500" />
                  {isRtl ? 'رقم الطاولة *' : 'Table Number *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.tableNumber}
                  onChange={(e) => setFormData({...formData, tableNumber: e.target.value})}
                  className="w-full input border-gray-200 focus:border-amber-500 focus:ring-amber-500 rounded-xl"
                  placeholder="e.g. 1, 2, A1, VIP"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-gray-400" />
                  {isRtl ? 'اسم الطاولة (اختياري)' : 'Table Name (Optional)'}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full input border-gray-200 focus:border-amber-500 focus:ring-amber-500 rounded-xl"
                  placeholder="e.g. Window Seat, Family Booth"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-500" />
                    {isRtl ? 'عدد المقاعد' : 'Seats'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.seats}
                    onChange={(e) => setFormData({...formData, seats: parseInt(e.target.value) || 1})}
                    className="w-full input border-gray-200 focus:border-amber-500 focus:ring-amber-500 rounded-xl text-center"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isRtl ? 'الحالة' : 'Status'}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full input border-gray-200 focus:border-amber-500 focus:ring-amber-500 rounded-xl font-medium"
                  >
                    <option value="available">{isRtl ? 'متاحة' : 'Available'}</option>
                    <option value="occupied">{isRtl ? 'مشغولة' : 'Occupied'}</option>
                    <option value="reserved">{isRtl ? 'محجوزة' : 'Reserved'}</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-dark-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn btn-secondary rounded-xl py-3"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn btn-primary bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-3 border-none disabled:opacity-50"
                >
                  {isSubmitting ? '...' : (isRtl ? 'حفظ' : 'Save Table')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
