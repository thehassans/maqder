import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Save } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function StockCount() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bakala-products');
      setProducts(res.data);
      setEdits({});
    } catch (err) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (id, newQty) => {
    setEdits({ ...edits, [id]: newQty });
  };

  const handleSave = async () => {
    const idsToUpdate = Object.keys(edits);
    if (idsToUpdate.length === 0) return toast.error('No changes to save');
    
    try {
      setSaving(true);
      // Process sequential updates (in real app, bulk update route is better)
      for (const id of idsToUpdate) {
        await api.put(`/bakala-products/${id}`, { stockQuantity: Number(edits[id]) });
      }
      toast.success('Stock updated successfully');
      fetchProducts();
    } catch (err) {
      toast.error('Failed to update some stock records');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.primaryBarcode?.includes(searchQuery)
  );

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex justify-between items-center">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search products to count..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={fetchProducts} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving || Object.keys(edits).length === 0}
            className={`px-4 py-2 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
              Object.keys(edits).length > 0 ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Stock Updates'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 font-medium">Barcode</th>
              <th className="px-6 py-3 font-medium">Product</th>
              <th className="px-6 py-3 font-medium text-center">Unit</th>
              <th className="px-6 py-3 font-medium text-right">System Qty</th>
              <th className="px-6 py-3 font-medium text-right">Physical Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-gray-500">Loading...</td>
              </tr>
            ) : filteredProducts.map(product => {
              const currentEdit = edits[product._id];
              const isEdited = currentEdit !== undefined && currentEdit !== product.stockQuantity;

              return (
                <tr key={product._id} className={isEdited ? 'bg-emerald-50/50' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-3 text-gray-500 font-mono text-xs">{product.primaryBarcode}</td>
                  <td className="px-6 py-3 font-medium text-gray-900">{product.name}</td>
                  <td className="px-6 py-3 text-center text-gray-500">{product.unit || 'PCS'}</td>
                  <td className="px-6 py-3 text-right font-medium text-gray-500">{product.stockQuantity || 0}</td>
                  <td className="px-6 py-3 text-right flex justify-end">
                    <input 
                      type="number"
                      value={currentEdit !== undefined ? currentEdit : (product.stockQuantity || 0)}
                      onChange={(e) => handleQtyChange(product._id, e.target.value)}
                      className={`w-24 px-3 py-1 border rounded outline-none text-right font-medium focus:ring-2 focus:ring-emerald-500 ${
                        isEdited ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : 'border-gray-300'
                      }`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
