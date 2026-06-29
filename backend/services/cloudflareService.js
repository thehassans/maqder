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

const getToken = () => process.env.CLOUDFLARE_API_TOKEN || '';
const getZoneId = () => process.env.CLOUDFLARE_ZONE_ID || '';

export const isCloudflareConfigured = () => Boolean(getToken() && getZoneId());

async function cfRequest(path, method = 'GET', body = null) {
  const token = getToken();
  if (!token) return { success: false, errors: ['Cloudflare not configured'] };

  const headers = {
    'Authorization': `Bearer ${token}`,
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
    return { success: false, errors: [err.message] };
  }
}

/**
 * Create a Cloudflare for SaaS custom hostname for the client's domain.
 * Returns the DNS records the client needs to add in their DNS provider.
 *
 * @param {string} hostname - The custom domain (e.g. store.example.com)
 * @param {string} verificationToken - Internal verification token
 * @returns {Promise<object>} { configured, cfHostnameId, cnameTarget, txtName, txtValue, sslStatus }
 */
export async function provisionCloudflareDomain(hostname, verificationToken) {
  if (!isCloudflareConfigured()) return { configured: false };

  const zoneId = getZoneId();

  // Check if a custom hostname already exists for this hostname
  const existing = await cfRequest(`/zones/${zoneId}/custom_hostnames?hostname=${hostname}`);
  let ch;

  if (existing.success && existing.result?.length > 0) {
    // Already exists — use it
    ch = existing.result[0];
  } else {
    // Create a new custom hostname with DCV SSL
    const createRes = await cfRequest(`/zones/${zoneId}/custom_hostnames`, 'POST', {
      hostname,
      ssl: {
        method: 'http',
        type: 'dv',
        settings: { min_tls_version: '1.2' },
      },
      custom_metadata: { verification_token: verificationToken },
    });

    if (!createRes.success) {
      return { configured: true, success: false, errors: createRes.errors || ['Failed to create custom hostname'] };
    }
    ch = createRes.result;
  }

  // Extract DNS records the client needs to add
  const cnameTarget = ch.ownership_verification?.value || '';
  const txtName = ch.ownership_verification?.name || '';
  const txtValue = ch.ownership_verification?.value || '';
  const sslStatus = ch.ssl?.status || 'pending';

  return {
    configured: true,
    success: true,
    cfHostnameId: ch.id,
    cnameTarget,
    txtName,
    txtValue,
    sslStatus,
  };
}

/**
 * Verify a domain by checking its Cloudflare for SaaS custom hostname status.
 * The custom hostname is verified when Cloudflare confirms ownership + SSL is active/pending.
 */
export async function verifyDomainViaCloudflare(hostname, verificationToken, cfHostnameId) {
  if (!isCloudflareConfigured()) return { configured: false, verified: false };

  const zoneId = getZoneId();

  // If we have a CF hostname ID, check its status directly
  if (cfHostnameId) {
    const check = await cfRequest(`/zones/${zoneId}/custom_hostnames/${cfHostnameId}`);
    if (check.success && check.result) {
      const ch = check.result;
      const verified = ch.status === 'active' || ch.ssl?.status === 'active' || ch.ssl?.status === 'pending_validation';
      return { configured: true, verified, sslStatus: ch.ssl?.status || 'pending' };
    }
  }

  // Fallback: look up by hostname
  const lookup = await cfRequest(`/zones/${zoneId}/custom_hostnames?hostname=${hostname}`);
  if (lookup.success && lookup.result?.length > 0) {
    const ch = lookup.result[0];
    const verified = ch.status === 'active' || ch.ssl?.status === 'active' || ch.ssl?.status === 'pending_validation';
    return { configured: true, verified, sslStatus: ch.ssl?.status || 'pending', cfHostnameId: ch.id };
  }

  return { configured: true, verified: false };
}

/**
 * Remove a custom hostname from Cloudflare for SaaS.
 */
export async function removeCloudflareDomain(hostname, cfHostnameId) {
  if (!isCloudflareConfigured()) return { configured: false };

  const zoneId = getZoneId();

  // If we have the CF hostname ID, delete directly
  if (cfHostnameId) {
    const del = await cfRequest(`/zones/${zoneId}/custom_hostnames/${cfHostnameId}`, 'DELETE');
    return { configured: true, success: del.success };
  }

  // Fallback: look up by hostname then delete
  const lookup = await cfRequest(`/zones/${zoneId}/custom_hostnames?hostname=${hostname}`);
  if (lookup.success && lookup.result?.length > 0) {
    const del = await cfRequest(`/zones/${zoneId}/custom_hostnames/${lookup.result[0].id}`, 'DELETE');
    return { configured: true, success: del.success };
  }

  return { configured: true, success: false };
}

/**
 * Get SSL certificate status for a custom hostname via Cloudflare for SaaS.
 */
export async function getSSLStatus(hostname, cfHostnameId) {
  if (!isCloudflareConfigured()) return { configured: false, status: 'none' };

  const zoneId = getZoneId();

  if (cfHostnameId) {
    const check = await cfRequest(`/zones/${zoneId}/custom_hostnames/${cfHostnameId}`);
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
  const lookup = await cfRequest(`/zones/${zoneId}/custom_hostnames?hostname=${hostname}`);
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
