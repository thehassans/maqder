/**
 * Cloudflare API integration for custom domain DNS + SSL provisioning.
 *
 * Uses Cloudflare Zone API to:
 *  - Create/update CNAME records for custom domains
 *  - Create TXT verification records
 *  - Provision Universal SSL for custom hostnames
 *  - Clean up records when a domain is removed
 *
 * Required env vars:
 *  - CLOUDFLARE_API_TOKEN: API token with Zone:Edit + DNS:Edit permissions
 *  - CLOUDFLARE_ZONE_ID: Zone ID for the platform domain (e.g. shop.maqder.com)
 *  - CLOUDFLARE_FALLBACK_ORIGIN: Origin IP or hostname the CNAME points to (e.g. cname.shop.maqder.com)
 *
 * If env vars are not set, all functions gracefully no-op (returns false),
 * and the system falls back to manual DNS verification.
 */

const CF_API = 'https://api.cloudflare.com/client/v4';

const getToken = () => process.env.CLOUDFLARE_API_TOKEN || '';
const getZoneId = () => process.env.CLOUDFLARE_ZONE_ID || '';
const getFallbackOrigin = () => process.env.CLOUDFLARE_FALLBACK_ORIGIN || 'cname.shop.maqder.com';

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
 * Create or update a CNAME record for a custom hostname pointing to the platform fallback origin.
 * Also creates the TXT verification record automatically.
 */
export async function provisionCloudflareDomain(hostname, verificationToken) {
  if (!isCloudflareConfigured()) return { configured: false };

  const zoneId = getZoneId();
  const fallbackOrigin = getFallbackOrigin();
  const results = { cname: null, txt: null, ssl: null, errors: [] };

  // 1. Check if CNAME record already exists
  const cnameCheck = await cfRequest(`/zones/${zoneId}/dns_records?type=CNAME&name=${hostname}`);
  const existingCname = cnameCheck.success && cnameCheck.result?.find(r => r.name === hostname);

  if (existingCname) {
    // Update existing record
    results.cname = await cfRequest(`/zones/${zoneId}/dns_records/${existingCname.id}`, 'PUT', {
      type: 'CNAME',
      name: hostname,
      content: fallbackOrigin,
      proxied: true,
      comment: 'Maqder e-commerce custom domain',
    });
  } else {
    // Create new CNAME record
    results.cname = await cfRequest(`/zones/${zoneId}/dns_records`, 'POST', {
      type: 'CNAME',
      name: hostname,
      content: fallbackOrigin,
      proxied: true,
      comment: 'Maqder e-commerce custom domain',
    });
  }

  if (!results.cname?.success) {
    results.errors.push('Failed to create CNAME record');
  }

  // 2. Create TXT verification record at _maqder-verify.<hostname>
  const txtName = `_maqder-verify.${hostname}`;
  const txtCheck = await cfRequest(`/zones/${zoneId}/dns_records?type=TXT&name=${txtName}`);
  const existingTxt = txtCheck.success && txtCheck.result?.find(r => r.name === txtName);

  if (existingTxt) {
    results.txt = await cfRequest(`/zones/${zoneId}/dns_records/${existingTxt.id}`, 'PUT', {
      type: 'TXT',
      name: txtName,
      content: verificationToken,
      ttl: 300,
    });
  } else {
    results.txt = await cfRequest(`/zones/${zoneId}/dns_records`, 'POST', {
      type: 'TXT',
      name: txtName,
      content: verificationToken,
      ttl: 300,
    });
  }

  if (!results.txt?.success) {
    results.errors.push('Failed to create TXT verification record');
  }

  // 3. Check SSL status for the zone
  const sslCheck = await cfRequest(`/zones/${zoneId}/ssl/verification`);
  if (sslCheck.success) {
    const cert = sslCheck.result?.find(c => c.certificat_status === 'active' || c.hostname === hostname);
    results.ssl = cert ? 'active' : 'pending';
  }

  return { configured: true, results };
}

/**
 * Verify a domain by checking if the TXT record exists in Cloudflare DNS.
 * This is an alternative to manual DNS lookup — checks via Cloudflare API.
 */
export async function verifyDomainViaCloudflare(hostname, verificationToken) {
  if (!isCloudflareConfigured()) return { configured: false, verified: false };

  const zoneId = getZoneId();
  const txtName = `_maqder-verify.${hostname}`;

  const check = await cfRequest(`/zones/${zoneId}/dns_records?type=TXT&name=${txtName}`);
  if (!check.success) return { configured: true, verified: false };

  const record = check.result?.find(r => r.name === txtName);
  const verified = record && record.content === verificationToken;

  return { configured: true, verified };
}

/**
 * Remove DNS records (CNAME + TXT) for a hostname from Cloudflare.
 */
export async function removeCloudflareDomain(hostname) {
  if (!isCloudflareConfigured()) return { configured: false };

  const zoneId = getZoneId();
  const results = { deleted: 0, errors: [] };

  // Find and delete CNAME record
  const cnameCheck = await cfRequest(`/zones/${zoneId}/dns_records?type=CNAME&name=${hostname}`);
  if (cnameCheck.success) {
    for (const record of cnameCheck.result || []) {
      if (record.name === hostname) {
        const del = await cfRequest(`/zones/${zoneId}/dns_records/${record.id}`, 'DELETE');
        if (del.success) results.deleted++;
        else results.errors.push('Failed to delete CNAME record');
      }
    }
  }

  // Find and delete TXT verification record
  const txtName = `_maqder-verify.${hostname}`;
  const txtCheck = await cfRequest(`/zones/${zoneId}/dns_records?type=TXT&name=${txtName}`);
  if (txtCheck.success) {
    for (const record of txtCheck.result || []) {
      if (record.name === txtName) {
        const del = await cfRequest(`/zones/${zoneId}/dns_records/${record.id}`, 'DELETE');
        if (del.success) results.deleted++;
        else results.errors.push('Failed to delete TXT record');
      }
    }
  }

  return { configured: true, results };
}

/**
 * Get SSL certificate status for a custom hostname.
 */
export async function getSSLStatus(hostname) {
  if (!isCloudflareConfigured()) return { configured: false, status: 'none' };

  const zoneId = getZoneId();
  const sslCheck = await cfRequest(`/zones/${zoneId}/ssl/verification`);

  if (!sslCheck.success) return { configured: true, status: 'none' };

  const cert = sslCheck.result?.find(c => c.hostname === hostname);
  if (!cert) return { configured: true, status: 'none' };

  const statusMap = {
    active: 'active',
    pending: 'pending',
    pending_issuance: 'pending',
    pending_deployment: 'pending',
    expired: 'error',
    error: 'error',
  };

  return { configured: true, status: statusMap[cert.certificat_status] || 'pending' };
}
