import React, { useState, useEffect, useRef } from 'react';
import { PackageOpen, Plus, Search, Check, Save, ArrowLeft, Calendar } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function GoodsReceiptNote() {
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'new' | 'view'
  
  // Form state
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedPO, setSelectedPO] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [lines, setLines] = useState([]);
  
  // Product Search
  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [grnRes, suppRes, poRes, prodRes] = await Promise.all([
        api.get('/grn'),
        api.get('/contacts?types=supplier'),
        api.get('/purchase-orders'),
        api.get('/bakala-products')
      ]);
      setGrns(grnRes.data);
      setSuppliers(suppRes.data?.contacts || []);
      setPurchaseOrders(poRes.data.filter(po => po.status !== 'fulfilled'));
      setAllProducts(prodRes.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleScannerSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const product = allProducts.find(p => p.primaryBarcode === searchTerm || p.barcodes?.includes(searchTerm));
    
    if (product) {
      // Check if already in lines
      const existingLineIndex = lines.findIndex(l => l.productId === product._id);
      if (existingLineIndex >= 0) {
        const newLines = [...lines];
        newLines[existingLineIndex].quantityReceived += 1;
        setLines(newLines);
      } else {
        setLines([{
          productId: product._id,
          productName: product.name,
          barcode: product.primaryBarcode,
          quantityReceived: 1,
          costPrice: product.costPrice || 0,
          expiryDate: '',
          batchNumber: ''
        }, ...lines]);
      }
      setSearchTerm('');
    } else {
      toast.error('Product not found for this barcode');
      setSearchTerm('');
    }
  };

  const handleSaveGRN = async () => {
    if (!selectedSupplier) return toast.error('Please select a supplier');
    if (lines.length === 0) return toast.error('Please scan at least one product');
    
    try {
      await api.post('/grn', {
        supplierId: selectedSupplier,
        purchaseOrderId: selectedPO || undefined,
        referenceNumber,
        lines: lines.map(l => ({
          ...l,
          expiryDate: l.expiryDate || undefined
        }))
      });
      toast.success('GRN Saved and Stock Updated!');
      setView('list');
      fetchData();
    } catch (err) {
      toast.error('Failed to save GRN');
    }
  };

  const updateLine = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = value;
    setLines(newLines);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  if (view === 'new') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('list')} className="p-2 hover:bg-gray-50 rounded-xl transition-colors"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
            <h2 className="text-xl font-bold text-gray-800">Receive Goods (GRN)</h2>
          </div>
          <button onClick={handleSaveGRN} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors">
            <Save className="w-4 h-4" /> Save & Update Stock
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier *</label>
            <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">Select Supplier</option>
              {suppliers.map(s => <option key={s.entityId || s._id} value={s.entityId || s._id}>{s.displayName || s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Link PO (Optional)</label>
            <select value={selectedPO} onChange={(e) => setSelectedPO(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">No PO</option>
              {purchaseOrders.map(p => <option key={p._id} value={p._id}>{p.poNumber}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier Inv / Ref #</label>
            <input type="text" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. INV-2024-99" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <form onSubmit={handleScannerSubmit} className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                ref={barcodeInputRef}
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Scan barcode to receive item..." 
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                autoFocus
              />
            </form>
          </div>
          
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3 w-32">Qty Recv</th>
                <th className="px-6 py-3 w-40">Unit Cost (SAR)</th>
                <th className="px-6 py-3 w-48">Expiry Date (Balady)</th>
                <th className="px-6 py-3 w-40">Batch #</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lines.map((line, index) => (
                <tr key={index} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{line.productName}</p>
                    <p className="text-xs text-gray-500">{line.barcode}</p>
                  </td>
                  <td className="px-6 py-4">
                    <input type="number" min="1" value={line.quantityReceived} onChange={(e) => updateLine(index, 'quantityReceived', Number(e.target.value))} className="w-full p-2 border border-gray-200 rounded-lg text-center outline-none focus:border-emerald-500 font-bold" />
                  </td>
                  <td className="px-6 py-4">
                    <input type="number" step="0.01" value={line.costPrice} onChange={(e) => updateLine(index, 'costPrice', Number(e.target.value))} className="w-full p-2 border border-gray-200 rounded-lg text-right outline-none focus:border-emerald-500" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative">
                      <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="date" value={line.expiryDate} onChange={(e) => updateLine(index, 'expiryDate', e.target.value)} className="w-full pl-8 pr-2 py-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500 text-sm" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <input type="text" value={line.batchNumber} onChange={(e) => updateLine(index, 'batchNumber', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-emerald-500 text-sm" placeholder="Optional" />
                  </td>
                </tr>
              ))}
              {lines.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    <PackageOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No items scanned yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Goods Receipt Notes (GRN)</h1>
          <p className="text-gray-500 mt-1">Receive deliveries from suppliers and automatically update inventory and expiry dates.</p>
        </div>
        <button onClick={() => { setLines([]); setSelectedSupplier(''); setReferenceNumber(''); setSelectedPO(''); setView('new'); }} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition-colors">
          <Plus className="w-5 h-5" /> Receive Goods
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">GRN Number</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Supplier</th>
              <th className="px-6 py-4">Ref # / PO</th>
              <th className="px-6 py-4">Items Received</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {grns.map(grn => (
              <tr key={grn._id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-bold text-gray-900">{grn.grnNumber}</td>
                <td className="px-6 py-4 text-gray-500">{new Date(grn.dateReceived).toLocaleString()}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{grn.supplierId?.nameEn || grn.supplierId?.nameAr}</td>
                <td className="px-6 py-4 text-sm">
                  {grn.referenceNumber && <span className="block text-gray-900">Ref: {grn.referenceNumber}</span>}
                  {grn.purchaseOrderId && <span className="block text-emerald-600">PO: {grn.purchaseOrderId.poNumber}</span>}
                </td>
                <td className="px-6 py-4 text-gray-500">{grn.lines?.length || 0} Lines</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-emerald-700 bg-emerald-50">
                    <Check className="w-3.5 h-3.5" /> Received
                  </span>
                </td>
              </tr>
            ))}
            {grns.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                  <PackageOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No GRNs created yet.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
