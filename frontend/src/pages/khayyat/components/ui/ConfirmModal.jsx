import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export const ConfirmModal = ({
  isOpen,
  onClose,
  title,
  message,
  subtitle,
  confirmText,
  cancelText,
  confirmVariant = 'danger',
  loading = false,
  onConfirm,
  preview,
  previewTitle,
  previewSubtitle
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-4">
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-900/10 p-4">
          <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{message}</div>
          {subtitle ? (
            <div className="text-sm text-gray-600 dark:text-slate-300 mt-1">{subtitle}</div>
          ) : null}
        </div>

        {(preview || previewTitle || previewSubtitle) ? (
          <div className="flex items-center gap-4 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 bg-white/60 dark:bg-slate-900/30">
            {preview ? (
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                {preview}
              </div>
            ) : null}
            <div className="min-w-0">
              {previewTitle ? (
                <div className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">{previewTitle}</div>
              ) : null}
              {previewSubtitle ? (
                <div className="text-xs text-gray-500 dark:text-slate-400 truncate">{previewSubtitle}</div>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex gap-3">
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading} className="flex-1">
            {confirmText}
          </Button>
          <Button variant="secondary" onClick={onClose} className="flex-1" disabled={loading}>
            {cancelText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
