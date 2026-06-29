import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, Save, Loader2, AlertCircle, CheckCircle, Copy, Zap, ZapOff } from 'lucide-react';
import api from '../../lib/api';

const PROVIDERS = [
  { key: 'moyasar', label: 'Moyasar', desc: 'Saudi-based payment gateway — mada, Visa, Mastercard, Apple Pay' },
  { key: 'tap', label: 'Tap Payments', desc: 'Regional gateway — KNET, mada, cards' },
  { key: 'paytabs', label: 'PayTabs', desc: 'Multi-currency gateway — cards, Apple Pay, STC Pay' },
  { key: 'stripe', label: 'Stripe', desc: 'Global gateway — cards, Apple Pay, Google Pay' },
];

export default function EcommercePayments() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedProvider, setExpandedProvider] = useState(null);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.get('/ecommerce/settings');
      setConfig(res.data.ecommerce?.payments || { defaultProvider: '', codEnabled: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load payment settings');
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
      await api.put('/ecommerce/payments', config);
      setSuccess('Payment settings saved');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const updateProvider = (key, field, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [field]: value },
    }));
  };

  const copyWebhookUrl = (provider) => {
    const url = `${window.location.origin}/api/ecommerce/fulfillment/webhook/${provider}`;
    navigator.clipboard.writeText(url);
    setSuccess(`Webhook URL copied for ${provider}`);
    setTimeout(() => setSuccess(''), 3000);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  const inputCls = "w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelCls = "block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Payment Gateways</h1>
            <p className="text-sm text-gray-400">Configure payment providers for your store</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-bold hover:bg-indigo-700 disabled:opacity-50 text-sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle className="w-4 h-4 flex-shrink-0" />{success}</div>}

      {/* General settings */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5 space-y-4">
        <h3 className="font-bold text-gray-900 dark:text-white">General</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Default Provider</label>
            <select className={inputCls} value={config?.defaultProvider || ''} onChange={e => setConfig(prev => ({ ...prev, defaultProvider: e.target.value }))}>
              <option value="">None</option>
              <option value="cod">Cash on Delivery</option>
              {PROVIDERS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm pb-2">
              <input type="checkbox" checked={config?.codEnabled ?? true} onChange={e => setConfig(prev => ({ ...prev, codEnabled: e.target.checked }))} className="w-4 h-4 rounded" />
              Enable Cash on Delivery (COD)
            </label>
          </div>
        </div>
      </div>

      {/* Provider cards */}
      {PROVIDERS.map(provider => {
        const pConfig = config?.[provider.key] || {};
        const isExpanded = expandedProvider === provider.key;
        const isEnabled = pConfig.enabled;
        return (
          <div key={provider.key} className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedProvider(isExpanded ? null : provider.key)}>
              <div className="flex items-center gap-3">
                {isEnabled ? <Zap className="w-5 h-5 text-emerald-500" /> : <ZapOff className="w-5 h-5 text-gray-300" />}
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{provider.label}</p>
                  <p className="text-xs text-gray-400">{provider.desc}</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${isEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                {isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            {isExpanded && (
              <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-dark-700 space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={pConfig.enabled || false} onChange={e => updateProvider(provider.key, 'enabled', e.target.checked)} className="w-4 h-4 rounded" />
                  Enable {provider.label}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Environment</label>
                    <select className={inputCls} value={pConfig.environment || 'sandbox'} onChange={e => updateProvider(provider.key, 'environment', e.target.value)}>
                      <option value="sandbox">Sandbox / Test</option>
                      <option value="production">Production / Live</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Merchant ID {provider.key === 'paytabs' ? '*' : '(optional)'}</label>
                    <input className={inputCls} value={pConfig.merchantId || ''} onChange={e => updateProvider(provider.key, 'merchantId', e.target.value)} placeholder="Merchant / Profile ID" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Publishable Key</label>
                    <input className={inputCls} value={pConfig.publishableKey || ''} onChange={e => updateProvider(provider.key, 'publishableKey', e.target.value)} placeholder="Public key" />
                  </div>
                  <div>
                    <label className={labelCls}>Secret Key</label>
                    <input className={inputCls} type="password" value={pConfig.secretKey || ''} onChange={e => updateProvider(provider.key, 'secretKey', e.target.value)} placeholder="••••••••" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Webhook Secret</label>
                  <input className={inputCls} type="password" value={pConfig.webhookSecret || ''} onChange={e => updateProvider(provider.key, 'webhookSecret', e.target.value)} placeholder="••••••••" />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-xs text-gray-400">Webhook URL:</span>
                  <code className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{window.location.origin}/api/ecommerce/fulfillment/webhook/{provider.key}</code>
                  <button onClick={() => copyWebhookUrl(provider.key)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><Copy className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
