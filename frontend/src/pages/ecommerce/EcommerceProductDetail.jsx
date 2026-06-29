import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Package, Save, Loader2, X, Trash2, ArrowLeft, Plus, AlertCircle, CheckCircle, Archive, Eye, Image as ImageIcon, Tag, Copy } from 'lucide-react';
import api from '../../lib/api';

const emptyVariant = () => ({
  sku: '', barcode: '', option1Value: '', option2Value: '', option3Value: '',
  price: 0, compareAtPrice: 0, costPrice: 0, stockQuantity: 0, trackInventory: true, weight: 0, isActive: true,
});

export default function EcommerceProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    api.get(`/ecommerce/products/${id}`)
      .then(res => { setProduct(res.data); setForm(res.data); })
      .catch(err => setError(err.response?.data?.error || 'Failed to load product'))
      .finally(() => setLoading(false));
  }, [id]);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const updateSeo = (key, value) => setForm(prev => ({ ...prev, seo: { ...prev.seo, [key]: value } }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) update('tags', [...form.tags, t]);
    setTagInput('');
  };
  const removeTag = (t) => update('tags', form.tags.filter(x => x !== t));

  const addImage = () => {
    const url = imageUrl.trim();
    if (!url) return;
    update('images', [...form.images, { url, altText: '', position: form.images.length }]);
    setImageUrl('');
  };
  const removeImage = (idx) => update('images', form.images.filter((_, i) => i !== idx).map((img, i) => ({ ...img, position: i })));

  const addVariant = () => update('variants', [...(form.variants || []), emptyVariant()]);
  const removeVariant = (idx) => update('variants', form.variants.filter((_, i) => i !== idx));
  const updateVariant = (idx, key, value) => {
    setForm(prev => ({ ...prev, variants: prev.variants.map((v, i) => i === idx ? { ...v, [key]: value } : v) }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = { ...form };
      if (!payload.hasVariants) {
        payload.variants = [];
        payload.option1Name = '';
        payload.option2Name = '';
        payload.option3Name = '';
      }
      const res = await api.put(`/ecommerce/products/${id}`, payload);
      setProduct(res.data);
      setForm(res.data);
      setSuccess('Product saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/ecommerce/products/${id}`);
      navigate('/app/dashboard/ecommerce/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete');
      setSaving(false);
    }
  };

  const handleClone = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = { ...product, title: `${product.title} (Copy)`, status: 'draft', sku: '' };
      delete payload._id;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.__v;
      if (payload.variants) {
        payload.variants = payload.variants.map(v => { const { _id, ...rest } = v; return rest; });
      }
      const res = await api.post('/ecommerce/products', payload);
      navigate(`/app/dashboard/ecommerce/products/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to clone product');
      setSaving(false);
    }
  };

  const handleStatusToggle = async () => {
    const newStatus = product.status === 'active' ? 'archived' : 'active';
    try {
      const res = await api.patch(`/ecommerce/products/${id}/status`, { status: newStatus });
      setProduct(res.data);
      setForm(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <p className="font-bold text-gray-500">Product not found</p>
        <Link to="/app/dashboard/ecommerce/products" className="text-indigo-600 text-sm mt-2 inline-block">Back to products</Link>
      </div>
    );
  }

  const inputCls = "w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelCls = "block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider";
  const tabCls = (tab) => `px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700'}`;

  const statusBadge = (status) => {
    const styles = { active: 'bg-emerald-50 text-emerald-700 border-emerald-200', draft: 'bg-amber-50 text-amber-700 border-amber-200', archived: 'bg-gray-100 text-gray-500 border-gray-200' };
    return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || styles.draft}`}>{status}</span>;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/app/dashboard/ecommerce/products" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">{product.title}</h1>
              {statusBadge(product.status)}
            </div>
            <p className="text-sm text-gray-400">{product.sku ? `SKU: ${product.sku}` : 'No SKU'} · {product.category || 'Uncategorized'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleStatusToggle} className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-dark-600 font-bold text-sm hover:bg-gray-50 dark:hover:bg-dark-700">
            {product.status === 'active' ? <><Archive className="w-4 h-4" /> Archive</> : <><CheckCircle className="w-4 h-4" /> Activate</>}
          </button>
          <button onClick={() => setShowDelete(true)} className="flex items-center gap-2 px-4 py-2 rounded-full border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          <button onClick={handleClone} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-dark-600 font-bold text-sm hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-50">
            <Copy className="w-4 h-4" /> Duplicate
          </button>
          {product.status === 'active' && (
            <a href={`/store/products/${product.seo?.slug || product._id}`} target="_blank" rel="noopener" className="flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-200 text-indigo-600 font-bold text-sm hover:bg-indigo-50">
              <Eye className="w-4 h-4" /> Live Preview
            </a>
          )}
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-full font-bold hover:bg-indigo-700 disabled:opacity-50 text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle className="w-4 h-4 flex-shrink-0" />{success}</div>}

      {/* Image preview */}
      {product.images?.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {product.images.map((img, idx) => (
            <img key={idx} src={img.url} alt={img.altText || product.title} className="w-24 h-24 rounded-xl object-cover border border-gray-200 flex-shrink-0" />
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['general', 'pricing', 'inventory', 'variants', 'images', 'seo'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={tabCls(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* General */}
      {activeTab === 'general' && form && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-6 space-y-4">
          <div>
            <label className={labelCls}>Title</label>
            <input className={inputCls} value={form.title || ''} onChange={e => update('title', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Title (Arabic)</label>
            <input className={inputCls} value={form.titleAr || ''} onChange={e => update('titleAr', e.target.value)} dir="rtl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Description</label>
              <textarea className={inputCls} rows={4} value={form.description || ''} onChange={e => update('description', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Description (Arabic)</label>
              <textarea className={inputCls} rows={4} value={form.descriptionAr || ''} onChange={e => update('descriptionAr', e.target.value)} dir="rtl" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Type</label>
              <select className={inputCls} value={form.productType || 'physical'} onChange={e => update('productType', e.target.value)}>
                <option value="physical">Physical</option>
                <option value="digital">Digital</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.status || 'draft'} onChange={e => update('status', e.target.value)}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <input className={inputCls} value={form.category || ''} onChange={e => update('category', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Brand</label>
              <input className={inputCls} value={form.brand || ''} onChange={e => update('brand', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Tags</label>
            <div className="flex gap-2 mb-2">
              <input className={inputCls} value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="Type a tag and press Enter" />
              <button onClick={addTag} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-dark-700 font-bold text-sm">Add</button>
            </div>
            {form.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                    {t}<button onClick={() => removeTag(t)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pricing */}
      {activeTab === 'pricing' && form && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className={labelCls}>Base Price</label><input type="number" step="0.01" className={inputCls} value={form.basePrice || 0} onChange={e => update('basePrice', parseFloat(e.target.value) || 0)} /></div>
            <div><label className={labelCls}>Compare-at</label><input type="number" step="0.01" className={inputCls} value={form.compareAtPrice || 0} onChange={e => update('compareAtPrice', parseFloat(e.target.value) || 0)} /></div>
            <div><label className={labelCls}>Cost Price</label><input type="number" step="0.01" className={inputCls} value={form.costPrice || 0} onChange={e => update('costPrice', parseFloat(e.target.value) || 0)} /></div>
            <div><label className={labelCls}>Tax Rate (%)</label><input type="number" step="0.01" className={inputCls} value={form.taxRate ?? 15} onChange={e => update('taxRate', parseFloat(e.target.value) || 0)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.taxIncluded ?? true} onChange={e => update('taxIncluded', e.target.checked)} className="w-4 h-4 rounded" /> Prices include tax</label>
            <div><label className={labelCls}>Currency</label>
              <select className={inputCls} value={form.currency || 'SAR'} onChange={e => update('currency', e.target.value)}>
                <option value="SAR">SAR</option><option value="USD">USD</option><option value="AED">AED</option><option value="KWD">KWD</option><option value="QAR">QAR</option><option value="BHD">BHD</option><option value="OMR">OMR</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Inventory */}
      {activeTab === 'inventory' && form && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-6 space-y-4">
          {form.hasVariants ? (
            <p className="text-sm text-gray-400 bg-amber-50 border border-amber-200 rounded-xl p-3">Inventory is managed per-variant in the Variants tab.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div><label className={labelCls}>SKU</label><input className={inputCls} value={form.sku || ''} onChange={e => update('sku', e.target.value)} /></div>
                <div><label className={labelCls}>Barcode</label><input className={inputCls} value={form.barcode || ''} onChange={e => update('barcode', e.target.value)} /></div>
                <div><label className={labelCls}>Stock</label><input type="number" className={inputCls} value={form.stockQuantity || 0} onChange={e => update('stockQuantity', parseInt(e.target.value) || 0)} /></div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.trackInventory ?? true} onChange={e => update('trackInventory', e.target.checked)} className="w-4 h-4 rounded" /> Track inventory</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.continueSellingWhenOOS || false} onChange={e => update('continueSellingWhenOOS', e.target.checked)} className="w-4 h-4 rounded" /> Continue selling when out of stock</label>
              </div>
            </>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-dark-700">
            <div><label className={labelCls}>Weight</label><input type="number" step="0.01" className={inputCls} value={form.weight || 0} onChange={e => update('weight', parseFloat(e.target.value) || 0)} /></div>
            <div><label className={labelCls}>Weight Unit</label><select className={inputCls} value={form.weightUnit || 'g'} onChange={e => update('weightUnit', e.target.value)}><option value="g">grams</option><option value="kg">kilograms</option></select></div>
            <label className="flex items-end gap-2 text-sm pb-2"><input type="checkbox" checked={form.requiresShipping ?? true} onChange={e => update('requiresShipping', e.target.checked)} className="w-4 h-4 rounded" /> Requires shipping</label>
          </div>
        </div>
      )}

      {/* Variants */}
      {activeTab === 'variants' && form && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-6 space-y-4">
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={form.hasVariants || false} onChange={e => { update('hasVariants', e.target.checked); if (e.target.checked && (!form.variants || form.variants.length === 0)) update('variants', [emptyVariant()]); }} className="w-4 h-4 rounded" />
            This product has variants
          </label>
          {form.hasVariants && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div><label className={labelCls}>Option 1</label><input className={inputCls} value={form.option1Name || ''} onChange={e => update('option1Name', e.target.value)} placeholder="e.g. Size" /></div>
                <div><label className={labelCls}>Option 2</label><input className={inputCls} value={form.option2Name || ''} onChange={e => update('option2Name', e.target.value)} placeholder="e.g. Color" /></div>
                <div><label className={labelCls}>Option 3</label><input className={inputCls} value={form.option3Name || ''} onChange={e => update('option3Name', e.target.value)} placeholder="e.g. Material" /></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-dark-700">
                    <th className="px-2 py-2">{form.option1Name || 'Opt 1'}</th>
                    <th className="px-2 py-2">{form.option2Name || 'Opt 2'}</th>
                    <th className="px-2 py-2">{form.option3Name || 'Opt 3'}</th>
                    <th className="px-2 py-2">SKU</th>
                    <th className="px-2 py-2">Price</th>
                    <th className="px-2 py-2">Stock</th>
                    <th></th>
                  </tr></thead>
                  <tbody>
                    {(form.variants || []).map((v, idx) => (
                      <tr key={idx} className="border-b border-gray-50 dark:border-dark-700/50">
                        <td className="px-2 py-2"><input className={inputCls} value={v.option1Value || ''} onChange={e => updateVariant(idx, 'option1Value', e.target.value)} /></td>
                        <td className="px-2 py-2"><input className={inputCls} value={v.option2Value || ''} onChange={e => updateVariant(idx, 'option2Value', e.target.value)} /></td>
                        <td className="px-2 py-2"><input className={inputCls} value={v.option3Value || ''} onChange={e => updateVariant(idx, 'option3Value', e.target.value)} /></td>
                        <td className="px-2 py-2"><input className={inputCls} value={v.sku || ''} onChange={e => updateVariant(idx, 'sku', e.target.value)} /></td>
                        <td className="px-2 py-2"><input type="number" step="0.01" className={inputCls} value={v.price || 0} onChange={e => updateVariant(idx, 'price', parseFloat(e.target.value) || 0)} /></td>
                        <td className="px-2 py-2"><input type="number" className={inputCls} value={v.stockQuantity || 0} onChange={e => updateVariant(idx, 'stockQuantity', parseInt(e.target.value) || 0)} /></td>
                        <td className="px-2 py-2"><button onClick={() => removeVariant(idx)} className="p-1 rounded-lg text-red-400 hover:bg-red-50"><X className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={addVariant} className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700"><Plus className="w-4 h-4" /> Add Variant</button>
            </>
          )}
        </div>
      )}

      {/* Images */}
      {activeTab === 'images' && form && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-6 space-y-4">
          <div className="flex gap-2">
            <input className={inputCls} value={imageUrl} onChange={e => setImageUrl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImage(); } }} placeholder="Paste image URL" />
            <button onClick={addImage} className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm">Add</button>
          </div>
          {form.images?.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {form.images.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img src={img.url} alt={img.altText} className="w-full h-32 rounded-xl object-cover border border-gray-200" />
                  <button onClick={() => removeImage(idx)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12"><ImageIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">No images</p></div>
          )}
        </div>
      )}

      {/* SEO */}
      {activeTab === 'seo' && form && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-6 space-y-4">
          <div><label className={labelCls}>Meta Title</label><input className={inputCls} value={form.seo?.metaTitle || ''} onChange={e => updateSeo('metaTitle', e.target.value)} /></div>
          <div><label className={labelCls}>Meta Description</label><textarea className={inputCls} rows={3} value={form.seo?.metaDescription || ''} onChange={e => updateSeo('metaDescription', e.target.value)} /></div>
          <div><label className={labelCls}>URL Slug</label><input className={inputCls} value={form.seo?.slug || ''} onChange={e => updateSeo('slug', e.target.value)} /></div>
          <div><label className={labelCls}>OG Image URL</label><input className={inputCls} value={form.seo?.ogImage || ''} onChange={e => updateSeo('ogImage', e.target.value)} /></div>
        </div>
      )}

      {/* Analytics summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-dark-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-dark-700 text-center">
          <Eye className="w-5 h-5 text-gray-300 mx-auto mb-1" />
          <p className="text-xl font-black text-gray-900 dark:text-white">{product.viewsCount || 0}</p>
          <p className="text-xs text-gray-400">Views</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-dark-700 text-center">
          <Package className="w-5 h-5 text-gray-300 mx-auto mb-1" />
          <p className="text-xl font-black text-gray-900 dark:text-white">{product.salesCount || 0}</p>
          <p className="text-xs text-gray-400">Sales</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-dark-700 text-center">
          <Tag className="w-5 h-5 text-gray-300 mx-auto mb-1" />
          <p className="text-xl font-black text-gray-900 dark:text-white">{product.hasVariants ? (product.variants?.length || 0) : 1}</p>
          <p className="text-xs text-gray-400">Variant{product.hasVariants && product.variants?.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Delete modal */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowDelete(false)}>
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-600" /></div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Delete Product?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">This will permanently delete "{product.title}" and all its data.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700">Cancel</button>
              <button onClick={handleDelete} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50">{saving ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
