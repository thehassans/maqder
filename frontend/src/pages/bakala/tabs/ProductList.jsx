import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Loader, Download } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function ProductList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', nameAr: '', primaryBarcode: '', category: '', brand: '', 
    unit: 'PCS', costPrice: 0, retailPrice: 0, minimumStockAlertLevel: 10, isActive: true
  });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);

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

  const fetchDropdownData = async () => {
    try {
      const [catRes, brandRes, unitRes] = await Promise.all([
        api.get('/bakala-products/categories'),
        api.get('/bakala-products/brands'),
        api.get('/bakala-products/units')
      ]);
      setCategories(catRes.data);
      setBrands(brandRes.data);
      setUnits(unitRes.data);
    } catch (err) {
      console.error('Failed to load dropdowns');
    }
  };

  useEffect(() => {
    fetchItems();
    fetchDropdownData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/bakala-products/${editingId}`, formData);
        toast.success('Product updated');
      } else {
        await api.post('/bakala-products', formData);
        toast.success('Product created');
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name || '',
      nameAr: product.nameAr || '',
      primaryBarcode: product.primaryBarcode || '',
      category: product.category || '',
      brand: product.brand || '',
      unit: product.unit || 'PCS',
      costPrice: product.costPrice || 0,
      retailPrice: product.retailPrice || 0,
      minimumStockAlertLevel: product.minimumStockAlertLevel || 10,
      isActive: product.isActive ?? true
    });
    setEditingId(product._id);
    setIsModalOpen(true);
  };

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
        <div className="flex gap-2">
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            onClick={async () => {
              const toastId = toast.loading('Importing from CSV on server...');
              try {
                const res = await api.get('/bakala-products/trigger-import');
                toast.success(res.data.message, { id: toastId });
                fetchItems();
              } catch (err) {
                toast.error(err.response?.data?.error || 'Import failed', { id: toastId });
              }
            }}
          >
            <Download className="w-4 h-4" /> Import CSV
          </button>
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
            onClick={() => {
              setFormData({
                name: '', nameAr: '', primaryBarcode: '', category: '', brand: '', 
                unit: 'PCS', costPrice: 0, retailPrice: 0, minimumStockAlertLevel: 10, isActive: true
              });
              setEditingId(null);
              setIsModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
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
                    <button onClick={() => handleEdit(item)} className="p-1 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded mr-2">
                      <Edit2 className="w-4 h-4" />
                    </button>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit' : 'Add'} Product</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (English) *</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (Arabic)</label>
                  <input type="text" value={formData.nameAr} onChange={e => setFormData({...formData, nameAr: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 outline-none text-right" dir="rtl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode *</label>
                  <input type="text" required value={formData.primaryBarcode} onChange={e => setFormData({...formData, primaryBarcode: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 outline-none">
                    <option value="PCS">PCS</option>
                    {units.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 outline-none">
                    <option value="">None</option>
                    {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <select value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 outline-none">
                    <option value="">None</option>
                    {brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (SAR)</label>
                  <input type="number" step="0.01" min="0" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Retail Price (SAR) *</label>
                  <input type="number" step="0.01" min="0" required value={formData.retailPrice} onChange={e => setFormData({...formData, retailPrice: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
