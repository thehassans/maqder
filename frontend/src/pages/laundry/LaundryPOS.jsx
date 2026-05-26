import { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { Plus, Minus, Trash2, ShoppingBag, CreditCard, Search, User, Phone, X, Zap } from 'lucide-react'
import api from '../../lib/api'
import { addItem, updateItemQuantity, removeItem, clearCart, setIsUrgent, setUrgentPrice, setCustomerName, setCustomerPhone } from '../../store/slices/laundryCartSlice'
import { toast } from 'react-hot-toast'
import ThermalReceipt from '../../components/ui/ThermalReceipt'

export default function LaundryPOS() {
  const dispatch = useDispatch()
  const { language } = useSelector(state => state.ui)
  const cart = useSelector(state => state.laundryCart)
  const isRtl = language === 'ar'

  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Customization Modal states
  const [selectedService, setSelectedService] = useState(null)
  const [selectedTreatment, setSelectedTreatment] = useState('')
  const [selectedCustomizations, setSelectedCustomizations] = useState([])
  const [itemQuantity, setItemQuantity] = useState(1)

  // Checkout states
  const [isProcessing, setIsProcessing] = useState(false)
  const [completedOrder, setCompletedOrder] = useState(null)
  const receiptRef = useRef(null)

  const ALL_CUSTOMIZATIONS = [
    { id: 'folded', labelEn: 'Folded', labelAr: 'مطوي' },
    { id: 'hanger', labelEn: 'On Hanger', labelAr: 'على الشماعة' },
    { id: 'starch', labelEn: 'Starch', labelAr: 'نشاء' },
    { id: 'perfume', labelEn: 'Perfume', labelAr: 'تعطير' },
    { id: 'no_crease', labelEn: 'No Crease', labelAr: 'بدون كسرة' }
  ]

  const handlePrint = () => {
    if (receiptRef.current) {
      window.print()
    }
  }

  const handleCloseReceipt = () => {
    setCompletedOrder(null)
    dispatch(clearCart())
  }
  
  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const { data } = await api.get('/laundry/services?isActive=true')
      setServices(data)
    } catch (error) {
      toast.error('Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  const filteredServices = services.filter(s => 
    (s.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     s.nameAr?.includes(searchQuery))
  )

  const openCustomizationModal = (service) => {
    setSelectedService(service)
    setSelectedTreatment(service.treatments?.[0] || 'Wash & Fold')
    setSelectedCustomizations([])
    setItemQuantity(1)
  }

  const handleAddToCart = () => {
    dispatch(addItem({
      service: selectedService,
      quantity: itemQuantity,
      treatment: selectedTreatment,
      customizations: selectedCustomizations
    }))
    setSelectedService(null)
  }

  const toggleCustomization = (id) => {
    if (selectedCustomizations.includes(id)) {
      setSelectedCustomizations(selectedCustomizations.filter(c => c !== id))
    } else {
      setSelectedCustomizations([...selectedCustomizations, id])
    }
  }

  const handleCheckout = async () => {
    if (cart.items.length === 0) return toast.error('Cart is empty')
    
    setIsProcessing(true)
    try {
      const payload = {
        customer: cart.customer?._id,
        customerName: cart.customerName || (cart.customer ? cart.customer.fullName : undefined),
        customerPhone: cart.customerPhone || (cart.customer ? cart.customer.mobile : undefined),
        items: cart.items.map(item => ({
          service: item.service._id,
          nameEn: item.nameEn,
          nameAr: item.nameAr,
          billingType: item.billingType,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.service.taxRate,
          subtotal: item.subtotal,
          taxAmount: item.taxAmount,
          total: item.total,
          treatment: item.treatment,
          customizations: item.customizations
        })),
        isUrgent: cart.isUrgent,
        deliveryType: cart.deliveryType,
        notes: cart.notes,
        subtotal: cart.items.reduce((s, i) => s + i.subtotal, 0),
        totalVat: cart.items.reduce((s, i) => s + i.taxAmount, 0),
        urgentFee: cart.isUrgent ? cart.urgentPrice : 0,
        grandTotal: cart.items.reduce((s, i) => s + i.total, 0) + (cart.isUrgent ? cart.urgentPrice : 0),
        amountPaid: cart.items.reduce((s, i) => s + i.total, 0) + (cart.isUrgent ? cart.urgentPrice : 0), 
      }
      
      const { data } = await api.post('/laundry/orders/checkout', payload)
      toast.success(isRtl ? `تم إنشاء الطلب: ${data.orderNumber}` : `Order created: ${data.orderNumber}`)
      setCompletedOrder(data)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Checkout failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-6rem)] gap-6">
      
      {/* Left: Service Grid */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4 relative">
          <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 ${isRtl ? 'right-4' : 'left-4'}`} />
          <input
            type="text"
            placeholder={isRtl ? "البحث عن خدمة..." : "Search services..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full bg-white dark:bg-dark-800 border-none rounded-2xl shadow-sm py-3 focus:ring-2 focus:ring-teal-500 ${isRtl ? 'pr-12' : 'pl-12'}`}
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">Loading...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredServices.map(service => (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={service._id}
                  onClick={() => openCustomizationModal(service)}
                  className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-transparent hover:border-teal-500 text-left flex flex-col overflow-hidden group"
                >
                  <div className="h-32 w-full bg-gray-100 dark:bg-dark-700 relative">
                    {service.imageUrl ? (
                      <img src={service.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {service.category.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col">
                    <div className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
                      {isRtl ? service.nameAr : service.nameEn}
                    </div>
                    <div className="text-sm text-teal-600 font-bold mb-2">
                      SAR {service.basePrice.toFixed(2)} / {service.billingType === 'per_kg' ? 'KG' : 'PC'}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart Sidebar */}
      <div className="w-full lg:w-96 bg-white dark:bg-dark-800 rounded-2xl shadow-sm flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100 dark:border-dark-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-teal-600" />
            {isRtl ? 'سلة الطلبات' : 'Current Order'}
          </h2>
        </div>

        {/* Customer Quick Inputs */}
        <div className="p-4 border-b border-gray-100 dark:border-dark-700 space-y-3 bg-gray-50 dark:bg-dark-900/30">
          <div className="relative">
            <User className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              placeholder={isRtl ? "اسم العميل" : "Customer Name"}
              value={cart.customerName}
              onChange={(e) => dispatch(setCustomerName(e.target.value))}
              className={`w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-xl py-2 text-sm focus:ring-2 focus:ring-teal-500 ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
            />
          </div>
          <div className="relative">
            <Phone className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              placeholder={isRtl ? "رقم الهاتف" : "Phone Number"}
              value={cart.customerPhone}
              onChange={(e) => dispatch(setCustomerPhone(e.target.value))}
              className={`w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-xl py-2 text-sm focus:ring-2 focus:ring-teal-500 ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
            />
          </div>
        </div>

        {/* Order Urgency Toggle */}
        <div className="p-4 border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-900/30">
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Zap className={`w-5 h-5 ${cart.isUrgent ? 'text-amber-500' : 'text-gray-400'}`} />
              <span className={`font-semibold ${cart.isUrgent ? 'text-amber-600 dark:text-amber-500' : 'text-gray-600 dark:text-gray-300'}`}>
                {isRtl ? 'طلب عاجل' : 'Urgent Order'}
              </span>
            </label>
            <input 
              type="checkbox" 
              className="toggle toggle-warning" 
              checked={cart.isUrgent} 
              onChange={(e) => dispatch(setIsUrgent(e.target.checked))} 
            />
          </div>
          
          {cart.isUrgent && (
            <div className="flex items-center justify-between gap-3 mt-3 animate-in fade-in slide-in-from-top-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {isRtl ? 'رسوم العاجل:' : 'Urgent Fee:'}
              </span>
              <div className="relative w-32">
                <span className={`absolute top-1/2 -translate-y-1/2 text-gray-500 text-sm ${isRtl ? 'right-3' : 'left-3'}`}>SAR</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cart.urgentPrice}
                  onChange={(e) => dispatch(setUrgentPrice(e.target.value))}
                  className={`w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-lg py-1.5 text-sm focus:ring-2 focus:ring-amber-500 font-bold ${isRtl ? 'pr-12 pl-2' : 'pl-12 pr-2'}`}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {cart.items.length === 0 ? (
            <div className="text-center text-gray-500 py-10 flex flex-col items-center">
              <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
              {isRtl ? 'السلة فارغة' : 'Cart is empty'}
            </div>
          ) : (
            cart.items.map(item => (
              <div key={item.cartItemId} className="flex gap-3 items-start border-b border-gray-100 dark:border-dark-700 pb-3 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {isRtl ? item.nameAr : item.nameEn}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.treatment} {item.customizations?.length > 0 && `• ${item.customizations.join(', ')}`}
                  </div>
                  <div className="text-sm text-teal-600 font-medium mt-1">
                    SAR {item.unitPrice.toFixed(2)} x {item.quantity}
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right min-w-[4rem] font-bold text-gray-900 dark:text-white">
                    {item.total.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
                    <button 
                      onClick={() => dispatch(updateItemQuantity({ cartItemId: item.cartItemId, quantity: item.quantity - 1 }))}
                      className="p-1 hover:bg-white dark:hover:bg-dark-600 rounded text-gray-600 dark:text-gray-300"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-4 text-center text-xs font-medium">{item.quantity}</span>
                    <button 
                      onClick={() => dispatch(updateItemQuantity({ cartItemId: item.cartItemId, quantity: item.quantity + 1 }))}
                      className="p-1 hover:bg-white dark:hover:bg-dark-600 rounded text-gray-600 dark:text-gray-300"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-dark-900/50 rounded-b-2xl border-t border-gray-100 dark:border-dark-700 space-y-3">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{isRtl ? 'المجموع الفرعي' : 'Subtotal'}</span>
            <span>SAR {cart.items.reduce((s, i) => s + i.subtotal, 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{isRtl ? 'ضريبة القيمة المضافة' : 'VAT (15%)'}</span>
            <span>SAR {cart.items.reduce((s, i) => s + i.taxAmount, 0).toFixed(2)}</span>
          </div>
          {cart.isUrgent && (
            <div className="flex justify-between text-sm text-amber-600 dark:text-amber-500 font-medium">
              <span>{isRtl ? 'رسوم العاجل' : 'Urgent Fee'}</span>
              <span>SAR {cart.urgentPrice.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-dark-600">
            <span>{isRtl ? 'الإجمالي' : 'Total'}</span>
            <span>SAR {(cart.items.reduce((s, i) => s + i.total, 0) + (cart.isUrgent ? cart.urgentPrice : 0)).toFixed(2)}</span>
          </div>
          
          <button
            onClick={handleCheckout}
            disabled={cart.items.length === 0 || isProcessing}
            className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (isRtl ? 'جاري المعالجة...' : 'Processing...') : (
              <>
                <CreditCard className="w-5 h-5" />
                {isRtl ? 'الدفع' : 'Checkout'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Item Customization Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-4 border-b border-gray-100 dark:border-dark-700 flex justify-between items-center bg-gray-50 dark:bg-dark-900">
              <h3 className="font-bold text-lg">
                {isRtl ? selectedService.nameAr : selectedService.nameEn}
              </h3>
              <button onClick={() => setSelectedService(null)} className="p-1 hover:bg-gray-200 dark:hover:bg-dark-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-6">
              {/* Treatment Selection */}
              {selectedService.treatments?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    {isRtl ? 'اختر المعالجة' : 'Select Treatment'}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedService.treatments.map(treatment => (
                      <button
                        key={treatment}
                        onClick={() => setSelectedTreatment(treatment)}
                        className={`p-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                          selectedTreatment === treatment 
                            ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400' 
                            : 'border-gray-200 dark:border-dark-700 text-gray-600 hover:border-teal-300'
                        }`}
                      >
                        {treatment}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Customizations */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  {isRtl ? 'التخصيص' : 'Customizations'}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {ALL_CUSTOMIZATIONS.map(opt => {
                    const isSelected = selectedCustomizations.includes(opt.id)
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleCustomization(opt.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          isSelected
                            ? 'border-teal-500 bg-teal-500 text-white'
                            : 'border-gray-300 dark:border-dark-600 text-gray-600 dark:text-gray-300 hover:border-teal-500'
                        }`}
                      >
                        {isRtl ? opt.labelAr : opt.labelEn}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  {isRtl ? 'الكمية' : 'Quantity'}
                </h4>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                    className="p-3 bg-gray-100 dark:bg-dark-700 rounded-xl hover:bg-gray-200"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-xl font-bold w-12 text-center">{itemQuantity}</span>
                  <button 
                    onClick={() => setItemQuantity(itemQuantity + 1)}
                    className="p-3 bg-gray-100 dark:bg-dark-700 rounded-xl hover:bg-gray-200"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-dark-700 flex gap-3">
              <button onClick={() => setSelectedService(null)} className="btn btn-secondary flex-1">
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={handleAddToCart} className="btn btn-primary flex-1 bg-teal-600 hover:bg-teal-700 text-white border-none">
                {isRtl ? 'إضافة للطلب' : 'Add to Order'}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <ThermalReceipt ref={receiptRef} order={completedOrder} type="laundry" />
            </div>

            <div className="mt-6 flex gap-3 print:hidden">
              <button onClick={handleCloseReceipt} className="btn btn-secondary flex-1">
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
              <button onClick={handlePrint} className="btn btn-primary flex-1 bg-teal-600">
                {isRtl ? 'طباعة' : 'Print Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
