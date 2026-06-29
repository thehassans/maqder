import React from 'react';
import { Palette, Construction } from 'lucide-react';

export default function EcommerceThemeEditor() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-violet-50 flex items-center justify-center">
          <Palette className="w-6 h-6 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Theme Editor</h1>
          <p className="text-sm text-gray-400">Customize your storefront — Shopify-style</p>
        </div>
      </div>
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 px-6 py-16 text-center">
        <Construction className="w-12 h-12 text-violet-200 mx-auto mb-4" />
        <p className="font-bold text-gray-500">Theme engine coming in Phase 4</p>
        <p className="text-sm text-gray-400 mt-1">JSON-driven sections, drag-and-drop layout, live iframe preview, color/typography controls</p>
      </div>
    </div>
  );
}
