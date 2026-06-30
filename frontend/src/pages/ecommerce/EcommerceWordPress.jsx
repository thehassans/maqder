import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Save, TestTube, RefreshCw, CheckCircle2, AlertCircle, ExternalLink, Trash2, Upload, Download } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function EcommerceWordPress() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({
    enabled: false,
    siteUrl: '',
    consumerKey: '',
    consumerSecret: '',
    username: '',
    appPassword: '',
    syncDirection: 'push',
    autoSync: false,
  });
  const [testResult, setTestResult] = useState(null);
  const [syncResult, setSyncResult] = useState(null);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.get('/ecommerce/wordpress');
      setConfig(res.data);
      setForm({
        enabled: res.data.enabled || false,
        siteUrl: res.data.siteUrl || '',
        consumerKey: '',
        consumerSecret: '',
        username: '',
        appPassword: '',
        syncDirection: res.data.syncDirection || 'push',
        autoSync: res.data.autoSync || false,
      });
    } catch {
      toast.error('Failed to load WordPress settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/ecommerce/wordpress', form);
      toast.success('WordPress settings saved');
      fetchConfig();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.post('/ecommerce/wordpress/test');
      setTestResult(res.data);
      if (res.data.success) {
        toast.success('WordPress connection successful!');
      } else {
        toast.error(res.data.error || 'Connection failed');
      }
    } catch (err) {
      setTestResult({ success: false, error: err.response?.data?.error || 'Test failed' });
      toast.error('Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await api.post('/ecommerce/wordpress/sync');
      setSyncResult(res.data);
      toast.success('WordPress sync completed');
      fetchConfig();
    } catch (err) {
      setSyncResult({ success: false, error: err.response?.data?.error || 'Sync failed' });
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  const inputCls = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500';
  const labelCls = 'block text-xs font-bold text-gray-500 mb-1';

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">WordPress Integration</h1>
        <p className="text-sm text-gray-500 mt-1">Connect your WordPress + WooCommerce site to sync products and orders.</p>
      </div>

      {/* Status card */}
      {config?.lastSyncAt && (
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${config.lastSyncStatus === 'success' ? 'bg-emerald-50 border border-emerald-100' : config.lastSyncStatus === 'failed' ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
          {config.lastSyncStatus === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-amber-500" />}
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">Last sync: {new Date(config.lastSyncAt).toLocaleString()}</p>
            <p className="text-xs text-gray-500">Status: {config.lastSyncStatus}{config.lastSyncError ? ` — ${config.lastSyncError}` : ''}</p>
          </div>
        </div>
      )}

      {/* Connection form */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-6 space-y-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
            <input type="checkbox" checked={form.enabled} onChange={e => setForm(prev => ({ ...prev, enabled: e.target.checked }))} className="w-4 h-4 rounded" />
            Enable WordPress Integration
          </label>
        </div>

        <div>
          <label className={labelCls}>WordPress Site URL</label>
          <input className={inputCls} value={form.siteUrl} onChange={e => setForm(prev => ({ ...prev, siteUrl: e.target.value }))} placeholder="https://your-store.com" />
        </div>

        <div className="pt-3 border-t border-gray-100 dark:border-dark-700">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">Option 1: WooCommerce REST API Keys</p>
          <p className="text-xs text-gray-400 mb-3">
            Go to WooCommerce → Settings → Advanced → REST API → Add Key (Read/Write permissions).
            <a href="https://woocommerce.com/document/woocommerce-rest-api/" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 hover:underline inline-flex items-center gap-0.5">
              <ExternalLink className="w-3 h-3" /> Docs
            </a>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Consumer Key</label>
              <input className={inputCls} value={form.consumerKey} onChange={e => setForm(prev => ({ ...prev, consumerKey: e.target.value }))} placeholder="ck_xxxxxx" />
            </div>
            <div>
              <label className={labelCls}>Consumer Secret</label>
              <input type="password" className={inputCls} value={form.consumerSecret} onChange={e => setForm(prev => ({ ...prev, consumerSecret: e.target.value }))} placeholder="cs_xxxxxx" />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 dark:border-dark-700">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">Option 2: WordPress Application Password</p>
          <p className="text-xs text-gray-400 mb-3">
            Go to WordPress Admin → Users → Profile → Application Passwords → Add New.
            <a href="https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 hover:underline inline-flex items-center gap-0.5">
              <ExternalLink className="w-3 h-3" /> Guide
            </a>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Username</label>
              <input className={inputCls} value={form.username} onChange={e => setForm(prev => ({ ...prev, username: e.target.value }))} placeholder="wp-admin username" />
            </div>
            <div>
              <label className={labelCls}>Application Password</label>
              <input type="password" className={inputCls} value={form.appPassword} onChange={e => setForm(prev => ({ ...prev, appPassword: e.target.value }))} placeholder="xxxx-xxxx-xxxx-xxxx" />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 dark:border-dark-700">
          <label className={labelCls}>Sync Direction</label>
          <select className={inputCls} value={form.syncDirection} onChange={e => setForm(prev => ({ ...prev, syncDirection: e.target.value }))}>
            <option value="push">Push — Send products to WooCommerce</option>
            <option value="pull">Pull — Import orders from WooCommerce</option>
            <option value="two-way">Two-way — Push products + Pull orders</option>
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.autoSync} onChange={e => setForm(prev => ({ ...prev, autoSync: e.target.checked }))} className="w-4 h-4 rounded" />
            <span className="text-gray-700 dark:text-gray-300">Auto-sync (run every 15 minutes)</span>
          </label>
        </div>

        <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-dark-700">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
          <button
            onClick={handleTest}
            disabled={testing || !form.siteUrl}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm disabled:opacity-60 transition-colors"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
            Test Connection
          </button>
          {config?.hasCredentials && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Sync Now
            </button>
          )}
        </div>

        {/* Test result */}
        {testResult && (
          <div className={`rounded-xl p-3 text-sm ${testResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {testResult.success ? '✓ Connected successfully' : `✕ ${testResult.error}`}
          </div>
        )}

        {/* Sync result */}
        {syncResult && (
          <div className="rounded-xl p-4 bg-gray-50 dark:bg-dark-700 text-sm space-y-2">
            <p className="font-bold text-gray-900 dark:text-white">Sync Results:</p>
            {syncResult.results?.push && (
              <p className="text-gray-600 dark:text-gray-300">
                Products pushed: <strong>{syncResult.results.push.pushed}</strong> / {syncResult.results.push.total}
                {syncResult.results.push.errors?.length > 0 && ` (${syncResult.results.push.errors.length} errors)`}
              </p>
            )}
            {syncResult.results?.pull && (
              <p className="text-gray-600 dark:text-gray-300">
                Orders pulled: <strong>{syncResult.results.pull.pulled}</strong>
                {syncResult.results.pull.errors?.length > 0 && ` (${syncResult.results.pull.errors.length} errors)`}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
