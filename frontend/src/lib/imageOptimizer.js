export function optimizeImageUrl(url, { width, height, quality = 80, format = 'auto' } = {}) {
  if (!url) return url;
  // If the URL is from a CDN or image service that supports query params, optimize it
  try {
    const u = new URL(url);
    // Cloudinary-style optimization
    if (u.hostname.includes('cloudinary') || u.hostname.includes('res.cloudinary')) {
      const parts = u.pathname.split('/');
      const uploadIdx = parts.indexOf('upload');
      if (uploadIdx >= 0) {
        const transforms = [`f_${format}`, `q_${quality}`];
        if (width) transforms.push(`w_${width}`);
        if (height) transforms.push(`h_${height}`);
        parts.splice(uploadIdx + 1, 0, transforms.join(','));
        u.pathname = parts.join('/');
        return u.toString();
      }
    }
    // For other URLs, add basic query params (many CDN services respect these)
    if (width) u.searchParams.set('w', width);
    if (height) u.searchParams.set('h', height);
    if (quality !== 80) u.searchParams.set('q', quality);
    return u.toString();
  } catch {
    // If URL parsing fails, return as-is
    return url;
  }
}

export function getResponsiveImageSrcSet(url, widths = [400, 800, 1200, 1600]) {
  if (!url) return '';
  return widths
    .map(w => `${optimizeImageUrl(url, { width: w })} ${w}w`)
    .join(', ');
}
