/**
 * Shared thermal printer settings helper.
 * Reads from tenant.settings.thermalPrinter and provides sensible defaults.
 */

export const DEFAULT_THERMAL_SETTINGS = {
  printerModel: 'generic_80', // printer model preset key
  paperWidth: 80,       // 58 or 80 (mm)
  charsPerLine: 48,     // character columns (32 for 58mm, 48 for 80mm)
  dpi: 203,             // print resolution (203 or 300)
  fontSize: 11,         // base font size in px
  lineHeight: 1.4,      // line height multiplier
  padding: 4,           // padding in mm
  autoPrint: false,     // auto-open print dialog after checkout
  showLogo: true,       // print logo on receipt
  showQrCode: true,     // print ZATCA QR code
  showFooter: true,     // print footer message
  footerTextEn: 'Thank you for your visit!',
  footerTextAr: 'شكراً لزيارتكم!',
  cutAtEnd: true,       // send paper cut command (for ESC/POS)
  copies: 1,            // number of receipt copies
  encoding: 'utf8',     // text encoding for ESC/POS
  darkness: 2,          // print darkness 1-5 (ESC/POS)
  beepOnComplete: false, // beep after print
};

/**
 * Printer model presets.
 * Each preset auto-configures paper width, chars per line, DPI, and encoding.
 */
export const PRINTER_MODELS = {
  generic_80: {
    label: 'Generic 80mm Thermal',
    labelAr: 'طابعة حرارية 80mm',
    paperWidth: 80,
    charsPerLine: 48,
    dpi: 203,
    encoding: 'utf8',
  },
  generic_58: {
    label: 'Generic 58mm Thermal',
    labelAr: 'طابعة حرارية 58mm',
    paperWidth: 58,
    charsPerLine: 32,
    dpi: 203,
    encoding: 'utf8',
  },
  epson_tm_t20: {
    label: 'Epson TM-T20 (80mm)',
    labelAr: 'Epson TM-T20 (80mm)',
    paperWidth: 80,
    charsPerLine: 48,
    dpi: 203,
    encoding: 'utf8',
  },
  epson_tm_t88: {
    label: 'Epson TM-T88VI (80mm)',
    labelAr: 'Epson TM-T88VI (80mm)',
    paperWidth: 80,
    charsPerLine: 48,
    dpi: 300,
    encoding: 'utf8',
  },
  star_tsp100: {
    label: 'Star TSP100III (80mm)',
    labelAr: 'Star TSP100III (80mm)',
    paperWidth: 80,
    charsPerLine: 48,
    dpi: 203,
    encoding: 'utf8',
  },
  star_tsp143: {
    label: 'Star TSP143IIIW (80mm)',
    labelAr: 'Star TSP143IIIW (80mm)',
    paperWidth: 80,
    charsPerLine: 48,
    dpi: 203,
    encoding: 'utf8',
  },
  xprinter_xp58: {
    label: 'Xprinter XP-58IIH (58mm)',
    labelAr: 'Xprinter XP-58IIH (58mm)',
    paperWidth: 58,
    charsPerLine: 32,
    dpi: 203,
    encoding: 'cp864',
  },
  xprinter_xp80: {
    label: 'Xprinter XP-80IIH (80mm)',
    labelAr: 'Xprinter XP-80IIH (80mm)',
    paperWidth: 80,
    charsPerLine: 48,
    dpi: 203,
    encoding: 'cp864',
  },
  gprinter_gp58: {
    label: 'Goojprt GP-58 (58mm)',
    labelAr: 'Goojprt GP-58 (58mm)',
    paperWidth: 58,
    charsPerLine: 32,
    dpi: 203,
    encoding: 'cp864',
  },
  gprinter_gp80: {
    label: 'Goojprt GP-80 (80mm)',
    labelAr: 'Goojprt GP-80 (80mm)',
    paperWidth: 80,
    charsPerLine: 48,
    dpi: 203,
    encoding: 'cp864',
  },
  citizen_cts310: {
    label: 'Citizen CT-S310II (80mm)',
    labelAr: 'Citizen CT-S310II (80mm)',
    paperWidth: 80,
    charsPerLine: 48,
    dpi: 203,
    encoding: 'utf8',
  },
  rongta_rp80: {
    label: 'Rongta RP-80USE (80mm)',
    labelAr: 'Rongta RP-80USE (80mm)',
    paperWidth: 80,
    charsPerLine: 48,
    dpi: 203,
    encoding: 'cp864',
  },
};

