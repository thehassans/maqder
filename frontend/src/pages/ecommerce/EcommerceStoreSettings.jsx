import React, { useState, useEffect } from 'react';
import { Store, Loader2, Save, Globe, Search as SearchIcon, Percent, Bell, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const PLATFORM_BASE = 'shop.maqder.com';

export default function EcommerceStoreSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slug, setSlug] = useState('');
  const [form, setForm] = useState({
    storeStatus: 'draft', storeName: '', storeNameAr: '', subdomain: '',
    currency: 'SAR', defaultTaxRate: 15, pricesIncludeTax: true, weightUnit: 'g',
    lowStockAlertEnabled: false, lowStockAlertEmail: '', lowStockThreshold: 5,
    seo: { metaTitle: '', metaTitleAr: '', metaDescription: '', metaDescriptionAr: '', ogImage: '', faviconUrl: '', googleAnalyticsId: '', metaPixelId: '', robotsIndex: true },
  });
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => { fetchSettings(); }, []);

  useEffect(() => {
    api.get('/ecommerce/low-stock').then(res => setLowStockItems(res.data?.products || [])).catch(() => {});
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/ecommerce/settings');
      const e = res.data?.ecommerce || {};
      setSlug(res.data?.slug || '');
      setForm(prev => ({
        ...prev,
        storeStatus: e.storeStatus || 'draft',
        storeName: e.storeName || '',
        storeNameAr: e.storeNameAr || '',
        subdomain: e.subdomain || res.data?.slug || '',
        currency: e.currency || 'SAR',
        defaultTaxRate: e.defaultTaxRate ?? 15,
        pricesIncludeTax: e.pricesIncludeTax ?? true,
        weightUnit: e.weightUnit || 'g',
        lowStockAlertEnabled: e.lowStockAlertEnabled ?? false,
        lowStockAlertEmail: e.lowStockAlertEmail || '',
        lowStockThreshold: e.lowStockThreshold ?? 5,
        seo: { ...prev.seo, ...(e.seo || {}) },
      }));
    } catch (err) {
      toast.error('Failed to load store settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/ecommerce/settings', form);
      toast.success('Store settings saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const setSeo = (key, value) => setForm(p => ({ ...p, seo: { ...p.seo, [key]: value } }));

  if (loading) {
    return <div className="flex justify-center items-center h-[calc(100vh-8rem)]"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Store className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Store Settings</h1>
            <p className="text-sm text-gray-400">General storefront configuration</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-indigo-600/10 hover:bg-indigo-700 disabled:opacity-60 transition-all">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
      </div>

      {/* General */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">General</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Store Name (English)</label>
            <input value={form.storeName} onChange={e => setForm({ ...form, storeName: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Store Name (Arabic)</label>
            <input value={form.storeNameAr} onChange={e => setForm({ ...form, storeNameAr: e.target.value })} className="input" dir="rtl" />
          </div>
          <div>
            <label className="label">Store Status</label>
            <select value={form.storeStatus} onChange={e => setForm({ ...form, storeStatus: e.target.value })} className="select">
              <option value="draft">Draft (not public)</option>
              <option value="live">Live</option>
              <option value="paused">Paused</option>
            </select>
          </div>
          <div>
            <label className="label">Platform Subdomain</label>
            <div className="flex items-center gap-2">
              <input value={form.subdomain} onChange={e => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} className="input" placeholder={slug} />
              <span className="text-sm text-gray-400 whitespace-nowrap">.{PLATFORM_BASE}</span>
            </div>
            {form.subdomain && (
              <p className="text-xs text-indigo-500 mt-1 flex items-center gap-1">
                <Globe className="w-3 h-3" /> {form.subdomain}.{PLATFORM_BASE}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Commerce defaults */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Percent className="w-5 h-5 text-emerald-500" /> Commerce Defaults</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Currency</label>
            <input value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value.toUpperCase() })} className="input" maxLength={3} />
          </div>
          <div>
            <label className="label">Default Tax Rate (%)</label>
            <input type="number" min="0" max="100" step="0.01" value={form.defaultTaxRate} onChange={e => setForm({ ...form, defaultTaxRate: Number(e.target.value) })} className="input" />
          </div>
          <div>
            <label className="label">Weight Unit</label>
            <select value={form.weightUnit} onChange={e => setForm({ ...form, weightUnit: e.target.value })} className="select">
              <option value="g">Grams (g)</option>
              <option value="kg">Kilograms (kg)</option>
            </select>
          </div>
          <div className="flex items-center gap-3 pt-7">
            <input id="pricesIncludeTax" type="checkbox" checked={form.pricesIncludeTax} onChange={e => setForm({ ...form, pricesIncludeTax: e.target.checked })} className="w-5 h-5 rounded accent-indigo-600" />
            <label htmlFor="pricesIncludeTax" className="text-sm font-medium text-gray-700 dark:text-gray-300">Product prices include tax</label>
          </div>
        </div>
      </div>

      {/* Low stock alerts */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Bell className="w-5 h-5 text-amber-500" /> Low Stock Alerts</h3>
        <div className="flex items-center gap-3">
          <input id="lowStockAlertEnabled" type="checkbox" checked={form.lowStockAlertEnabled} onChange={e => setForm({ ...form, lowStockAlertEnabled: e.target.checked })} className="w-5 h-5 rounded accent-indigo-600" />
          <label htmlFor="lowStockAlertEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable low stock email notifications</label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Alert Email</label>
            <input type="email" value={form.lowStockAlertEmail} onChange={e => setForm({ ...form, lowStockAlertEmail: e.target.value })} className="input" placeholder="alerts@yourstore.com" disabled={!form.lowStockAlertEnabled} />
          </div>
          <div>
            <label className="label">Default Low Stock Threshold</label>
            <input type="number" min="0" value={form.lowStockThreshold} onChange={e => setForm({ ...form, lowStockThreshold: Number(e.target.value) })} className="input" disabled={!form.lowStockAlertEnabled} />
          </div>
        </div>
        {lowStockItems.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> {lowStockItems.length} products currently low on stock</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {lowStockItems.slice(0, 10).map(p => (
                <div key={p._id} className="flex items-center gap-3 p-2 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-700 truncate">{p.title}</p>
                    <p className="text-xs text-gray-400">{p.sku ? `SKU: ${p.sku} · ` : ''}Stock: {p.stockQuantity} / Threshold: {p.lowStockThreshold || form.lowStockThreshold}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SEO */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><SearchIcon className="w-5 h-5 text-amber-500" /> SEO & Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Meta Title (English)</label>
            <input value={form.seo.metaTitle} onChange={e => setSeo('metaTitle', e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Meta Title (Arabic)</label>
            <input value={form.seo.metaTitleAr} onChange={e => setSeo('metaTitleAr', e.target.value)} className="input" dir="rtl" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Meta Description (English)</label>
            <textarea value={form.seo.metaDescription} onChange={e => setSeo('metaDescription', e.target.value)} rows="2" className="input" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Meta Description (Arabic)</label>
            <textarea value={form.seo.metaDescriptionAr} onChange={e => setSeo('metaDescriptionAr', e.target.value)} rows="2" className="input" dir="rtl" />
          </div>
          <div>
            <label className="label">OG Image URL</label>
            <input value={form.seo.ogImage} onChange={e => setSeo('ogImage', e.target.value)} className="input" placeholder="https://..." />
          </div>
          <div>
            <label className="label">Favicon URL</label>
            <input value={form.seo.faviconUrl} onChange={e => setSeo('faviconUrl', e.target.value)} className="input" placeholder="https://..." />
          </div>
          <div>
            <label className="label">Google Analytics ID</label>
            <input value={form.seo.googleAnalyticsId} onChange={e => setSeo('googleAnalyticsId', e.target.value)} className="input" placeholder="G-XXXXXXX" />
          </div>
          <div>
            <label className="label">Meta Pixel ID</label>
            <input value={form.seo.metaPixelId} onChange={e => setSeo('metaPixelId', e.target.value)} className="input" />
          </div>
          <div className="flex items-center gap-3 md:col-span-2">
            <input id="robotsIndex" type="checkbox" checked={form.seo.robotsIndex} onChange={e => setSeo('robotsIndex', e.target.checked)} className="w-5 h-5 rounded accent-indigo-600" />
            <label htmlFor="robotsIndex" className="text-sm font-medium text-gray-700 dark:text-gray-300">Allow search engines to index this store</label>
          </div>
        </div>
      </div>
    </div>
  );
}
