import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Save, Loader2, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

const emptyVariant = () => ({
  sku: '',
  barcode: '',
  option1Value: '',
  option2Value: '',
  option3Value: '',
  price: 0,
  compareAtPrice: 0,
  costPrice: 0,
  stockQuantity: 0,
  trackInventory: true,
  weight: 0,
  isActive: true,
});

export default function EcommerceAddProduct() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  const [form, setForm] = useState({
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    productType: 'physical',
    status: 'draft',
    category: '',
    tags: [],
    vendor: '',
    brand: '',
    basePrice: 0,
    compareAtPrice: 0,
    costPrice: 0,
    taxRate: 15,
    taxIncluded: true,
    currency: 'SAR',
    hasVariants: false,
    option1Name: '',
    option2Name: '',
    option3Name: '',
    variants: [],
    stockQuantity: 0,
    trackInventory: true,
    continueSellingWhenOOS: false,
    sku: '',
    barcode: '',
    weight: 0,
    weightUnit: 'g',
    requiresShipping: true,
    images: [],
    seo: { metaTitle: '', metaDescription: '', slug: '', ogImage: '' },
  });

  const [tagInput, setTagInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const updateSeo = (key, value) => setForm(prev => ({ ...prev, seo: { ...prev.seo, [key]: value } }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      update('tags', [...form.tags, t]);
    }
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

  const generateVariants = () => {
    const opts = [];
    if (form.option1Name) {
      const vals = form.variants.map(v => v.option1Value).filter(Boolean);
      opts.push({ name: form.option1Name, values: [...new Set(vals)] });
    }
    // Simple: just create one variant per combination of option values entered
    // For now, start with a single empty variant row
    if (form.variants.length === 0) {
      update('variants', [emptyVariant()]);
    }
  };

  const addVariant = () => update('variants', [...form.variants, emptyVariant()]);
  const removeVariant = (idx) => update('variants', form.variants.filter((_, i) => i !== idx));
  const updateVariant = (idx, key, value) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.map((v, i) => i === idx ? { ...v, [key]: value } : v),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Product title is required');
      setActiveTab('general');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (!payload.hasVariants) {
        payload.variants = [];
        payload.option1Name = '';
        payload.option2Name = '';
        payload.option3Name = '';
      } else if (payload.variants.length === 0) {
        payload.variants = [emptyVariant()];
      }
      const res = await api.post('/ecommerce/products', payload);
      navigate(`/app/dashboard/ecommerce/products/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelCls = "block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider";
  const tabCls = (tab) => `px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700'}`;

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Plus className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Add Product</h1>
            <p className="text-sm text-gray-400">Create a new in-house product</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-full border border-gray-200 dark:border-dark-600 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 text-sm">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-bold hover:bg-indigo-700 disabled:opacity-50 text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Product
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['general', 'pricing', 'inventory', 'variants', 'images', 'seo'].map(tab => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={tabCls(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* General */}
      {activeTab === 'general' && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-6 space-y-4">
          <div>
            <label className={labelCls}>Title *</label>
            <input className={inputCls} value={form.title} onChange={e => update('title', e.target.value)} placeholder="Product name" required />
          </div>
          <div>
            <label className={labelCls}>Title (Arabic)</label>
            <input className={inputCls} value={form.titleAr} onChange={e => update('titleAr', e.target.value)} placeholder="اسم المنتج" dir="rtl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Description</label>
              <textarea className={inputCls} rows={4} value={form.description} onChange={e => update('description', e.target.value)} placeholder="Product description" />
            </div>
            <div>
              <label className={labelCls}>Description (Arabic)</label>
              <textarea className={inputCls} rows={4} value={form.descriptionAr} onChange={e => update('descriptionAr', e.target.value)} placeholder="وصف المنتج" dir="rtl" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Type</label>
              <select className={inputCls} value={form.productType} onChange={e => update('productType', e.target.value)}>
                <option value="physical">Physical</option>
                <option value="digital">Digital</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.status} onChange={e => update('status', e.target.value)}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <input className={inputCls} value={form.category} onChange={e => update('category', e.target.value)} placeholder="e.g. Electronics" />
            </div>
            <div>
              <label className={labelCls}>Brand</label>
              <input className={inputCls} value={form.brand} onChange={e => update('brand', e.target.value)} placeholder="Brand name" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                className={inputCls}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Type a tag and press Enter"
              />
              <button type="button" onClick={addTag} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-dark-700 font-bold text-sm">Add</button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                    {t}
                    <button type="button" onClick={() => removeTag(t)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pricing */}
      {activeTab === 'pricing' && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Base Price (SAR)</label>
              <input type="number" step="0.01" min="0" className={inputCls} value={form.basePrice} onChange={e => update('basePrice', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className={labelCls}>Compare-at Price</label>
              <input type="number" step="0.01" min="0" className={inputCls} value={form.compareAtPrice} onChange={e => update('compareAtPrice', parseFloat(e.target.value) || 0)} placeholder="Original price" />
            </div>
            <div>
              <label className={labelCls}>Cost Price</label>
              <input type="number" step="0.01" min="0" className={inputCls} value={form.costPrice} onChange={e => update('costPrice', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className={labelCls}>Tax Rate (%)</label>
              <input type="number" step="0.01" min="0" className={inputCls} value={form.taxRate} onChange={e => update('taxRate', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.taxIncluded} onChange={e => update('taxIncluded', e.target.checked)} className="w-4 h-4 rounded" />
              Prices include tax
            </label>
            <div>
              <label className={labelCls}>Currency</label>
              <select className={inputCls} value={form.currency} onChange={e => update('currency', e.target.value)}>
                <option value="SAR">SAR</option>
                <option value="USD">USD</option>
                <option value="AED">AED</option>
                <option value="KWD">KWD</option>
                <option value="QAR">QAR</option>
                <option value="BHD">BHD</option>
                <option value="OMR">OMR</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Inventory */}
      {activeTab === 'inventory' && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-6 space-y-4">
          {form.hasVariants ? (
            <p className="text-sm text-gray-400 bg-amber-50 border border-amber-200 rounded-xl p-3">Inventory is managed per-variant in the Variants tab.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>SKU</label>
                  <input className={inputCls} value={form.sku} onChange={e => update('sku', e.target.value)} placeholder="Stock keeping unit" />
                </div>
                <div>
                  <label className={labelCls}>Barcode</label>
                  <input className={inputCls} value={form.barcode} onChange={e => update('barcode', e.target.value)} placeholder="GTIN / UPC" />
                </div>
                <div>
                  <label className={labelCls}>Stock Quantity</label>
                  <input type="number" min="0" className={inputCls} value={form.stockQuantity} onChange={e => update('stockQuantity', parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.trackInventory} onChange={e => update('trackInventory', e.target.checked)} className="w-4 h-4 rounded" />
                  Track inventory
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.continueSellingWhenOOS} onChange={e => update('continueSellingWhenOOS', e.target.checked)} className="w-4 h-4 rounded" />
                  Continue selling when out of stock
                </label>
              </div>
            </>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-dark-700">
            <div>
              <label className={labelCls}>Weight</label>
              <input type="number" step="0.01" min="0" className={inputCls} value={form.weight} onChange={e => update('weight', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className={labelCls}>Weight Unit</label>
              <select className={inputCls} value={form.weightUnit} onChange={e => update('weightUnit', e.target.value)}>
                <option value="g">grams</option>
                <option value="kg">kilograms</option>
              </select>
            </div>
            <label className="flex items-end gap-2 text-sm pb-2">
              <input type="checkbox" checked={form.requiresShipping} onChange={e => update('requiresShipping', e.target.checked)} className="w-4 h-4 rounded" />
              Requires shipping
            </label>
          </div>
        </div>
      )}

      {/* Variants */}
      {activeTab === 'variants' && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-6 space-y-4">
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={form.hasVariants} onChange={e => { update('hasVariants', e.target.checked); if (e.target.checked && form.variants.length === 0) generateVariants(); }} className="w-4 h-4 rounded" />
            This product has variants (e.g. size, color)
          </label>
          {form.hasVariants && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Option 1 Name</label>
                  <input className={inputCls} value={form.option1Name} onChange={e => update('option1Name', e.target.value)} placeholder="e.g. Size" />
                </div>
                <div>
                  <label className={labelCls}>Option 2 Name</label>
                  <input className={inputCls} value={form.option2Name} onChange={e => update('option2Name', e.target.value)} placeholder="e.g. Color" />
                </div>
                <div>
                  <label className={labelCls}>Option 3 Name</label>
                  <input className={inputCls} value={form.option3Name} onChange={e => update('option3Name', e.target.value)} placeholder="e.g. Material" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-dark-700">
                      <th className="px-2 py-2">{form.option1Name || 'Opt 1'}</th>
                      <th className="px-2 py-2">{form.option2Name || 'Opt 2'}</th>
                      <th className="px-2 py-2">{form.option3Name || 'Opt 3'}</th>
                      <th className="px-2 py-2">SKU</th>
                      <th className="px-2 py-2">Price</th>
                      <th className="px-2 py-2">Stock</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.variants.map((v, idx) => (
                      <tr key={idx} className="border-b border-gray-50 dark:border-dark-700/50">
                        <td className="px-2 py-2"><input className={inputCls} value={v.option1Value} onChange={e => updateVariant(idx, 'option1Value', e.target.value)} placeholder="—" /></td>
                        <td className="px-2 py-2"><input className={inputCls} value={v.option2Value} onChange={e => updateVariant(idx, 'option2Value', e.target.value)} placeholder="—" /></td>
                        <td className="px-2 py-2"><input className={inputCls} value={v.option3Value} onChange={e => updateVariant(idx, 'option3Value', e.target.value)} placeholder="—" /></td>
                        <td className="px-2 py-2"><input className={inputCls} value={v.sku} onChange={e => updateVariant(idx, 'sku', e.target.value)} /></td>
                        <td className="px-2 py-2"><input type="number" step="0.01" className={inputCls} value={v.price} onChange={e => updateVariant(idx, 'price', parseFloat(e.target.value) || 0)} /></td>
                        <td className="px-2 py-2"><input type="number" className={inputCls} value={v.stockQuantity} onChange={e => updateVariant(idx, 'stockQuantity', parseInt(e.target.value) || 0)} /></td>
                        <td className="px-2 py-2"><button type="button" onClick={() => removeVariant(idx)} className="p-1 rounded-lg text-red-400 hover:bg-red-50"><X className="w-4 h-4" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={addVariant} className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700">
                <Plus className="w-4 h-4" />
                Add Variant
              </button>
            </>
          )}
        </div>
      )}

      {/* Images */}
      {activeTab === 'images' && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-6 space-y-4">
          <div className="flex gap-2">
            <input className={inputCls} value={imageUrl} onChange={e => setImageUrl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImage(); } }} placeholder="Paste image URL" />
            <button type="button" onClick={addImage} className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm">Add</button>
          </div>
          {form.images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {form.images.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img src={img.url} alt={img.altText} className="w-full h-32 rounded-xl object-cover border border-gray-200" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-gray-400 mt-1 truncate">{img.url}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No images added yet</p>
            </div>
          )}
        </div>
      )}

      {/* SEO */}
      {activeTab === 'seo' && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-6 space-y-4">
          <div>
            <label className={labelCls}>Meta Title</label>
            <input className={inputCls} value={form.seo.metaTitle} onChange={e => updateSeo('metaTitle', e.target.value)} placeholder="SEO title (defaults to product title)" />
          </div>
          <div>
            <label className={labelCls}>Meta Description</label>
            <textarea className={inputCls} rows={3} value={form.seo.metaDescription} onChange={e => updateSeo('metaDescription', e.target.value)} placeholder="SEO description for search engines" />
          </div>
          <div>
            <label className={labelCls}>URL Slug</label>
            <input className={inputCls} value={form.seo.slug} onChange={e => updateSeo('slug', e.target.value)} placeholder="auto-generated from title if empty" />
          </div>
          <div>
            <label className={labelCls}>OG Image URL</label>
            <input className={inputCls} value={form.seo.ogImage} onChange={e => updateSeo('ogImage', e.target.value)} placeholder="Open Graph image URL" />
          </div>
        </div>
      )}
    </form>
  );
}