/**
 * Apply a printer model preset to thermal settings.
 * Updates paperWidth, charsPerLine, dpi, and encoding from the model.
 * @param {string} modelKey - Key from PRINTER_MODELS.
 * @param {object} currentThermal - Current thermal settings.
 * @returns {object} Updated thermal settings.
 */
export function applyPrinterModel(modelKey, currentThermal) {
  const model = PRINTER_MODELS[modelKey];
  if (!model) return currentThermal;
  return {
    ...currentThermal,
    printerModel: modelKey,
    paperWidth: model.paperWidth,
    charsPerLine: model.charsPerLine,
    dpi: model.dpi,
    encoding: model.encoding,
  };
}

/**
 * Get thermal printer settings from tenant, merged with defaults.
 * @param {object} tenant - The tenant object from Redux state or API.
 * @returns {object} Merged settings.
 */
export function getThermalPrinterSettings(tenant) {
  const saved = tenant?.settings?.thermalPrinter || {};
  return { ...DEFAULT_THERMAL_SETTINGS, ...saved };
}

/**
 * Get the CSS width string for the current paper width.
 * @param {object} settings - Thermal printer settings (from getThermalPrinterSettings).
 * @returns {string} e.g. '80mm' or '58mm'
 */
export function getPaperWidth(settings) {
  return `${settings.paperWidth}mm`;
}

/**
 * Get the CSS padding string.
 * @param {object} settings
 * @returns {string} e.g. '4mm'
 */
export function getPaperPadding(settings) {
  return `${settings.padding}mm`;
}

/**
 * Get inline style object for a thermal receipt container.
 * @param {object} settings - Thermal printer settings.
 * @returns {object} React style object.
 */
export function getReceiptStyle(settings) {
  return {
    width: getPaperWidth(settings),
    padding: getPaperPadding(settings),
    boxSizing: 'border-box',
    fontSize: `${settings.fontSize}px`,
    lineHeight: settings.lineHeight,
  };
}

/**
 * Get print CSS for a given class name and settings.
 * @param {string} className - The CSS class used on the receipt container.
 * @param {object} settings - Thermal printer settings.
 * @returns {string} CSS string for @media print block.
 */
export function getPrintCss(className, settings) {
  const width = getPaperWidth(settings);
  const padding = getPaperPadding(settings);
  return `
    @media print {
      .${className} {
        width: ${width} !important;
        padding: ${padding} !important;
        margin: 0 auto !important;
        box-shadow: none !important;
        border: none !important;
      }
      body * { visibility: hidden !important; }
      .${className}, .${className} * { visibility: visible !important; }
      .${className} { position: absolute; left: 0; top: 0; }
    }
  `;
}

/**
 * Get the @page CSS string for thermal printing.
 * @param {object} settings
 * @returns {string}
 */
export function getPageCss(settings) {
  return `@page { size: ${getPaperWidth(settings)} auto; margin: 0; }`;
}

/**
 * Get the body width CSS for inline HTML receipts (e.g. window.open() receipts).
 * @param {object} settings
 * @returns {string}
 */
export function getBodyWidthCss(settings) {
  const width = getPaperWidth(settings);
  return `body { margin: 0; padding: 8px; font-family: monospace; font-size: ${settings.fontSize}px; background: white; color: black; width: ${width}; }`;
}
