import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Palette, Save, Loader2, Upload, RotateCcw, AlertCircle, CheckCircle, Eye, Layout, Type, ShoppingCart, Home, Monitor, Smartphone, GripVertical, Trash2, Plus, ImageIcon, Sparkles, Download, FileUp, Smartphone as PhoneIcon, Moon, ChevronLeft, ChevronRight, Tag, Tablet, Maximize2, Package, Code, CreditCard, Layers } from 'lucide-react';
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
  { value: 'flash-sale', label: 'Flash Sale / Countdown' },
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
  const [importingTheme, setImportingTheme] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [previewPage, setPreviewPage] = useState('home');
  const [previewSize, setPreviewSize] = useState(null); // null = auto per device
  const [categories, setCategories] = useState([]);
  const [categoryUploading, setCategoryUploading] = useState(null);
  const [bannerUploadTarget, setBannerUploadTarget] = useState(null); // { secIdx, bannerIdx }
  const importInputRef = useRef(null);
  const previewRef = useRef(null);
  const logoInputRef = useRef(null);
  const heroInputRef = useRef(null);
  const categoryImgRefs = useRef({});
  const bannerUploadRef = useRef(null);

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

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/ecommerce/categories');
      setCategories(res.data?.categories || res.data || []);
    } catch {}
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleSaveCategory = async (cat) => {
    try {
      if (cat._id) {
        await api.put(`/ecommerce/categories/${cat._id}`, cat);
      } else {
        await api.post('/ecommerce/categories', cat);
      }
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await api.delete(`/ecommerce/categories/${id}`);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete category');
    }
  };

  const handleUploadCategoryImage = async (file, catIdx) => {
    if (!file) return null;
    setCategoryUploading(catIdx);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/ecommerce/theme/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      return res.data?.imageUrl;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload image');
      return null;
    } finally {
      setCategoryUploading(null);
    }
  };

  const handleUploadBannerImage = async (file, secIdx, bannerIdx) => {
    if (!file) return;
    setApplyingPreset(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/ecommerce/theme/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });
      const imageUrl = res.data?.imageUrl;
      if (imageUrl) {
        const sec = theme.homepage?.sections?.[secIdx];
        if (sec?.settings?.banners && bannerIdx !== undefined) {
          const next = [...sec.settings.banners];
          next[bannerIdx] = { ...next[bannerIdx], imageUrl };
          updateSection(secIdx, 'banners', next);
        } else if (sec?.settings?.slides && bannerIdx !== undefined) {
          const next = [...sec.settings.slides];
          next[bannerIdx] = { ...next[bannerIdx], imageUrl };
          updateSection(secIdx, 'slides', next);
        } else {
          updateSection(secIdx, 'imageUrl', imageUrl);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload image');
    } finally {
      setApplyingPreset(false);
      if (bannerUploadRef.current) bannerUploadRef.current.value = '';
    }
  };

  // Generate preview HTML from theme config
  const generatePreviewHTML = (config, device = 'desktop', page = 'home') => {
    if (!config) return '<html><body>Loading...</body></html>';
    const c = config.colors || {};
    const t = config.typography || {};
    const h = config.header || {};
    const hn = config.headerNav || {};
    const f = config.footer || {};
    const pc = config.productCard || {};
    const mm = config.megaMenu || {};
    const sections = config.homepage?.sections || [];

    const sectionHTML = sections.filter(s => s.enabled).map(s => {
      const settings = s.settings || {};
      switch (s.type) {
        case 'hero': {
          const slides = settings.slides || [{ imageUrl: settings.imageUrl, title: settings.title, subtitle: settings.subtitle, buttonText: settings.buttonText, buttonLink: settings.buttonLink }];
          const slide = slides[0] || {};
          return `<div style="background:${slide.imageUrl ? `linear-gradient(rgba(0,0,0,0.25),rgba(0,0,0,0.25)),url(${slide.imageUrl}) center/cover` : c.primary};padding:60px 20px;text-align:center;border-radius:12px;margin-bottom:20px">
            <h2 style="color:#fff;font-size:28px;margin:0 0 8px">${slide.title || 'Welcome to our store'}</h2>
            <p style="color:#fff;opacity:0.9;margin:0 0 16px">${slide.subtitle || ''}</p>
            ${slide.buttonText ? `<button style="background:${c.buttonBg};color:${c.buttonText};border:none;padding:10px 24px;border-radius:8px;font-weight:bold;cursor:pointer">${slide.buttonText}</button>` : ''}
            ${slides.length > 1 ? `<p style="color:#fff;opacity:0.6;font-size:11px;margin-top:12px">${slides.length} slides · ${settings.autoPlay !== false ? 'Auto-play' : 'Manual'}</p>` : ''}
          </div>`;
        }
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
        case 'flash-sale':
          return `<div style="margin-bottom:24px;background:linear-gradient(135deg,${c.primary || '#4f46e5'},${c.accent || '#7c3aed'});border-radius:12px;padding:24px;text-align:center">
            <h3 style="color:#fff;font-size:22px;margin:0 0 4px">${settings.title || 'Flash Sale'}</h3>
            <p style="color:#fff;opacity:0.9;margin:0 0 12px">${settings.subtitle || 'Limited time offer!'}</p>
            <div style="display:flex;gap:8px;justify-content:center;margin-bottom:16px">
              ${['00','12','45','30'].map((val,i) => `
                <div style="background:rgba(255,255,255,0.2);border-radius:8px;padding:8px 12px;min-width:48px">
                  <p style="color:#fff;font-size:20px;font-weight:bold;margin:0">${val}</p>
                  <p style="color:#fff;opacity:0.7;font-size:10px;margin:0">${['Days','Hrs','Min','Sec'][i]}</p>
                </div>`).join('')}
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px">
              ${Array.from({ length: 4 }).map((_, i) => `
                <div style="background:#fff;border-radius:8px;overflow:hidden">
                  <div style="height:100px;background:#f3f4f6;display:flex;align-items:center;justify-content:center"><span style="color:#9ca3af;font-size:11px">Product ${i + 1}</span></div>
                  <div style="padding:8px">
                    <p style="font-size:12px;margin:0 0 2px">Sale Product ${i + 1}</p>
                    <span style="font-size:11px;color:#dc2626;text-decoration:line-through">199 SAR</span>
                    <p style="color:#059669;font-size:14px;font-weight:bold;margin:0">99 SAR</p>
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
        case 'image-banner': {
          const banners = settings.banners || [{ imageUrl: settings.imageUrl, linkUrl: settings.linkUrl, altText: settings.altText }];
          return banners.map(b => `<div style="margin-bottom:12px;border-radius:12px;overflow:hidden">
            <img src="${b.imageUrl || ''}" alt="${b.altText || ''}" style="width:100%;display:block;max-height:300px;object-fit:cover" />
          </div>`).join('');
        }
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

    // Page-specific preview content
    const pageContentHTML = (() => {
      if (page === 'product') {
        return `<div style="padding:20px;max-width:960px;margin:0 auto">
          <p style="font-size:12px;color:${c.textMuted||'#6b7280'};margin-bottom:16px">Home &rsaquo; Products &rsaquo; Sample Product</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
            <div style="background:${c.surface||'#f9fafb'};border-radius:12px;aspect-ratio:1;display:flex;align-items:center;justify-content:center;border:1px solid ${c.borderColor||'#e5e7eb'}">
              <span style="color:${c.textMuted||'#9ca3af'};font-size:13px">Product Image</span>
            </div>
            <div>
              <h1 style="font-size:22px;font-weight:800;color:${c.text||'#111'};margin:0 0 8px">Sample Product Name</h1>
              <p style="font-size:24px;font-weight:700;color:${c.priceColor||'#059669'};margin:0 0 16px">249 SAR</p>
              <p style="font-size:14px;color:${c.textMuted||'#6b7280'};margin-bottom:20px;line-height:1.6">A great product with amazing features. Perfect for everyday use and long-lasting quality.</p>
              <button style="width:100%;background:${c.buttonBg||c.primary||'#4f46e5'};color:${c.buttonText||'#fff'};border:none;padding:14px;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer">Add to Cart</button>
              <button style="width:100%;background:transparent;border:1.5px solid ${c.borderColor||'#e5e7eb'};color:${c.text||'#111'};padding:12px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;margin-top:8px">Buy Now</button>
            </div>
          </div>
        </div>`;
      }
      if (page === 'cart') {
        return `<div style="padding:20px;max-width:700px;margin:0 auto">
          <h2 style="font-size:20px;font-weight:800;color:${c.text||'#111'};margin:0 0 20px">Your Cart (2 items)</h2>
          ${[1,2].map(i => `<div style="display:flex;gap:14px;padding:14px;background:${c.surface||'#f9fafb'};border-radius:12px;border:1px solid ${c.borderColor||'#e5e7eb'};margin-bottom:10px">
            <div style="width:72px;height:72px;background:${c.borderColor||'#e5e7eb'};border-radius:8px;flex-shrink:0"></div>
            <div style="flex:1">
              <p style="font-weight:700;color:${c.text||'#111'};margin:0 0 4px;font-size:14px">Sample Product ${i}</p>
              <p style="color:${c.priceColor||'#059669'};font-weight:700;margin:0;font-size:15px">149 SAR</p>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <button style="width:28px;height:28px;border:1px solid ${c.borderColor||'#e5e7eb'};border-radius:6px;background:#fff;font-weight:700">-</button>
              <span style="font-weight:700;color:${c.text||'#111'}">1</span>
              <button style="width:28px;height:28px;border:1px solid ${c.borderColor||'#e5e7eb'};border-radius:6px;background:#fff;font-weight:700">+</button>
            </div>
          </div>`).join('')}
          <div style="background:${c.surface||'#f9fafb'};border-radius:12px;padding:16px;margin-top:16px;border:1px solid ${c.borderColor||'#e5e7eb'}">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="color:${c.textMuted||'#6b7280'}">Subtotal</span><span style="font-weight:700;color:${c.text||'#111'}">298 SAR</span></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:14px"><span style="color:${c.textMuted||'#6b7280'}">Shipping</span><span style="font-weight:700;color:${c.priceColor||'#059669'}">Free</span></div>
            <button style="width:100%;background:${c.buttonBg||c.primary||'#4f46e5'};color:${c.buttonText||'#fff'};border:none;padding:14px;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer">Proceed to Checkout</button>
          </div>
        </div>`;
      }
      if (page === 'category') {
        return `<div style="padding:20px;max-width:960px;margin:0 auto">
          <h2 style="font-size:20px;font-weight:800;color:${c.text||'#111'};margin:0 0 16px">All Categories</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:14px">
            ${['Electronics','Fashion','Home & Living','Sports','Beauty','Books','Toys','Food'].map((cat, i) => `
              <div style="background:${c.surface||'#f9fafb'};border:1px solid ${c.borderColor||'#e5e7eb'};border-radius:14px;overflow:hidden;text-align:center;padding-bottom:12px">
                <div style="height:90px;background:linear-gradient(135deg,${c.primary||'#4f46e5'}22,${c.accent||'#7c3aed'}22);display:flex;align-items:center;justify-content:center;font-size:28px">🏷️</div>
                <p style="font-size:13px;font-weight:700;color:${c.text||'#111'};margin:8px 0 0;padding:0 8px">${cat}</p>
              </div>`).join('')}
          </div>
        </div>`;
      }
      if (page === 'orders') {
        return `<div style="padding:20px;max-width:700px;margin:0 auto">
          <h2 style="font-size:20px;font-weight:800;color:${c.text||'#111'};margin:0 0 20px">My Orders</h2>
          ${[{id:'#ORD-001',status:'Delivered',date:'Jun 30',total:'349 SAR'},{id:'#ORD-002',status:'Processing',date:'Jul 1',total:'149 SAR'},{id:'#ORD-003',status:'Shipped',date:'Jul 2',total:'598 SAR'}].map(o => `
            <div style="padding:16px;background:${c.surface||'#f9fafb'};border-radius:12px;border:1px solid ${c.borderColor||'#e5e7eb'};margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
              <div>
                <p style="font-weight:800;color:${c.text||'#111'};margin:0 0 4px;font-size:14px">${o.id}</p>
                <p style="font-size:12px;color:${c.textMuted||'#9ca3af'};margin:0">${o.date}</p>
              </div>
              <div style="text-align:right">
                <span style="display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;background:${o.status==='Delivered'?'#dcfce7':o.status==='Processing'?'#fef9c3':'#dbeafe'};color:${o.status==='Delivered'?'#166534':o.status==='Processing'?'#854d0e':'#1e40af'}">${o.status}</span>
                <p style="font-weight:700;color:${c.priceColor||'#059669'};margin:4px 0 0;font-size:14px">${o.total}</p>
              </div>
            </div>`).join('')}
        </div>`;
      }
      // home - use sectionHTML
      if (page === 'checkout') {
        return `<div style="padding:20px;max-width:800px;margin:0 auto">
          <h2 style="font-size:20px;font-weight:800;color:${c.text||'#111'};margin:0 0 20px">Checkout</h2>
          <div style="display:flex;gap:8px;margin-bottom:24px">
            ${['Shipping','Payment','Confirmation'].map((step, i) => `
              <div style="flex:1;text-align:center">
                <div style="width:32px;height:32px;border-radius:50%;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;${i===0?`background:${c.primary||'#4f46e5'};color:#fff`:`background:${c.surface||'#f3f4f6'};color:${c.textMuted||'#9ca3af'}`}">${i+1}</div>
                <span style="font-size:11px;font-weight:700;color:${i===0?c.text||'#111':c.textMuted||'#9ca3af'}">${step}</span>
              </div>`).join('<div style="flex:0 0 30px;height:2px;background:'+c.borderColor+';margin-top:15px"></div>')}
          </div>
          <div style="display:grid;grid-template-columns:1fr 320px;gap:20px">
            <div style="space-y:16px">
              <div style="background:${c.surface||'#f9fafb'};border:1px solid ${c.borderColor||'#e5e7eb'};border-radius:12px;padding:16px;margin-bottom:12px">
                <h3 style="font-size:15px;font-weight:800;color:${c.text||'#111'};margin:0 0 12px">Shipping Address</h3>
                <input style="width:100%;padding:10px 12px;border:1px solid ${c.borderColor||'#e5e7eb'};border-radius:8px;margin-bottom:8px;font-size:13px;background:#fff" placeholder="Full name" />
                <input style="width:100%;padding:10px 12px;border:1px solid ${c.borderColor||'#e5e7eb'};border-radius:8px;margin-bottom:8px;font-size:13px;background:#fff" placeholder="Address" />
                <div style="display:flex;gap:8px">
                  <input style="flex:1;padding:10px 12px;border:1px solid ${c.borderColor||'#e5e7eb'};border-radius:8px;font-size:13px;background:#fff" placeholder="City" />
                  <input style="flex:1;padding:10px 12px;border:1px solid ${c.borderColor||'#e5e7eb'};border-radius:8px;font-size:13px;background:#fff" placeholder="Postal code" />
                </div>
              </div>
              <div style="background:${c.surface||'#f9fafb'};border:1px solid ${c.borderColor||'#e5e7eb'};border-radius:12px;padding:16px">
                <h3 style="font-size:15px;font-weight:800;color:${c.text||'#111'};margin:0 0 12px">Payment Method</h3>
                ${['Credit Card','Apple Pay','Cash on Delivery'].map((pm, i) => `
                  <label style="display:flex;align-items:center;gap:10px;padding:10px;border:1px solid ${i===0?c.primary||'#4f46e5':c.borderColor||'#e5e7eb'};border-radius:8px;margin-bottom:8px;cursor:pointer;font-size:13px;color:${c.text||'#111'}">
                    <input type="radio" ${i===0?'checked':''} name="pm" style="accent-color:${c.primary||'#4f46e5'}" /> ${pm}
                  </label>`).join('')}
              </div>
            </div>
            <div style="background:${c.surface||'#f9fafb'};border:1px solid ${c.borderColor||'#e5e7eb'};border-radius:12px;padding:16px;height:fit-content">
              <h3 style="font-size:15px;font-weight:800;color:${c.text||'#111'};margin:0 0 12px">Order Summary</h3>
              ${['Product A - 149 SAR','Product B - 99 SAR'].map(item => `<div style="display:flex;justify-content:space-between;font-size:13px;color:${c.textMuted||'#6b7280'};margin-bottom:6px"><span>${item.split(' - ')[0]}</span><span>${item.split(' - ')[1]}</span></div>`).join('')}
              <div style="border-top:1px solid ${c.borderColor||'#e5e7eb'};margin:10px 0;padding-top:10px">
                <div style="display:flex;justify-content:space-between;font-size:13px;color:${c.textMuted||'#6b7280'};margin-bottom:4px"><span>Subtotal</span><span>248 SAR</span></div>
                <div style="display:flex;justify-content:space-between;font-size:13px;color:${c.textMuted||'#6b7280'};margin-bottom:4px"><span>Shipping</span><span style="color:${c.priceColor||'#059669'};font-weight:700">Free</span></div>
                <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:${c.text||'#111'};margin-top:8px"><span>Total</span><span style="color:${c.priceColor||'#059669'}">248 SAR</span></div>
              </div>
              <button style="width:100%;background:${c.buttonBg||c.primary||'#4f46e5'};color:${c.buttonText||'#fff'};border:none;padding:14px;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;margin-top:12px">Place Order</button>
            </div>
          </div>
        </div>`;
      }
      return `<div class="container">${sectionHTML}</div>`;
    })();

    const mobileNavEnabled = config.mobileNav?.enabled !== false;
    const navStyle = config.mobileNav?.style || 'default';
    const accent = c.primary || '#4f46e5';
    const navLabels = ['Home', 'Shop', 'Cart', 'Wishlist'];
    const navSvgs = [
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    ];
    let mobileNavHTML = '';
    if (mobileNavEnabled) {
      if (navStyle === 'default') {
        mobileNavHTML = `<div style="position:fixed;bottom:0;left:0;right:0;background:rgba(255,255,255,0.95);backdrop-filter:blur(12px);border-top:1px solid ${c.borderColor || '#e5e7eb'};display:flex;justify-content:space-around;padding:8px 0">
          ${navSvgs.map((ic, i) => `<div style="display:flex;flex-direction:column;align-items:center;gap:2px"><span style="font-size:20px">${ic}</span><span style="font-size:10px;font-weight:700;color:${i===0?accent:'#6b7280'}">${navLabels[i]}</span></div>`).join('')}
        </div>`;
      } else if (navStyle === 'modern') {
        mobileNavHTML = `<div style="position:fixed;bottom:0;left:0;right:0;background:${c.surface || '#fff'};border-top:1px solid ${c.borderColor || '#e5e7eb'};display:flex;justify-content:space-around;padding:6px 0">
          ${navSvgs.map((ic, i) => `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 14px">
            <span style="font-size:20px;${i===0?`animation:iconBounce 0.5s ease`:''}">${ic}</span>
            <strong style="font-size:10px;color:${i===0?accent:'#9ca3af'}">${navLabels[i]}</strong>
            ${i===0?`<div style="height:2px;width:30px;background:${accent};border-radius:999px;margin-top:3px"></div>`:'<div style="height:2px;width:0;margin-top:3px"></div>'}
          </div>`).join('')}
          <style>@keyframes iconBounce{0%,100%{transform:translateY(0)}20%{transform:translateY(-4px)}40%{transform:translateY(0)}60%{transform:translateY(-2px)}80%{transform:translateY(0)}}</style>
        </div>`;
      } else if (navStyle === 'spotlight') {
        mobileNavHTML = `<div style="position:fixed;bottom:12px;left:50%;transform:translateX(-50%);display:flex;align-items:center;background:rgba(17,17,17,0.92);border-radius:16px;padding:8px 6px;box-shadow:0 8px 32px rgba(0,0,0,0.18)">
          ${navSvgs.map((ic, i) => { const dist=Math.abs(0-i); const op=i===0?1:Math.max(0,1-dist*0.6); return `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:48px;height:48px;margin:0 4px">
            <div style="position:absolute;width:48px;height:64px;background:radial-gradient(ellipse at center,${accent}55 0%,transparent 70%);border-radius:50%;filter:blur(8px);opacity:${op}"></div>
            <span style="font-size:20px;position:relative">${ic}</span>
          </div>`; }).join('')}
        </div>`;
      } else if (navStyle === 'pill') {
        mobileNavHTML = `<div style="position:fixed;bottom:16px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:2px;background:${c.surface || '#fff'};border-radius:999px;padding:6px;box-shadow:0 4px 24px rgba(0,0,0,0.1)">
          ${navSvgs.map((ic, i) => `<div style="display:flex;align-items:center;gap:6px;padding:${i===0?'8px 16px':'8px'};border-radius:999px;background:${i===0?accent:'transparent'}">
            <span style="font-size:18px">${ic}</span>
            ${i===0?`<span style="font-size:12px;font-weight:700;color:#fff">${navLabels[i]}</span>`:''}
          </div>`).join('')}
        </div>`;
      }
    }

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
  .logo{font-weight:bold;font-size:20px;color:${c.text};display:flex;align-items:center;gap:8px}
  .nav{display:flex;gap:16px}
  .nav a{color:${c.textMuted};text-decoration:none;font-size:14px}
  .header-centered{text-align:center}
  .header-centered .logo{justify-content:center;margin-bottom:8px}
  .header-centered .nav{justify-content:center}
  .header-split{display:grid;grid-template-columns:1fr 2fr 1fr;align-items:center;gap:16px}
  .header-split .nav{justify-content:flex-end}
  .header-minimal .nav{display:none}
  .hamburger{font-size:24px;cursor:pointer;color:${c.text}}
  .container{max-width:960px;margin:0 auto;padding:20px}
  .footer{background:${c.footerBg};color:${c.footerText};padding:24px 20px;margin-top:40px}
  .footer-grid{max-width:960px;margin:0 auto;display:flex;justify-content:space-between;flex-wrap:wrap;gap:20px}
  .footer h4{color:#fff;margin:0 0 8px;font-size:14px}
  .footer a{color:${c.footerText};text-decoration:none;font-size:13px;display:block;margin-bottom:4px}
  .pcard{background:${c.surface||'#fff'};border:1px solid ${c.borderColor||'#e5e7eb'};border-radius:${pc.borderRadius ?? 12}px;overflow:hidden;transition:all 0.3s ease;cursor:pointer;position:relative}
  .pcard:hover{${pc.hoverEffect === 'lift' ? 'transform:translateY(-4px);box-shadow:0 12px 24px rgba(0,0,0,0.1)' : pc.hoverEffect === 'zoom' ? 'transform:scale(1.03)' : pc.hoverEffect === 'glow' ? `box-shadow:0 0 20px ${c.primary||'#4f46e5'}44` : ''}}
  .pcard-img{aspect-ratio:${pc.imageAspectRatio || '1/1'};background:${c.borderColor||'#f3f4f6'};display:flex;align-items:center;justify-content:center;overflow:hidden}
  .pcard-badge{position:absolute;top:${pc.badgePosition === 'bottom-left' ? 'auto' : '8px'};bottom:${pc.badgePosition === 'bottom-left' ? '8px' : 'auto'};left:${pc.badgePosition === 'top-right' || pc.badgePosition === 'bottom-right' ? 'auto' : '8px'};right:${pc.badgePosition === 'top-right' || pc.badgePosition === 'bottom-right' ? '8px' : 'auto'};background:${c.primary||'#4f46e5'};color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px}
  .pcard-body{padding:10px 12px}
  .pcard-title{font-size:13px;font-weight:600;color:${c.text||'#111'};margin:0 0 4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .pcard-price{font-size:15px;font-weight:800;color:${c.priceColor||'#059669'};margin:0}
  .pcard-qv{position:absolute;bottom:8px;right:8px;background:rgba(255,255,255,0.95);border:1px solid ${c.borderColor||'#e5e7eb'};border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;color:${c.text||'#111'};opacity:0;transition:opacity 0.2s}
  .pcard:hover .pcard-qv{opacity:1}
  .megamenu{position:absolute;top:100%;left:0;right:0;background:${c.headerBg||'#fff'};border:1px solid ${c.borderColor||'#e5e7eb'};box-shadow:0 12px 32px rgba(0,0,0,0.1);padding:20px;display:none;z-index:100}
  .header:hover .megamenu{display:block}
  .megamenu-grid{display:grid;grid-template-columns:repeat(${mm.columns || 4},1fr);gap:20px;max-width:960px;margin:0 auto}
  .megamenu-col h5{font-size:13px;font-weight:800;color:${c.text||'#111'};margin:0 0 8px}
  .megamenu-col a{display:block;font-size:12px;color:${c.textMuted||'#6b7280'};text-decoration:none;margin-bottom:4px}
  .megamenu-promo{grid-column:-1/-2;background:linear-gradient(135deg,${c.primary||'#4f46e5'}22,${c.accent||'#7c3aed'}22);border-radius:12px;padding:16px;text-align:center}
  .megamenu-promo h5{font-size:15px;font-weight:800;color:${c.text||'#111'};margin:0 0 4px}
  .megamenu-promo p{font-size:12px;color:${c.textMuted||'#6b7280'};margin:0}
  ${device === 'mobile' ? `
  .container{max-width:100%;padding:16px}
  .header{padding:10px 16px}
  .header-split{grid-template-columns:1fr auto;gap:8px}
  .header-split .nav{display:none}
  .nav{gap:10px}
  .nav a{font-size:12px}
  .footer-grid{flex-direction:column;gap:12px}
  ` : ''}
  ${config.customCss || ''}
</style>
</head>
<body>
${announcement}
<div class="header header-${hn.style || 'default'}">
  <div class="logo">${h.logoImageUrl ? `<img src="${h.logoImageUrl}" alt="logo" style="height:${h.logoSize || 34}px">` : (h.logoText || 'Store Name')}</div>
  ${(hn.style === 'split' && h.showSearch) ? '<div style="flex:1;max-width:300px"><input style="width:100%;padding:8px 12px;border:1px solid ' + (c.borderColor || '#e5e7eb') + ';border-radius:8px;font-size:13px;background:' + (c.surface || '#f9fafb') + '" placeholder="Search products..."></div>' : ''}
  <div class="nav">
    ${h.showCategories ? '<a href="#">Categories</a>' : ''}
    <a href="#">Products</a>
    ${h.showSearch && hn.style !== 'split' ? '<a href="#">Search</a>' : ''}
    ${h.showCart ? '<a href="#">Cart (0)</a>' : ''}
  </div>
  ${mm.enabled ? `<div class="megamenu">
    <div class="megamenu-grid">
      ${(mm.columns || 4) > 1 ? Array.from({length: (mm.columns || 4) - 1}).map((_, ci) => `
        <div class="megamenu-col">
          <h5>${['Featured','New Arrivals','Top Selling','Collections'][ci] || 'Category'}</h5>
          ${['Electronics','Fashion','Home & Living','Sports','Beauty','Books'].slice(0, 4).map(cat => `<a href="#">${cat}</a>`).join('')}
        </div>`).join('') : ''}
      ${mm.showPromo ? `<div class="megamenu-promo">
        <h5>${mm.promoTitle || 'Special Offer'}</h5>
        <p>${mm.promoText || 'Up to 50% off selected items'}</p>
      </div>` : ''}
    </div>
  </div>` : ''}
</div>
${pageContentHTML}
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
${mobileNavHTML}
</body>
</html>`;
  };

  // Update preview iframe
  useEffect(() => {
    if (previewRef.current && theme) {
      const doc = previewRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(generatePreviewHTML(theme, previewDevice, previewPage));
        doc.close();
      }
    }
  }, [theme, previewDevice, previewPage]);

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

  const handleExportTheme = async () => {
    try {
      const res = await api.get('/ecommerce/theme/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `maqder-theme-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export theme');
    }
  };

  const handleDragStart = (idx) => setDraggedIdx(idx);
  const handleDragOver = (e, idx) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop = (e, idx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) { setDraggedIdx(null); setDragOverIdx(null); return; }
    const sections = [...(theme.homepage?.sections || [])];
    const [moved] = sections.splice(draggedIdx, 1);
    sections.splice(idx, 0, moved);
    update('homepage.sections', sections);
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleImportTheme = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingTheme(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/ecommerce/theme/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setTheme(res.data.draft);
      setDraftUpdatedAt(res.data.draftUpdatedAt);
      setHasUnpublished(true);
      setSuccess('Theme imported — save draft to keep it');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to import theme');
    } finally {
      setImportingTheme(false);
      if (importInputRef.current) importInputRef.current.value = '';
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
          <button onClick={handleExportTheme} className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-dark-600 font-bold text-sm hover:bg-gray-50 dark:hover:bg-dark-700">
            <Download className="w-4 h-4" /> Export
          </button>
          <input ref={importInputRef} type="file" accept=".json" onChange={handleImportTheme} className="hidden" />
          <button onClick={() => importInputRef.current?.click()} disabled={importingTheme} className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-dark-600 font-bold text-sm hover:bg-gray-50 dark:hover:bg-dark-700 disabled:opacity-50">
            {importingTheme ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />} Import
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
            <button onClick={() => setActiveTab('headernav')} className={tabCls('headernav')}><Layout className="w-4 h-4" /> Header Nav</button>
            <button onClick={() => setActiveTab('sections')} className={tabCls('sections')}><Home className="w-4 h-4" /> Sections</button>
            <button onClick={() => setActiveTab('footer')} className={tabCls('footer')}><Layout className="w-4 h-4" /> Footer</button>
            <button onClick={() => setActiveTab('product')} className={tabCls('product')}><Eye className="w-4 h-4" /> Product</button>
            <button onClick={() => setActiveTab('cart')} className={tabCls('cart')}><ShoppingCart className="w-4 h-4" /> Cart</button>
            <button onClick={() => setActiveTab('mobilenav')} className={tabCls('mobilenav')}><Smartphone className="w-4 h-4" /> Mobile Nav</button>
            <button onClick={() => setActiveTab('darkmode')} className={tabCls('darkmode')}><Moon className="w-4 h-4" /> Dark Mode</button>
            <button onClick={() => setActiveTab('categories')} className={tabCls('categories')}><Tag className="w-4 h-4" /> Categories</button>
            <button onClick={() => setActiveTab('productcard')} className={tabCls('productcard')}><Package className="w-4 h-4" /> Product Card</button>
            <button onClick={() => setActiveTab('megamenu')} className={tabCls('megamenu')}><Layers className="w-4 h-4" /> Mega Menu</button>
            <button onClick={() => setActiveTab('customcss')} className={tabCls('customcss')}><Code className="w-4 h-4" /> Custom CSS</button>
          </div>

          {/* Hidden file inputs for image uploads */}
          <input ref={heroInputRef} type="file" accept="image/*" onChange={e => handleUploadImage(e, 'hero')} className="hidden" />
          <input ref={bannerUploadRef} type="file" accept="image/*" className="hidden" onChange={e => { if (bannerUploadTarget) handleUploadBannerImage(e.target.files?.[0], bannerUploadTarget.secIdx, bannerUploadTarget.bannerIdx); }} />

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
                    <img src={theme.header.logoImageUrl} alt="Logo preview" className="mt-2 w-auto object-contain rounded-lg border border-gray-200" style={{ height: `${theme.header?.logoSize || 34}px` }} />
                  )}
                </div>
              </div>
              {/* Logo size slider */}
              <div>
                <label className={labelCls}>Logo Size: {theme.header?.logoSize || 34}px</label>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={theme.header?.logoSize || 34}
                  onChange={e => updateHeader('logoSize', parseInt(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-200 dark:bg-dark-600"
                  style={{ accentColor: '#7c3aed' }}
                />
                <div className="flex justify-between text-[10px] text-gray-300 mt-1">
                  <span>20px</span>
                  <span>80px</span>
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

          {/* Header Nav */}
          {activeTab === 'headernav' && (
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5 space-y-4">
              <div>
                <label className={labelCls}>Header Navigation Style</label>
                <p className="text-xs text-gray-400 mb-3">Choose a header layout style for your storefront. This controls how the logo, navigation links, and search are arranged.</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'default', label: 'Default', desc: 'Logo left, nav links right' },
                    { value: 'centered', label: 'Centered', desc: 'Logo centered, nav below' },
                    { value: 'minimal', label: 'Minimal', desc: 'Logo left, hamburger menu' },
                    { value: 'split', label: 'Split', desc: 'Logo left, search center, cart right' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => update('headerNav.style', opt.value)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        (theme.headerNav?.style || 'default') === opt.value
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-gray-200 dark:border-dark-600 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{opt.label}</p>
                      <p className="text-xs text-gray-400 mt-1">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 dark:border-dark-700">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.headerNav?.enabled ?? true} onChange={e => update('headerNav.enabled', e.target.checked)} className="w-4 h-4 rounded" /> Show header navigation</label>
              </div>
            </div>
          )}

          {/* Sections (homepage builder) */}
          {activeTab === 'sections' && (
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5 space-y-3">
              <p className="text-sm text-gray-400 mb-2">Drag sections to reorder. Toggle to show/hide on storefront.</p>
              {theme.homepage?.sections?.map((sec, idx) => (
                <div
                  key={sec.id || idx}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={() => { setDraggedIdx(null); setDragOverIdx(null); }}
                  className={`border rounded-xl p-3 space-y-2 transition-all ${dragOverIdx === idx && draggedIdx !== idx ? 'border-violet-400 bg-violet-50' : 'border-gray-200 dark:border-dark-600'} ${draggedIdx === idx ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0 cursor-grab active:cursor-grabbing" />
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
                          <div className="col-span-2 flex items-center gap-2">
                            <label className="text-xs font-bold text-gray-500">Mode:</label>
                            <select className={inputCls} style={{ width: 'auto' }} value={sec.settings.slides ? 'multi' : 'single'} onChange={e => { if (e.target.value === 'multi') { updateSection(idx, 'slides', sec.settings.slides || [{ imageUrl: sec.settings.imageUrl || '', title: sec.settings.title || '', subtitle: sec.settings.subtitle || '', buttonText: sec.settings.buttonText || '', buttonLink: sec.settings.buttonLink || '/store/products', textPosition: 'left' }]); updateSection(idx, 'autoPlay', true); updateSection(idx, 'interval', 5000); } else { const s0 = (sec.settings.slides || [])[0] || {}; updateSection(idx, 'imageUrl', s0.imageUrl || ''); updateSection(idx, 'title', s0.title || ''); updateSection(idx, 'subtitle', s0.subtitle || ''); updateSection(idx, 'buttonText', s0.buttonText || ''); updateSection(idx, 'buttonLink', s0.buttonLink || ''); } }}>
                              <option value="single">Single (Steady)</option>
                              <option value="multi">Multi-slide Carousel</option>
                            </select>
                            {sec.settings.slides && (
                              <>
                                <label className="flex items-center gap-1 text-xs font-bold text-gray-500"><input type="checkbox" checked={sec.settings.autoPlay !== false} onChange={e => updateSection(idx, 'autoPlay', e.target.checked)} /> Auto-play</label>
                                <input type="number" className={inputCls} style={{ width: '80px' }} value={sec.settings.interval || 5000} onChange={e => updateSection(idx, 'interval', parseInt(e.target.value) || 5000)} placeholder="ms" />
                                <span className="text-xs text-gray-400">ms interval</span>
                              </>
                            )}
                          </div>
                          {sec.settings.slides ? (
                            <div className="col-span-2 space-y-2">
                              {(sec.settings.slides || []).map((slide, si) => (
                                <div key={si} className="border border-gray-200 dark:border-dark-600 rounded-lg p-2 space-y-2 bg-gray-50 dark:bg-dark-700/50">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-500">Slide {si + 1}</span>
                                    <button onClick={() => { const next = (sec.settings.slides || []).filter((_, j) => j !== si); updateSection(idx, 'slides', next); }} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 className="w-3 h-3" /></button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input className={inputCls} value={slide.imageUrl || ''} onChange={e => { const next = [...(sec.settings.slides || [])]; next[si] = { ...next[si], imageUrl: e.target.value }; updateSection(idx, 'slides', next); }} placeholder="Background image URL" />
                                    <button onClick={() => { setHeroUploadIdx(idx); setTimeout(() => heroInputRef.current?.click(), 0); }} disabled={applyingPreset} className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold disabled:opacity-60">{applyingPreset ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}Upload</button>
                                  </div>
                                  <input className={inputCls} value={slide.title || ''} onChange={e => { const next = [...(sec.settings.slides || [])]; next[si] = { ...next[si], title: e.target.value }; updateSection(idx, 'slides', next); }} placeholder="Slide title" />
                                  <input className={inputCls} value={slide.subtitle || ''} onChange={e => { const next = [...(sec.settings.slides || [])]; next[si] = { ...next[si], subtitle: e.target.value }; updateSection(idx, 'slides', next); }} placeholder="Subtitle" />
                                  <div className="flex gap-2">
                                    <input className={inputCls} value={slide.buttonText || ''} onChange={e => { const next = [...(sec.settings.slides || [])]; next[si] = { ...next[si], buttonText: e.target.value }; updateSection(idx, 'slides', next); }} placeholder="Button text" />
                                    <input className={inputCls} value={slide.buttonLink || ''} onChange={e => { const next = [...(sec.settings.slides || [])]; next[si] = { ...next[si], buttonLink: e.target.value }; updateSection(idx, 'slides', next); }} placeholder="Link URL (e.g. /store/products)" />
                                  </div>
                                  <select className={inputCls} style={{ width: 'auto' }} value={slide.textPosition || 'left'} onChange={e => { const next = [...(sec.settings.slides || [])]; next[si] = { ...next[si], textPosition: e.target.value }; updateSection(idx, 'slides', next); }}>
                                    <option value="left">Text Left</option>
                                    <option value="center">Text Center</option>
                                    <option value="right">Text Right</option>
                                  </select>
                                </div>
                              ))}
                              <button onClick={() => updateSection(idx, 'slides', [...(sec.settings.slides || []), { imageUrl: '', title: '', subtitle: '', buttonText: '', buttonLink: '/store/products', textPosition: 'left' }])} className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:underline"><Plus className="w-3 h-3" /> Add slide</button>
                            </div>
                          ) : (
                            <>
                              <input className={inputCls} value={sec.settings.title || ''} onChange={e => updateSection(idx, 'title', e.target.value)} placeholder="Hero title" />
                              <input className={inputCls} value={sec.settings.subtitle || ''} onChange={e => updateSection(idx, 'subtitle', e.target.value)} placeholder="Subtitle" />
                              <div className="flex items-center gap-2">
                                <input className={inputCls} value={sec.settings.imageUrl || ''} onChange={e => updateSection(idx, 'imageUrl', e.target.value)} placeholder="Background image URL" />
                                <button onClick={() => { setHeroUploadIdx(idx); setTimeout(() => heroInputRef.current?.click(), 0); }} disabled={applyingPreset} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-60">{applyingPreset ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}Upload</button>
                              </div>
                              <input className={inputCls} value={sec.settings.buttonText || ''} onChange={e => updateSection(idx, 'buttonText', e.target.value)} placeholder="Button text" />
                              <input className={inputCls} value={sec.settings.buttonLink || ''} onChange={e => updateSection(idx, 'buttonLink', e.target.value)} placeholder="Button link (e.g. /store/products)" />
                            </>
                          )}
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
                      {sec.type === 'flash-sale' && (
                        <>
                          <input className={inputCls} value={sec.settings.title || ''} onChange={e => updateSection(idx, 'title', e.target.value)} placeholder="Sale title (e.g. Flash Sale)" />
                          <input className={inputCls} value={sec.settings.subtitle || ''} onChange={e => updateSection(idx, 'subtitle', e.target.value)} placeholder="Subtitle (e.g. Limited time offer!)" />
                          <input type="datetime-local" className={inputCls} value={sec.settings.endDate ? sec.settings.endDate.slice(0, 16) : ''} onChange={e => updateSection(idx, 'endDate', e.target.value ? new Date(e.target.value).toISOString() : '')} />
                          <input type="number" className={inputCls} value={sec.settings.discountPercent || 20} onChange={e => updateSection(idx, 'discountPercent', parseInt(e.target.value) || 0)} placeholder="Discount %" />
                          <input type="number" className={inputCls} value={sec.settings.limit || 4} onChange={e => updateSection(idx, 'limit', parseInt(e.target.value) || 4)} placeholder="Number of products" />
                          <input className={inputCls} value={sec.settings.categoryFilter || ''} onChange={e => updateSection(idx, 'categoryFilter', e.target.value)} placeholder="Category filter (optional)" />
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
                          <div className="col-span-2 flex items-center gap-2">
                            <label className="text-xs font-bold text-gray-500">Mode:</label>
                            <select className={inputCls} style={{ width: 'auto' }} value={sec.settings.banners ? 'multi' : 'single'} onChange={e => { if (e.target.value === 'multi') { updateSection(idx, 'banners', sec.settings.banners || [{ imageUrl: sec.settings.imageUrl || '', linkUrl: sec.settings.linkUrl || '', altText: sec.settings.altText || '', openInNewTab: false }]); } else { const b0 = (sec.settings.banners || [])[0] || {}; updateSection(idx, 'imageUrl', b0.imageUrl || ''); updateSection(idx, 'linkUrl', b0.linkUrl || ''); updateSection(idx, 'altText', b0.altText || ''); } }}>
                              <option value="single">Single Banner</option>
                              <option value="multi">Multiple Banners</option>
                            </select>
                          </div>
                          {sec.settings.banners ? (
                            <div className="col-span-2 space-y-2">
                              {(sec.settings.banners || []).map((b, bi) => (
                                <div key={bi} className="border border-gray-200 dark:border-dark-600 rounded-lg p-2 space-y-2 bg-gray-50 dark:bg-dark-700/50">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-500">Banner {bi + 1}</span>
                                    <button onClick={() => { const next = (sec.settings.banners || []).filter((_, j) => j !== bi); updateSection(idx, 'banners', next); }} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 className="w-3 h-3" /></button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input className={inputCls} value={b.imageUrl || ''} onChange={e => { const next = [...(sec.settings.banners || [])]; next[bi] = { ...next[bi], imageUrl: e.target.value }; updateSection(idx, 'banners', next); }} placeholder="Image URL" />
                                    <button onClick={() => { setHeroUploadIdx(idx); setTimeout(() => heroInputRef.current?.click(), 0); }} disabled={applyingPreset} className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold disabled:opacity-60">{applyingPreset ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}Upload</button>
                                  </div>
                                  <input className={inputCls} value={b.linkUrl || ''} onChange={e => { const next = [...(sec.settings.banners || [])]; next[bi] = { ...next[bi], linkUrl: e.target.value }; updateSection(idx, 'banners', next); }} placeholder="Link URL (e.g. /store/products or https://...)" />
                                  <input className={inputCls} value={b.altText || ''} onChange={e => { const next = [...(sec.settings.banners || [])]; next[bi] = { ...next[bi], altText: e.target.value }; updateSection(idx, 'banners', next); }} placeholder="Alt text" />
                                  <label className="flex items-center gap-1 text-xs font-bold text-gray-500"><input type="checkbox" checked={b.openInNewTab || false} onChange={e => { const next = [...(sec.settings.banners || [])]; next[bi] = { ...next[bi], openInNewTab: e.target.checked }; updateSection(idx, 'banners', next); }} /> Open in new tab</label>
                                </div>
                              ))}
                              <button onClick={() => updateSection(idx, 'banners', [...(sec.settings.banners || []), { imageUrl: '', linkUrl: '', altText: '', openInNewTab: false }])} className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:underline"><Plus className="w-3 h-3" /> Add banner</button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <input className={inputCls} value={sec.settings.imageUrl || ''} onChange={e => updateSection(idx, 'imageUrl', e.target.value)} placeholder="Image URL" />
                                <button onClick={() => { setHeroUploadIdx(idx); setTimeout(() => heroInputRef.current?.click(), 0); }} disabled={applyingPreset} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-60">{applyingPreset ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}Upload</button>
                              </div>
                              <input className={inputCls} value={sec.settings.linkUrl || ''} onChange={e => updateSection(idx, 'linkUrl', e.target.value)} placeholder="Link URL (e.g. /store/products or https://...)" />
                              <input className={inputCls} value={sec.settings.altText || ''} onChange={e => updateSection(idx, 'altText', e.target.value)} placeholder="Alt text" />
                              <label className="flex items-center gap-1 text-xs font-bold text-gray-500"><input type="checkbox" checked={sec.settings.openInNewTab || false} onChange={e => updateSection(idx, 'openInNewTab', e.target.checked)} /> Open link in new tab</label>
                            </>
                          )}
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

          {/* Mobile Nav */}
          {activeTab === 'mobilenav' && (
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5 space-y-4">
              <div>
                <label className={labelCls}>Bottom Nav Style</label>
                <p className="text-xs text-gray-400 mb-3">Choose a mobile bottom navigation bar style. This will be shown to mobile visitors on your storefront.</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'default', label: 'Default', desc: 'Frosted glass bar with icons + labels' },
                    { value: 'modern', label: 'Modern', desc: 'Animated underline + icon bounce' },
                    { value: 'spotlight', label: 'Spotlight', desc: 'Dark floating bar with spotlight glow' },
                    { value: 'pill', label: 'Pill', desc: 'Floating pill with expanding active item' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => update('mobileNav.style', opt.value)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        (theme.mobileNav?.style || 'default') === opt.value
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-gray-200 dark:border-dark-600 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{opt.label}</p>
                      <p className="text-xs text-gray-400 mt-1">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 dark:border-dark-700">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.mobileNav?.enabled ?? true} onChange={e => update('mobileNav.enabled', e.target.checked)} className="w-4 h-4 rounded" /> Show bottom navigation on mobile</label>
              </div>
            </div>
          )}

          {/* Dark Mode */}
          {activeTab === 'darkmode' && (
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5 space-y-4">
              <div className="pt-3 border-b border-gray-100 dark:border-dark-700 pb-4">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                  <input type="checkbox" checked={theme.darkMode?.enabled ?? false} onChange={e => update('darkMode.enabled', e.target.checked)} className="w-4 h-4 rounded" />
                  Enable Dark Mode for Storefront
                </label>
                <p className="text-xs text-gray-400 mt-2 ml-6">When enabled, customers can toggle between light and dark themes on the storefront.</p>
              </div>
              {(theme.darkMode?.enabled) && (
                <div className="space-y-4">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Dark Mode Colors</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {COLOR_FIELDS.map(f => (
                      <div key={f.key}>
                        <label className={labelCls}>{f.label}</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={theme.darkMode?.colors?.[f.key] || '#000000'}
                            onChange={e => update(`darkMode.colors.${f.key}`, e.target.value)}
                            className="w-10 h-10 rounded-lg border border-gray-200 dark:border-dark-600 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={theme.darkMode?.colors?.[f.key] || ''}
                            onChange={e => update(`darkMode.colors.${f.key}`, e.target.value)}
                            className={`${inputCls} font-mono text-xs`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Categories */}
          {activeTab === 'categories' && (
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">Store Categories</p>
                  <p className="text-xs text-gray-400 mt-0.5">Add categories with images. These appear in your Category Grid section.</p>
                </div>
                <button
                  onClick={() => setCategories(prev => [...prev, { _id: null, _tempId: Date.now(), name: '', nameAr: '', imageUrl: '', slug: '' }])}
                  className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Category
                </button>
              </div>
              <div className="space-y-3">
                {categories.length === 0 && (
                  <div className="text-center py-10 text-gray-400">
                    <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No categories yet. Click "Add Category" to start.</p>
                  </div>
                )}
                {categories.map((cat, ci) => (
                  <div key={cat._id || cat._tempId || ci} className="border border-gray-200 dark:border-dark-600 rounded-xl p-3 space-y-3">
                    <div className="flex items-start gap-3">
                      {/* Category image */}
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 flex items-center justify-center cursor-pointer overflow-hidden hover:border-violet-400 transition-colors"
                          onClick={() => { const inp = categoryImgRefs.current[ci]; if (inp) inp.click(); }}
                        >
                          {cat.imageUrl ? (
                            <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            categoryUploading === ci ? <Loader2 className="w-5 h-5 animate-spin text-violet-500" /> : <ImageIcon className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                        <input
                          type="file" accept="image/*" className="hidden"
                          ref={el => categoryImgRefs.current[ci] = el}
                          onChange={async (e) => {
                            const url = await handleUploadCategoryImage(e.target.files?.[0], ci);
                            if (url) setCategories(prev => prev.map((c, i) => i === ci ? { ...c, imageUrl: url } : c));
                          }}
                        />
                        <span className="absolute -bottom-1 -right-1 bg-violet-600 text-white rounded-full p-0.5"><ImageIcon className="w-2.5 h-2.5" /></span>
                      </div>
                      {/* Fields */}
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className={inputCls}
                            value={cat.name || ''}
                            onChange={e => setCategories(prev => prev.map((c, i) => i === ci ? { ...c, name: e.target.value } : c))}
                            placeholder="Category name (EN)"
                          />
                          <input
                            className={inputCls}
                            value={cat.nameAr || ''}
                            onChange={e => setCategories(prev => prev.map((c, i) => i === ci ? { ...c, nameAr: e.target.value } : c))}
                            placeholder="اسم التصنيف (AR)"
                            dir="rtl"
                          />
                        </div>
                        <input
                          className={inputCls}
                          value={cat.slug || ''}
                          onChange={e => setCategories(prev => prev.map((c, i) => i === ci ? { ...c, slug: e.target.value } : c))}
                          placeholder="slug (e.g. electronics)"
                        />
                      </div>
                      {/* Actions */}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleSaveCategory(categories[ci])}
                          className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          title="Save"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (cat._id) handleDeleteCategory(cat._id);
                            else setCategories(prev => prev.filter((_, i) => i !== ci));
                          }}
                          className="p-2 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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

          {/* Product Card Designer */}
          {activeTab === 'productcard' && (
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5 space-y-4">
              <p className="text-sm text-gray-400">Customize how product cards look across your store.</p>
              <div>
                <label className={labelCls}>Card Border Radius</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="0" max="24" value={theme.productCard?.borderRadius ?? 12} onChange={e => update('productCard.borderRadius', parseInt(e.target.value))} className="flex-1 accent-violet-600" />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 w-12 text-right">{theme.productCard?.borderRadius ?? 12}px</span>
                </div>
              </div>
              <div>
                <label className={labelCls}>Image Aspect Ratio</label>
                <select className={inputCls} value={theme.productCard?.imageAspectRatio || '1/1'} onChange={e => update('productCard.imageAspectRatio', e.target.value)}>
                  <option value="1/1">Square (1:1)</option>
                  <option value="3/4">Portrait (3:4)</option>
                  <option value="4/3">Landscape (4:3)</option>
                  <option value="16/9">Wide (16:9)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Hover Effect</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{v:'none',l:'None'},{v:'lift',l:'Lift Up'},{v:'zoom',l:'Zoom In'},{v:'glow',l:'Glow'}].map(opt => (
                    <button key={opt.v} onClick={() => update('productCard.hoverEffect', opt.v)} className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${(theme.productCard?.hoverEffect || 'none') === opt.v ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 dark:border-dark-600 text-gray-500 hover:border-gray-300'}`}>{opt.l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Badge Position</label>
                <select className={inputCls} value={theme.productCard?.badgePosition || 'top-left'} onChange={e => update('productCard.badgePosition', e.target.value)}>
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Show Badges</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.productCard?.showSaleBadge ?? true} onChange={e => update('productCard.showSaleBadge', e.target.checked)} className="w-4 h-4 rounded" /> Sale badge</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.productCard?.showNewBadge ?? false} onChange={e => update('productCard.showNewBadge', e.target.checked)} className="w-4 h-4 rounded" /> New badge</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.productCard?.showOosBadge ?? true} onChange={e => update('productCard.showOosBadge', e.target.checked)} className="w-4 h-4 rounded" /> Out of stock</label>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.productCard?.showQuickView ?? false} onChange={e => update('productCard.showQuickView', e.target.checked)} className="w-4 h-4 rounded" /> Show Quick View button on hover</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.productCard?.showWishlistIcon ?? false} onChange={e => update('productCard.showWishlistIcon', e.target.checked)} className="w-4 h-4 rounded" /> Show wishlist heart icon</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.productCard?.showRatingStars ?? true} onChange={e => update('productCard.showRatingStars', e.target.checked)} className="w-4 h-4 rounded" /> Show rating stars</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={theme.productCard?.showAddToCart ?? true} onChange={e => update('productCard.showAddToCart', e.target.checked)} className="w-4 h-4 rounded" /> Show Add to Cart button on card</label>
            </div>
          )}

          {/* Mega Menu Builder */}
          {activeTab === 'megamenu' && (
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5 space-y-4">
              <p className="text-sm text-gray-400">Configure the mega menu dropdown that appears on header hover.</p>
              <label className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white"><input type="checkbox" checked={theme.megaMenu?.enabled ?? false} onChange={e => update('megaMenu.enabled', e.target.checked)} className="w-4 h-4 rounded" /> Enable Mega Menu</label>
              {theme.megaMenu?.enabled && (
                <>
                  <div>
                    <label className={labelCls}>Number of Columns</label>
                    <input type="range" min="2" max="6" value={theme.megaMenu?.columns ?? 4} onChange={e => update('megaMenu.columns', parseInt(e.target.value))} className="w-full accent-violet-600" />
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{theme.megaMenu?.columns ?? 4} columns</span>
                  </div>
                  <div>
                    <label className={labelCls}>Menu Items per Column</label>
                    <p className="text-xs text-gray-400 mb-2">Add links to each mega menu column.</p>
                    {(theme.megaMenu?.items || []).map((item, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <input className={inputCls} value={item.label || ''} onChange={e => { const next = [...(theme.megaMenu?.items || [])]; next[i] = { ...next[i], label: e.target.value }; update('megaMenu.items', next); }} placeholder="Label (e.g. Electronics)" />
                        <input className={inputCls} value={item.link || ''} onChange={e => { const next = [...(theme.megaMenu?.items || [])]; next[i] = { ...next[i], link: e.target.value }; update('megaMenu.items', next); }} placeholder="Link (e.g. /store/category/electronics)" />
                        <input type="number" min="0" className={inputCls} style={{ width: '70px' }} value={item.column ?? 0} onChange={e => { const next = [...(theme.megaMenu?.items || [])]; next[i] = { ...next[i], column: parseInt(e.target.value) || 0 }; update('megaMenu.items', next); }} placeholder="Col" />
                        <button onClick={() => { const next = (theme.megaMenu?.items || []).filter((_, j) => j !== i); update('megaMenu.items', next); }} className="p-1.5 text-red-400 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <button onClick={() => update('megaMenu.items', [...(theme.megaMenu?.items || []), { label: '', link: '', column: 0 }])} className="flex items-center gap-1 text-xs font-bold text-violet-600 hover:underline"><Plus className="w-3 h-3" /> Add menu item</button>
                  </div>
                  <div className="pt-3 border-t border-gray-100 dark:border-dark-700">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white"><input type="checkbox" checked={theme.megaMenu?.showPromo ?? true} onChange={e => update('megaMenu.showPromo', e.target.checked)} className="w-4 h-4 rounded" /> Show promo banner in mega menu</label>
                    {theme.megaMenu?.showPromo && (
                      <div className="pl-6 mt-3 space-y-2">
                        <input className={inputCls} value={theme.megaMenu?.promoTitle || ''} onChange={e => update('megaMenu.promoTitle', e.target.value)} placeholder="Promo title (e.g. Summer Sale)" />
                        <input className={inputCls} value={theme.megaMenu?.promoText || ''} onChange={e => update('megaMenu.promoText', e.target.value)} placeholder="Promo text (e.g. Up to 50% off)" />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Custom CSS Editor */}
          {activeTab === 'customcss' && (
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5 space-y-4">
              <p className="text-sm text-gray-400">Add custom CSS to override any theme styles. Changes appear in the live preview instantly.</p>
              <div className="relative">
                <textarea
                  className="w-full font-mono text-xs p-4 rounded-xl border-2 border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-900 text-gray-800 dark:text-gray-200 focus:border-violet-500 focus:outline-none transition-colors"
                  rows="14"
                  value={theme.customCss || ''}
                  onChange={e => update('customCss', e.target.value)}
                  placeholder={`/* Custom CSS — applies to the storefront */\n\n.my-custom-class {\n  color: red;\n  font-size: 18px;\n}\n\n/* Override product cards */\n.pcard {\n  box-shadow: 0 4px 12px rgba(0,0,0,0.08);\n}`}
                  spellCheck={false}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => update('customCss', '')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"><RotateCcw className="w-3.5 h-3.5" /> Clear CSS</button>
                <button onClick={() => { setPreviewPage('home'); }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors"><Eye className="w-3.5 h-3.5" /> Preview on Home</button>
              </div>
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3 text-xs text-violet-700 dark:text-violet-300">
                <p className="font-bold mb-1">Available CSS classes:</p>
                <p className="font-mono">.header, .logo, .nav, .container, .footer, .footer-grid, .pcard, .pcard-img, .pcard-body, .pcard-title, .pcard-price, .pcard-badge, .pcard-qv, .megamenu, .megamenu-grid, .megamenu-col, .megamenu-promo</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Preview */}
        <div className="space-y-3 sticky top-4 self-start">
          {/* Preview header row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Eye className="w-4 h-4 text-gray-400" /> Live Preview</h3>
            <div className="flex gap-1 bg-gray-100 dark:bg-dark-700 rounded-lg p-1">
              <button onClick={() => setPreviewDevice('desktop')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${previewDevice === 'desktop' ? 'bg-white dark:bg-dark-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400'}`}><Monitor className="w-3.5 h-3.5" /> Desktop</button>
              <button onClick={() => setPreviewDevice('mobile')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${previewDevice === 'mobile' ? 'bg-white dark:bg-dark-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400'}`}><Smartphone className="w-3.5 h-3.5" /> Mobile</button>
            </div>
          </div>

          {/* Page navigation */}
          <div className="flex gap-1 flex-wrap">
            {[{id:'home',label:'Home',icon:<Home className="w-3 h-3" />},{id:'product',label:'Product',icon:<Package className="w-3 h-3" />},{id:'cart',label:'Cart',icon:<ShoppingCart className="w-3 h-3" />},{id:'checkout',label:'Checkout',icon:<CreditCard className="w-3 h-3" />},{id:'category',label:'Categories',icon:<Tag className="w-3 h-3" />},{id:'orders',label:'Orders',icon:<ChevronRight className="w-3 h-3" />}].map(pg => (
              <button
                key={pg.id}
                onClick={() => setPreviewPage(pg.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  previewPage === pg.id
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'border-gray-200 dark:border-dark-600 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {pg.icon}{pg.label}
              </button>
            ))}
          </div>

          {/* Size/alignment controls */}
          {previewDevice === 'desktop' && (
            <div className="flex gap-1 items-center">
              <span className="text-xs text-gray-400 font-bold">Width:</span>
              {[{label:'Full',val:null},{label:'1440',val:1440},{label:'1280',val:1280},{label:'1024',val:1024},{label:'768',val:768}].map(s => (
                <button
                  key={String(s.val)}
                  onClick={() => setPreviewSize(s.val)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all border ${
                    previewSize === s.val
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'border-gray-200 dark:border-dark-600 text-gray-400 hover:bg-gray-50'
                  }`}
                >{s.label}</button>
              ))}
            </div>
          )}
          {previewDevice === 'mobile' && (
            <div className="flex gap-1 items-center">
              <span className="text-xs text-gray-400 font-bold">Size:</span>
              {[{label:'iPhone SE',w:375,h:667},{label:'iPhone 15',w:390,h:844},{label:'Galaxy S',w:412,h:915}].map(s => (
                <button
                  key={s.label}
                  onClick={() => setPreviewSize(s)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all border ${
                    previewSize && previewSize.w === s.w
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'border-gray-200 dark:border-dark-600 text-gray-400 hover:bg-gray-50'
                  }`}
                >{s.label}</button>
              ))}
            </div>
          )}

          <div className={`bg-gray-100 dark:bg-dark-900 rounded-2xl border border-gray-100 dark:border-dark-700 overflow-hidden flex items-center justify-center ${previewDevice === 'mobile' ? 'py-8' : ''}`}>
            {previewDevice === 'mobile' ? (() => {
              const ms = (previewSize && previewSize.w) ? previewSize : { w: 375, h: 667 };
              return (
                <div className="relative" style={{ width: `${ms.w}px`, height: `${ms.h}px` }}>
                  <div className="absolute inset-0 bg-black rounded-[2.5rem] shadow-xl p-2">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10" />
                    <iframe ref={previewRef} title="Theme Preview" className="w-full h-full rounded-[2rem] border-0 bg-white" />
                  </div>
                </div>
              );
            })() : (
              <div style={{ width: previewSize ? `${previewSize}px` : '100%', transition: 'width 0.3s' }}>
                <iframe ref={previewRef} title="Theme Preview" className="w-full border-0" style={{ height: '600px' }} />
              </div>
            )}
          </div>

          {/* Quick image upload shortcuts */}
          <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 p-3">
            <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Quick Image Upload</p>
            <div className="flex flex-wrap gap-2">
              {/* Logo */}
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 hover:border-violet-400 transition-colors"
              >
                {uploadingLogo ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3 text-violet-500" />}
                Logo
              </button>
              {/* Hero / banner images */}
              {theme.homepage?.sections?.filter(s => s.enabled && (s.type === 'hero' || s.type === 'image-banner')).map((s, realIdx) => {
                const secIdx = theme.homepage.sections.indexOf(s);
                return (
                  <button
                    key={s.id || realIdx}
                    onClick={() => {
                      setBannerUploadTarget({ secIdx, bannerIdx: 0 });
                      setTimeout(() => bannerUploadRef.current?.click(), 0);
                    }}
                    disabled={!!applyingPreset}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 hover:border-violet-400 transition-colors"
                  >
                    {applyingPreset ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3 text-pink-500" />}
                    {s.type === 'hero' ? 'Hero' : 'Banner'} {realIdx + 1}
                  </button>
                );
              })}
              {/* Category images */}
              <button
                onClick={() => setActiveTab('categories')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 hover:border-violet-400 transition-colors"
              >
                <Tag className="w-3 h-3 text-emerald-500" /> Category Images
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
