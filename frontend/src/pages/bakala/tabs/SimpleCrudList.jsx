import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Loader } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function SimpleCrudList({ endpoint, title, itemLabel }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', nameAr: '', isActive: true });
  const [editingId, setEditingId] = useState(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get(endpoint);
      setItems(res.data);
    } catch (err) {
      toast.error(`Failed to load ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [endpoint]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`${endpoint}/${editingId}`, formData);
        toast.success(`${itemLabel} updated`);
      } else {
        await api.post(endpoint, formData);
        toast.success(`${itemLabel} created`);
      }
      setIsModalOpen(false);
      setFormData({ name: '', nameAr: '', isActive: true });
      setEditingId(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to save ${itemLabel.toLowerCase()}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`${endpoint}/${id}`);
      toast.success(`${itemLabel} deleted`);
      fetchItems();
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (i.nameAr && i.nameAr.includes(searchQuery))
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder={`Search ${title.toLowerCase()}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
          />
        </div>
        <button 
          onClick={() => {
            setFormData({ name: '', nameAr: '', isActive: true });
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add {itemLabel}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 font-medium">Name (English)</th>
              <th className="px-6 py-3 font-medium">Name (Arabic)</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                  <Loader className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                  Loading...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                  No {title.toLowerCase()} found.
                </td>
              </tr>
            ) : (
              filteredItems.map(item => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-3 text-gray-600">{item.nameAr || '-'}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => {
                        setFormData({ name: item.name || '', nameAr: item.nameAr || '', isActive: item.isActive ?? true });
                        setEditingId(item._id);
                        setIsModalOpen(true);
                      }}
                      className="p-1 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded mr-2"
                    >
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit' : 'Add'} {itemLabel}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (English) *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (Arabic)</label>
                <input 
                  type="text" 
                  value={formData.nameAr}
                  onChange={e => setFormData({...formData, nameAr: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none text-right"
                  dir="rtl"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
