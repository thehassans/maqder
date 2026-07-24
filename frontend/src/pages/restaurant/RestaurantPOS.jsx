import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Trash2, ShoppingBag, CreditCard, Search, Coffee, Truck, UtensilsCrossed, Gift } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import api, { getImageUrl } from '../../lib/api'
import { toast } from 'react-hot-toast'
import ThermalReceipt from '../../components/ui/ThermalReceipt'
import KitchenTicket from '../../components/restaurant/KitchenTicket'
import OrderReceipt from '../../components/restaurant/OrderReceipt'
import CardPaymentModal from '../../components/pos/CardPaymentModal'

export default function RestaurantPOS() {
  const { language } = useSelector(state => state.ui)
  const { tenant } = useSelector(state => state.auth)
  const isRtl = language === 'ar'
  const cardTerminalEnabled = Boolean(tenant?.settings?.posTerminal?.enabled)
  const terminalLabel = tenant?.settings?.posTerminal?.terminalLabel || ''

  const [searchParams] = useSearchParams()
  const editOrderId = searchParams.get('orderId')
  const [editingOrder, setEditingOrder] = useState(null)

  const [menuItems, setMenuItems] = useState([])
  const [combos, setCombos] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const [cart, setCart] = useState([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [orderType, setOrderType] = useState('dine_in') // dine_in, takeaway, delivery
  const [selectedTable, setSelectedTable] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [applyVat, setApplyVat] = useState(true)
  
  // Checkout states
  const [isProcessing, setIsProcessing] = useState(false)
  const [completedOrder, setCompletedOrder] = useState(null)
  const [receiptType, setReceiptType] = useState('customer') // 'customer' or 'kitchen'
  const [showCardModal, setShowCardModal] = useState(false)
  const receiptRef = useRef(null)
  const kitchenRef = useRef(null)

  // Half plate modal state
  const [selectedHalfPlateItem, setSelectedHalfPlateItem] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [menuRes, tablesRes, combosRes] = await Promise.all([
        api.get('/restaurant/menu-items?limit=200'),
        api.get('/restaurant/tables?status=available'),
        tenant?.subscription?.hasCombosAddon ? api.get('/restaurant/combos?isActive=true') : Promise.resolve({ data: { combos: [] } })
      ])
      const loadedMenuItems = menuRes.data.items || []
      setMenuItems(loadedMenuItems)
      setCombos(combosRes.data.combos || [])
      setTables(tablesRes.data || [])

      if (editOrderId) {
        try {
          const orderRes = await api.get(`/restaurant/orders/${editOrderId}`)
          const order = orderRes.data
          if (order) {
            setEditingOrder(order)
            setCustomerName(order.customerName || '')
            setCustomerPhone(order.customerPhone || '')
            setOrderType(order.orderType || 'dine_in')
            if (order.tableId) setSelectedTable(order.tableId)
            if (order.paymentMethod) setPaymentMethod(order.paymentMethod)
            
            // Reconstruct cart
            const reconstructedCart = (order.lineItems || []).map(li => {
              const mItem = loadedMenuItems.find(m => String(m._id) === String(li.menuItemId)) || { _id: li.menuItemId }
              const isHalfPlate = li.nameEn?.includes('Half Plate') || li.name?.includes('Half Plate')
              return {
                cartItemId: `${li.menuItemId}-${isHalfPlate ? 'half' : 'full'}`,
                menuItem: mItem,
                isHalfPlate,
                quantity: li.quantity,
                unitPrice: li.unitPrice,
                taxRate: li.taxRate,
                nameEn: li.name || li.nameEn,
                nameAr: li.nameAr || li.name,
                isCombo: li.isCombo,
                comboId: li.comboId,
              }
            })
            setCart(reconstructedCart)
          }
        } catch (err) {
          toast.error('Failed to load existing order')
        }
      }
    } catch (error) {
      toast.error('Failed to load POS data')
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', ...new Set(menuItems.map(m => m.category).filter(Boolean))]
  if (tenant?.subscription?.hasCombosAddon && combos.length > 0) {
    categories.push('combos')
  }

  const filteredItems = menuItems.filter(m => {
    const matchesSearch = (m.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) || m.nameAr?.includes(searchQuery))
    const matchesCat = activeCategory === 'all' || m.category === activeCategory
    return matchesSearch && matchesCat
  })
  
  const displayCombos = (tenant?.subscription?.hasCombosAddon && (activeCategory === 'all' || activeCategory === 'combos'))
    ? combos.filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.nameAr?.includes(searchQuery))
    : []

  const handleItemClick = (menuItem) => {
    if (menuItem.hasHalfPlate) {
      setSelectedHalfPlateItem(menuItem)
    } else {
      addToCart(menuItem, false)
    }
  }

  const addToCart = (menuItem, isHalfPlate) => {
    const price = isHalfPlate ? menuItem.halfPlatePrice : menuItem.sellingPrice
    const nameSuffixEn = isHalfPlate ? ' (Half Plate)' : ''
    const nameSuffixAr = isHalfPlate ? ' (نصف)' : ''
    
    // Unique ID combining item ID and plate type
    const cartItemId = `${menuItem._id}-${isHalfPlate ? 'half' : 'full'}`

    setCart(prev => {
      const existing = prev.find(item => item.cartItemId === cartItemId)
      if (existing) {
        return prev.map(item => 
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { 
        cartItemId,
        menuItem, 
        isHalfPlate,
        quantity: 1, 
        unitPrice: price || 0, 
        taxRate: menuItem.taxRate || 15,
        nameEn: `${menuItem.nameEn}${nameSuffixEn}`,
        nameAr: `${menuItem.nameAr || menuItem.nameEn}${nameSuffixAr}`
      }]
    })
    
    setSelectedHalfPlateItem(null)
  }

  const addComboToCart = (combo) => {
    const cartItemId = `combo-${combo._id}`
    setCart(prev => {
      const existing = prev.find(item => item.cartItemId === cartItemId)
      if (existing) {
        return prev.map(item => 
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { 
        cartItemId,
        menuItem: { _id: combo._id }, 
        isCombo: true,
        comboId: combo._id,
        quantity: 1, 
        unitPrice: combo.comboPrice || 0, 
        taxRate: 15,
        nameEn: `${combo.name} (Combo)`,
        nameAr: `${combo.nameAr || combo.name} (عرض)`
      }]
    })
  }

  const updateQuantity = (cartItemId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQ = Math.max(0, item.quantity + delta)
        return { ...item, quantity: newQ }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const clearCart = () => {
    setCart([])
    setCustomerName('')
    setCustomerPhone('')
    setSelectedTable('')
  }

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const cartTax = applyVat ? cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.taxRate / 100)), 0) : 0
  const cartTotal = cartSubtotal + cartTax

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Cart is empty')
    // Route card payments through the physical terminal when configured.
    if (paymentMethod === 'card' && cardTerminalEnabled) {
      setShowCardModal(true)
      return
    }

    await submitOrder()
  }

  const submitOrder = async (targetStatus = 'paid') => {
    setIsProcessing(true)
    try {
      const payload = {
        status: targetStatus,
        kitchenStatus: 'new', // Send to kitchen
        orderType,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        paymentMethod: targetStatus === 'paid' ? paymentMethod : undefined,
        lineItems: cart.map(item => ({
          menuItemId: item.menuItem._id,
          name: item.nameEn,
          nameAr: item.nameAr,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: applyVat ? item.taxRate : 0,
          isCombo: item.isCombo,
          comboId: item.comboId,
        }))
      }
      
      if (orderType === 'dine_in') {
        const table = tables.find(t => t._id === selectedTable)
        if (table) {
          payload.tableId = table._id
          payload.tableNumber = table.tableNumber
        }
      }
      
      let data;
      if (editOrderId) {
        const res = await api.put(`/restaurant/orders/${editOrderId}`, payload)
        data = res.data
        toast.success(isRtl ? `تم تحديث الطلب: ${data.orderNumber}` : `Order updated: ${data.orderNumber}`)
      } else {
        const res = await api.post('/restaurant/orders', payload)
        data = res.data
        toast.success(isRtl ? `تم إنشاء الطلب: ${data.orderNumber}` : `Order created: ${data.orderNumber}`)
      }
      
      setReceiptType('customer')
      setCompletedOrder(data)

      // Auto-print customer receipt + kitchen ticket
      setTimeout(() => {
        // Print customer receipt first
        if (receiptRef.current) window.print()
      }, 500)

      // Refresh tables if dine in to update status
      if (orderType === 'dine_in') {
        fetchData()
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Checkout failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSendToKitchen = async () => {
    if (cart.length === 0) return toast.error('Cart is empty')
    setIsProcessing(true)
    try {
      const payload = {
        status: 'open',
        kitchenStatus: 'new', // Send to kitchen
        orderType,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        lineItems: cart.map(item => ({
          menuItemId: item.menuItem._id,
          name: item.nameEn,
          nameAr: item.nameAr,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: applyVat ? item.taxRate : 0,
          isCombo: item.isCombo,
          comboId: item.comboId,
        }))
      }
      if (orderType === 'dine_in') {
        const table = tables.find(t => t._id === selectedTable)
        if (table) { payload.tableId = table._id; payload.tableNumber = table.tableNumber }
      }
      
      let data;
      if (editOrderId) {
        const res = await api.put(`/restaurant/orders/${editOrderId}`, payload)
        data = res.data
        toast.success(isRtl ? `تم التحديث للمطبخ: ${data.orderNumber}` : `Updated to kitchen: ${data.orderNumber}`)
      } else {
        const res = await api.post('/restaurant/orders', payload)
        data = res.data
        toast.success(isRtl ? `تم الإرسال للمطبخ: ${data.orderNumber}` : `Sent to kitchen: ${data.orderNumber}`)
      }
      
      setReceiptType('kitchen')
      setCompletedOrder(data)

      // Auto-print kitchen ticket first, then customer receipt
      setTimeout(() => {
        if (kitchenRef.current) window.print()
        // After kitchen print, switch to customer receipt and print
        setTimeout(() => {
          setReceiptType('customer')
          setTimeout(() => {
            if (receiptRef.current) window.print()
          }, 300)
        }, 800)
      }, 500)

      if (orderType === 'dine_in') fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Kitchen dispatch failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCardApproved = async (posPayment) => {
    setShowCardModal(false)
    // Submit the restaurant order with card payment
    setIsProcessing(true)
    try {
      const payload = {
        status: 'paid',
        kitchenStatus: 'new',
        orderType,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        paymentMethod: 'card',
        lineItems: cart.map(item => ({
          menuItemId: item.menuItem._id,
          name: item.nameEn,
          nameAr: item.nameAr,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: applyVat ? item.taxRate : 0,
          isCombo: item.isCombo,
          comboId: item.comboId,
        }))
      }
      if (orderType === 'dine_in') {
        const table = tables.find(t => t._id === selectedTable)
        if (table) { payload.tableId = table._id; payload.tableNumber = table.tableNumber }
      }
      
      let data;
      if (editOrderId) {
        const res = await api.put(`/restaurant/orders/${editOrderId}`, payload)
        data = res.data
      } else {
        const res = await api.post('/restaurant/orders', payload)
        data = res.data
      }

      // Best-effort PATCH to record the POS payment
      try {
        await api.patch(`/restaurant/orders/${data._id}/payment`, {
          paymentMethod: 'card',
          posPaymentId: posPayment._id,
          status: 'paid',
        })
      } catch {
        // ignore
      }
      
      if (editOrderId) {
        toast.success(isRtl ? `تم تحديث الطلب: ${data.orderNumber}` : `Order updated: ${data.orderNumber}`)
      } else {
        toast.success(isRtl ? `تم إنشاء الطلب: ${data.orderNumber}` : `Order created: ${data.orderNumber}`)
      }
      
      setReceiptType('customer')
      setCompletedOrder(data)
      if (orderType === 'dine_in') fetchData()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Checkout failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePrint = () => {
    const activeRef = receiptType === 'kitchen' ? kitchenRef : receiptRef
    if (activeRef.current) {
      window.print()
    }
  }

  const handleCloseReceipt = () => {
    setCompletedOrder(null)
    clearCart()
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-7rem)] min-h-0 max-h-full gap-4 lg:gap-6 overflow-hidden">
      
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
              {displayCombos.map(combo => (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={`combo-${combo._id}`}
                  onClick={() => addComboToCart(combo)}
                  className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-transparent hover:border-pink-500 text-left flex flex-col relative overflow-hidden group"
                >
                  <div className="h-36 w-full bg-gradient-to-br from-pink-500/10 to-purple-500/10 relative overflow-hidden p-3 flex items-center justify-center">
                    <div className="w-full h-full flex items-center justify-center text-pink-500">
                      <Gift className="w-12 h-12 drop-shadow-sm group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    {combo.badgeText && (
                      <div className="absolute top-2 left-2 bg-pink-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {combo.badgeText}
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <div className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
                      {isRtl ? (combo.nameAr || combo.name) : combo.name}
                    </div>
                    <div className="text-sm font-bold text-pink-600">
                      SAR {(combo.comboPrice || 0).toFixed(2)}
                    </div>
                  </div>
                </motion.button>
              ))}
              {filteredItems.map(item => (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={item._id}
                  onClick={() => handleItemClick(item)}
                  className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-transparent hover:border-amber-500 text-left flex flex-col relative overflow-hidden group"
                >
                  <div className="h-36 w-full bg-gradient-to-b from-gray-50 to-gray-100/50 dark:from-dark-700 dark:to-dark-800 relative overflow-hidden p-3 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={getImageUrl(item.imageUrl)} alt="" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-md" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <UtensilsCrossed className="w-10 h-10 opacity-30" />
                      </div>
                    )}
                    {item.hasHalfPlate && (
                      <div className="absolute top-2 left-2 bg-indigo-600/90 text-white text-[10px] px-2 py-0.5 rounded-full font-bold backdrop-blur-md">
                        {isRtl ? 'نصف و كامل' : 'Half/Full'}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 flex-1 flex flex-col">
                    <div className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
                      {isRtl ? (item.nameAr || item.nameEn) : item.nameEn}
                    </div>
                    <div className="text-sm font-bold text-amber-600">
                      SAR {(item.sellingPrice || 0).toFixed(2)}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart Sidebar */}
      <div className="w-full lg:w-96 bg-white dark:bg-dark-800 rounded-2xl shadow-sm flex flex-col flex-shrink-0 min-h-0 h-full border border-gray-100 dark:border-dark-700">
        
        {/* Order Type Selector */}
        <div className="p-3 border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-900/40 rounded-t-2xl">
          <div className="flex gap-2">
            <button
              onClick={() => setOrderType('dine_in')}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-colors ${
                orderType === 'dine_in'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white dark:bg-dark-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700'
              }`}
            >
              <UtensilsCrossed className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold uppercase">{isRtl ? 'محلي' : 'Dine In'}</span>
            </button>
            <button
              onClick={() => setOrderType('takeaway')}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-colors ${
                orderType === 'takeaway'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white dark:bg-dark-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700'
              }`}
            >
              <Coffee className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold uppercase">{isRtl ? 'سفري' : 'Takeaway'}</span>
            </button>
            <button
              onClick={() => setOrderType('delivery')}
              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-colors ${
                orderType === 'delivery'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white dark:bg-dark-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700'
              }`}
            >
              <Truck className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold uppercase">{isRtl ? 'توصيل' : 'Delivery'}</span>
            </button>
          </div>
        </div>

        {/* Customer & Table Inputs */}
        <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-dark-700 space-y-3 flex-shrink-0">
          {orderType === 'dine_in' && (
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-amber-500 font-semibold text-gray-700 dark:text-gray-300"
            >
              <option value="">{isRtl ? 'اختر الطاولة...' : 'Select Table...'}</option>
              {tables.map(t => (
                <option key={t._id} value={t._id}>
                  {isRtl ? 'طاولة' : 'Table'} {t.tableNumber} ({t.seats} {isRtl ? 'مقاعد' : 'seats'})
                </option>
              ))}
            </select>
          )}

          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder={isRtl ? 'اسم العميل (اختياري)' : 'Customer Name'} 
              className="w-full bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-amber-500"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
            {(orderType === 'delivery' || orderType === 'takeaway') && (
              <input 
                type="text" 
                placeholder={isRtl ? 'رقم الهاتف' : 'Phone'} 
                className="w-full bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-amber-500"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="text-center text-gray-500 py-10 flex flex-col items-center">
              <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
              {isRtl ? 'الطلب فارغ' : 'Order is empty'}
            </div>
          ) : (
            cart.map(item => (
              <div key={item.cartItemId} className="flex gap-3 items-center border-b border-gray-50 dark:border-dark-700/50 pb-3 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                    {isRtl ? item.nameAr : item.nameEn}
                  </div>
                  <div className="text-xs text-amber-600 font-bold mt-0.5">
                    SAR {item.unitPrice.toFixed(2)}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
                  <button 
                    onClick={() => updateQuantity(item.cartItemId, -1)}
                    className="p-1 hover:bg-white dark:hover:bg-dark-600 rounded text-gray-600 dark:text-gray-300"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.cartItemId, 1)}
                    className="p-1 hover:bg-white dark:hover:bg-dark-600 rounded text-gray-600 dark:text-gray-300"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                
                <div className="text-right min-w-[3.5rem] font-bold text-gray-900 dark:text-white text-sm">
                  {(item.unitPrice * item.quantity).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Checkout */}
        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-dark-900/50 rounded-b-2xl border-t border-gray-100 dark:border-dark-700 space-y-3 flex-shrink-0">
          
          <div className="flex gap-2 mb-2 sm:mb-4">
            {['cash', 'card'].map(pm => (
              <button
                key={pm}
                onClick={() => setPaymentMethod(pm)}
                className={`flex-1 py-2 rounded-xl border text-sm font-bold transition-colors ${
                  paymentMethod === pm
                    ? 'border-amber-500 bg-amber-500 text-white'
                    : 'border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-600 dark:text-gray-400 hover:border-amber-300'
                }`}
              >
                {pm === 'cash' ? (isRtl ? 'نقداً' : 'Cash') : (isRtl ? 'بطاقة' : 'Card')}
              </button>
            ))}
          </div>

          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{isRtl ? 'المجموع الفرعي' : 'Subtotal'}</span>
            <span>SAR {cartSubtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 items-center">
            <div className="flex items-center gap-2">
              <span>{isRtl ? 'الضريبة' : 'VAT'}</span>
              <button
                onClick={() => setApplyVat(!applyVat)}
                className={`text-xs px-2 py-0.5 rounded border ${applyVat ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:border-amber-500/30' : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-dark-700'}`}
              >
                {applyVat ? '15%' : '0%'}
              </button>
            </div>
            <span>SAR {cartTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-black text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-dark-600">
            <span>{isRtl ? 'الإجمالي' : 'Total'}</span>
            <span>SAR {cartTotal.toFixed(2)}</span>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSendToKitchen}
              disabled={cart.length === 0 || isProcessing}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 px-2 rounded-xl font-bold text-sm lg:text-base transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isProcessing ? (isRtl ? '...' : '...') : (
                <>
                  <UtensilsCrossed className="w-5 h-5 hidden sm:block" />
                  {isRtl ? 'للمطبخ' : 'To Kitchen'}
                </>
              )}
            </button>
            
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3.5 px-2 rounded-xl font-bold text-sm lg:text-base transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isProcessing ? (isRtl ? '...' : '...') : (
                <>
                  <CreditCard className="w-5 h-5 hidden sm:block" />
                  {isRtl ? 'دفع' : 'Pay'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Half Plate Selector Modal */}
      <AnimatePresence>
        {selectedHalfPlateItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 dark:border-dark-700 bg-amber-50 dark:bg-amber-900/20">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white text-center">
                  {isRtl ? (selectedHalfPlateItem.nameAr || selectedHalfPlateItem.nameEn) : selectedHalfPlateItem.nameEn}
                </h3>
                <p className="text-sm text-center text-amber-700 dark:text-amber-500 mt-1">
                  {isRtl ? 'اختر حجم الحصة' : 'Select Portion Size'}
                </p>
              </div>
              <div className="p-4 flex gap-4">
                <button
                  onClick={() => addToCart(selectedHalfPlateItem, true)}
                  className="flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50 dark:border-dark-600 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/20 transition-all group"
                >
                  <div className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 mb-1">
                    {isRtl ? 'نصف حصة' : 'Half Plate'}
                  </div>
                  <div className="text-sm font-semibold text-gray-500 group-hover:text-indigo-500">
                    SAR {(selectedHalfPlateItem.halfPlatePrice || 0).toFixed(2)}
                  </div>
                </button>
                <button
                  onClick={() => addToCart(selectedHalfPlateItem, false)}
                  className="flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 border-amber-100 hover:border-amber-500 hover:bg-amber-50 dark:border-dark-600 dark:hover:border-amber-500 dark:hover:bg-amber-900/20 transition-all group"
                >
                  <div className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-amber-600 mb-1">
                    {isRtl ? 'حصة كاملة' : 'Full Plate'}
                  </div>
                  <div className="text-sm font-semibold text-gray-500 group-hover:text-amber-500">
                    SAR {(selectedHalfPlateItem.sellingPrice || 0).toFixed(2)}
                  </div>
                </button>
              </div>
              <div className="p-3 border-t border-gray-100 dark:border-dark-700">
                <button 
                  onClick={() => setSelectedHalfPlateItem(null)}
                  className="w-full py-2 rounded-xl text-gray-600 font-semibold hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700 transition-colors"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Modal */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 print:bg-white print:static print:inset-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-[400px] max-h-[90vh] overflow-y-auto print:shadow-none print:p-0 print:w-auto print:max-h-none print:overflow-visible">
            <div className="flex justify-between items-center mb-4 print:hidden">
              <h3 className="text-lg font-bold">{isRtl ? 'إيصال الطلب' : 'Order Receipt'}</h3>
              <button onClick={handleCloseReceipt} className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-1">
                <Minus className="w-5 h-5" />
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-2 print:border-none print:p-0 flex justify-center">
              {receiptType === 'kitchen' ? (
                <KitchenTicket ref={kitchenRef} order={completedOrder} isUpdated={!!editOrderId} />
              ) : (
                <OrderReceipt ref={receiptRef} order={completedOrder} isUpdated={!!editOrderId} />
              )}
            </div>

            <div className="mt-6 flex gap-3 print:hidden">
              <button onClick={handleCloseReceipt} className="flex-1 py-3 rounded-xl border border-gray-200 font-bold hover:bg-gray-50 dark:border-dark-600 dark:hover:bg-dark-700">
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
              {receiptType === 'customer' && (
                <button
                  onClick={() => { setReceiptType('kitchen'); setTimeout(() => window.print(), 300) }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 font-bold hover:bg-gray-50 dark:border-dark-600 dark:hover:bg-dark-700"
                >
                  {isRtl ? 'طباعة للمطبخ' : 'Print Kitchen'}
                </button>
              )}
              {receiptType === 'kitchen' && (
                <button
                  onClick={() => { setReceiptType('customer'); setTimeout(() => window.print(), 300) }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 font-bold hover:bg-gray-50 dark:border-dark-600 dark:hover:bg-dark-700"
                >
                  {isRtl ? 'طباعة الفاتورة' : 'Print Receipt'}
                </button>
              )}
              <button onClick={handlePrint} className="flex-1 py-3 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700">
                {isRtl ? 'طباعة' : 'Print'}
              </button>
            </div>
          </div>
        </div>
      )}

      <CardPaymentModal
        open={showCardModal}
        amount={cartTotal}
        currency="SAR"
        source="restaurant"
        orderType="restaurant"
        orderNumber={''}
        terminalLabel={terminalLabel}
        onApproved={handleCardApproved}
        onDeclined={() => setShowCardModal(false)}
        onFailed={() => setShowCardModal(false)}
        onExpired={() => setShowCardModal(false)}
        onClose={() => setShowCardModal(false)}
      />
    </div>
  )
}
