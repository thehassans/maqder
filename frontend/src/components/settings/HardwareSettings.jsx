import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Printer, Box, Camera, Save, Receipt } from 'lucide-react';
import { useTranslation } from '../../lib/translations';
import { DEFAULT_THERMAL_SETTINGS } from '../../lib/thermalPrinter';

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
  const [thermal, setThermal] = useState(DEFAULT_THERMAL_SETTINGS);

  useEffect(() => {
    if (tenant?.settings?.hardwareSettings) {
      setHardware(tenant.settings.hardwareSettings);
    }
    if (tenant?.settings?.thermalPrinter) {
      setThermal(prev => ({ ...prev, ...tenant.settings.thermalPrinter }));
    }
  }, [tenant]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setHardware(prev => ({ ...prev, [name]: value }));
  };

  const handleThermalChange = (e) => {
    const { name, value, type, checked } = e.target;
    setThermal(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value),
    }));
  };

  const handleSave = () => {
    onSave({ ...hardware }, thermal);
  };

  const Toggle = ({ name, label, desc }) => (
    <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700/50 rounded-xl cursor-pointer">
      <div>
        <span className="font-semibold text-sm">{label}</span>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <input type="checkbox" name={name} checked={thermal[name]} onChange={handleThermalChange} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 relative" />
    </label>
  );

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

      {/* Thermal Receipt Settings */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-amber-500" />
          {language === 'ar' ? 'إعدادات إيصال الطابعة الحرارية' : 'Thermal Receipt Settings'}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {language === 'ar'
            ? 'تحكم في حجم الورق والخط والمظهر لجميع الإيصالات الحرارية عبر النظام'
            : 'Control paper size, font, and appearance for all thermal receipts across the system'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">{language === 'ar' ? 'عرض الورق' : 'Paper Width'}</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setThermal(prev => ({ ...prev, paperWidth: 58 }))}
                className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${thermal.paperWidth === 58 ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-500 hover:border-amber-300'}`}
              >
                58mm
                <span className="block text-[10px] font-normal opacity-60">{language === 'ar' ? 'صغير' : 'Small'}</span>
              </button>
              <button
                type="button"
                onClick={() => setThermal(prev => ({ ...prev, paperWidth: 80 }))}
                className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${thermal.paperWidth === 80 ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-500 hover:border-amber-300'}`}
              >
                80mm
                <span className="block text-[10px] font-normal opacity-60">{language === 'ar' ? 'قياسي' : 'Standard'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="label">{language === 'ar' ? 'حجم الخط (px)' : 'Font Size (px)'}</label>
            <select name="fontSize" value={thermal.fontSize} onChange={handleThermalChange} className="select">
              <option value={9}>9px — {language === 'ar' ? 'صغير' : 'Small'}</option>
              <option value={10}>10px — {language === 'ar' ? 'متوسط' : 'Medium'}</option>
              <option value={11}>11px — {language === 'ar' ? 'قياسي' : 'Standard'}</option>
              <option value={12}>12px — {language === 'ar' ? 'كبير' : 'Large'}</option>
              <option value={14}>14px — {language === 'ar' ? 'كبير جداً' : 'Extra Large'}</option>
            </select>
          </div>

          <div>
            <label className="label">{language === 'ar' ? 'تباعد الأسطر' : 'Line Height'}</label>
            <select name="lineHeight" value={thermal.lineHeight} onChange={handleThermalChange} className="select">
              <option value={1.2}>1.2 — {language === 'ar' ? 'مضغوط' : 'Compact'}</option>
              <option value={1.4}>1.4 — {language === 'ar' ? 'عادي' : 'Normal'}</option>
              <option value={1.6}>1.6 — {language === 'ar' ? 'مريح' : 'Relaxed'}</option>
              <option value={1.8}>1.8 — {language === 'ar' ? 'واسع' : 'Spacious'}</option>
            </select>
          </div>

          <div>
            <label className="label">{language === 'ar' ? 'الهامش الداخلي (mm)' : 'Padding (mm)'}</label>
            <select name="padding" value={thermal.padding} onChange={handleThermalChange} className="select">
              <option value={2}>2mm</option>
              <option value={3}>3mm</option>
              <option value={4}>4mm</option>
              <option value={5}>5mm</option>
            </select>
          </div>

          <div>
            <label className="label">{language === 'ar' ? 'عدد النسخ' : 'Receipt Copies'}</label>
            <input type="number" name="copies" min="1" max="5" value={thermal.copies} onChange={handleThermalChange} className="input" />
          </div>

          <div>
            <label className="label">{language === 'ar' ? 'ترميز النص (ESC/POS)' : 'Text Encoding (ESC/POS)'}</label>
            <select name="encoding" value={thermal.encoding} onChange={handleThermalChange} className="select">
              <option value="utf8">UTF-8</option>
              <option value="cp864">CP-864 (Arabic)</option>
              <option value="cp1256">CP-1256 (Windows Arabic)</option>
              <option value="iso8859-6">ISO 8859-6</option>
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Toggle name="autoPrint" label={language === 'ar' ? 'طباعة تلقائية بعد الدفع' : 'Auto-print after checkout'} desc={language === 'ar' ? 'فتح نافذة الطباعة تلقائياً' : 'Open print dialog automatically'} />
          <Toggle name="showLogo" label={language === 'ar' ? 'إظهار الشعار' : 'Show Logo'} desc={language === 'ar' ? 'طباعة شعار الشركة على الإيصال' : 'Print company logo on receipt'} />
          <Toggle name="showQrCode" label={language === 'ar' ? 'إظهار رمز QR' : 'Show QR Code'} desc={language === 'ar' ? 'طباعة رمز ZATCA QR' : 'Print ZATCA QR code'} />
          <Toggle name="showFooter" label={language === 'ar' ? 'إظهار التذييل' : 'Show Footer'} desc={language === 'ar' ? 'رسالة شكر في أسفل الإيصال' : 'Thank you message at bottom'} />
          <Toggle name="cutAtEnd" label={language === 'ar' ? 'قص الورق في النهاية' : 'Paper Cut at End'} desc={language === 'ar' ? 'إرسال أمر قص الورق (ESC/POS)' : 'Send paper cut command (ESC/POS)'} />
        </div>

        {thermal.showFooter && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">{language === 'ar' ? 'نص التذييل (إنجليزي)' : 'Footer Text (English)'}</label>
              <input type="text" name="footerTextEn" value={thermal.footerTextEn} onChange={handleThermalChange} className="input" placeholder="Thank you for your visit!" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'نص التذييل (عربي)' : 'Footer Text (Arabic)'}</label>
              <input type="text" name="footerTextAr" value={thermal.footerTextAr} onChange={handleThermalChange} className="input" placeholder="شكراً لزيارتكم!" dir="rtl" />
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-100 dark:bg-dark-800 rounded-xl">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{language === 'ar' ? 'معاينة' : 'Preview'}</p>
          <div
            className="bg-white text-black mx-auto font-mono border border-gray-200"
            style={{
              width: `${thermal.paperWidth}mm`,
              padding: `${thermal.padding}mm`,
              fontSize: `${thermal.fontSize}px`,
              lineHeight: thermal.lineHeight,
              boxSizing: 'border-box',
            }}
          >
            {thermal.showLogo && <div className="text-center mb-2 text-gray-400 text-[8px]">[ LOGO ]</div>}
            <div className="text-center font-bold">Business Name</div>
            <div className="text-center text-gray-500">اسم الشركة</div>
            <div className="border-t border-dashed border-gray-300 my-2"></div>
            <div className="flex justify-between"><span>Item 1</span><span>SAR 10.00</span></div>
            <div className="flex justify-between"><span>Item 2</span><span>SAR 15.00</span></div>
            <div className="border-t border-dashed border-gray-300 my-2"></div>
            <div className="flex justify-between font-bold"><span>Total</span><span>SAR 25.00</span></div>
            {thermal.showQrCode && <div className="text-center mt-2 text-gray-400 text-[8px]">[ QR CODE ]</div>}
            {thermal.showFooter && (
              <div className="text-center mt-2 text-gray-500 text-[9px]">
                <p>{thermal.footerTextEn}</p>
                <p>{thermal.footerTextAr}</p>
              </div>
            )}
          </div>
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
