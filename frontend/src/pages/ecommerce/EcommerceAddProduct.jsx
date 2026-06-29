import React from 'react';
import { Plus, Construction } from 'lucide-react';

export default function EcommerceAddProduct() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center">
          <Plus className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Add Product</h1>
          <p className="text-sm text-gray-400">Create a new in-house product with variants</p>
        </div>
      </div>
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 px-6 py-16 text-center">
        <Construction className="w-12 h-12 text-indigo-200 mx-auto mb-4" />
        <p className="font-bold text-gray-500">Product form coming in Phase 2</p>
        <p className="text-sm text-gray-400 mt-1">Variants (size/color), inventory tracking, images, SEO settings, pricing</p>
      </div>
    </div>
  );
}
