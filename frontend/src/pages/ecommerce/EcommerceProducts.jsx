import React from 'react';
import { Package, Construction, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EcommerceProducts() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Package className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Products</h1>
            <p className="text-sm text-gray-400">Manage your in-house product catalog</p>
          </div>
        </div>
        <Link
          to="/app/dashboard/ecommerce/products/new"
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-indigo-600/10 hover:bg-indigo-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 px-6 py-16 text-center">
        <Construction className="w-12 h-12 text-indigo-200 mx-auto mb-4" />
        <p className="font-bold text-gray-500">Catalog module coming in Phase 2</p>
        <p className="text-sm text-gray-400 mt-1">Product list with variants, inventory, SEO fields, and bulk actions</p>
      </div>
    </div>
  );
}
