/**
 * Cloudflare for SaaS integration for custom domain SSL + routing.
 *
 * Uses Cloudflare Custom Hostnames API to:
 *  - Create a custom hostname entry for the client's domain
 *  - Return DNS records the client needs to add (CNAME + TXT for ownership)
 *  - Auto-provision SSL certificates (DCV)
 *  - Check verification + SSL status
 *  - Clean up when a domain is removed
 *
 * Required env vars (server only):
 *  - CLOUDFLARE_API_TOKEN: API token with "Cloudflare for SaaS" / Custom Hostname permissions
 *  - CLOUDFLARE_ZONE_ID: Zone ID for the platform domain (e.g. shop.maqder.com)
 *
 * The client does NOT need Cloudflare. They just add DNS records in their own provider.
 */

const CF_API = 'https://api.cloudflare.com/client/v4';

const getGlobalToken = () => process.env.CLOUDFLARE_API_TOKEN || '';
const getGlobalZoneId = () => process.env.CLOUDFLARE_ZONE_ID || '';
const getGlobalFallbackOrigin = () => process.env.CLOUDFLARE_FALLBACK_ORIGIN || 'origin.maqder.com';
const getOAuthClientId = () => process.env.CLOUDFLARE_OAUTH_CLIENT_ID || '';
const getOAuthClientSecret = () => process.env.CLOUDFLARE_OAUTH_CLIENT_SECRET || '';

function resolveConfig(config = {}) {
  return {
    apiToken: config.apiToken || getGlobalToken(),
    zoneId: config.zoneId || getGlobalZoneId(),
    fallbackOrigin: config.fallbackOrigin || getGlobalFallbackOrigin(),
  };
}

export function isCloudflareOAuthConfigured() {
  return Boolean(getOAuthClientId() && getOAuthClientSecret());
}

export function getCloudflareOAuthRedirectUrl() {
  return process.env.CLOUDFLARE_OAUTH_REDIRECT_URL || `${process.env.FRONTEND_URL || 'https://maqder.com'}/api/ecommerce/domains/cloudflare/oauth-callback`;
}

export function buildCloudflareAuthUrl(state) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: getOAuthClientId(),
    redirect_uri: getCloudflareOAuthRedirectUrl(),
    scope: 'account:settings:read zone:read dns:write',
    state,
  });
  return `https://dash.cloudflare.com/oauth2/auth?${params.toString()}`;
}

export async function exchangeCloudflareCodeForToken(code) {
  const res = await fetch('https://api.cloudflare.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: getOAuthClientId(),
      client_secret: getOAuthClientSecret(),
      redirect_uri: getCloudflareOAuthRedirectUrl(),
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    return { success: false, error: data.error_description || data.error || 'Token exchange failed' };
  }
  return { success: true, accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in, tokenType: data.token_type };
}

export async function refreshCloudflareToken(refreshToken) {
  const res = await fetch('https://api.cloudflare.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: getOAuthClientId(),
      client_secret: getOAuthClientSecret(),
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    return { success: false, error: data.error_description || data.error || 'Refresh failed' };
  }
  return { success: true, accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
}

export const isCloudflareConfigured = (config = {}) => {
  const { apiToken, zoneId } = resolveConfig(config);
  return Boolean(apiToken && zoneId);
};

export const isGlobalCloudflareConfigured = () => isCloudflareConfigured();

function formatCfErrors(errors) {
  if (!errors || errors.length === 0) return '';
  return errors.map(e => e.message || String(e)).join('; ');
}

async function cfRequest(path, method = 'GET', body = null, config = {}) {
  const { apiToken } = resolveConfig(config);
  if (!apiToken) return { success: false, errors: [{ message: 'Cloudflare not configured' }] };

  const headers = {
    'Authorization': `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  };

  try {
    const res = await fetch(`${CF_API}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, errors: [{ message: err.message }] };
  }
}

/**
 * Create a Cloudflare for SaaS custom hostname for the client's domain.
 * Returns the DNS records the client needs to add in their DNS provider.
 *
 * @param {string} hostname - The custom domain (e.g. store.example.com)
 * @param {string} verificationToken - Internal verification token
 * @returns {Promise<object>} { configured, cfHostnameId, cnameTarget, txtName, txtValue, sslStatus, errors }
 */
