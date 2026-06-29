/**
 * Tracking pixel service — handles server-side Conversions API (CAPI) calls
 * for Facebook, TikTok, and Snapchat, plus client-side pixel script generation.
 */

// --- Facebook CAPI ---
async function facebookCAPI(event, data, config) {
  if (!config?.pixelId || !config?.token) return;
  const url = `https://graph.facebook.com/v18.0/${config.pixelId}/events?access_token=${config.token}`;
  const payload = {
    data: [{
      event_name: event,
      event_time: Math.floor(Date.now() / 1000),
      event_id: data.eventId || `${event}_${Date.now()}`,
      ...data.userData,
      custom_data: data.customData || {},
    }],
  };
  try {
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch (e) { /* silent fail */ }
}

// --- TikTok CAPI ---
async function tiktokCAPI(event, data, config) {
  if (!config?.pixelCode || !config?.accessToken) return;
  const url = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';
  const payload = {
    pixel_code: config.pixelCode,
    event: event,
    event_id: data.eventId || `${event}_${Date.now()}`,
    timestamp: new Date().toISOString(),
    context: {
      user: data.userData || {},
    },
    properties: data.customData || {},
  };
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Access-Token': config.accessToken },
      body: JSON.stringify(payload),
    });
  } catch (e) { /* silent fail */ }
}

// --- Snapchat CAPI ---
async function snapchatCAPI(event, data, config) {
  if (!config?.pixelId || !config?.token) return;
  const url = `https://tr.snapchat.com/v3/${config.pixelId}/events?access_token=${config.token}`;
  const payload = {
    data: [{
      event_name: event,
      event_time: Math.floor(Date.now() / 1000),
      event_id: data.eventId || `${event}_${Date.now()}`,
      ...data.userData,
      custom_data: data.customData || {},
    }],
  };
  try {
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch (e) { /* silent fail */ }
}

/**
 * Fire server-side conversion events to all configured CAPI integrations.
 * @param {string} event - Event name: 'PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase', etc.
 * @param {object} data - { eventId, userData, customData }
 * @param {object} pixelsConfig - tenant.ecommerce.pixels
 */
export async function fireServerSideEvents(event, data, pixelsConfig) {
  if (!pixelsConfig) return;
  const promises = [];
  if (pixelsConfig.facebookPixel?.enabled && pixelsConfig.facebookPixel?.pixelId) {
    // FB CAPI needs a token — check if we have it in a separate field or use the pixel ID
    // For now, we fire client-side only for FB unless CAPI token is configured
  }
  if (pixelsConfig.snapchatCapi?.enabled) {
    promises.push(snapchatCAPI(event, data, pixelsConfig.snapchatCapi));
  }
  if (pixelsConfig.tiktokCapi?.enabled) {
    promises.push(tiktokCAPI(event, data, pixelsConfig.tiktokCapi));
  }
  await Promise.allSettled(promises);
}

/**
 * Generate client-side pixel scripts to inject into the storefront <head>.
 * Returns an HTML string with all enabled pixel scripts.
 */
export function generatePixelScripts(pixels) {
  if (!pixels) return '';
  let scripts = '';

  // Google Analytics 4
  if (pixels.googleAnalytics?.enabled && pixels.googleAnalytics?.measurementId) {
    const id = pixels.googleAnalytics.measurementId;
    scripts += `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');
window.__trackEvent=function(name,params){gtag('event',name,params||{});};
</script>`;
  }

  // Facebook Pixel
  if (pixels.facebookPixel?.enabled && pixels.facebookPixel?.pixelId) {
    const id = pixels.facebookPixel.pixelId;
    scripts += `<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${id}');fbq('track','PageView');
</script>`;
  }

  // TikTok Pixel
  if (pixels.tiktokPixel?.enabled && pixels.tiktokPixel?.pixelId) {
    const id = pixels.tiktokPixel.pixelId;
    scripts += `<script>
!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
ttq.load('${id}');ttq.page();
</script>`;
  }

  // Snapchat Pixel
  if (pixels.snapchatPixel?.enabled && pixels.snapchatPixel?.pixelId) {
    const id = pixels.snapchatPixel.pixelId;
    scripts += `<script>
(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u)})(window,document,'https://sc-static.net/scevent.min.js');
snaptr('init','${id}');snaptr('track','PAGE_VIEW');
</script>`;
  }

  // Twitter Pixel
  if (pixels.twitterPixel?.enabled && pixels.twitterPixel?.pixelId) {
    const id = pixels.twitterPixel.pixelId;
    scripts += `<script>
!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='//static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
twq('init','${id}');twq('track','PageView');
</script>`;
  }

  // Google Ads
  if (pixels.googleAds?.enabled && pixels.googleAds?.conversionId) {
    const cid = pixels.googleAds.conversionId;
    scripts += `<script async src="https://www.googletagmanager.com/gtag/js?id=${cid}"></script>
<script>
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${cid}');
</script>`;
  }

  // Unified event dispatcher
  scripts += `<script>
window.__firePixelEvent=function(event,params){
  params=params||{};
  // Facebook
  if(typeof fbq!=='undefined'){fbq('track',event,params);}
  // TikTok
  if(typeof ttq!=='undefined'){ttq.track(event,params);}
  // Snapchat
  if(typeof snaptr!=='undefined'){snaptr('track',event.toUpperCase().replace(/_/g,'_'),params);}
  // Twitter
  if(typeof twq!=='undefined'){twq('track',event,params);}
  // Google Analytics
  if(typeof gtag!=='undefined'){gtag('event',event,params);}
};
</script>`;

  return scripts;
}

/**
 * Get sanitized pixel config for the storefront (no secrets/tokens).
 */
export function getPublicPixelConfig(pixels) {
  if (!pixels) return {};
  return {
    googleAnalytics: pixels.googleAnalytics?.enabled ? { enabled: true, measurementId: pixels.googleAnalytics.measurementId } : { enabled: false },
    facebookPixel: pixels.facebookPixel?.enabled ? { enabled: true, pixelId: pixels.facebookPixel.pixelId } : { enabled: false },
    tiktokPixel: pixels.tiktokPixel?.enabled ? { enabled: true, pixelId: pixels.tiktokPixel.pixelId } : { enabled: false },
    snapchatPixel: pixels.snapchatPixel?.enabled ? { enabled: true, pixelId: pixels.snapchatPixel.pixelId } : { enabled: false },
    twitterPixel: pixels.twitterPixel?.enabled ? { enabled: true, pixelId: pixels.twitterPixel.pixelId } : { enabled: false },
    googleAds: pixels.googleAds?.enabled ? { enabled: true, conversionId: pixels.googleAds.conversionId, conversionLabel: pixels.googleAds.conversionLabel } : { enabled: false },
  };
}
