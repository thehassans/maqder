import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Printer, Box, Camera, Save } from 'lucide-react';
import { useTranslation } from '../../lib/translations';

export default function HardwareSettings({ tenant, language, onSave, isSaving }) {
  const { t } = useTranslation(language);
  const [hardware, setHardware] = useState({
    receiptPrinterType: 'none',
    printerIpAddress: '192.168.1.100',
    printerPort: 9100,
    cashDrawerKickCode: '27,112,0,50,250',
    barcodeScannerPrefix: '',
    barcodeScannerSuffix: 'Enter',
    scaleBarcodePrefix: '21',
    scaleType: 'none',
  });

  useEffect(() => {
    if (tenant?.settings?.hardwareSettings) {
      setHardware(tenant.settings.hardwareSettings);
    }
  }, [tenant]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setHardware(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(hardware);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      
      {/* Receipt Printer Section */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Printer className="w-5 h-5 text-indigo-500" />
          {language === 'ar' ? 'إعدادات الطابعة' : 'Printer Settings'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">{language === 'ar' ? 'نوع الطابعة' : 'Printer Type'}</label>
            <select name="receiptPrinterType" value={hardware.receiptPrinterType} onChange={handleChange} className="select">
              <option value="none">{language === 'ar' ? 'بدون (طباعة المتصفح)' : 'None (Browser Print)'}</option>
              <option value="network">{language === 'ar' ? 'طابعة شبكة (ESC/POS)' : 'Network Printer (ESC/POS)'}</option>
              <option value="usb">{language === 'ar' ? 'طابعة USB' : 'USB Printer'}</option>
            </select>
          </div>
          
          {hardware.receiptPrinterType === 'network' && (
            <>
              <div>
                <label className="label">{language === 'ar' ? 'عنوان IP للطابعة' : 'Printer IP Address'}</label>
                <input type="text" name="printerIpAddress" value={hardware.printerIpAddress} onChange={handleChange} className="input" placeholder="192.168.1.100" />
              </div>
              <div>
                <label className="label">{language === 'ar' ? 'منفذ الطابعة' : 'Printer Port'}</label>
                <input type="number" name="printerPort" value={hardware.printerPort} onChange={handleChange} className="input" placeholder="9100" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cash Drawer Section */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Box className="w-5 h-5 text-emerald-500" />
          {language === 'ar' ? 'درج النقود' : 'Cash Drawer'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">{language === 'ar' ? 'كود فتح الدرج' : 'Kick Code (Decimal)'}</label>
            <input type="text" name="cashDrawerKickCode" value={hardware.cashDrawerKickCode} onChange={handleChange} className="input" placeholder="27,112,0,50,250" />
            <p className="text-xs text-gray-500 mt-1">
              {language === 'ar' ? 'الكود الافتراضي لطابعات Epson/Star' : 'Default ESC/POS kick code for Epson/Star printers.'}
            </p>
          </div>
        </div>
      </div>

      {/* Scanner / Scale Section */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-rose-500" />
          {language === 'ar' ? 'قارئ الباركود والميزان' : 'Barcode Scanner & Scale'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">{language === 'ar' ? 'بادئة الباركود (إن وجدت)' : 'Scanner Prefix (If any)'}</label>
            <input type="text" name="barcodeScannerPrefix" value={hardware.barcodeScannerPrefix} onChange={handleChange} className="input" />
          </div>
          <div>
            <label className="label">{language === 'ar' ? 'لاحقة الباركود' : 'Scanner Suffix'}</label>
            <input type="text" name="barcodeScannerSuffix" value={hardware.barcodeScannerSuffix} onChange={handleChange} className="input" placeholder="Enter" />
          </div>
          <div>
            <label className="label">{language === 'ar' ? 'بادئة باركود الميزان' : 'Scale Barcode Prefix'}</label>
            <input type="text" name="scaleBarcodePrefix" value={hardware.scaleBarcodePrefix || '21'} onChange={handleChange} className="input" placeholder="21" />
          </div>
          <div>
            <label className="label">{language === 'ar' ? 'تكامل الميزان' : 'Scale Integration'}</label>
            <select name="scaleType" value={hardware.scaleType} onChange={handleChange} className="select">
              <option value="none">{language === 'ar' ? 'بدون ميزان متصل' : 'No connected scale'}</option>
              <option value="barcode">{language === 'ar' ? 'باركود الميزان (مثل بنده)' : 'Weight Barcode (Weight embedded)'}</option>
              <option value="serial">{language === 'ar' ? 'ميزان تسلسلي (Serial/COM)' : 'Serial Port Scale'}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={isSaving} className="btn btn-primary">
          {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" />{t('save')}</>}
        </button>
      </div>

    </motion.div>
  );
}
