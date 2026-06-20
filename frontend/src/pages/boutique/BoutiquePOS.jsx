import { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ShoppingBag,
  Calendar,
  User,
  Phone,
  Printer,
  ChevronRight,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  Clock,
  CheckCircle2,
  ArrowRight,
  Receipt,
  FileDown,
} from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import Money from '../../components/ui/Money'
import InvoiceLivePreview from '../../components/invoices/InvoiceLivePreview'
import { printInvoiceSnapshot, downloadInvoicePdf } from '../../lib/invoicePdf'

/**
 * Boutique POS — Ladies Boutique & Dress Rental
 * Ultra-premium, minimalist POS counter interface for selecting dresses,
 * picking calendar dates, and processing checkout with thermal receipt print.
 */

export default function BoutiquePOS() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const tenant = useSelector((state) => state.auth.tenant)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // ─── UI State ───
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [cart, setCart] = useState([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState(null)
  const [transactionMode, setTransactionMode] = useState('rental') // 'rental' | 'sale'

  // ─── Customer & Dates ───
  const [customerName, setCustomerName] = useState('')
  const [customerNameAr, setCustomerNameAr] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)

  // ─── Product Fetch ───
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['boutique-products', searchQuery, selectedCategory, transactionMode],
    queryFn: () =>
      api
        .get('/boutique/products', {
          params: {
            search: searchQuery || undefined,
            category: selectedCategory || undefined,
            mode: transactionMode,
            isActive: true,
            limit: 100,
          },
        })
        .then((res) => res.data.products || []),
  })

  const products = productsData || []

  // ─── Categories ───
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))]

  // ─── Cart Logic ───
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product._id)
      if (existing) return prev
      return [
        ...prev,
        {
          productId: product._id,
          sku: product.sku,
          name: product.name,
          nameAr: product.nameAr,
          size: product.size,
          color: product.color,
          image: product.primaryImage || product.images?.[0],
          dailyRate: transactionMode === 'sale' ? product.salePrice : product.dailyRate,
          salePrice: product.salePrice,
          rentalRates: product.rentalRates,
          securityDeposit: transactionMode === 'sale' ? 0 : product.securityDeposit,
          quantity: 1,
          rentalDays: 1,
          mode: transactionMode,
        },
      ]
    })
  }

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId))
  }

  const updateCartItem = (productId, field, value) => {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, [field]: value } : item
      )
    )
  }

  // ─── Pricing Logic ───
  const computeItemPrice = (item) => {
    const days = Math.max(1, Number(item.rentalDays) || 1)
    const tiers = (item.rentalRates || []).slice().sort((a, b) => a.days - b.days)
    const exact = tiers.find((t) => t.days === days)
    if (exact) return exact.rate
    const largest = tiers.length > 0 ? tiers[tiers.length - 1] : null
    if (largest && days > largest.days) {
      const daily = item.dailyRate || largest.rate / largest.days
      return largest.rate + (days - largest.days) * daily
    }
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (days >= tiers[i].days) {
        const daily = item.dailyRate || tiers[i].rate / tiers[i].days
        return tiers[i].rate + (days - tiers[i].days) * daily
      }
    }
    return days * (item.dailyRate || 0)
  }

  const cartTotals = (() => {
    const lines = cart.map((item) => {
      const isSaleItem = item.mode === 'sale'
      const rentalSubtotal = isSaleItem ? (item.salePrice || 0) : computeItemPrice(item)
      const deposit = isSaleItem ? 0 : (item.securityDeposit || 0)
      return { ...item, rentalSubtotal, deposit }
    })
    const rentalSubtotal = lines.reduce((s, l) => s + l.rentalSubtotal, 0)
    const totalDeposit = lines.reduce((s, l) => s + l.deposit, 0)
    const totalTax = Math.round(Math.max(0, rentalSubtotal - discountAmount) * 0.15 * 100) / 100
    const grandTotal = Math.round(Math.max(0, rentalSubtotal - discountAmount + totalTax) * 100) / 100
    return { lines, rentalSubtotal, totalDeposit, totalTax, grandTotal, discountAmount }
  })()

  // ─── A4 PDF Print Helper (same template as trading invoices) ───
  const printA4Invoice = async (invoice) => {
    try {
      await printInvoiceSnapshot({ invoice, language, tenant, documentType: 'invoice' })
    } catch (err) {
      console.error('Failed to print A4 invoice', err)
    }
  }

  // ─── A4 PDF Download Helper (same template as trading invoices) ───
  const downloadA4Invoice = async (invoice) => {
    try {
      await downloadInvoicePdf({ invoice, language, tenant, documentType: 'invoice' })
    } catch (err) {
      console.error('Failed to download A4 invoice', err)
      alert(label('Failed to download PDF. Please try again.', 'فشل تحميل ملف PDF. حاول مرة أخرى.'))
    }
  }

  // ─── Checkout Mutation ───
  const checkoutMutation = useMutation({
    mutationFn: (payload) => api.post('/boutique/rentals', payload).then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['boutique-rentals'] })
      setReceiptData(data)
      setShowCheckout(false)
      setShowReceipt(true)
      setCart([])
      // Auto-print A4 PDF after invoice is created
      if (data?.invoice) {
        setTimeout(() => printA4Invoice(data.invoice), 800)
      }
    },
  })

  const handleCheckout = () => {
    const isSale = transactionMode === 'sale'
    if (!customerName || !customerPhone || cart.length === 0) return
    if (!isSale && (!startDate || !endDate)) return
    const payload = {
      customerName,
      customerNameAr,
      customerPhone,
      customerIdNumber: customerId,
      transactionType: transactionMode,
      discount: discountAmount || 0,
      ...(isSale ? {} : { startDate, endDate }),
      lineItems: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        rentalDays: isSale ? 1 : item.rentalDays,
      })),
    }
    checkoutMutation.mutate(payload)
  }

  // ─── Print ───
  const handlePrint = () => {
    if (receiptData?.invoice) {
      printA4Invoice(receiptData.invoice)
    }
  }

  // ─── Helpers ───
  const isArabic = language === 'ar'
  const dir = isArabic ? 'rtl' : 'ltr'
  const label = (en, ar) => (isArabic ? ar : en)

  return (
    <div className="h-full flex flex-col" dir={dir}>
      {/* ─── Header ─── */}
      <div className="flex-none px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className={`w-5 h-5 ${transactionMode === 'sale' ? 'text-emerald-500' : 'text-rose-500'}`} />
              {label('Boutique POS', 'نقاط البيع — بوتيك')}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Mode Toggle — Ultra Premium Pill */}
            <div className="relative inline-flex bg-gray-100/80 backdrop-blur-sm rounded-full p-1 border border-gray-200/60 shadow-inner">
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className={`absolute top-1 bottom-1 rounded-full shadow-sm ${
                  transactionMode === 'sale' ? 'bg-white left-1/2 right-1' : 'bg-white left-1 right-1/2'
                }`}
                style={{ borderRadius: '9999px' }}
              />
              <button
                onClick={() => { setTransactionMode('rental'); setCart([]) }}
                className={`relative z-10 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  transactionMode === 'rental' ? 'text-rose-700' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                {label('Rent', 'إيجار')}
              </button>
              <button
                onClick={() => { setTransactionMode('sale'); setCart([]) }}
                className={`relative z-10 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  transactionMode === 'sale' ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                {label('Sell', 'بيع')}
              </button>
            </div>

            <div className="h-6 w-px bg-gray-200" />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={label('Search dresses...', 'ابحثي عن فستان...')}
                className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm w-64 focus:ring-2 focus:ring-rose-200 focus:border-rose-300 outline-none transition-all"
              />
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setShowCheckout(true)}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                <ShoppingBag className="w-4 h-4" />
                {label('Checkout', 'الدفع')}
                <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs">{cart.length}</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Chips */}
        {categories.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !selectedCategory ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label('All', 'الكل')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Main Content ─── */}
      <div className="flex-1 overflow-hidden flex">
        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              {label('Loading dresses...', 'جاري تحميل الفساتين...')}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Sparkles className="w-12 h-12 mb-3 opacity-30" />
              <p>{label('No dresses found', 'لم يتم العثور على فساتين')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {products.map((product) => (
                <motion.div
                  key={product._id}
                  layoutId={product._id}
                  onClick={() => addToCart(product)}
                  className="group cursor-pointer bg-white rounded-2xl border border-gray-100 hover:border-rose-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden">
                    {product.primaryImage ? (
                      <img
                        src={product.primaryImage}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className="bg-white/90 backdrop-blur text-[10px] font-bold px-2 py-1 rounded-lg text-gray-700 shadow-sm">
                        {product.size}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className={`w-full text-white text-xs font-bold py-2 rounded-xl shadow-lg ${
                        transactionMode === 'sale' ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}>
                        {transactionMode === 'sale'
                          ? label('+ Add to Cart', '+ أضيفي للسلة')
                          : label('+ Add to Rental', '+ أضيفي للإيجار')}
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{isArabic ? product.nameAr || product.name : product.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{product.sku}</p>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${transactionMode === 'sale' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {transactionMode === 'sale'
                            ? `SAR ${product.salePrice || 0}`
                            : product.dailyRate > 0
                            ? `SAR ${product.dailyRate}/${label('day', 'يوم')}`
                            : label('Tiered pricing', 'تسعيرة متدرجة')}
                        </span>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {product.color}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {transactionMode === 'sale'
                          ? `${label('After VAT', 'بعد الضريبة')}: SAR ${Math.round((product.salePrice || 0) * 1.15 * 100) / 100}`
                          : product.dailyRate > 0
                          ? `${label('After VAT', 'بعد الضريبة')}: SAR ${Math.round((product.dailyRate || 0) * 1.15 * 100) / 100}/${label('day', 'يوم')}`
                          : ''}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Sidebar */}
        <div className="w-80 border-l border-gray-100 bg-gray-50/50 flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-white">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className={`w-4 h-4 ${transactionMode === 'sale' ? 'text-emerald-500' : 'text-rose-500'}`} />
              {transactionMode === 'sale' ? label('Shopping Cart', 'سلة التسوق') : label('Rental Cart', 'عربة الإيجار')}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence>
              {cart.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm"
                >
                  <ShoppingBag className="w-8 h-8 mb-2 opacity-30" />
                  {label('Cart is empty', 'العربة فارغة')}
                </motion.div>
              ) : (
                cart.map((item) => (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm"
                  >
                    <div className="flex gap-3">
                      <div className="w-12 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className="text-xs font-semibold text-gray-900 truncate">{isArabic ? item.nameAr || item.name : item.name}</h4>
                          <button
                            onClick={() => removeFromCart(item.productId)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400">{item.sku} · {item.size}</p>

                        {item.mode !== 'sale' && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-gray-500">{label('Days', 'أيام')}:</span>
                            <button
                              onClick={() => updateCartItem(item.productId, 'rentalDays', Math.max(1, item.rentalDays - 1))}
                              className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{item.rentalDays}</span>
                            <button
                              onClick={() => updateCartItem(item.productId, 'rentalDays', item.rentalDays + 1)}
                              className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <div className="flex justify-between mt-2 pt-2 border-t border-gray-50">
                          {item.mode !== 'sale' && (
                            <span className="text-[10px] text-gray-400">
                              {label('Deposit', 'التأمين')}: <Money value={item.securityDeposit || 0} />
                            </span>
                          )}
                          <span className={`text-xs font-bold ${item.mode === 'sale' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            SAR {item.mode === 'sale' ? (item.salePrice || 0).toFixed(2) : computeItemPrice(item).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Cart Footer / Inline Checkout */}
          {cart.length > 0 && (
            <div className="p-4 bg-white border-t border-gray-100">
              {!showCheckout ? (
                /* ── Cart Summary + Proceed ── */
                <div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-gray-500">
                      <span>{transactionMode === 'sale' ? label('Subtotal', 'المجموع الفرعي') : label('Rental Subtotal', 'إجمالي الإيجار')}</span>
                      <Money value={cartTotals.rentalSubtotal} />
                    </div>
                    {transactionMode !== 'sale' && (
                      <div className="flex justify-between text-gray-500">
                        <span>{label('Security Deposit', 'تأمين')}</span>
                        <Money value={cartTotals.totalDeposit} />
                      </div>
                    )}
                    <div className="flex justify-between text-gray-500">
                      <span>{label('VAT (15%)', 'الضريبة 15%')}</span>
                      <Money value={cartTotals.totalTax} />
                    </div>
                    <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-100">
                      <span>{label('Total', 'الإجمالي')}</span>
                      <Money value={cartTotals.grandTotal} />
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCheckout(true)}
                    className={`w-full mt-3 text-white py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                      transactionMode === 'sale' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {label('Proceed to Checkout', 'متابعة الدفع')}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* ── Inline Checkout Form ── */
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {/* Back to Cart */}
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ChevronRight className={`w-3 h-3 ${isArabic ? 'rotate-180' : ''}`} />
                    {label('Back to Cart', 'العودة للسلة')}
                  </button>

                  {/* Customer Info */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      {label('Customer Details', 'بيانات العميل')}
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] text-gray-500 mb-0.5 block">{label('Full Name (EN)', 'الاسم الكامل (إنجليزي)')} *</label>
                        <div className="relative">
                          <User className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400`} />
                          <input
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className={`w-full ${isArabic ? 'pr-8 pl-2' : 'pl-8 pr-2'} py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-rose-200 outline-none`}
                            placeholder={label('Customer name', 'اسم العميل')}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 mb-0.5 block">{label('Full Name (AR)', 'الاسم الكامل (عربي)')}</label>
                        <input
                          value={customerNameAr}
                          onChange={(e) => setCustomerNameAr(e.target.value)}
                          className="w-full px-2 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-rose-200 outline-none text-right"
                          dir="rtl"
                          placeholder={label('اسم العميل', 'اسم العميل')}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 mb-0.5 block">{label('Phone', 'الجوال')} *</label>
                        <div className="relative">
                          <Phone className={`absolute ${isArabic ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400`} />
                          <input
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className={`w-full ${isArabic ? 'pr-8 pl-2' : 'pl-8 pr-2'} py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-rose-200 outline-none`}
                            placeholder="05xxxxxxxx"
                          />
                        </div>
                      </div>
                      {transactionMode !== 'sale' && (
                        <div>
                          <label className="text-[10px] text-gray-500 mb-0.5 block">{label('ID / Iqama', 'الهوية')}</label>
                          <input
                            value={customerId}
                            onChange={(e) => setCustomerId(e.target.value)}
                            className="w-full px-2 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-rose-200 outline-none"
                            placeholder="1xxxxxxxx"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rental Dates */}
                  {transactionMode === 'rental' && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {label('Rental Dates', 'تواريخ الإيجار')}
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-500 mb-0.5 block">{label('Pickup Date', 'تاريخ الاستلام')} *</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-2 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-rose-200 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 mb-0.5 block">{label('Return Date', 'تاريخ الإرجاع')} *</label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-2 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-rose-200 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Discount */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      {label('Discount', 'الخصم')}
                    </h4>
                    <div className="relative">
                      <span className={`absolute ${isArabic ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-[10px] text-gray-400`}>SAR</span>
                      <input
                        type="number"
                        min={0}
                        max={cartTotals.rentalSubtotal}
                        value={discountAmount || ''}
                        onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                        className={`w-full ${isArabic ? 'pl-10 pr-2' : 'pr-10 pl-2'} py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-rose-200 outline-none`}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-xs">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {label('Order Summary', 'ملخص الطلب')}
                    </h4>
                    <div className="flex justify-between text-gray-500">
                      <span>{transactionMode === 'sale' ? label('Subtotal', 'المجموع الفرعي') : label('Rental Subtotal', 'إجمالي الإيجار')}</span>
                      <Money value={cartTotals.rentalSubtotal} />
                    </div>
                    {cartTotals.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>{label('Discount', 'خصم')}</span>
                        <span>-<Money value={cartTotals.discountAmount} /></span>
                      </div>
                    )}
                    {transactionMode !== 'sale' && (
                      <div className="flex justify-between text-gray-500">
                        <span>{label('Security Deposit', 'تأمين')}</span>
                        <Money value={cartTotals.totalDeposit} />
                      </div>
                    )}
                    <div className="flex justify-between text-gray-500">
                      <span>{label('VAT (15%)', 'الضريبة 15%')}</span>
                      <Money value={cartTotals.totalTax} />
                    </div>
                    <div className="flex justify-between text-sm font-bold text-gray-900 pt-1.5 border-t border-gray-200">
                      <span>{label('Grand Total', 'الإجمالي')}</span>
                      <Money value={cartTotals.grandTotal} />
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={checkoutMutation.isPending || !customerName || !customerPhone || (transactionMode === 'rental' && (!startDate || !endDate))}
                    className={`w-full py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50 transition-colors flex items-center justify-center gap-2 ${
                      transactionMode === 'sale' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {checkoutMutation.isPending ? (
                      <Clock className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {label('Confirm & Print', 'تأكيد وطباعة')}
                        <Printer className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Receipt Print Modal ─── */}
      <AnimatePresence>
        {showReceipt && receiptData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 print:bg-white print:static print:inset-auto"
          >
            <div className="bg-white rounded-2xl shadow-xl p-6 w-[900px] max-w-[95vw] max-h-[90vh] overflow-y-auto print:shadow-none print:p-0 print:w-auto print:max-h-none print:overflow-visible">
              <div className="flex justify-between items-center mb-4 print:hidden">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Receipt className={`w-5 h-5 ${receiptData?.transactionType === 'sale' ? 'text-emerald-500' : 'text-rose-500'}`} />
                  {label('Invoice', 'فاتورة')}
                </h3>
                <button
                  onClick={() => setShowReceipt(false)}
                  className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center"
                >
                  ×
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-2 print:border-none print:p-0 flex justify-center">
                {receiptData?.invoice && (
                  <InvoiceLivePreview
                    invoice={receiptData.invoice}
                    tenant={tenant}
                    language={language}
                    bilingual
                    currencyRenderMode="icon"
                  />
                )}
              </div>

              <div className="mt-6 flex gap-2 print:hidden">
                <button
                  onClick={() => setShowReceipt(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 font-bold hover:bg-gray-50 text-gray-700"
                >
                  {label('Close', 'إغلاق')}
                </button>
                {receiptData?.invoice?._id && (
                  <>
                    <button
                      onClick={() => navigate(`/dashboard/invoices/${receiptData.invoice._id}`)}
                      className="flex-1 py-3 rounded-xl border border-gray-200 font-bold hover:bg-gray-50 text-gray-700 flex items-center justify-center gap-2"
                    >
                      <Receipt className="w-4 h-4" />
                      {label('Invoice', 'الفاتورة')}
                    </button>
                    <button
                      onClick={() => downloadA4Invoice(receiptData.invoice)}
                      className="flex-1 py-3 rounded-xl border border-gray-200 font-bold hover:bg-gray-50 text-gray-700 flex items-center justify-center gap-2"
                    >
                      <FileDown className="w-4 h-4" />
                      {label('A4 Invoice', 'فاتورة A4')}
                    </button>
                  </>
                )}
                <button
                  onClick={handlePrint}
                  className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  {label('Print Invoice', 'طباعة الفاتورة')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
