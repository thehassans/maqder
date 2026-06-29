import React, { useState, useEffect, useCallback } from 'react';
import { Truck, Save, Loader2, AlertCircle, CheckCircle, Zap, ZapOff } from 'lucide-react';
import api from '../../lib/api';

const COURIERS = [
  { key: 'smsa', label: 'SMSA Express', desc: 'Saudi domestic and international express delivery' },
  { key: 'aramex', label: 'Aramex', desc: 'Regional and global logistics — express, freight' },
  { key: 'naqel', label: 'Naqel Express', desc: 'Saudi-based domestic and GCC shipping' },
  { key: 'imile', label: 'iMile', desc: 'Cross-border e-commerce delivery — MENA focus' },
];

export default function EcommerceCouriers() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedCourier, setExpandedCourier] = useState(null);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.get('/ecommerce/settings');
      setConfig(res.data.ecommerce?.couriers || { flatRate: { enabled: true, price: 25, freeShippingThreshold: 0 } });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load courier settings');
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
      await api.put('/ecommerce/couriers', config);
      setSuccess('Courier settings saved');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const updateCourier = (key, field, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [field]: value },
    }));
  };

  const updateFlatRate = (field, value) => {
    setConfig(prev => ({
      ...prev,
      flatRate: { ...(prev.flatRate || {}), [field]: value },
    }));
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  const inputCls = "w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelCls = "block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Truck className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Shipping & Couriers</h1>
            <p className="text-sm text-gray-400">Configure courier integrations and shipping rates</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-bold hover:bg-indigo-700 disabled:opacity-50 text-sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle className="w-4 h-4 flex-shrink-0" />{success}</div>}

      {/* Flat rate shipping */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white">Flat Rate Shipping</h3>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={config?.flatRate?.enabled ?? true} onChange={e => updateFlatRate('enabled', e.target.checked)} className="w-4 h-4 rounded" />
            Enabled
          </label>
        </div>
        {config?.flatRate?.enabled && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Flat Rate Price (SAR)</label>
              <input type="number" step="0.01" min="0" className={inputCls} value={config?.flatRate?.price || 0} onChange={e => updateFlatRate('price', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className={labelCls}>Free Shipping Threshold (SAR)</label>
              <input type="number" step="0.01" min="0" className={inputCls} value={config?.flatRate?.freeShippingThreshold || 0} onChange={e => updateFlatRate('freeShippingThreshold', parseFloat(e.target.value) || 0)} placeholder="0 = no free shipping" />
            </div>
          </div>
        )}
      </div>

      {/* Courier cards */}
      {COURIERS.map(courier => {
        const cConfig = config?.[courier.key] || {};
        const isExpanded = expandedCourier === courier.key;
        const isEnabled = cConfig.enabled;
        return (
          <div key={courier.key} className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedCourier(isExpanded ? null : courier.key)}>
              <div className="flex items-center gap-3">
                {isEnabled ? <Zap className="w-5 h-5 text-emerald-500" /> : <ZapOff className="w-5 h-5 text-gray-300" />}
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{courier.label}</p>
                  <p className="text-xs text-gray-400">{courier.desc}</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${isEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                {isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            {isExpanded && (
              <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-dark-700 space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={cConfig.enabled || false} onChange={e => updateCourier(courier.key, 'enabled', e.target.checked)} className="w-4 h-4 rounded" />
                  Enable {courier.label}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Environment</label>
                    <select className={inputCls} value={cConfig.environment || 'sandbox'} onChange={e => updateCourier(courier.key, 'environment', e.target.value)}>
                      <option value="sandbox">Sandbox / Test</option>
                      <option value="production">Production / Live</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Account Number</label>
                    <input className={inputCls} value={cConfig.accountNumber || ''} onChange={e => updateCourier(courier.key, 'accountNumber', e.target.value)} placeholder="Account / Customer number" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>API Key</label>
                    <input className={inputCls} type="password" value={cConfig.apiKey || ''} onChange={e => updateCourier(courier.key, 'apiKey', e.target.value)} placeholder="••••••••" />
                  </div>
                  <div>
                    <label className={labelCls}>API Secret / Passphrase</label>
                    <input className={inputCls} type="password" value={cConfig.apiSecret || ''} onChange={e => updateCourier(courier.key, 'apiSecret', e.target.value)} placeholder="••••••••" />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