export async function provisionCloudflareDomain(hostname, verificationToken, config = {}) {
  if (!isCloudflareConfigured(config)) return { configured: false };

  const { zoneId, fallbackOrigin } = resolveConfig(config);

  // Check if a custom hostname already exists for this hostname
  const existing = await cfRequest(`/zones/${zoneId}/custom_hostnames?hostname=${hostname}`, 'GET', null, config);
  let ch;

  if (existing.success && existing.result?.length > 0) {
    // Already exists — use it
    ch = existing.result[0];
  } else {
    // Create a new custom hostname with HTTP DCV SSL
    const createRes = await cfRequest(`/zones/${zoneId}/custom_hostnames`, 'POST', {
      hostname,
      ssl: {
        method: 'http',
        type: 'dv',
        settings: { min_tls_version: '1.2' },
      },
      custom_metadata: { verification_token: verificationToken },
    }, config);

    if (!createRes.success) {
      const errorMessage = formatCfErrors(createRes.errors) || 'Failed to create custom hostname';
      return { configured: true, success: false, errors: [errorMessage] };
    }
    ch = createRes.result;
  }

  // Extract DNS records the client needs to add
  // The custom domain must CNAME to the fallback origin (e.g. origin.maqder.com)
  // Cloudflare may also require an ownership verification TXT record
  const ov = ch.ownership_verification || {};

  const cnameTarget = fallbackOrigin;
  const txtName = ov.type === 'TXT' ? ov.name : '';
  const txtValue = ov.type === 'TXT' ? ov.value : '';
  const sslStatus = ch.ssl?.status || 'pending';
  const cfStatus = ch.status || 'pending';

  return {
    configured: true,
    success: true,
    cfHostnameId: ch.id,
    cnameTarget,
    txtName,
    txtValue,
    sslStatus,
    cfStatus,
  };
}

/**
 * Verify a domain by checking its Cloudflare for SaaS custom hostname status.
 * The custom hostname is verified when Cloudflare confirms ownership + SSL is active/pending.
 */
export async function verifyDomainViaCloudflare(hostname, verificationToken, cfHostnameId, config = {}) {
  if (!isCloudflareConfigured(config)) return { configured: false, verified: false };

  const { zoneId } = resolveConfig(config);

  // If we have a CF hostname ID, check its status directly
  if (cfHostnameId) {
    const check = await cfRequest(`/zones/${zoneId}/custom_hostnames/${cfHostnameId}`, 'GET', null, config);
    if (check.success && check.result) {
      const ch = check.result;
      const verified = ch.status === 'active' || ch.ssl?.status === 'active' || ch.ssl?.status === 'pending_validation';
      const sslStatus = ch.ssl?.status || 'pending';
      const cfStatus = ch.status || 'pending';
      return { configured: true, verified, sslStatus, cfStatus, cfHostnameId: ch.id };
    }
  }

  // Fallback: look up by hostname
  const lookup = await cfRequest(`/zones/${zoneId}/custom_hostnames?hostname=${hostname}`);
  if (lookup.success && lookup.result?.length > 0) {
    const ch = lookup.result[0];
    const verified = ch.status === 'active' || ch.ssl?.status === 'active' || ch.ssl?.status === 'pending_validation';
    const sslStatus = ch.ssl?.status || 'pending';
    const cfStatus = ch.status || 'pending';
    return { configured: true, verified, sslStatus, cfStatus, cfHostnameId: ch.id };
  }

  return { configured: true, verified: false };
}

/**
 * Remove a custom hostname from Cloudflare for SaaS.
 */
export async function removeCloudflareDomain(hostname, cfHostnameId, config = {}) {
  if (!isCloudflareConfigured(config)) return { configured: false };

  const { zoneId } = resolveConfig(config);

  // If we have the CF hostname ID, delete directly
  if (cfHostnameId) {
    const del = await cfRequest(`/zones/${zoneId}/custom_hostnames/${cfHostnameId}`, 'DELETE', null, config);
    return { configured: true, success: del.success };
  }

  // Fallback: look up by hostname then delete
  const lookup = await cfRequest(`/zones/${zoneId}/custom_hostnames?hostname=${hostname}`, 'GET', null, config);
  if (lookup.success && lookup.result?.length > 0) {
    const del = await cfRequest(`/zones/${zoneId}/custom_hostnames/${lookup.result[0].id}`, 'DELETE', null, config);
    return { configured: true, success: del.success };
  }

  return { configured: true, success: false };
}

/**
 * Verify that a Cloudflare API token is valid.
 */
export async function verifyCloudflareCredentials(config = {}) {
  if (!isCloudflareConfigured(config)) return { valid: false, error: 'Cloudflare not configured' };

  const res = await cfRequest('/user/tokens/verify', 'GET', null, config);
  if (!res.success) {
    return { valid: false, error: formatCfErrors(res.errors) || 'Invalid token' };
  }
  return { valid: true, result: res.result };
}

