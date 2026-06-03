import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Loader } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function ProductList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bakala-products');
      setItems(res.data);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/bakala-products/${id}`);
      toast.success('Product deleted');
      fetchItems();
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  const filteredItems = items.filter(i => 
    i.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.primaryBarcode?.includes(searchQuery)
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search by name or barcode..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
          />
        </div>
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
          onClick={() => toast('Add Product form is under construction. Please use the CSV import tool for now.', { icon: '🚧' })}
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 font-medium">Barcode</th>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Category</th>
              <th className="px-6 py-3 font-medium text-right">Cost Price</th>
              <th className="px-6 py-3 font-medium text-right">Retail Price</th>
              <th className="px-6 py-3 font-medium text-center">Unit</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                  <Loader className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                  Loading...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                  No products found.
                </td>
              </tr>
            ) : (
              filteredItems.map(item => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-500 font-mono text-xs">{item.primaryBarcode}</td>
                  <td className="px-6 py-3 font-medium text-gray-900">
                    <p>{item.name}</p>
                    <p className="text-xs text-gray-500">{item.nameAr}</p>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{item.category || '-'}</td>
                  <td className="px-6 py-3 text-right text-gray-500">SAR {item.costPrice?.toFixed(2)}</td>
                  <td className="px-6 py-3 text-right font-medium text-gray-900">SAR {item.retailPrice?.toFixed(2)}</td>
                  <td className="px-6 py-3 text-center">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{item.unit || 'PCS'}</span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => handleDelete(item._id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
