import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, Loader2, CheckCircle2, XCircle, Clock, RefreshCw, Cloud, ShieldCheck, AlertCircle, ExternalLink, X, Unlink, Copy, Check } from 'lucide-react';
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
  const [retryingId, setRetryingId] = useState(null);
  const [sslChecking, setSslChecking] = useState(false);
  const [cloudflareStatus, setCloudflareStatus] = useState(null);
  const [tenantCloudflareConnected, setTenantCloudflareConnected] = useState(false);
  const [tenantCloudflareOAuth, setTenantCloudflareOAuth] = useState(false);
  const [cloudflareOAuthConfigured, setCloudflareOAuthConfigured] = useState(false);
  const [showCfModal, setShowCfModal] = useState(false);
  const [connectingCf, setConnectingCf] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  const [autoChecking, setAutoChecking] = useState(false);

  useEffect(() => { fetchDomains(); }, []);

  // Auto-verify polling: while there are pending domains, silently re-check every 20s
  useEffect(() => {
    const hasPending = domains.some(d => d.status === 'pending' || d.status === 'verifying');
    if (!hasPending) { setAutoChecking(false); return; }
    setAutoChecking(true);
    const interval = setInterval(() => { silentVerifyPending(); }, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domains]);

  const silentVerifyPending = async () => {
    const pending = domains.filter(d => d.status === 'pending' || d.status === 'verifying');
    let anyVerified = false;
    for (const d of pending) {
      try {
        const res = await api.post(`/ecommerce/domains/${d._id}/verify`);
        if (res.data?.verified) anyVerified = true;
      } catch { /* keep polling silently */ }
    }
    if (anyVerified) {
      toast.success('Domain verified automatically! SSL is being provisioned.');
    }
    fetchDomains();
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 2000);
    }).catch(() => toast.error('Failed to copy'));
  };

  const fetchDomains = async () => {
    try {
      const res = await api.get('/ecommerce/settings');
      setSlug(res.data?.slug || '');
      const d = await api.get('/ecommerce/domains');
      setDomains(d.data || []);
      // Check Cloudflare config status from the domains response
      setCloudflareStatus(d.headers?.['x-cloudflare-configured'] || null);
      setTenantCloudflareConnected(d.headers?.['x-tenant-cloudflare-connected'] === 'true');
      setTenantCloudflareOAuth(d.headers?.['x-tenant-cloudflare-oauth'] === 'true');
      setCloudflareOAuthConfigured(d.headers?.['x-cloudflare-oauth-configured'] === 'true');
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

  const handleConnectCloudflare = async () => {
    setConnectingCf(true);
    try {
      const res = await api.get('/ecommerce/domains/cloudflare/oauth-url');
      const url = res.data?.url;
      if (!url) throw new Error('No OAuth URL returned');

      const width = 520;
      const height = 680;
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;
      const popup = window.open(
        url,
        'cloudflareOAuth',
        `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,location=no,status=no`
      );
      if (!popup) {
        toast.error('Popup blocked — please allow popups for this site');
        return;
      }

      // Listen for the popup to report success
      const onMessage = (event) => {
        if (event.data?.type === 'cloudflare-oauth-success') {
          window.removeEventListener('message', onMessage);
          setShowCfModal(false);
          setConnectingCf(false);
          fetchDomains();
          toast.success('Cloudflare connected — DNS will be added automatically');
        }
      };
      window.addEventListener('message', onMessage);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to start Cloudflare OAuth');
      setConnectingCf(false);
    }
  };

  const handleDisconnectCloudflare = async () => {
    if (!confirm('Disconnect your Cloudflare account? Custom domains will need manual DNS configuration.')) return;
    try {
      await api.delete('/ecommerce/domains/cloudflare');
      toast.success('Cloudflare account disconnected');
      setTenantCloudflareConnected(false);
      fetchDomains();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to disconnect');
    }
  };

  const handleRetryCloudflare = async (id) => {
    setRetryingId(id);
    try {
      const res = await api.post(`/ecommerce/domains/${id}/retry-cloudflare`);
      toast.success(res.data?.message || 'Cloudflare provisioning retried');
      fetchDomains();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cloudflare retry failed');
      fetchDomains();
    } finally {
      setRetryingId(null);
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

  const cfStatusLabel = (cfStatus) => {
    if (!cfStatus) return '';
    if (cfStatus === 'active') return 'Cloudflare Active';
    if (cfStatus === 'pending') return 'Cloudflare Pending';
    if (cfStatus === 'pending_validation') return 'Cloudflare Validating';
    return `Cloudflare: ${cfStatus}`;
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
            {cloudflareStatus
              ? (tenantCloudflareOAuth
                ? 'Cloudflare Connected (Auto-DNS)'
                : tenantCloudflareConnected
                  ? 'Cloudflare Connected (Tenant Account)'
                  : 'Cloudflare DNS Auto-Provisioning Active')
              : 'Cloudflare Not Configured'}
          </p>
          <p className="text-xs text-gray-400">
            {cloudflareStatus
              ? (tenantCloudflareOAuth
                ? 'Your Cloudflare account is connected. CNAME records and SSL are created automatically when you add a domain.'
                : tenantCloudflareConnected
                  ? 'Your Cloudflare account is connected. DNS records and SSL are provisioned through your own zone.'
                  : 'DNS records and SSL certificates are automatically provisioned when you add a domain.')
              : cloudflareOAuthConfigured
                ? 'Connect your Cloudflare account to enable automatic DNS and SSL.'
                : 'Connect your Cloudflare account or ask your admin to set CLOUDFLARE_OAUTH_CLIENT_ID and CLOUDFLARE_OAUTH_CLIENT_SECRET on the server.'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {tenantCloudflareConnected ? (
            <button
              onClick={handleDisconnectCloudflare}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
            >
              <Unlink className="w-3.5 h-3.5" /> Disconnect
            </button>
          ) : (
            <button
              onClick={() => setShowCfModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              <Cloud className="w-3.5 h-3.5" /> Connect Cloudflare
            </button>
          )}
          {cloudflareStatus && (
            <div className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {tenantCloudflareOAuth ? 'Auto-DNS' : tenantCloudflareConnected ? 'Tenant' : 'Auto'}
            </div>
          )}
        </div>
      </div>

      {/* Platform subdomain card */}
      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-3xl p-6 border border-indigo-100">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Platform Subdomain (Free)</p>
            <p className="text-xl font-black text-gray-900 break-all">
              {slug || 'your-store'}.{PLATFORM_BASE}
            </p>
            <p className="text-xs text-indigo-500 mt-1">Ready to use instantly — no setup required.</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => copyToClipboard(`${slug || 'your-store'}.${PLATFORM_BASE}`, 'subdomain')}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/70 text-indigo-700 rounded-xl text-xs font-bold hover:bg-white transition-colors"
            >
              {copiedKey === 'subdomain' ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </button>
            <a
              href={`https://${slug || 'your-store'}.${PLATFORM_BASE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Visit
            </a>
            <div className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active
            </div>
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
          {tenantCloudflareOAuth ? (
            <>
              <p className="flex items-center gap-1.5"><Cloud className="w-4 h-4 text-blue-500" /> Your Cloudflare account is connected. DNS and SSL are created automatically.</p>
              <p>1. Click <strong>Add</strong> to register the domain</p>
              <p>2. We create a CNAME record and enable Cloudflare proxy in your zone automatically</p>
              <p>3. SSL is active immediately — no manual DNS steps needed</p>
            </>
          ) : cloudflareStatus ? (
            <>
              <p className="flex items-center gap-1.5"><Cloud className="w-4 h-4 text-blue-500" /> Cloudflare for SaaS will create a custom hostname and provision SSL automatically.</p>
              <p>1. Click <strong>Add</strong> to register the domain</p>
              <p>2. Add the DNS records shown below into your DNS provider (the CNAME points to your fallback origin)</p>
              <p>3. Click <strong>Verify</strong> — Cloudflare will confirm ownership and issue SSL</p>
            </>
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
                    {domain.isPrimary && domain.status === 'verified' && (
                      <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold">PRIMARY</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className={`text-xs font-bold ${domain.status === 'verified' ? 'text-emerald-600' : domain.status === 'failed' ? 'text-rose-600' : 'text-amber-600'}`}>{statusLabel(domain.status)}</p>
                    {domain.cfStatus && (
                      <span className="text-xs text-blue-600 font-bold">{cfStatusLabel(domain.cfStatus)}</span>
                    )}
                    {domain.sslStatus === 'active' && (
                      <span className="flex items-center gap-0.5 text-xs text-emerald-600 font-bold"><ShieldCheck className="w-3 h-3" /> SSL Active</span>
                    )}
                    {domain.sslStatus === 'pending' && (
                      <span className="flex items-center gap-0.5 text-xs text-amber-600 font-bold"><Clock className="w-3 h-3" /> SSL Pending</span>
                    )}
                  </div>
                  {domain.cfErrorMessage && domain.status === 'failed' && (
                    <div className="mt-1.5 p-2 bg-rose-50 rounded-lg text-xs text-rose-700 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>{domain.cfErrorMessage}</span>
                    </div>
                  )}
                  {domain.status !== 'verified' && (
                    <div className="mt-3 rounded-xl border border-gray-100 dark:border-dark-700 bg-gray-50/60 dark:bg-dark-900/40 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Add these DNS records</p>
                        {autoChecking && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-500">
                            <Loader2 className="w-3 h-3 animate-spin" /> Auto-checking…
                          </span>
                        )}
                      </div>
                      {domain.cfCnameTarget ? (
                        <>
                          <DnsRecordRow type="CNAME" name={domain.hostname} value={domain.cfCnameTarget} copyKey={`${domain._id}-cname`} copiedKey={copiedKey} onCopy={copyToClipboard} />
                          {domain.cfTxtName && (
                            <DnsRecordRow type="TXT" name={domain.cfTxtName} value={domain.cfTxtValue} copyKey={`${domain._id}-txt`} copiedKey={copiedKey} onCopy={copyToClipboard} />
                          )}
                        </>
                      ) : domain.verificationToken ? (
                        <>
                          <DnsRecordRow type="CNAME" name={domain.hostname} value={`cname.${PLATFORM_BASE}`} copyKey={`${domain._id}-cname`} copiedKey={copiedKey} onCopy={copyToClipboard} />
                          <DnsRecordRow type="TXT" name={`_maqder-verify.${domain.hostname}`} value={domain.verificationToken} copyKey={`${domain._id}-txt`} copiedKey={copiedKey} onCopy={copyToClipboard} />
                        </>
                      ) : null}
                      <p className="text-[11px] text-gray-400 pt-1">DNS changes can take a few minutes to propagate. We'll verify automatically, or click <strong>Verify</strong> to check now.</p>
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
                  {domain.status === 'failed' && cloudflareStatus && (
                    <button
                      onClick={() => handleRetryCloudflare(domain._id)}
                      disabled={retryingId === domain._id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 disabled:opacity-60 transition-colors"
                      title="Retry Cloudflare provisioning"
                    >
                      {retryingId === domain._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Retry CF
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

      {/* Connect Cloudflare Account Modal */}
      {showCfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Cloud className="w-5 h-5 text-blue-500" /> Connect Cloudflare
              </h3>
              <button onClick={() => { setShowCfModal(false); }} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Log in with your Cloudflare account to enable automatic DNS and SSL. We will create CNAME records in your Cloudflare zone when you add a domain.
              </p>
              <button
                onClick={handleConnectCloudflare}
                disabled={connectingCf}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {connectingCf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                Login with Cloudflare
              </button>
              <p className="text-xs text-gray-400 text-center">
                A popup window will open for you to authorize Maqder.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DnsRecordRow({ type, name, value, copyKey, copiedKey, onCopy }) {
  return (
    <div className="flex items-center gap-2 bg-white dark:bg-dark-800 rounded-lg border border-gray-100 dark:border-dark-700 px-2.5 py-1.5">
      <span className="text-[10px] font-black text-indigo-500 w-12 flex-shrink-0">{type}</span>
      <div className="flex-1 min-w-0 overflow-hidden">
        <code className="text-[11px] text-gray-700 dark:text-gray-300 break-all">{name}</code>
        <code className="block text-[11px] text-gray-500 dark:text-gray-400 break-all">{value}</code>
      </div>
      <button
        onClick={() => onCopy(value, copyKey)}
        className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-bold text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-dark-700 transition-colors"
        title="Copy value"
      >
        {copiedKey === copyKey ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
      </button>
    </div>
  );
}