/**
 * List all zones accessible by the given API token.
 * Used to auto-detect the zone ID when a tenant connects their Cloudflare account.
 */
export async function listZones(config = {}) {
  const { apiToken } = resolveConfig(config);
  if (!apiToken) return { success: false, zones: [], error: 'No API token' };

  const res = await cfRequest('/zones?per_page=50', 'GET', null, config);
  if (!res.success) {
    return { success: false, zones: [], error: formatCfErrors(res.errors) || 'Failed to list zones' };
  }
  const zones = (res.result || []).map(z => ({ id: z.id, name: z.name, status: z.status }));
  return { success: true, zones };
}

/**
 * Make a request using an OAuth access token (tenant account).
 * The access_token is used as a Bearer token instead of an API token.
 */
async function cfOAuthRequest(path, accessToken, method = 'GET', body = null) {
  if (!accessToken) return { success: false, errors: [{ message: 'No Cloudflare OAuth token' }] };
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
  try {
    const res = await fetch(`${CF_API}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, errors: [{ message: err.message }] };
  }
}

/**
 * Find the Cloudflare zone ID for a given domain name using an OAuth token.
 */
export async function findZoneByHostname(accessToken, hostname) {
  const root = hostname.replace(/^[^.]+\./, '');
  const res = await cfOAuthRequest(`/zones?name=${encodeURIComponent(root)}`, accessToken);
  if (!res.success || res.result?.length === 0) return { success: false, error: 'No matching Cloudflare zone found' };
  return { success: true, zoneId: res.result[0].id, zoneName: res.result[0].name };
}

/**
 * List all zones accessible via OAuth token.
 */
export async function listZonesOAuth(accessToken) {
  const res = await cfOAuthRequest('/zones?per_page=50', accessToken);
  if (!res.success) return { success: false, zones: [], error: formatCfErrors(res.errors) };
  return { success: true, zones: (res.result || []).map(z => ({ id: z.id, name: z.name, status: z.status })) };
}

/**
 * Create a CNAME (and optionally TXT) record in the tenant's Cloudflare zone.
 * Proxied=true means Cloudflare handles SSL and DDoS automatically.
 */
export async function createCloudflareDnsRecord(accessToken, hostname, target, proxied = true) {
  const zone = await findZoneByHostname(accessToken, hostname);
  if (!zone.success) return zone;

  const create = await cfOAuthRequest(`/zones/${zone.zoneId}/dns_records`, accessToken, 'POST', {
    type: 'CNAME',
    name: hostname,
    content: target,
    proxied,
    ttl: 1, // Auto TTL
    comment: 'Auto-provisioned by Maqder',
  });

  if (!create.success) return { success: false, error: formatCfErrors(create.errors) };
  return { success: true, zoneId: zone.zoneId, recordId: create.result.id, name: create.result.name, content: create.result.content };
}

/**
 * Delete a DNS record from the tenant's Cloudflare zone.
 */
export async function deleteCloudflareDnsRecord(accessToken, zoneId, recordId) {
  const res = await cfOAuthRequest(`/zones/${zoneId}/dns_records/${recordId}`, accessToken, 'DELETE');
  if (!res.success) return { success: false, error: formatCfErrors(res.errors) };
  return { success: true };
}

export async function getSSLStatus(hostname, cfHostnameId, config = {}) {
  if (!isCloudflareConfigured(config)) return { configured: false, status: 'none' };

  const { zoneId } = resolveConfig(config);

  if (cfHostnameId) {
    const check = await cfRequest(`/zones/${zoneId}/custom_hostnames/${cfHostnameId}`, 'GET', null, config);
    if (check.success && check.result) {
      const sslStatus = check.result.ssl?.status || 'none';
      const statusMap = {
        active: 'active',
        pending_validation: 'pending',
        pending_issuance: 'pending',
        pending_deployment: 'pending',
        expired: 'error',
        error: 'error',
      };
      return { configured: true, status: statusMap[sslStatus] || 'pending' };
    }
  }

  // Fallback: look up by hostname
  const lookup = await cfRequest(`/zones/${zoneId}/custom_hostnames?hostname=${hostname}`, 'GET', null, config);
  if (lookup.success && lookup.result?.length > 0) {
    const sslStatus = lookup.result[0].ssl?.status || 'none';
    const statusMap = {
      active: 'active',
      pending_validation: 'pending',
      pending_issuance: 'pending',
      pending_deployment: 'pending',
      expired: 'error',
      error: 'error',
    };
    return { configured: true, status: statusMap[sslStatus] || 'pending' };
  }

  return { configured: true, status: 'none' };
}
