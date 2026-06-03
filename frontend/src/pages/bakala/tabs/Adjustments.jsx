import React, { useState, useEffect, useRef } from 'react';
import { SlidersHorizontal, Plus, Search, Check, Save, ArrowLeft } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function Adjustments() {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'new'
  
  // Form state
  const [reason, setReason] = useState('Shrinkage');
  const [notes, setNotes] = useState('');
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
      const [adjRes, prodRes] = await Promise.all([
        api.get('/inventory-adjustments'),
        api.get('/bakala-products')
      ]);
      setAdjustments(adjRes.data);
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
        toast.error('Product already added to adjustment list');
      } else {
        setLines([{
          productId: product._id,
          productName: product.name,
          barcode: product.primaryBarcode,
          systemQuantity: product.stockQuantity || 0,
          actualQuantity: product.stockQuantity || 0,
          difference: 0,
          unitCost: product.costPrice || 0
        }, ...lines]);
      }
      setSearchTerm('');
    } else {
      toast.error('Product not found for this barcode');
      setSearchTerm('');
    }
  };

  const updateLine = (index, actualQuantity) => {
    const newLines = [...lines];
    newLines[index].actualQuantity = actualQuantity;
    newLines[index].difference = actualQuantity - newLines[index].systemQuantity;
    setLines(newLines);
  };

  const handleSaveAdjustment = async () => {
    if (lines.length === 0) return toast.error('Please add at least one product to adjust');
    
    try {
      await api.post('/inventory-adjustments', {
        reason,
        notes,
        lines
      });
      toast.success('Adjustment Saved and Stock Updated!');
      setView('list');
      fetchData();
    } catch (err) {
      toast.error('Failed to save Adjustment');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  if (view === 'new') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('list')} className="p-2 hover:bg-gray-50 rounded-xl transition-colors"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
            <h2 className="text-xl font-bold text-gray-800">New Stock Adjustment</h2>
          </div>
          <button onClick={handleSaveAdjustment} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
            <Save className="w-4 h-4" /> Save & Update Stock
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="Shrinkage">Shrinkage / Missing</option>
              <option value="Damage">Damaged / Expired</option>
              <option value="Found">Found Items</option>
              <option value="Manual Count">Manual Count Correction</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Optional explanation" />
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
                placeholder="Scan barcode to adjust item..." 
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                autoFocus
              />
            </form>
          </div>
          
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3 w-32 text-center">System Qty</th>
                <th className="px-6 py-3 w-32 text-center">Actual Qty</th>
                <th className="px-6 py-3 w-32 text-center">Difference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lines.map((line, index) => (
                <tr key={index} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{line.productName}</p>
                    <p className="text-xs text-gray-500">{line.barcode}</p>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-gray-500">
                    {line.systemQuantity}
                  </td>
                  <td className="px-6 py-4">
                    <input type="number" value={line.actualQuantity} onChange={(e) => updateLine(index, Number(e.target.value))} className="w-full p-2 border border-gray-200 rounded-lg text-center outline-none focus:border-indigo-500 font-bold bg-indigo-50" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-bold ${line.difference > 0 ? 'text-emerald-600' : line.difference < 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                      {line.difference > 0 ? '+' : ''}{line.difference}
                    </span>
                  </td>
                </tr>
              ))}
              {lines.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                    <SlidersHorizontal className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No items scanned to adjust yet.</p>
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Inventory Adjustments</h2>
          <p className="text-gray-500 mt-1">Log shrinkage, damages, or perform manual stock count corrections.</p>
        </div>
        <button onClick={() => { setLines([]); setReason('Shrinkage'); setNotes(''); setView('new'); }} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-sm hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> New Adjustment
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Adjustment Number</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Reason</th>
              <th className="px-6 py-4">Lines Adjusted</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {adjustments.map(adj => (
              <tr key={adj._id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-bold text-gray-900">{adj.adjustmentNumber}</td>
                <td className="px-6 py-4 text-gray-500">{new Date(adj.dateAdjusted).toLocaleString()}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{adj.reason}</td>
                <td className="px-6 py-4 text-gray-500">{adj.lines?.length || 0} Lines</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-indigo-700 bg-indigo-50">
                    <Check className="w-3.5 h-3.5" /> Applied
                  </span>
                </td>
              </tr>
            ))}
            {adjustments.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                  <SlidersHorizontal className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No adjustments recorded yet.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
