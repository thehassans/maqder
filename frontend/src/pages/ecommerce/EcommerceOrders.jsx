import React from 'react';
import { ListOrdered, Construction } from 'lucide-react';

export default function EcommerceOrders() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center">
          <ListOrdered className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Orders</h1>
          <p className="text-sm text-gray-400">Manage customer orders and fulfillment</p>
        </div>
      </div>
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 px-6 py-16 text-center">
        <Construction className="w-12 h-12 text-indigo-200 mx-auto mb-4" />
        <p className="font-bold text-gray-500">Orders module coming in Phase 3</p>
        <p className="text-sm text-gray-400 mt-1">Order pipeline with customer name, product details, payment method, and fulfillment status</p>
      </div>
    </div>
  );
}
