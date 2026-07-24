import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { Plus, Search, Edit2, Trash2, UtensilsCrossed, Users, Hash, Settings2, Save, Map } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import api from '../../lib/api'

export default function RestaurantTables() {
  const { language } = useSelector(state => state.ui)
  const isRtl = language === 'ar'

  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editMode, setEditMode] = useState(false)
  const containerRef = useRef(null)
  
  // Form Modal
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    tableNumber: '',
    name: '',
    seats: 4,
    status: 'available',
    shape: 'rectangle',
    width: 120,
    height: 80
  })
  const [editingId, setEditingId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)

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

  const seedTables = async () => {
    try {
      setIsSeeding(true)
      await api.post('/restaurant/tables/seed')
      toast.success(isRtl ? 'تم إضافة الطاولات الافتراضية' : 'Default tables added')
      fetchTables()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to seed tables')
    } finally {
      setIsSeeding(false)
    }
  }

  const handleOpenModal = (table = null) => {
    if (table) {
      setFormData({
        tableNumber: table.tableNumber,
        name: table.name || '',
        seats: table.seats || 4,
        status: table.status,
        shape: table.shape || 'rectangle',
        width: table.width || 120,
        height: table.height || 80
      })
      setEditingId(table._id)
    } else {
      setFormData({ tableNumber: '', name: '', seats: 4, status: 'available', shape: 'rectangle', width: 120, height: 80 })
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
        await api.post('/restaurant/tables', { ...formData, positionX: 50, positionY: 50 })
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

  const updateTablePosition = async (id, x, y) => {
    try {
      await api.put(`/restaurant/tables/${id}`, { positionX: x, positionY: y })
    } catch (error) {
      console.error('Failed to update position', error)
    }
  }

  const filteredTables = tables.filter(t => 
    t.tableNumber?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return 'bg-emerald-500 shadow-emerald-500/50'
      case 'occupied': return 'bg-rose-500 shadow-rose-500/50'
      case 'reserved': return 'bg-amber-500 shadow-amber-500/50'
      default: return 'bg-gray-500 shadow-gray-500/50'
    }
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-dark-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <Map className="w-8 h-8 text-amber-600" />
            {isRtl ? 'مخطط الطاولات' : 'Floor Plan'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isRtl ? 'نظم طاولات مطعمك بتصميم ثلاثي الأبعاد' : 'Organize your restaurant tables with a 3D floor plan'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {tables.length === 0 && !loading && (
            <button
              onClick={seedTables}
              disabled={isSeeding}
              className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-dark-700 dark:hover:bg-dark-600 dark:text-gray-300 rounded-xl px-4 py-2.5 font-bold"
            >
              {isSeeding ? '...' : (isRtl ? 'إضافة طاولات افتراضية' : 'Seed Default Tables')}
            </button>
          )}
          
          <button
            onClick={() => setEditMode(!editMode)}
            className={`btn rounded-xl px-5 py-2.5 flex items-center gap-2 font-bold transition-all ${
              editMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-dark-700 dark:hover:bg-dark-600 dark:text-gray-300'
            }`}
          >
            {editMode ? <Save className="w-5 h-5" /> : <Settings2 className="w-5 h-5" />}
            {editMode ? (isRtl ? 'حفظ التخطيط' : 'Save Layout') : (isRtl ? 'تعديل التخطيط' : 'Edit Layout')}
          </button>
          
          <button
            onClick={() => handleOpenModal()}
            className="btn btn-primary bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-6 py-2.5 flex items-center gap-2 font-bold shadow-md shadow-amber-500/20"
          >
            <Plus className="w-5 h-5" />
            {isRtl ? 'إضافة طاولة' : 'Add Table'}
          </button>
        </div>
      </div>

      {/* Floor Plan Area */}
      <div 
        className="relative w-full h-[700px] bg-gray-100 dark:bg-dark-900 rounded-3xl overflow-hidden border-4 border-gray-200 dark:border-dark-800 shadow-inner"
        style={{
          backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
        ref={containerRef}
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-bold text-xl">Loading floor plan...</div>
        ) : (
          filteredTables.map(table => (
            <motion.div
              key={table._id}
              drag={editMode}
              dragConstraints={containerRef}
              dragElastic={0}
              dragMomentum={false}
              onDragEnd={(e, info) => {
                // Update position locally then via API
                const x = Math.max(0, (table.positionX || 0) + info.offset.x)
                const y = Math.max(0, (table.positionY || 0) + info.offset.y)
                updateTablePosition(table._id, x, y)
                // Update state to prevent snapping back
                setTables(tables.map(t => t._id === table._id ? { ...t, positionX: x, positionY: y } : t))
              }}
              initial={{ x: table.positionX || 0, y: table.positionY || 0 }}
              animate={{ x: table.positionX || 0, y: table.positionY || 0 }}
              style={{
                width: table.width || 120,
                height: table.height || 80,
                position: 'absolute'
              }}
              className={`absolute cursor-${editMode ? 'grab active:cursor-grabbing' : 'pointer'} flex items-center justify-center group`}
            >
              {/* 3D Table Visual */}
              <div 
                className={`relative w-full h-full flex flex-col items-center justify-center
                  ${table.shape === 'circle' ? 'rounded-full' : 'rounded-2xl'}
                  bg-gradient-to-b from-[#3a2c20] to-[#251b12] shadow-xl border border-[#4a3a2d]
                  transition-transform ${!editMode && 'hover:scale-[1.02]'}
                `}
                style={{
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* Wood texture overlay */}
                <div 
                  className={`absolute inset-0 opacity-20 pointer-events-none ${table.shape === 'circle' ? 'rounded-full' : 'rounded-2xl'}`}
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #000 0px, #000 2px, transparent 2px, transparent 8px)'
                  }}
                />

                {/* Status Indicator */}
                <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getStatusColor(table.status)}`} />

                {/* Content */}
                <span className="relative z-10 text-white font-black text-2xl drop-shadow-md">
                  {table.tableNumber}
                </span>
                
                {/* Edit Controls (Only visible in edit mode) */}
                {editMode && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white dark:bg-dark-800 p-1.5 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenModal(table); }}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-gray-600 dark:text-gray-300"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(table._id); }}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 dark:border-dark-700 flex justify-between items-center bg-gray-50/50 dark:bg-dark-900/50">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingId 
                  ? (isRtl ? 'تعديل الطاولة' : 'Edit Table') 
                  : (isRtl ? 'إضافة طاولة جديدة' : 'Add New Table')}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Details Section */}
                <div className="space-y-4">
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

                {/* Visual Settings Section */}
                <div className="space-y-4 bg-gray-50 dark:bg-dark-900 p-4 rounded-2xl border border-gray-100 dark:border-dark-700">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4">Visual Settings</h3>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Shape
                    </label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setFormData({...formData, shape: 'rectangle'})} className={`flex-1 py-2 rounded-xl border ${formData.shape === 'rectangle' ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-gray-200 bg-white'}`}>Rectangle</button>
                      <button type="button" onClick={() => setFormData({...formData, shape: 'circle'})} className={`flex-1 py-2 rounded-xl border ${formData.shape === 'circle' ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-gray-200 bg-white'}`}>Circle</button>
                      <button type="button" onClick={() => setFormData({...formData, shape: 'square'})} className={`flex-1 py-2 rounded-xl border ${formData.shape === 'square' ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-gray-200 bg-white'}`}>Square</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Width (px)</label>
                      <input type="number" value={formData.width} onChange={e => setFormData({...formData, width: Number(e.target.value)})} className="w-full input rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Height (px)</label>
                      <input type="number" value={formData.height} onChange={e => setFormData({...formData, height: Number(e.target.value)})} className="w-full input rounded-xl" />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-center items-center h-32 border-2 border-dashed border-gray-200 dark:border-dark-700 rounded-xl">
                    {/* Preview */}
                    <div 
                      className={`flex items-center justify-center bg-gradient-to-b from-[#3a2c20] to-[#251b12] shadow-xl border border-[#4a3a2d] ${formData.shape === 'circle' ? 'rounded-full' : 'rounded-2xl'}`}
                      style={{ 
                        width: Math.min(formData.width, 100), 
                        height: Math.min(formData.height, 100),
                        boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.1)'
                      }}
                    >
                       <span className="text-white font-bold text-sm">Preview</span>
                    </div>
                  </div>
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
