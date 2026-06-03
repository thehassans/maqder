import React, { useState } from 'react';
import { Package, Tags, Maximize, Target, Printer, BarChart2 } from 'lucide-react';
import ProductList from './tabs/ProductList';
import CategoryList from './tabs/CategoryList';
import BrandList from './tabs/BrandList';
import UnitList from './tabs/UnitList';
import PrintBarcode from './tabs/PrintBarcode';
import StockCount from './tabs/StockCount';
import ExpiryTracker from './tabs/ExpiryTracker';
import Adjustments from './tabs/Adjustments';
import { CalendarDays, SlidersHorizontal } from 'lucide-react';

export default function BakalaProducts() {
  const [activeTab, setActiveTab] = useState('products');

  const tabs = [
    { id: 'products', label: 'Product List', icon: Package },
    { id: 'units', label: 'Unit', icon: Maximize },
    { id: 'categories', label: 'Category', icon: Tags },
    { id: 'brands', label: 'Brand', icon: Target },
    { id: 'print', label: 'Print Barcode', icon: Printer },
    { id: 'stock', label: 'Stock Count', icon: BarChart2 },
    { id: 'adjustments', label: 'Adjustments', icon: SlidersHorizontal },
    { id: 'expiry', label: 'Expiry Tracker', icon: CalendarDays },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Bakala Catalog & Inventory</h1>
        <p className="text-gray-500">Manage your supermarket products, categories, printing, and stock levels.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tabs Header */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 min-h-[500px]">
          {activeTab === 'products' && <ProductList />}
          {activeTab === 'units' && <UnitList />}
          {activeTab === 'categories' && <CategoryList />}
          {activeTab === 'brands' && <BrandList />}
          { activeTab === 'print' && <PrintBarcode /> }
          { activeTab === 'stock' && <StockCount /> }
          { activeTab === 'adjustments' && <Adjustments /> }
          { activeTab === 'expiry' && <ExpiryTracker /> }
        </div>
      </div>
    </div>
  );
}
