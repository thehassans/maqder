import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../lib/api';
const t = (key, opts) => opts?.defaultValue || key;

import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Modal } from './components/ui/Modal';
import { ConfirmModal } from './components/ui/ConfirmModal';
import DemoBlockedModal from './components/ui/DemoBlockedModal';
import { Input } from './components/ui/Input';
import { Table, Thead, Tbody, Tr, Th, Td } from './components/ui/Table';
import SARIcon from './components/ui/SARIcon';
import { Layers, Plus, Minus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const FabricRollar = () => {
  
  const { user } = useSelector(state => state.auth);

      <Modal isOpen={stockOpen} onClose={closeStock} title={(language === 'ar' ? 'تعديل المخزون' : 'Adjust Stock')} size="lg">
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 p-4">
            <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{stockForm.name || ''}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400">{(language === 'ar' ? 'اكتب رقمًا موجبًا لإضافة رولات أو رقمًا سالبًا للخصم.' : 'Use a positive number to add rolls, or negative to subtract.')}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                label={(language === 'ar' ? 'التغيير (± رولات)' : 'Delta (± rolls)')}
                type="number"
                step="1"
                value={stockForm.delta}
                onChange={(e) => setStockForm((p) => ({ ...p, delta: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-1 flex items-end gap-2">
              <button
                type="button"
                onClick={() => setStockForm((p) => ({ ...p, delta: String((Number(p.delta) || 0) + 1) }))}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 hover:bg-gray-50 dark:hover:bg-slate-900/60 text-gray-700 dark:text-slate-200"
              >
                <Plus className="w-4 h-4" />
                {(language === 'ar' ? '+1' : '+1')}
              </button>
              <button
                type="button"
                onClick={() => setStockForm((p) => ({ ...p, delta: String((Number(p.delta) || 0) - 1) }))}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 hover:bg-gray-50 dark:hover:bg-slate-900/60 text-gray-700 dark:text-slate-200"
              >
                <Minus className="w-4 h-4" />
                {(language === 'ar' ? '-1' : '-1')}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={submitStock} className="flex-1 rounded-2xl" disabled={isDemo}>{(language === 'ar' ? 'حفظ' : 'Save')}</Button>
            <Button variant="secondary" onClick={closeStock} className="flex-1 rounded-2xl">{(language === 'ar' ? 'إلغاء' : 'Cancel')}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={closeDelete}
        title={(language === 'ar' ? 'حذف' : 'Delete')}
        message={(language === 'ar' ? 'حذف هذا القماش؟' : 'Delete this fabric?')}
        subtitle={(language === 'ar' ? 'لا يمكن التراجع عن هذا الإجراء. إذا كان القماش مستخدمًا في طلبات فسيتم منع الحذف.' : 'This action cannot be undone. If this fabric is used by orders, deletion will be blocked.')}
        confirmText={(language === 'ar' ? 'حذف' : 'Delete')}
        cancelText={(language === 'ar' ? 'إلغاء' : 'Cancel')}
        confirmVariant="danger"
        loading={deleteModal.loading}
        onConfirm={confirmDelete}
        previewTitle={deleteModal?.fabric?.name || ''}
        previewSubtitle={deleteModal?.fabric ? (
          <span className="inline-flex items-center gap-1">
            {Number(deleteModal.fabric.rollsInStock || 0)} {(language === 'ar' ? 'رولات' : 'rolls')} · {Number(deleteModal.fabric.pricePerRoll || 0).toFixed(2)} <SARIcon className="w-3 h-3" /> {(language === 'ar' ? '/ رول' : '/ roll')}
          </span>
        ) : ''}
      />

      <DemoBlockedModal
        isOpen={demoBlockedOpen}
        onClose={() => setDemoBlockedOpen(false)}
        title={(language === 'ar' ? 'وضع العرض' : 'Demo Mode')}
        phone="+966596775485"
      />
    </div>
  );
};

export default FabricRollar;




