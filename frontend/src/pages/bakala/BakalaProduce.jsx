import React, { useState, useEffect } from 'react';
import { Plus, Search, Loader, Leaf, Trash2, Edit2 } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function BakalaProduce() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', retailPrice: '', unit: 'KG'
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bakala-products');
      const produce = res.data.filter(p => {
        const cat = (p.category || '').toLowerCase();
        return cat.includes('fruit') || cat.includes('veg') || cat.includes('produce') || p.unit === 'KG';
      });
      setItems(produce);
    } catch (err) {
      toast.error('Failed to load produce');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/bakala-products/${editingId}`, {
          ...formData,
          retailPrice: Number(formData.retailPrice)
        });
        toast.success('Produce updated');
      } else {
        const primaryBarcode = String(Math.floor(Math.random() * 90000) + 10000);
        await api.post('/bakala-products', {
          ...formData,
          retailPrice: Number(formData.retailPrice),
          category: 'Fruits & Vegetables',
          primaryBarcode,
          stockQuantity: 999
        });
        toast.success('Produce created');
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save produce');
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name || '',
      retailPrice: product.retailPrice || '',
      unit: product.unit || 'KG'
    });
    setEditingId(product._id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this produce?')) return;
    try {
      await api.delete(`/bakala-products/${id}`);
      toast.success('Produce deleted');
      fetchItems();
    } catch (err) {
      toast.error('Failed to delete produce');
    }
  };

  const filteredItems = items.filter(i => 
    i.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-3">
            <Leaf className="w-8 h-8 text-emerald-500" />
            Fruits & Vegetables
          </h1>
          <p className="text-gray-500 font-medium">Manage your fresh produce catalog for the weight scale.</p>
        </div>
        <button 
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          onClick={() => {
            setFormData({ name: '', retailPrice: '', unit: 'KG' });
            setEditingId(null);
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-5 h-5" /> Add New Produce
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-[2rem] shadow-xl shadow-gray-200/40 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search produce by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium transition-shadow"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="px-6 py-4">Produce Name</th>
                <th className="px-6 py-4">Unit Type</th>
                <th className="px-6 py-4 text-right">Retail Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-400 font-medium">
                    <Loader className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-500" />
                    Loading produce...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-400 font-medium">
                    <Leaf className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    No produce found. Add your first fruit or vegetable!
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item._id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4 font-bold text-gray-900">{item.name}</td>
                    <td className="px-6 py-4">
                      <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold tracking-widest uppercase">
                        {item.unit || 'KG'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-gray-900">SAR {item.retailPrice?.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl mr-2 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <h3 className="text-xl font-black text-gray-900">{editingId ? 'Edit' : 'Add'} Produce</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Produce Name</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g., Red Apples"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Retail Price (SAR)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    required 
                    value={formData.retailPrice} 
                    onChange={e => setFormData({...formData, retailPrice: e.target.value})} 
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Unit Type</label>
                  <select 
                    value={formData.unit} 
                    onChange={e => setFormData({...formData, unit: e.target.value})} 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium appearance-none"
                  >
                    <option value="KG">Per KG</option>
                    <option value="PCS">Per Piece</option>
                    <option value="DZ">Per Dozen</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-4 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-colors">Save Produce</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
