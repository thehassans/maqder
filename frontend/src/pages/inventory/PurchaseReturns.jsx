import React, { useState, useEffect, useRef } from 'react';
import { PackageMinus, Plus, Search, Check, Save, ArrowLeft } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function PurchaseReturns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'new'
  
  // Form state
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
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
      const [retRes, suppRes, prodRes] = await Promise.all([
        api.get('/purchase-returns'),
        api.get('/contacts?type=Supplier'),
        api.get('/bakala-products')
      ]);
      setReturns(retRes.data);
      setSuppliers(suppRes.data);
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
        newLines[existingLineIndex].quantityReturned += 1;
        setLines(newLines);
      } else {
        setLines([{
          productId: product._id,
          productName: product.name,
          barcode: product.primaryBarcode,
          quantityReturned: 1,
          reason: 'expired'
        }, ...lines]);
      }
      setSearchTerm('');
    } else {
      toast.error('Product not found for this barcode');
      setSearchTerm('');
    }
  };

  const handleSaveReturn = async () => {
    if (!selectedSupplier) return toast.error('Please select a supplier');
    if (lines.length === 0) return toast.error('Please scan at least one product to return');
    
    try {
      await api.post('/purchase-returns', {
        supplierId: selectedSupplier,
        referenceNumber,
        lines
      });
      toast.success('Return Saved and Stock Updated!');
      setView('list');
      fetchData();
    } catch (err) {
      toast.error('Failed to save Purchase Return');
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
            <h2 className="text-xl font-bold text-gray-800">Return Goods to Supplier</h2>
          </div>
          <button onClick={handleSaveReturn} className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors">
            <Save className="w-4 h-4" /> Finalize Return & Deduct Stock
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier *</label>
            <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500">
              <option value="">Select Supplier</option>
              {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Reference / Invoice #</label>
            <input type="text" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500" placeholder="Optional" />
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
                placeholder="Scan barcode to return item..." 
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
                autoFocus
              />
            </form>
          </div>
          
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3 w-32">Qty Returned</th>
                <th className="px-6 py-3 w-48">Reason</th>
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
                    <input type="number" min="1" value={line.quantityReturned} onChange={(e) => updateLine(index, 'quantityReturned', Number(e.target.value))} className="w-full p-2 border border-gray-200 rounded-lg text-center outline-none focus:border-rose-500 font-bold text-rose-600 bg-rose-50" />
                  </td>
                  <td className="px-6 py-4">
                    <select value={line.reason} onChange={(e) => updateLine(index, 'reason', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-rose-500 text-sm bg-white">
                      <option value="expired">Expired</option>
                      <option value="damaged">Damaged</option>
                      <option value="wrong_item">Wrong Item</option>
                      <option value="other">Other</option>
                    </select>
                  </td>
                </tr>
              ))}
              {lines.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gray-400">
                    <PackageMinus className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No items scanned to return yet.</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Purchase Returns</h1>
          <p className="text-gray-500 mt-1">Return expired or damaged goods to suppliers for credit.</p>
        </div>
        <button onClick={() => { setLines([]); setSelectedSupplier(''); setReferenceNumber(''); setView('new'); }} className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white font-bold rounded-xl shadow-sm hover:bg-rose-700 transition-colors">
          <Plus className="w-5 h-5" /> New Return
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Return Number</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Supplier</th>
              <th className="px-6 py-4">Ref #</th>
              <th className="px-6 py-4">Items Returned</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {returns.map(ret => (
              <tr key={ret._id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-bold text-gray-900">{ret.returnNumber}</td>
                <td className="px-6 py-4 text-gray-500">{new Date(ret.dateReturned).toLocaleString()}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{ret.supplierId?.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{ret.referenceNumber || '-'}</td>
                <td className="px-6 py-4 text-gray-500">{ret.lines?.length || 0} Lines</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-rose-700 bg-rose-50">
                    <Check className="w-3.5 h-3.5" /> Completed
                  </span>
                </td>
              </tr>
            ))}
            {returns.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                  <PackageMinus className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No returns created yet.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
