import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Plus, Minus, Trash2, ShoppingBag, CreditCard, Search, UserPlus } from 'lucide-react'
import api from '../../lib/api'
import { toast } from 'react-hot-toast'
import ThermalReceipt from '../../components/ui/ThermalReceipt'

export default function RestaurantPOS() {
  const { language } = useSelector(state => state.ui)
  const isRtl = language === 'ar'

  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  
  const [cart, setCart] = useState([])
  const [customerName, setCustomerName] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  
  // Checkout states
  const [isProcessing, setIsProcessing] = useState(false)
  const [completedOrder, setCompletedOrder] = useState(null)
  const receiptRef = useRef(null)

  useEffect(() => {
    fetchMenuItems()
  }, [])

  const fetchMenuItems = async () => {
    try {
      const { data } = await api.get('/restaurant/menu-items?limit=200')
      setMenuItems(data.items || [])
    } catch (error) {
      toast.error('Failed to load menu items')
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', ...new Set(menuItems.map(m => m.category).filter(Boolean))]

  const filteredItems = menuItems.filter(m => {
    const matchesSearch = (m.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) || m.nameAr?.includes(searchQuery))
    const matchesCat = activeCategory === 'all' || m.category === activeCategory
    return matchesSearch && matchesCat
  })

  const addToCart = (menuItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.menuItem._id === menuItem._id)
      if (existing) {
        return prev.map(item => 
          item.menuItem._id === menuItem._id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { menuItem, quantity: 1, unitPrice: menuItem.sellingPrice || 0, taxRate: menuItem.taxRate || 15 }]
    })
  }

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.menuItem._id === id) {
        const newQ = Math.max(0, item.quantity + delta)
        return { ...item, quantity: newQ }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const clearCart = () => {
    setCart([])
    setCustomerName('')
    setTableNumber('')
  }

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const cartTax = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.taxRate / 100)), 0)
  const cartTotal = cartSubtotal + cartTax

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Cart is empty')
    
    setIsProcessing(true)
    try {
      const payload = {
        status: 'paid', // Instant checkout
        kitchenStatus: 'new', // Send to kitchen
        customerName: customerName.trim(),
        tableNumber: tableNumber.trim(),
        paymentMethod,
        lineItems: cart.map(item => ({
          menuItemId: item.menuItem._id,
          name: item.menuItem.nameEn,
          nameAr: item.menuItem.nameAr,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
        }))
      }
      
      const { data } = await api.post('/restaurant/orders', payload)
      toast.success(isRtl ? `تم إنشاء الطلب: ${data.orderNumber}` : `Order created: ${data.orderNumber}`)
      setCompletedOrder(data)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Checkout failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePrint = () => {
    if (receiptRef.current) {
      window.print()
    }
  }

  const handleCloseReceipt = () => {
    setCompletedOrder(null)
    clearCart()
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-6rem)] gap-6">
      
      {/* Left: Menu Grid */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 ${isRtl ? 'right-4' : 'left-4'}`} />
            <input
              type="text"
              placeholder={isRtl ? "البحث عن صنف..." : "Search menu..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-white dark:bg-dark-800 border-none rounded-2xl shadow-sm py-3 focus:ring-2 focus:ring-amber-500 ${isRtl ? 'pr-12' : 'pl-12'}`}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl whitespace-nowrap font-medium transition-colors ${
                  activeCategory === cat 
                    ? 'bg-amber-600 text-white shadow-sm' 
                    : 'bg-white dark:bg-dark-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700'
                }`}
              >
                {cat === 'all' ? (isRtl ? 'الكل' : 'All') : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">Loading...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map(item => (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={item._id}
                  onClick={() => addToCart(item)}
                  className="bg-white dark:bg-dark-800 p-4 rounded-2xl shadow-sm border border-transparent hover:border-amber-500 text-left flex flex-col relative overflow-hidden group"
                >
                  <div className="font-bold text-gray-900 dark:text-white mb-1">
                    {isRtl ? (item.nameAr || item.nameEn) : item.nameEn}
                  </div>
                  <div className="text-sm text-gray-500 mb-4">
                    SAR {(item.sellingPrice || 0).toFixed(2)}
                  </div>
                  <div className="mt-auto w-full py-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center text-sm font-medium text-amber-700 dark:text-amber-400 group-hover:bg-amber-100 transition-colors">
                    {isRtl ? 'إضافة' : 'Add'}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart Sidebar */}
      <div className="w-full lg:w-96 bg-white dark:bg-dark-800 rounded-2xl shadow-sm flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100 dark:border-dark-700 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-600" />
            {isRtl ? 'الطلب الحالي' : 'Current Order'}
          </h2>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-red-500 hover:text-red-600 p-1">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-4 border-b border-gray-100 dark:border-dark-700 space-y-3">
          <div className="flex gap-3">
            <input 
              type="text" 
              placeholder={isRtl ? 'رقم الطاولة' : 'Table #'} 
              className="input w-1/3"
              value={tableNumber}
              onChange={e => setTableNumber(e.target.value)}
            />
            <input 
              type="text" 
              placeholder={isRtl ? 'اسم العميل (اختياري)' : 'Customer Name'} 
              className="input flex-1"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['cash', 'card'].map(pm => (
              <button
                key={pm}
                onClick={() => setPaymentMethod(pm)}
                className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
                  paymentMethod === pm
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                    : 'border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                }`}
              >
                {pm === 'cash' ? (isRtl ? 'نقداً' : 'Cash') : (isRtl ? 'بطاقة' : 'Card')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              {isRtl ? 'لا يوجد عناصر' : 'No items added'}
            </div>
          ) : (
            cart.map(item => (
              <div key={item.menuItem._id} className="flex gap-3 items-center">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {isRtl ? (item.menuItem.nameAr || item.menuItem.nameEn) : item.menuItem.nameEn}
                  </div>
                  <div className="text-sm text-gray-500">
                    SAR {item.unitPrice.toFixed(2)}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-dark-700 rounded-lg p-1">
                  <button 
                    onClick={() => updateQuantity(item.menuItem._id, -1)}
                    className="p-1 hover:bg-white dark:hover:bg-dark-600 rounded text-gray-600 dark:text-gray-300"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.menuItem._id, 1)}
                    className="p-1 hover:bg-white dark:hover:bg-dark-600 rounded text-gray-600 dark:text-gray-300"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="text-right min-w-[4rem] font-bold text-gray-900 dark:text-white">
                  {(item.unitPrice * item.quantity).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-dark-900/50 rounded-b-2xl border-t border-gray-100 dark:border-dark-700 space-y-3">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{isRtl ? 'المجموع الفرعي' : 'Subtotal'}</span>
            <span>SAR {cartSubtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{isRtl ? 'الضريبة' : 'Tax'}</span>
            <span>SAR {cartTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-dark-600">
            <span>{isRtl ? 'الإجمالي' : 'Total'}</span>
            <span>SAR {cartTotal.toFixed(2)}</span>
          </div>
          
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className="w-full mt-4 bg-amber-600 hover:bg-amber-700 text-white py-3 px-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (isRtl ? 'جاري المعالجة...' : 'Processing...') : (
              <>
                <CreditCard className="w-5 h-5" />
                {isRtl ? 'إصدار الفاتورة' : 'Checkout & Print'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Print Modal */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 print:bg-white print:static print:inset-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-[400px] max-h-[90vh] overflow-y-auto print:shadow-none print:p-0 print:w-auto print:max-h-none print:overflow-visible">
            <div className="flex justify-between items-center mb-4 print:hidden">
              <h3 className="text-lg font-bold">{isRtl ? 'إيصال الطلب' : 'Order Receipt'}</h3>
              <button onClick={handleCloseReceipt} className="text-gray-500 hover:text-gray-700">
                <Minus className="w-5 h-5" />
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-2 print:border-none print:p-0 flex justify-center">
              <ThermalReceipt ref={receiptRef} order={completedOrder} type="restaurant" />
            </div>

            <div className="mt-6 flex gap-3 print:hidden">
              <button onClick={handleCloseReceipt} className="btn btn-secondary flex-1">
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
              <button onClick={handlePrint} className="btn btn-primary flex-1">
                {isRtl ? 'طباعة' : 'Print Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
