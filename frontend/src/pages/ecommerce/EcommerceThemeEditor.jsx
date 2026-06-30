import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Palette, Save, Loader2, Upload, RotateCcw, AlertCircle, CheckCircle, Eye, Layout, Type, ShoppingCart, Home, Monitor, Smartphone, GripVertical, Trash2, Plus, ImageIcon, Sparkles } from 'lucide-react';
import api from '../../lib/api';

const COLOR_FIELDS = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
  { key: 'background', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'text', label: 'Text' },
  { key: 'textMuted', label: 'Muted Text' },
  { key: 'headerBg', label: 'Header BG' },
  { key: 'footerBg', label: 'Footer BG' },
  { key: 'footerText', label: 'Footer Text' },
  { key: 'buttonBg', label: 'Button BG' },
  { key: 'buttonText', label: 'Button Text' },
  { key: 'priceColor', label: 'Price' },
  { key: 'salePriceColor', label: 'Sale Price' },
  { key: 'borderColor', label: 'Border' },
];

const FONT_OPTIONS = ['Inter', 'Cairo', 'Tajawal', 'Almarai', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat'];
const LAYOUT_OPTIONS = [
  { value: 'modern', label: 'Modern' },
  { value: 'classic', label: 'Classic' },
  { value: 'minimal', label: 'Minimal' },
];

const SECTION_TYPES = [
  { value: 'hero', label: 'Hero Banner' },
  { value: 'product-carousel', label: 'Product Carousel' },
  { value: 'category-grid', label: 'Category Grid' },
  { value: 'newsletter', label: 'Newsletter Signup' },
  { value: 'custom-html', label: 'Custom HTML' },
  { value: 'rich-text', label: 'Rich Text Block' },
  { value: 'image-banner', label: 'Image Banner' },
  { value: 'testimonial', label: 'Testimonials' },
  { value: 'faq', label: 'FAQ Section' },
  { value: 'spacer', label: 'Spacer / Divider' },
];

export default function EcommerceThemeEditor() {
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('colors');
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [hasUnpublished, setHasUnpublished] = useState(false);
  const [publishedAt, setPublishedAt] = useState(null);
  const [draftUpdatedAt, setDraftUpdatedAt] = useState(null);
  const [presets, setPresets] = useState([]);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [applyingPreset, setApplyingPreset] = useState(null);
  const [heroUploadIdx, setHeroUploadIdx] = useState(null);
  const previewRef = useRef(null);
  const logoInputRef = useRef(null);
  const heroInputRef = useRef(null);

  const fetchTheme = useCallback(async () => {
    try {
      const [themeRes, presetsRes] = await Promise.all([
        api.get('/ecommerce/theme'),
        api.get('/ecommerce/theme/presets'),
      ]);
      setTheme(themeRes.data.draft);
      setHasUnpublished(themeRes.data.hasUnpublishedChanges);
      setPublishedAt(themeRes.data.publishedAt);
      setDraftUpdatedAt(themeRes.data.draftUpdatedAt);
      setPresets(presetsRes.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load theme');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTheme(); }, [fetchTheme]);

  // Generate preview HTML from theme config
  const generatePreviewHTML = (config) => {
    if (!config) return '<html><body>Loading...</body></html>';
    const c = config.colors || {};
    const t = config.typography || {};
    const h = config.header || {};
    const f = config.footer || {};
    const sections = config.homepage?.sections || [];

    const sectionHTML = sections.filter(s => s.enabled).map(s => {
      const settings = s.settings || {};
      switch (s.type) {
        case 'hero':
          return `<div style="background:${settings.imageUrl ? `url(${settings.imageUrl}) center/cover` : c.primary};padding:60px 20px;text-align:center;border-radius:12px;margin-bottom:20px">
            <h2 style="color:#fff;font-size:28px;margin:0 0 8px">${settings.title || 'Welcome to our store'}</h2>
            <p style="color:#fff;opacity:0.9;margin:0 0 16px">${settings.subtitle || ''}</p>
            <button style="background:${c.buttonBg};color:${c.buttonText};border:none;padding:10px 24px;border-radius:8px;font-weight:bold;cursor:pointer">${settings.buttonText || 'Shop Now'}</button>
          </div>`;
        case 'product-carousel':
          return `<div style="margin-bottom:24px">
            <h3 style="color:${c.text};font-size:20px;margin:0 0 12px">${settings.title || 'Products'}</h3>
            <div style="display:flex;gap:12px;overflow-x:auto;padding-bottom:8px">
              ${Array.from({ length: 6 }).map((_, i) => `
                <div style="min-width:160px;background:${c.surface};border:1px solid ${c.borderColor};border-radius:8px;overflow:hidden">
                  <div style="height:120px;background:${c.borderColor};display:flex;align-items:center;justify-content:center"><span style="color:${c.textMuted};font-size:12px">Product ${i + 1}</span></div>
                  <div style="padding:8px">
                    <p style="color:${c.text};font-size:13px;margin:0 0 4px">Sample Product ${i + 1}</p>
                    <p style="color:${c.priceColor};font-size:14px;font-weight:bold;margin:0">99 SAR</p>
                  </div>
                </div>`).join('')}
            </div>
          </div>`;
        case 'category-grid':
          return `<div style="margin-bottom:24px">
            <h3 style="color:${c.text};font-size:20px;margin:0 0 12px">${settings.title || 'Categories'}</h3>
            <div style="display:grid;grid-template-columns:repeat(${settings.columns || 4},1fr);gap:12px">
              ${Array.from({ length: settings.columns || 4 }).map((_, i) => `
                <div style="background:${c.surface};border:1px solid ${c.borderColor};border-radius:8px;padding:20px;text-align:center">
                  <p style="color:${c.text};font-weight:bold;margin:0">Category ${i + 1}</p>
                </div>`).join('')}
            </div>
          </div>`;
        case 'newsletter':
          return `<div style="background:${c.primary};padding:32px 20px;text-align:center;border-radius:12px;margin-bottom:20px">
            <h3 style="color:#fff;margin:0 0 8px">${settings.title || 'Subscribe'}</h3>
            <p style="color:#fff;opacity:0.9;margin:0 0 12px">${settings.subtitle || 'Get updates on new products'}</p>
            <div style="display:flex;gap:8px;max-width:400px;margin:0 auto">
              <input style="flex:1;padding:10px;border:none;border-radius:8px" placeholder="Email address" />
              <button style="background:${c.buttonBg};color:${c.buttonText};border:none;padding:10px 20px;border-radius:8px;font-weight:bold">Subscribe</button>
            </div>
          </div>`;
        case 'rich-text':
          return `<div style="max-width:800px;margin:0 auto 24px;padding:16px">
            <h3 style="color:${c.text};font-size:20px;margin:0 0 8px">${settings.title || ''}</h3>
            <div style="color:${c.textMuted};font-size:14px;line-height:1.6">${settings.content || ''}</div>
          </div>`;
        case 'image-banner':
          return `<div style="margin-bottom:24px;border-radius:12px;overflow:hidden">
            <img src="${settings.imageUrl || ''}" alt="${settings.altText || ''}" style="width:100%;display:block;max-height:300px;object-fit:cover" />
          </div>`;
        case 'testimonial':
          return `<div style="margin-bottom:24px">
            <h3 style="color:${c.text};font-size:20px;margin:0 0 12px">${settings.title || 'Testimonials'}</h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px">
              ${(settings.items || []).slice(0, 3).map((item, i) => `
                <div style="background:${c.surface};border:1px solid ${c.borderColor};border-radius:8px;padding:16px">
                  <p style="color:${c.text};font-size:14px;font-style:italic;margin:0 0 8px">"${item.text || 'Great service!'}"</p>
                  <p style="color:${c.textMuted};font-size:13px;font-weight:bold;margin:0">${item.author || 'Customer'}</p>
                </div>`).join('')}
            </div>
          </div>`;
        case 'faq':
          return `<div style="max-width:800px;margin:0 auto 24px;padding:16px">
            <h3 style="color:${c.text};font-size:20px;margin:0 0 12px">${settings.title || 'FAQ'}</h3>
            ${(settings.items || []).slice(0, 5).map((item, i) => `
              <details style="border-bottom:1px solid ${c.borderColor};padding:8px 0">
                <summary style="color:${c.text};font-size:14px;font-weight:bold;cursor:pointer">${item.question || 'Question?'}</summary>
                <p style="color:${c.textMuted};font-size:13px;margin:8px 0">${item.answer || ''}</p>
              </details>`).join('')}
          </div>`;
        case 'spacer':
          return `<div style="height:${settings.height || 40}px"></div>`;
        case 'custom-html':
          return settings.html || '';
        default:
          return '';
      }
    }).join('');

    const announcement = h.announcementBar?.enabled ? `
      <div style="background:${h.announcementBar.bgColor || c.primary};color:${h.announcementBar.textColor || '#fff'};padding:8px;text-align:center;font-size:13px">
        ${h.announcementBar.text || ''}
      </div>` : '';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=${(t.headingFont || 'Inter').replace(/ /g, '+')}:wght@400;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:${t.bodyFont || 'Inter'},sans-serif;background:${c.background};color:${c.text};${t.lineHeight ? `line-height:1.6` : ''}}
  .header{background:${c.headerBg};border-bottom:1px solid ${c.borderColor};padding:12px 20px;display:flex;align-items:center;justify-content:space-between;position:${h.sticky ? 'sticky' : 'static'};top:0;z-index:10}
  .logo{font-weight:bold;font-size:20px;color:${c.text}}
  .nav{display:flex;gap:16px}
  .nav a{color:${c.textMuted};text-decoration:none;font-size:14px}
  .container{max-width:960px;margin:0 auto;padding:20px}
  .footer{background:${c.footerBg};color:${c.footerText};padding:24px 20px;margin-top:40px}
  .footer-grid{max-width:960px;margin:0 auto;display:flex;justify-content:space-between;flex-wrap:wrap;gap:20px}
  .footer h4{color:#fff;margin:0 0 8px;font-size:14px}
  .footer a{color:${c.footerText};text-decoration:none;font-size:13px;display:block;margin-bottom:4px}
  ${config.customCss || ''}
</style>
</head>
<body>
${announcement}
<div class="header">
  <div class="logo">${h.logoImageUrl ? `<img src="${h.logoImageUrl}" alt="logo" style="height:32px">` : (h.logoText || 'Store Name')}</div>
  <div class="nav">
    ${h.showCategories ? '<a href="#">Categories</a>' : ''}
    <a href="#">Products</a>
    ${h.showSearch ? '<a href="#">Search</a>' : ''}
    ${h.showCart ? '<a href="#">Cart (0)</a>' : ''}
  </div>
</div>
<div class="container">
${sectionHTML}
</div>
<div class="footer">
  <div class="footer-grid">
    <div>
      <h4>About</h4>
      <p style="font-size:13px;max-width:200px">${f.aboutText || 'Your store description here.'}</p>
    </div>
    <div>
      <h4>Quick Links</h4>
      <a href="#">Home</a><a href="#">Products</a><a href="#">Contact</a>
    </div>
    <div>
      <h4>Contact</h4>
      <p style="font-size:13px">Email: info@store.com</p>
    </div>
  </div>
  ${f.copyrightText ? `<p style="text-align:center;margin-top:16px;font-size:12px">${f.copyrightText}</p>` : ''}
</div>
</body>
</html>`;
  };

  // Update preview iframe
  useEffect(() => {
    if (previewRef.current && theme) {
      const doc = previewRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(generatePreviewHTML(theme));
        doc.close();
      }
    }
  }, [theme]);

  const update = (path, value) => {
    setTheme(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = obj[keys[i]] || {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const updateColor = (key, value) => update(`colors.${key}`, value);
  const updateTypography = (key, value) => update(`typography.${key}`, value);
  const updateHeader = (key, value) => update(`header.${key}`, value);
  const updateFooter = (key, value) => update(`footer.${key}`, value);
  const updateProductPage = (key, value) => update(`productPage.${key}`, value);
  const updateCart = (key, value) => update(`cart.${key}`, value);

  const updateSection = (idx, key, value) => {
    setTheme(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.homepage.sections[idx].settings = next.homepage.sections[idx].settings || {};
      if (key === 'enabled') {
        next.homepage.sections[idx].enabled = value;
      } else if (key === 'type') {
        next.homepage.sections[idx].type = value;
      } else if (key === 'title') {
        next.homepage.sections[idx].settings.title = value;
      } else {
        next.homepage.sections[idx].settings[key] = value;
      }
      return next;
    });
  };

  const moveSection = (idx, dir) => {
    setTheme(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const sections = next.homepage.sections;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= sections.length) return prev;
      [sections[idx], sections[newIdx]] = [sections[newIdx], sections[idx]];
      return next;
    });
  };

  const removeSection = (idx) => {
    setTheme(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.homepage.sections.splice(idx, 1);
      return next;
    });
  };

  const addSection = (type) => {
    setTheme(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const id = `sec-${Date.now()}`;
      next.homepage.sections.push({ id, type, enabled: true, settings: { title: 'New Section' } });
      return next;
    });
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await api.put('/ecommerce/theme/draft', theme);
      setDraftUpdatedAt(res.data.draftUpdatedAt);
      setSuccess('Draft saved');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setError('');
    try {
      const res = await api.post('/ecommerce/theme/publish', {});
      setPublishedAt(res.data.publishedAt);
      setHasUnpublished(false);
      setSuccess('Theme published — storefront updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  const handleUploadImage = async (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const targetSetter = target === 'hero' ? setApplyingPreset : setUploadingLogo;
    targetSetter(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/ecommerce/theme/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      const imageUrl = res.data?.imageUrl;
      if (target === 'hero' && heroUploadIdx !== null) {
        updateSection(heroUploadIdx, 'imageUrl', imageUrl);
      } else {
        updateHeader('logoImageUrl', imageUrl);
      }
      return imageUrl;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload image');
      return null;
    } finally {
      targetSetter(false);
      if (target === 'logo' && logoInputRef.current) logoInputRef.current.value = '';
      if (target === 'hero' && heroInputRef.current) heroInputRef.current.value = '';
    }
  };

  const handleApplyPreset = async (id) => {
    setApplyingPreset(id);
    try {
      const res = await api.post(`/ecommerce/theme/presets/${id}`);
      setTheme(res.data.draft);
      setDraftUpdatedAt(res.data.draftUpdatedAt);
      setHasUnpublished(true);
      setSuccess('Preset applied — save draft to keep it');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to apply preset');
    } finally {
      setApplyingPreset(null);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset draft to default theme? This will discard all your changes.')) return;
    setSaving(true);
    try {
      const res = await api.post('/ecommerce/theme/reset', {});
      setTheme(res.data.draft);
      setDraftUpdatedAt(res.data.draftUpdatedAt);
      setSuccess('Draft reset to defaults');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>;
  }

  if (!theme) {
    return <div className="max-w-4xl mx-auto py-20 text-center"><Palette className="w-12 h-12 text-gray-200 mx-auto mb-4" /><p className="font-bold text-gray-500">Failed to load theme</p></div>;
  }

  const inputCls = "w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500";
  const labelCls = "block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider";
  const tabCls = (tab) => `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${activeTab === tab ? 'bg-violet-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700'}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleString('en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-violet-50 flex items-center justify-center">
            <Palette className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Theme Editor</h1>
            <p className="text-sm text-gray-400">
              {hasUnpublished ? <span className="text-amber-600 font-bold">Unpublished changes</span> : 'All changes published'}
              {' · '}Draft: {fmtDate(draftUpdatedAt)} · Published: {fmtDate(publishedAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-dark-600 font-bold text-sm hover:bg-gray-50 dark:hover:bg-dark-700">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button onClick={handleSaveDraft} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-full border border-violet-200 text-violet-600 font-bold text-sm hover:bg-violet-50 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Draft
          </button>
          <button onClick={handlePublish} disabled={publishing} className="flex items-center gap-2 bg-violet-600 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-violet-700 disabled:opacity-50">
            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Publish
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle className="w-4 h-4 flex-shrink-0" />{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Controls */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setActiveTab('presets')} className={tabCls('presets')}><Sparkles className="w-4 h-4" /> Presets</button>
            <button onClick={() => setActiveTab('colors')} className={tabCls('colors')}><Palette className="w-4 h-4" /> Colors</button>
            <button onClick={() => setActiveTab('typography')} className={tabCls('typography')}><Type className="w-4 h-4" /> Typography</button>
            <button onClick={() => setActiveTab('header')} className={tabCls('header')}><Layout className="w-4 h-4" /> Header</button>
            <button onClick={() => setActiveTab('sections')} className={tabCls('sections')}><Home className="w-4 h-4" /> Sections</button>
            <button onClick={() => setActiveTab('footer')} className={tabCls('footer')}><Layout className="w-4 h-4" /> Footer</button>
            <button onClick={() => setActiveTab('product')} className={tabCls('product')}><Eye className="w-4 h-4" /> Product</button>
            <button onClick={() => setActiveTab('cart')} className={tabCls('cart')}><ShoppingCart className="w-4 h-4" /> Cart</button>
          </div>

          {/* Hidden file inputs for image uploads */}
          <input ref={heroInputRef} type="file" accept="image/*" onChange={e => handleUploadImage(e, 'hero')} className="hidden" />

          {/* Presets */}
          {activeTab === 'presets' && (
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5 space-y-4">
              <p className="text-sm text-gray-500">Choose a preset theme to apply instantly. You can customize it afterward.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {presets.map(preset => (
                  <div key={preset.id} className="border border-gray-200 dark:border-dark-600 rounded-xl p-4 space-y-3 hover:border-violet-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0" style={{ background: preset.preview?.background || '#fff' }}>
                        <div className="w-full h-2" style={{ background: preset.preview?.primary || '#4f46e5' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{preset.name}</p>
                        <p className="text-xs text-gray-400 truncate">{preset.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplyPreset(preset.id)}
                      disabled={applyingPreset === preset.id}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-50 text-violet-600 rounded-lg text-xs font-bold hover:bg-violet-100 disabled:opacity-60 transition-colors"
                    >
                      {applyingPreset === preset.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      Apply Preset
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {activeTab === 'colors' && (
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {COLOR_FIELDS.map(f => (
                  <div key={f.key} className="flex items-center gap-2">
                    <input type="color" value={theme.colors?.[f.key] || '#000000'} onChange={e => updateColor(f.key, e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <label className={labelCls}>{f.label}</label>
                      <input className={inputCls} value={theme.colors?.[f.key] || ''} onChange={e => updateColor(f.key, e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-gray-100 dark:border-dark-700">
                <label className={labelCls}>Layout Style</label>
                <select className={inputCls} value={theme.layout || 'modern'} onChange={e => update('layout', e.target.value)}>
                  {LAYOUT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Typography */}
          {activeTab === 'typography' && (
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Heading Font</label>
                  <select className={inputCls} value={theme.typography?.headingFont || 'Inter'} onChange={e => updateTypography('headingFont', e.target.value)}>
                    {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Body Font</label>
                  <select className={inputCls} value={theme.typography?.bodyFont || 'Inter'} onChange={e => updateTypography('bodyFont', e.target.value)}>
                    {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Custom CSS</label>
                <textarea className={`${inputCls} font-mono`} rows={6} value={theme.customCss || ''} onChange={e => update('customCss', e.target.value)} placeholder="/* Add custom CSS here */" />
              </div>
            </div>
          )}

          {/* Header */}
          {activeTab === 'header' && (
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Logo Text</label>
                  <input className={inputCls} value={theme.header?.logoText || ''} onChange={e => updateHeader('logoText', e.target.value)} placeholder="Store name" />
                </div>
                <div>
                  <label className={labelCls}>Logo Image</label>
                  <div className="flex items-center gap-2">
                    <input className={inputCls} value={theme.header?.logoImageUrl || ''} onChange={e => updateHeader('logoImageUrl', e.target.value)} placeholder="https://..." />
                    <input ref={logoInputRef} type="file" accept="image/*" onChange={e => handleUploadImage(e, 'logo')} className="hidden" />
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
                    >
                      {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                      Upload
                    </button>
                  </div>
                  {theme.header?.logoImageUrl && (
                    <img src={theme.header.logoImageUrl} alt="Logo preview" className="mt-2 h-10 w-auto object-contain rounded-lg border border-gray-200" />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.header?.showLogo ?? true} onChange={e => updateHeader('showLogo', e.target.checked)} className="w-4 h-4 rounded" /> Show logo</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.header?.showSearch ?? true} onChange={e => updateHeader('showSearch', e.target.checked)} className="w-4 h-4 rounded" /> Show search bar</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.header?.showCart ?? true} onChange={e => updateHeader('showCart', e.target.checked)} className="w-4 h-4 rounded" /> Show cart icon</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.header?.showCategories ?? true} onChange={e => updateHeader('showCategories', e.target.checked)} className="w-4 h-4 rounded" /> Show categories nav</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.header?.sticky ?? true} onChange={e => updateHeader('sticky', e.target.checked)} className="w-4 h-4 rounded" /> Sticky header</label>
              </div>
              <div className="pt-3 border-t border-gray-100 dark:border-dark-700">
                <label className="flex items-center gap-2 text-sm font-bold mb-2"><input type="checkbox" checked={theme.header?.announcementBar?.enabled || false} onChange={e => update('header.announcementBar.enabled', e.target.checked)} className="w-4 h-4 rounded" /> Announcement Bar</label>
                {theme.header?.announcementBar?.enabled && (
                  <div className="grid grid-cols-2 gap-3 pl-6">
                    <input className={inputCls} value={theme.header.announcementBar.text || ''} onChange={e => update('header.announcementBar.text', e.target.value)} placeholder="Announcement text" />
                    <input className={inputCls} value={theme.header.announcementBar.textAr || ''} onChange={e => update('header.announcementBar.textAr', e.target.value)} placeholder="النص بالعربية" dir="rtl" />
                    <input type="color" value={theme.header.announcementBar.bgColor || '#4f46e5'} onChange={e => update('header.announcementBar.bgColor', e.target.value)} className="w-full h-10 rounded-lg border border-gray-200 cursor-pointer" />
                    <input type="color" value={theme.header.announcementBar.textColor || '#ffffff'} onChange={e => update('header.announcementBar.textColor', e.target.value)} className="w-full h-10 rounded-lg border border-gray-200 cursor-pointer" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sections (homepage builder) */}
          {activeTab === 'sections' && (
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5 space-y-3">
              <p className="text-sm text-gray-400 mb-2">Drag sections to reorder. Toggle to show/hide on storefront.</p>
              {theme.homepage?.sections?.map((sec, idx) => (
                <div key={sec.id || idx} className="border border-gray-200 dark:border-dark-600 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <select className={`${inputCls} flex-1`} value={sec.type} onChange={e => updateSection(idx, 'type', e.target.value)}>
                      {SECTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={sec.enabled} onChange={e => updateSection(idx, 'enabled', e.target.checked)} className="w-4 h-4 rounded" /> On</label>
                    <div className="flex gap-1">
                      <button onClick={() => moveSection(idx, -1)} disabled={idx === 0} className="p-1 rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 text-xs">↑</button>
                      <button onClick={() => moveSection(idx, 1)} disabled={idx === theme.homepage.sections.length - 1} className="p-1 rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 text-xs">↓</button>
                      <button onClick={() => removeSection(idx)} className="p-1 rounded text-red-400 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  {sec.enabled && sec.settings && (
                    <div className="pl-6 grid grid-cols-2 gap-2">
                      {sec.type === 'hero' && (
                        <>
                          <input className={inputCls} value={sec.settings.title || ''} onChange={e => updateSection(idx, 'title', e.target.value)} placeholder="Hero title" />
                          <input className={inputCls} value={sec.settings.subtitle || ''} onChange={e => updateSection(idx, 'subtitle', e.target.value)} placeholder="Subtitle" />
                          <div className="flex items-center gap-2">
                            <input className={inputCls} value={sec.settings.imageUrl || ''} onChange={e => updateSection(idx, 'imageUrl', e.target.value)} placeholder="Background image URL" />
                            <button
                              onClick={() => { setHeroUploadIdx(idx); setTimeout(() => heroInputRef.current?.click(), 0); }}
                              disabled={applyingPreset}
                              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
                            >
                              {applyingPreset ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                              Upload
                            </button>
                          </div>
                          <input className={inputCls} value={sec.settings.buttonText || ''} onChange={e => updateSection(idx, 'buttonText', e.target.value)} placeholder="Button text" />
                        </>
                      )}
                      {sec.type === 'product-carousel' && (
                        <>
                          <input className={inputCls} value={sec.settings.title || ''} onChange={e => updateSection(idx, 'title', e.target.value)} placeholder="Section title" />
                          <input type="number" className={inputCls} value={sec.settings.limit || 8} onChange={e => updateSection(idx, 'limit', parseInt(e.target.value) || 8)} placeholder="Product limit" />
                        </>
                      )}
                      {sec.type === 'category-grid' && (
                        <>
                          <input className={inputCls} value={sec.settings.title || ''} onChange={e => updateSection(idx, 'title', e.target.value)} placeholder="Section title" />
                          <input type="number" className={inputCls} value={sec.settings.columns || 4} onChange={e => updateSection(idx, 'columns', parseInt(e.target.value) || 4)} placeholder="Columns" />
                        </>
                      )}
                      {sec.type === 'newsletter' && (
                        <>
                          <input className={inputCls} value={sec.settings.title || ''} onChange={e => updateSection(idx, 'title', e.target.value)} placeholder="Title" />
                          <input className={inputCls} value={sec.settings.subtitle || ''} onChange={e => updateSection(idx, 'subtitle', e.target.value)} placeholder="Subtitle" />
                        </>
                      )}
                      {sec.type === 'rich-text' && (
                        <>
                          <input className={inputCls} value={sec.settings.title || ''} onChange={e => updateSection(idx, 'title', e.target.value)} placeholder="Block title" />
                          <textarea className={`${inputCls}`} rows={4} value={sec.settings.content || ''} onChange={e => updateSection(idx, 'content', e.target.value)} placeholder="HTML or text content" />
                        </>
                      )}
                      {sec.type === 'image-banner' && (
                        <>
                          <div className="flex items-center gap-2">
                            <input className={inputCls} value={sec.settings.imageUrl || ''} onChange={e => updateSection(idx, 'imageUrl', e.target.value)} placeholder="Image URL" />
                            <button
                              onClick={() => { setHeroUploadIdx(idx); setTimeout(() => heroInputRef.current?.click(), 0); }}
                              disabled={applyingPreset}
                              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
                            >
                              {applyingPreset ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                              Upload
                            </button>
                          </div>
                          <input className={inputCls} value={sec.settings.altText || ''} onChange={e => updateSection(idx, 'altText', e.target.value)} placeholder="Alt text" />
                        </>
                      )}
                      {sec.type === 'testimonial' && (
                        <>
                          <input className={inputCls} value={sec.settings.title || ''} onChange={e => updateSection(idx, 'title', e.target.value)} placeholder="Section title" />
                          {(sec.settings.items || []).map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input className={inputCls} value={item.author || ''} onChange={e => { const next = [...(sec.settings.items || [])]; next[i] = { ...next[i], author: e.target.value }; updateSection(idx, 'items', next); }} placeholder="Author name" />
                              <input className={inputCls} value={item.text || ''} onChange={e => { const next = [...(sec.settings.items || [])]; next[i] = { ...next[i], text: e.target.value }; updateSection(idx, 'items', next); }} placeholder="Testimonial text" />
                              <button onClick={() => { const next = (sec.settings.items || []).filter((_, j) => j !== i); updateSection(idx, 'items', next); }} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          ))}
                          <button onClick={() => updateSection(idx, 'items', [...(sec.settings.items || []), { author: '', text: '' }])} className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:underline"><Plus className="w-3 h-3" /> Add testimonial</button>
                        </>
                      )}
                      {sec.type === 'faq' && (
                        <>
                          <input className={inputCls} value={sec.settings.title || ''} onChange={e => updateSection(idx, 'title', e.target.value)} placeholder="Section title" />
                          {(sec.settings.items || []).map((item, i) => (
                            <div key={i} className="space-y-1">
                              <div className="flex items-center gap-2">
                                <input className={inputCls} value={item.question || ''} onChange={e => { const next = [...(sec.settings.items || [])]; next[i] = { ...next[i], question: e.target.value }; updateSection(idx, 'items', next); }} placeholder="Question" />
                                <button onClick={() => { const next = (sec.settings.items || []).filter((_, j) => j !== i); updateSection(idx, 'items', next); }} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                              <input className={inputCls} value={item.answer || ''} onChange={e => { const next = [...(sec.settings.items || [])]; next[i] = { ...next[i], answer: e.target.value }; updateSection(idx, 'items', next); }} placeholder="Answer" />
                            </div>
                          ))}
                          <button onClick={() => updateSection(idx, 'items', [...(sec.settings.items || []), { question: '', answer: '' }])} className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:underline"><Plus className="w-3 h-3" /> Add FAQ item</button>
                        </>
                      )}
                      {sec.type === 'spacer' && (
                        <input type="number" className={inputCls} value={sec.settings.height || 40} onChange={e => updateSection(idx, 'height', parseInt(e.target.value) || 40)} placeholder="Height in px" />
                      )}
                      {sec.type === 'custom-html' && (
                        <textarea className={`${inputCls} font-mono`} rows={4} value={sec.settings.html || ''} onChange={e => updateSection(idx, 'html', e.target.value)} placeholder="Custom HTML code" />
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <select id="newSectionType" className={inputCls} defaultValue="hero">
                  {SECTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <button onClick={() => {
                  const sel = document.getElementById('newSectionType');
                  addSection(sel?.value || 'hero');
                }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          {activeTab === 'footer' && (
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5 space-y-4">
              <div>
                <label className={labelCls}>About Text</label>
                <textarea className={inputCls} rows={3} value={theme.footer?.aboutText || ''} onChange={e => updateFooter('aboutText', e.target.value)} placeholder="Store description for footer" />
              </div>
              <div>
                <label className={labelCls}>Copyright Text</label>
                <input className={inputCls} value={theme.footer?.copyrightText || ''} onChange={e => updateFooter('copyrightText', e.target.value)} placeholder="© 2024 Store Name" />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.footer?.showAbout ?? true} onChange={e => updateFooter('showAbout', e.target.checked)} className="w-4 h-4 rounded" /> Show about section</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.footer?.showContact ?? true} onChange={e => updateFooter('showContact', e.target.checked)} className="w-4 h-4 rounded" /> Show contact info</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.footer?.showSocialLinks ?? true} onChange={e => updateFooter('showSocialLinks', e.target.checked)} className="w-4 h-4 rounded" /> Show social links</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.footer?.showPaymentIcons ?? true} onChange={e => updateFooter('showPaymentIcons', e.target.checked)} className="w-4 h-4 rounded" /> Show payment icons</label>
              </div>
              {theme.footer?.showSocialLinks && (
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <input className={inputCls} value={theme.footer?.socialLinks?.instagram || ''} onChange={e => update('footer.socialLinks.instagram', e.target.value)} placeholder="Instagram URL" />
                  <input className={inputCls} value={theme.footer?.socialLinks?.twitter || ''} onChange={e => update('footer.socialLinks.twitter', e.target.value)} placeholder="Twitter URL" />
                  <input className={inputCls} value={theme.footer?.socialLinks?.facebook || ''} onChange={e => update('footer.socialLinks.facebook', e.target.value)} placeholder="Facebook URL" />
                  <input className={inputCls} value={theme.footer?.socialLinks?.tiktok || ''} onChange={e => update('footer.socialLinks.tiktok', e.target.value)} placeholder="TikTok URL" />
                  <input className={inputCls} value={theme.footer?.socialLinks?.snapchat || ''} onChange={e => update('footer.socialLinks.snapchat', e.target.value)} placeholder="Snapchat URL" />
                </div>
              )}
            </div>
          )}

          {/* Product Page */}
          {activeTab === 'product' && (
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5 space-y-3">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.productPage?.showBreadcrumbs ?? true} onChange={e => updateProductPage('showBreadcrumbs', e.target.checked)} className="w-4 h-4 rounded" /> Show breadcrumbs</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.productPage?.showRelatedProducts ?? true} onChange={e => updateProductPage('showRelatedProducts', e.target.checked)} className="w-4 h-4 rounded" /> Show related products</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.productPage?.showReviews ?? false} onChange={e => updateProductPage('showReviews', e.target.checked)} className="w-4 h-4 rounded" /> Show reviews section</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.productPage?.defaultImageZoom ?? true} onChange={e => updateProductPage('defaultImageZoom', e.target.checked)} className="w-4 h-4 rounded" /> Enable image zoom</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.productPage?.showShareButtons ?? true} onChange={e => updateProductPage('showShareButtons', e.target.checked)} className="w-4 h-4 rounded" /> Show share buttons</label>
              <div>
                <label className={labelCls}>Related Products Limit</label>
                <input type="number" min="1" max="12" className={inputCls} value={theme.productPage?.relatedLimit || 4} onChange={e => updateProductPage('relatedLimit', parseInt(e.target.value) || 4)} />
              </div>
            </div>
          )}

          {/* Cart */}
          {activeTab === 'cart' && (
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5 space-y-4">
              <div>
                <label className={labelCls}>Cart Style</label>
                <select className={inputCls} value={theme.cart?.style || 'drawer'} onChange={e => updateCart('style', e.target.value)}>
                  <option value="drawer">Slide-out Drawer</option>
                  <option value="page">Full Page</option>
                  <option value="modal">Modal Popup</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.cart?.showRecommendations ?? true} onChange={e => updateCart('showRecommendations', e.target.checked)} className="w-4 h-4 rounded" /> Show product recommendations</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.cart?.freeShippingBar ?? true} onChange={e => updateCart('freeShippingBar', e.target.checked)} className="w-4 h-4 rounded" /> Show free shipping progress bar</label>
            </div>
          )}
        </div>

        {/* Right: Live Preview */}
        <div className="space-y-3 sticky top-4 self-start">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Eye className="w-4 h-4 text-gray-400" /> Live Preview</h3>
            <div className="flex gap-1">
              <button onClick={() => setPreviewDevice('desktop')} className={`p-2 rounded-lg ${previewDevice === 'desktop' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-100'}`}><Monitor className="w-4 h-4" /></button>
              <button onClick={() => setPreviewDevice('mobile')} className={`p-2 rounded-lg ${previewDevice === 'mobile' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-gray-100'}`}><Smartphone className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
            <iframe
              ref={previewRef}
              title="Theme Preview"
              className="w-full border-0 transition-all"
              style={{ height: '600px', maxWidth: previewDevice === 'mobile' ? '375px' : '100%', margin: previewDevice === 'mobile' ? '0 auto' : '0' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
