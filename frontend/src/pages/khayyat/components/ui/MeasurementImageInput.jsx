import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, Upload, Loader2, Sparkles } from 'lucide-react';
import api from '../../../../lib/api';
import toast from 'react-hot-toast';

const MeasurementImageInput = ({
  label = 'Measurement Image',
  hint = 'Upload a reference image or take a photo from the camera.',
  previewSrc = '',
  fileName = '',
  onFileChange,
  onRemove,
  disabled = false,
  className = '',
  onExtractedData
}) => {
  const uploadInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleSelectFile = async (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    onFileChange?.(file);
    
    // Auto-extract measurements
    if (onExtractedData) {
      try {
        setIsExtracting(true);
        const formData = new FormData();
        formData.append('image', file);

        const { data } = await api.post('/ai/khayyat-ocr', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (data?.success && data?.measurements) {
          onExtractedData(data.measurements, data.notes);
          toast.success('Measurements extracted successfully!');
        }
      } catch (error) {
        console.error('Failed to extract measurements:', error);
        toast.error(error.response?.data?.error || 'Failed to auto-extract measurements from the image.');
      } finally {
        setIsExtracting(false);
      }
    }
    
    event.target.value = '';
  };

  return (
    <div className={`rounded-2xl border border-gray-200 dark:border-slate-700 bg-white/85 dark:bg-slate-900/60 p-4 shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{label}</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">{hint}</div>
        </div>
        {previewSrc ? (
          <button
            type="button"
            onClick={() => onRemove?.()}
            disabled={disabled}
            className="inline-flex items-center gap-1 rounded-xl border border-rose-200 dark:border-rose-800/40 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove
          </button>
        ) : null}
      </div>

      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        onChange={handleSelectFile}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleSelectFile}
        className="hidden"
      />

      {previewSrc ? (
        <div className="mt-4 relative overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950/70">
          <img src={previewSrc} alt="Measurement reference" className="h-56 w-full object-cover" />
          {isExtracting && (
            <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              <div className="mt-3 text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> Extracting measurements...
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 flex h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-950/50 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700">
            <ImageIcon className="w-6 h-6 text-gray-400 dark:text-slate-500" />
          </div>
          <div className="mt-3 text-sm font-medium text-gray-700 dark:text-slate-200">No measurement image selected</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">JPG, PNG, GIF, or WEBP</div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => uploadInputRef.current?.click()}
          disabled={disabled}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-gray-900 hover:opacity-90 disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          Upload Image
        </button>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/50 disabled:opacity-50"
        >
          <Camera className="w-4 h-4" />
          Take Photo
        </button>
      </div>

      {fileName ? (
        <div className="mt-3 truncate text-xs text-gray-500 dark:text-slate-400">{fileName}</div>
      ) : null}
    </div>
  );
};

export default MeasurementImageInput;
