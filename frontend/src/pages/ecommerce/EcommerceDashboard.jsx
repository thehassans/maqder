import React, { useState, useEffect } from 'react';
import { Store, Loader2, TrendingUp, ShoppingBag, DollarSign, Users, Package } from 'lucide-react';
import api from '../../lib/api';

export default function EcommerceDashboard() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api.get('/ecommerce/settings')
      .then(res => setSettings(res.data?.ecommerce || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-[calc(100vh-8rem)]"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const storeLive = settings.storeStatus === 'live';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center">
          <Store className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
            {settings.storeName || 'E-Commerce Dashboard'}
          </h1>
          <p className="text-sm text-gray-400">
            {storeLive ? 'Store is live' : settings.storeStatus === 'paused' ? 'Store is paused' : 'Store is in draft mode'}
          </p>
        </div>
      </div>

      {/* Store status banner */}
      {!storeLive && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Store className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">Your store is not live yet</p>
            <p className="text-xs text-amber-600">Add products, customize your theme, and publish your store to start selling.</p>
          </div>
        </div>
      )}

      {/* Stats grid — will be powered by analytics API in Phase 8 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Revenue (30d)', value: '—', icon: DollarSign, color: 'emerald' },
          { label: 'Orders (30d)', value: '—', icon: ShoppingBag, color: 'indigo' },
          { label: 'Products', value: '—', icon: Package, color: 'violet' },
          { label: 'Visitors (7d)', value: '—', icon: Users, color: 'amber' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white dark:bg-dark-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-dark-700">
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 text-${stat.color}-600`} />
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href="/app/dashboard/ecommerce/products/new" className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 hover:border-indigo-200 transition-colors block">
          <Package className="w-8 h-8 text-indigo-500 mb-3" />
          <p className="font-bold text-gray-900 dark:text-white">Add Your First Product</p>
          <p className="text-xs text-gray-400 mt-1">Create in-house products with variants and SEO</p>
        </a>
        <a href="/app/dashboard/ecommerce/theme" className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 hover:border-violet-200 transition-colors block">
          <TrendingUp className="w-8 h-8 text-violet-500 mb-3" />
          <p className="font-bold text-gray-900 dark:text-white">Customize Your Theme</p>
          <p className="text-xs text-gray-400 mt-1">Colors, fonts, layout — Shopify-style editor</p>
        </a>
        <a href="/app/dashboard/ecommerce/settings" className="bg-white dark:bg-dark-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 hover:border-emerald-200 transition-colors block">
          <Store className="w-8 h-8 text-emerald-500 mb-3" />
          <p className="font-bold text-gray-900 dark:text-white">Configure Payments & Shipping</p>
          <p className="text-xs text-gray-400 mt-1">Moyasar, Tap, PayTabs, SMSA, Aramex</p>
        </a>
      </div>

      {/* Recent orders placeholder */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Orders</h3>
        </div>
        <div className="px-6 py-12 text-center">
          <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No orders yet — orders will appear here once your store is live</p>
        </div>
      </div>
    </div>
  );
}
