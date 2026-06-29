import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, Loader2, CheckCircle2, XCircle, Clock, RefreshCw, Cloud, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const PLATFORM_BASE = 'shop.maqder.com';

export default function EcommerceDomains() {
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState([]);
  const [slug, setSlug] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const [verifyingId, setVerifyingId] = useState(null);
  const [sslChecking, setSslChecking] = useState(false);
  const [cloudflareStatus, setCloudflareStatus] = useState(null);

  useEffect(() => { fetchDomains(); }, []);

  const fetchDomains = async () => {
    try {
      const res = await api.get('/ecommerce/settings');
      setSlug(res.data?.slug || '');
      const d = await api.get('/ecommerce/domains');
      setDomains(d.data || []);
      // Check Cloudflare config status from the domains response
      setCloudflareStatus(d.headers?.['x-cloudflare-configured'] || null);
    } catch {
      toast.error('Failed to load domains');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newDomain.trim()) return;
    setAdding(true);
    try {
      const res = await api.post('/ecommerce/domains', { hostname: newDomain.trim() });
      setDomains(res.data || []);
      setNewDomain('');
      toast.success('Domain added — verify DNS to activate');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add domain');
    } finally {
      setAdding(false);
    }
  };

  const handleVerify = async (id) => {
    setVerifyingId(id);
    try {
      const res = await api.post(`/ecommerce/domains/${id}/verify`);
      if (res.data.verified) {
        toast.success('Domain verified successfully! SSL is being provisioned.');
      } else {
        toast.error('DNS record not found yet — please add the TXT record and try again');
      }
      fetchDomains();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      await api.put(`/ecommerce/domains/${id}/primary`);
      toast.success('Primary domain updated');
      fetchDomains();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to set primary domain');
    }
  };

  const handleCheckSSL = async () => {
    setSslChecking(true);
    try {
      await api.post('/ecommerce/domains/refresh-ssl');
      toast.success('SSL status refreshed');
      fetchDomains();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to refresh SSL');
    } finally {
      setSslChecking(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this domain?')) return;
    try {
      await api.delete(`/ecommerce/domains/${id}`);
      setDomains(prev => prev.filter(d => d._id !== id));
      toast.success('Domain removed');
    } catch {
      toast.error('Failed to remove domain');
    }
  };

  const statusIcon = (status) => {
    if (status === 'verified') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status === 'failed') return <XCircle className="w-4 h-4 text-rose-500" />;
    return <Clock className="w-4 h-4 text-amber-500" />;
  };

  const statusLabel = (status) => {
    if (status === 'verified') return 'Verified';
    if (status === 'failed') return 'Failed';
    if (status === 'verifying') return 'Verifying';
    return 'Pending';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[calc(100vh-8rem)]"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center">
          <Globe className="w-6 h-6 text-indigo-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Domains</h1>
          <p className="text-sm text-gray-400">Connect a custom domain to your store</p>
        </div>
        {domains.length > 0 && (
          <button
            onClick={handleCheckSSL}
            disabled={sslChecking}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-gray-200 dark:border-dark-600 text-gray-600 hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-60 transition-colors"
          >
            {sslChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            Refresh SSL
          </button>
        )}
      </div>

      {/* Cloudflare status badge */}
      <div className={`rounded-2xl p-4 flex items-center gap-3 ${cloudflareStatus ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100 dark:bg-dark-800 dark:border-dark-700'}`}>
        <Cloud className={`w-5 h-5 ${cloudflareStatus ? 'text-blue-500' : 'text-gray-400'}`} />
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {cloudflareStatus ? 'Cloudflare DNS Auto-Provisioning Active' : 'Cloudflare Not Configured'}
          </p>
          <p className="text-xs text-gray-400">
            {cloudflareStatus
              ? 'DNS records and SSL certificates are automatically provisioned when you add a domain.'
              : 'Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID in the server environment to enable automatic DNS provisioning.'}
          </p>
        </div>
        {cloudflareStatus && (
          <div className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Auto
          </div>
        )}
      </div>

      {/* Platform subdomain card */}
      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-3xl p-6 border border-indigo-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Platform Subdomain (Free)</p>
            <p className="text-xl font-black text-gray-900">
              {slug || 'your-store'}.{PLATFORM_BASE}
            </p>
          </div>
          <div className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active
          </div>
        </div>
      </div>

      {/* Add custom domain */}
      <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add Custom Domain</h3>
        <div className="flex gap-3">
          <input
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            placeholder="store.example.com"
            className="flex-1 input"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newDomain.trim()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-bold hover:bg-indigo-700 disabled:opacity-60 transition-all"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </button>
        </div>
        <div className="mt-4 p-4 bg-amber-50 rounded-2xl text-sm text-amber-800 space-y-2">
          <p className="font-bold">How to connect your domain:</p>
          {cloudflareStatus ? (
            <p className="flex items-center gap-1.5"><Cloud className="w-4 h-4 text-blue-500" /> Cloudflare will automatically create the DNS records and provision SSL — just click <strong>Add</strong> and we handle the rest.</p>
          ) : (
            <>
              <p>1. Add a <code className="bg-amber-100 px-1.5 py-0.5 rounded">CNAME</code> record in your DNS provider pointing <code className="bg-amber-100 px-1.5 py-0.5 rounded">store.example.com</code> → <code className="bg-amber-100 px-1.5 py-0.5 rounded">cname.{PLATFORM_BASE}</code></p>
              <p>2. Add a <code className="bg-amber-100 px-1.5 py-0.5 rounded">TXT</code> record at <code className="bg-amber-100 px-1.5 py-0.5 rounded">_maqder-verify.store.example.com</code> with the verification token shown below</p>
              <p>3. Click <strong>Verify</strong> — SSL is provisioned automatically once verified</p>
            </>
          )}
        </div>
      </div>

      {/* Custom domains list */}
      {domains.length > 0 && (
        <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Custom Domains ({domains.length})</h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-dark-700">
            {domains.map(domain => (
              <div key={domain._id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex-shrink-0">
                  {statusIcon(domain.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{domain.hostname}</p>
                    {domain.isPrimary && (
                      <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold">PRIMARY</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-400">{statusLabel(domain.status)}</p>
                    {domain.sslStatus === 'active' && (
                      <span className="flex items-center gap-0.5 text-xs text-emerald-600 font-bold"><ShieldCheck className="w-3 h-3" /> SSL Active</span>
                    )}
                    {domain.sslStatus === 'pending' && (
                      <span className="flex items-center gap-0.5 text-xs text-amber-600 font-bold"><Clock className="w-3 h-3" /> SSL Pending</span>
                    )}
                  </div>
                  {domain.status !== 'verified' && domain.verificationToken && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <code className="text-[10px] bg-gray-100 dark:bg-dark-700 px-2 py-1 rounded text-gray-600 dark:text-gray-400 break-all">
                        TXT _maqder-verify.{domain.hostname} = {domain.verificationToken}
                      </code>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {domain.status === 'verified' && !domain.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(domain._id)}
                      className="px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors"
                    >
                      Set Primary
                    </button>
                  )}
                  {domain.status !== 'verified' && (
                    <button
                      onClick={() => handleVerify(domain._id)}
                      disabled={verifyingId === domain._id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 disabled:opacity-60 transition-colors"
                    >
                      {verifyingId === domain._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Verify
                    </button>
                  )}
                  {domain.status === 'verified' && (
                    <a
                      href={`https://${domain.hostname}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Open store"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(domain._id)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
