import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Save, Loader2, AlertCircle, CheckCircle, Zap, ZapOff, Eye, Code } from 'lucide-react';
import api from '../../lib/api';

const PIXELS = [
  { key: 'googleAnalytics', label: 'Google Analytics 4', desc: 'Web analytics — GA4 measurement ID', field: 'measurementId', fieldLabel: 'Measurement ID', placeholder: 'G-XXXXXXXXXX' },
  { key: 'facebookPixel', label: 'Facebook (Meta) Pixel', desc: 'Facebook & Instagram ads tracking', field: 'pixelId', fieldLabel: 'Pixel ID', placeholder: '123456789012345' },
  { key: 'tiktokPixel', label: 'TikTok Pixel', desc: 'TikTok ads tracking', field: 'pixelId', fieldLabel: 'Pixel ID', placeholder: 'CXXXXXXXXXXXXXXXXX' },
  { key: 'snapchatPixel', label: 'Snapchat Pixel', desc: 'Snapchat ads tracking', field: 'pixelId', fieldLabel: 'Pixel ID', placeholder: 'xxxxxxxx-xxxx-xxxx' },
  { key: 'twitterPixel', label: 'Twitter/X Pixel', desc: 'Twitter ads tracking', field: 'pixelId', fieldLabel: 'Pixel ID', placeholder: 'abcdef' },
  { key: 'googleAds', label: 'Google Ads', desc: 'Google Ads conversion tracking', fields: [
    { name: 'conversionId', label: 'Conversion ID', placeholder: 'AW-XXXXXXXXX' },
    { name: 'conversionLabel', label: 'Conversion Label', placeholder: 'xxxxxxxx' },
  ]},
];

const CAPI_PIXELS = [
  { key: 'snapchatCapi', label: 'Snapchat CAPI', desc: 'Snapchat Conversions API — server-side', fields: [
    { name: 'pixelId', label: 'Pixel ID', placeholder: 'xxxxxxxx-xxxx-xxxx' },
    { name: 'token', label: 'Access Token', placeholder: '••••••••', secret: true },
  ]},
  { key: 'tiktokCapi', label: 'TikTok CAPI', desc: 'TikTok Events API — server-side', fields: [
    { name: 'pixelCode', label: 'Pixel Code', placeholder: 'CXXXXXXXXXXXXXXXXX' },
    { name: 'accessToken', label: 'Access Token', placeholder: '••••••••', secret: true },
  ]},
];

export default function EcommercePixels() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expanded, setExpanded] = useState(null);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.get('/ecommerce/settings');
      setConfig(res.data.ecommerce?.pixels || {});
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load pixel settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/ecommerce/pixels', config);
      setSuccess('Pixel settings saved');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const update = (key, field, value) => {
    setConfig(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: value } }));
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  const inputCls = "w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelCls = "block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider";

  const renderPixel = (p, isCAPI = false) => {
    const pConfig = config?.[p.key] || {};
    const isExpanded = expanded === p.key;
    const isEnabled = pConfig.enabled;
    return (
      <div key={p.key} className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(isExpanded ? null : p.key)}>
          <div className="flex items-center gap-3">
            {isEnabled ? <Zap className="w-5 h-5 text-emerald-500" /> : <ZapOff className="w-5 h-5 text-gray-300" />}
            <div>
              <p className="font-bold text-gray-900 dark:text-white">{p.label}</p>
              <p className="text-xs text-gray-400">{p.desc}</p>
            </div>
          </div>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${isEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
            {isEnabled ? 'Active' : 'Off'}
          </span>
        </div>
        {isExpanded && (
          <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-dark-700 space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={pConfig.enabled || false} onChange={e => update(p.key, 'enabled', e.target.checked)} className="w-4 h-4 rounded" />
              Enable {p.label}
            </label>
            {p.field && (
              <div>
                <label className={labelCls}>{p.fieldLabel}</label>
                <input className={inputCls} value={pConfig[p.field] || ''} onChange={e => update(p.key, p.field, e.target.value)} placeholder={p.placeholder} />
              </div>
            )}
            {p.fields && p.fields.map(f => (
              <div key={f.name}>
                <label className={labelCls}>{f.label}</label>
                <input className={inputCls} type={f.secret ? 'password' : 'text'} value={pConfig[f.name] || ''} onChange={e => update(p.key, f.name, e.target.value)} placeholder={f.placeholder} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Tracking Pixels</h1>
            <p className="text-sm text-gray-400">Configure marketing pixels and conversion APIs</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-bold hover:bg-indigo-700 disabled:opacity-50 text-sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle className="w-4 h-4 flex-shrink-0" />{success}</div>}

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <Eye className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-800">How pixels work</p>
          <p className="text-xs text-blue-600 mt-1">Client-side pixels are automatically injected into your storefront <code className="bg-blue-100 px-1 rounded">&lt;head&gt;</code> and fire on these events with proper per-platform event name mapping:</p>
          <div className="grid grid-cols-2 gap-1 mt-2 text-xs text-blue-700">
            <span>• <strong>PageView</strong> — on every page load</span>
            <span>• <strong>ViewContent</strong> — product detail view</span>
            <span>• <strong>AddToCart</strong> — add item to cart</span>
            <span>• <strong>AddToWishlist</strong> — add to wishlist</span>
            <span>• <strong>Search</strong> — search query submitted</span>
            <span>• <strong>InitiateCheckout</strong> — checkout page view</span>
            <span>• <strong>AddPaymentInfo</strong> — payment method selected</span>
            <span>• <strong>Purchase</strong> — order confirmed (with real value)</span>
          </div>
          <p className="text-xs text-blue-600 mt-2">Google Ads conversions fire automatically on Purchase with <code className="bg-blue-100 px-1 rounded">send_to</code> parameter. Purchase events are deduplicated per order ID. CAPI integrations send the same events server-side for better attribution.</p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Client-Side Pixels</h2>
        <div className="space-y-3">{PIXELS.map(p => renderPixel(p))}</div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Code size={14} /> Server-Side (CAPI)</h2>
        <div className="space-y-3">{CAPI_PIXELS.map(p => renderPixel(p, true))}</div>
      </div>
    </div>
  );
}
