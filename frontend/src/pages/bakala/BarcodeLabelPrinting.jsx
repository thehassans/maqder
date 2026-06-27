import { useState, useRef, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Barcode from 'react-barcode'
import {
  Search, Printer, Plus, Minus, Trash2, Scan, Tag, Package,
  Loader2, Settings, Eye, Grid3x3, Check,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

const LABEL_SIZES = [
  { id: '30x20', label: '30×20mm', width: 30, height: 20, nameSize: 8, priceSize: 8, barcodeHeight: 15, barcodeWidth: 1, fontSize: 7 },
  { id: '38x25', label: '38×25mm', width: 38, height: 25, nameSize: 9, priceSize: 9, barcodeHeight: 20, barcodeWidth: 1.2, fontSize: 8 },
  { id: '50x30', label: '50×30mm', width: 50, height: 30, nameSize: 11, priceSize: 10, barcodeHeight: 25, barcodeWidth: 1.5, fontSize: 9 },
  { id: '60x40', label: '60×40mm', width: 60, height: 40, nameSize: 13, priceSize: 12, barcodeHeight: 30, barcodeWidth: 1.8, fontSize: 10 },
]

const PRINT_LAYOUTS = [
  { id: 'individual', label: 'Individual (one per page)', cols: 1 },
  { id: 'grid-3', label: 'Grid 3 cols (sheet)', cols: 3 },
  { id: 'grid-4', label: 'Grid 4 cols (sheet)', cols: 4 },
]

function LabelPreview({ item, size, showName, showPrice, showArabic, showBarcodeText }) {
  const cfg = LABEL_SIZES.find(s => s.id === size) || LABEL_SIZES[1]
  const scale = 2.5

  return (
    <div
      style={{
        width: `${cfg.width * scale}mm`,
        height: `${cfg.height * scale}mm`,
        fontSize: `${cfg.nameSize * scale}px`,
      }}
      className="flex flex-col items-center justify-center bg-white border border-gray-300 rounded overflow-hidden px-1"
    >
      {showName && (
        <div className="font-bold text-center leading-tight truncate w-full" style={{ fontSize: `${cfg.nameSize * scale}px` }}>
          {item.name}
        </div>
      )}
      {showArabic && item.nameAr && (
        <div className="text-center leading-tight truncate w-full" style={{ fontSize: `${(cfg.nameSize - 1) * scale}px` }} dir="rtl">
          {item.nameAr}
        </div>
      )}
      {showPrice && (
        <div className="font-bold" style={{ fontSize: `${cfg.priceSize * scale}px` }}>
          SAR {item.retailPrice?.toFixed(2)}
        </div>
      )}
      <div className="flex justify-center w-full">
        <Barcode
          value={item.primaryBarcode || '000000'}
          format={item.primaryBarcode?.length === 13 ? 'EAN13' : item.primaryBarcode?.length === 8 ? 'EAN8' : 'CODE128'}
          width={cfg.barcodeWidth}
          height={cfg.barcodeHeight * scale * 0.5}
          fontSize={showBarcodeText ? cfg.fontSize : 0}
          margin={0}
          displayValue={showBarcodeText}
        />
      </div>
    </div>
  )
}

export default function BarcodeLabelPrinting() {
  const { language } = useSelector((state) => state.ui)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItems, setSelectedItems] = useState([])
  const [labelSize, setLabelSize] = useState('38x25')
  const [printLayout, setPrintLayout] = useState('grid-3')
  const [showName, setShowName] = useState(true)
  const [showPrice, setShowPrice] = useState(true)
  const [showArabic, setShowArabic] = useState(false)
  const [showBarcodeText, setShowBarcodeText] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('')
  const printRef = useRef(null)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['bakala-products-all'],
    queryFn: () => api.get('/bakala-products', { params: { limit: 500 } }).then(res => res.data),
  })

  const categories = useMemo(() => {
    const cats = new Set()
    products.forEach(p => { if (p.category) cats.add(p.category) })
    return Array.from(cats).sort()
  }, [products])

  const filteredProducts = useMemo(() => {
    let list = products
    if (categoryFilter) list = list.filter(p => p.category === categoryFilter)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.primaryBarcode?.includes(q) ||
        p.nameAr?.includes(searchQuery)
      )
    }
    return list.slice(0, 100)
  }, [products, searchQuery, categoryFilter])

  const handleSelect = (product) => {
    const existing = selectedItems.find(i => i._id === product._id)
    if (existing) {
      setSelectedItems(selectedItems.map(i => i._id === product._id ? { ...i, printQty: i.printQty + 1 } : i))
    } else {
      setSelectedItems([...selectedItems, { ...product, printQty: 1 }])
    }
  }

  const handleAddCategory = () => {
    if (!categoryFilter) return toast.error('Select a category first')
    const catProducts = products.filter(p => p.category === categoryFilter)
    catProducts.forEach(p => handleSelect(p))
    toast.success(`Added ${catProducts.length} products from ${categoryFilter}`)
  }

  const handleUpdateQty = (id, qty) => {
    if (qty <= 0) {
      setSelectedItems(selectedItems.filter(i => i._id !== id))
    } else {
      setSelectedItems(selectedItems.map(i => i._id === id ? { ...i, printQty: qty } : i))
    }
  }

  const handleClearAll = () => setSelectedItems([])

  const totalLabels = selectedItems.reduce((s, i) => s + i.printQty, 0)

  const handlePrint = () => {
    if (selectedItems.length === 0) return toast.error('Add items to print queue first')
    if (!printRef.current) return

    const cfg = LABEL_SIZES.find(s => s.id === labelSize) || LABEL_SIZES[1]
    const layout = PRINT_LAYOUTS.find(l => l.id === printLayout) || PRINT_LAYOUTS[1]
    const cols = layout.cols

    const labels = []
    selectedItems.forEach(item => {
      for (let i = 0; i < item.printQty; i++) {
        labels.push(item)
      }
    })

    const labelHTML = labels.map(item => `
      <div class="label-cell" style="width: ${cfg.width}mm; height: ${cfg.height}mm;">
        ${showName ? `<div class="name">${escapeHtml(item.name || '')}</div>` : ''}
        ${showArabic && item.nameAr ? `<div class="name-ar" dir="rtl">${escapeHtml(item.nameAr)}</div>` : ''}
        ${showPrice ? `<div class="price">SAR ${(item.retailPrice || 0).toFixed(2)}</div>` : ''}
        <div class="barcode-wrapper">
          <svg class="barcode-svg" data-value="${escapeHtml(item.primaryBarcode || '000000')}"
            data-format="${(item.primaryBarcode || '').length === 13 ? 'EAN13' : (item.primaryBarcode || '').length === 8 ? 'EAN8' : 'CODE128'}"
            data-width="${cfg.barcodeWidth}" data-height="${cfg.barcodeHeight}"
            data-font="${cfg.fontSize}" data-display="${showBarcodeText}">
          </svg>
        </div>
      </div>
    `).join('')

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Labels - ${totalLabels} labels</title>
          <style>
            @page { size: auto; margin: 5mm; }
            body { font-family: 'Inter', 'Arial', sans-serif; margin: 0; padding: 0; color: #000; }
            .labels-grid {
              display: grid;
              grid-template-columns: repeat(${cols}, ${cfg.width}mm);
              gap: 2mm;
              justify-content: start;
            }
            .label-cell {
              width: ${cfg.width}mm;
              height: ${cfg.height}mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              overflow: hidden;
              border: 0.5px solid #ddd;
              border-radius: 1mm;
              padding: 0.5mm;
              box-sizing: border-box;
              page-break-inside: avoid;
            }
            .name { font-weight: 900; font-size: ${cfg.nameSize}px; line-height: 1.1; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-transform: uppercase; }
            .name-ar { font-size: ${(cfg.nameSize - 1)}px; line-height: 1.1; max-width: 100%; overflow: hidden; }
            .price { font-size: ${cfg.priceSize}px; font-weight: bold; margin: 0.5mm 0; }
            .barcode-wrapper { display: flex; justify-content: center; align-items: center; }
            .barcode-wrapper svg { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <div class="labels-grid">${labelHTML}</div>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
          <script>
            document.querySelectorAll('.barcode-svg').forEach(function(svg) {
              var value = svg.getAttribute('data-value');
              var format = svg.getAttribute('data-format');
              var width = parseFloat(svg.getAttribute('data-width'));
              var height = parseInt(svg.getAttribute('data-height'));
              var fontSize = parseInt(svg.getAttribute('data-font'));
              var display = svg.getAttribute('data-display') === 'true';
              try {
                JsBarcode(svg, value, {
                  format: format,
                  width: width,
                  height: height,
                  fontSize: fontSize,
                  margin: 0,
                  displayValue: display,
                });
              } catch(e) {
                svg.textContent = 'Invalid barcode';
              }
            });
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }, 500);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  const previewItem = selectedItems[0] || filteredProducts[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'ar' ? 'طباعة الباركود والملصقات' : 'Barcode & Label Printing'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'طباعة ملصقات المنتجات بالباركود' : 'Generate and print product barcode labels'}
          </p>
        </div>
        <button
          onClick={handlePrint}
          disabled={!selectedItems.length}
          className="btn btn-action-dark flex items-center gap-1.5 disabled:opacity-50"
        >
          <Printer className="w-4 h-4" />
          {language === 'ar' ? 'طباعة' : 'Print'} ({totalLabels})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Product Search & Selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Filter */}
          <div className="card p-4 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name or barcode..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input pl-9"
                />
              </div>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="select w-auto">
                <option value="">All categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={handleAddCategory} className="btn btn-secondary flex items-center gap-1 whitespace-nowrap">
                <Package className="w-4 h-4" /> Add Category
              </button>
            </div>
          </div>

          {/* Product List */}
          <div className="card overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Scan className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No products found</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-dark-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Barcode</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                    {filteredProducts.map(product => {
                      const inQueue = selectedItems.find(i => i._id === product._id)
                      return (
                        <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                          <td className="px-4 py-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                            {product.nameAr && <p className="text-xs text-gray-400" dir="rtl">{product.nameAr}</p>}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500 font-mono">{product.primaryBarcode}</td>
                          <td className="px-4 py-2 text-right text-sm text-gray-700 dark:text-gray-300">{product.retailPrice?.toFixed(2)}</td>
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => handleSelect(product)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                inQueue
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                              }`}
                            >
                              {inQueue ? <Check className="w-3 h-3 inline" /> : <Plus className="w-3 h-3 inline" />}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Print Queue */}
          {selectedItems.length > 0 && (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Print Queue ({selectedItems.length} items, {totalLabels} labels)
                </h3>
                <button onClick={handleClearAll} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Clear All
                </button>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-dark-700 max-h-[300px] overflow-y-auto">
                {selectedItems.map(item => (
                  <div key={item._id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{item.primaryBarcode} · SAR {item.retailPrice?.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleUpdateQty(item._id, item.printQty - 1)} className="p-1 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={item.printQty}
                        onChange={(e) => handleUpdateQty(item._id, parseInt(e.target.value) || 0)}
                        className="w-14 px-2 py-1 border border-gray-300 dark:border-dark-600 rounded text-sm text-center bg-white dark:bg-dark-800"
                      />
                      <button onClick={() => handleUpdateQty(item._id, item.printQty + 1)} className="p-1 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Settings & Preview */}
        <div className="space-y-4">
          {/* Label Settings */}
          <div className="card p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary-500" />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Label Settings</h3>
            </div>

            <div>
              <label className="label">Label Size</label>
              <div className="grid grid-cols-2 gap-2">
                {LABEL_SIZES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setLabelSize(s.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      labelSize === s.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Print Layout</label>
              <select value={printLayout} onChange={(e) => setPrintLayout(e.target.value)} className="select">
                {PRINT_LAYOUTS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="label">Content</label>
              {[
                { key: 'name', label: 'Product Name', val: showName, set: setShowName },
                { key: 'arabic', label: 'Arabic Name', val: showArabic, set: setShowArabic },
                { key: 'price', label: 'Price', val: showPrice, set: setShowPrice },
                { key: 'barcodeText', label: 'Barcode Text', val: showBarcodeText, set: setShowBarcodeText },
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opt.val}
                    onChange={(e) => opt.set(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-primary-500" />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Live Preview</h3>
            </div>
            {previewItem ? (
              <div className="flex flex-col items-center gap-2">
                <div className="bg-gray-50 dark:bg-dark-900/50 rounded-xl p-4 flex items-center justify-center">
                  <LabelPreview
                    item={previewItem}
                    size={labelSize}
                    showName={showName}
                    showPrice={showPrice}
                    showArabic={showArabic}
                    showBarcodeText={showBarcodeText}
                  />
                </div>
                <p className="text-xs text-gray-400 text-center">
                  {LABEL_SIZES.find(s => s.id === labelSize)?.label} · {totalLabels} labels to print
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Tag className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs">Select a product to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden print area (not used - print generates its own window) */}
      <div className="hidden" ref={printRef}></div>
    </div>
  )
}
