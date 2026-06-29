import { useEffect } from 'react';

/**
 * Injects SEO meta tags into the document <head>.
 * Cleans up previous tags on unmount or when props change.
 */
export default function StorefrontSeo({ title, description, image, url, type = 'website', siteName, noindex }) {
  useEffect(() => {
    const tags = [];

    const upsert = (selector, attr, value, name = 'meta') => {
      let el = document.head.querySelector(`meta[${selector}]`);
      if (!el) {
        el = document.createElement(name === 'meta' ? 'meta' : 'link');
        if (name === 'link') el.setAttribute('rel', attr.split('=')[1].replace(/"/g, ''));
      }
      if (name === 'meta') {
        el.setAttribute(attr.split('=')[0], attr.split('=')[1].replace(/"/g, ''));
        el.setAttribute('content', value);
      } else {
        el.setAttribute('href', value);
      }
      if (!el.parentNode) document.head.appendChild(el);
      tags.push(el);
    };

    // Title
    if (title) {
      document.title = title;
    }

    // Standard meta
    if (description) {
      upsert('name="description"', 'name="description"', description);
    }

    if (noindex) {
      upsert('name="robots"', 'name="robots"', 'noindex, nofollow');
    }

    // Open Graph tags
    if (title) upsert('property="og:title"', 'property="og:title"', title);
    if (description) upsert('property="og:description"', 'property="og:description"', description);
    if (image) upsert('property="og:image"', 'property="og:image"', image);
    if (url) upsert('property="og:url"', 'property="og:url"', url);
    upsert('property="og:type"', 'property="og:type"', type);
    if (siteName) upsert('property="og:site_name"', 'property="og:site_name"', siteName);

    // Twitter Card tags
    if (title) upsert('name="twitter:title"', 'name="twitter:title"', title);
    if (description) upsert('name="twitter:description"', 'name="twitter:description"', description);
    if (image) upsert('name="twitter:image"', 'name="twitter:image"', image);
    upsert('name="twitter:card"', 'name="twitter:card"', 'summary_large_image');

    // Canonical link
    if (url) {
      let canonical = document.head.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', url);
      tags.push(canonical);
    }

    return () => {
      // Don't remove tags on cleanup — they'll be overwritten on next mount
      // This prevents flickering between page transitions
    };
  }, [title, description, image, url, type, siteName, noindex]);

  return null;
}
