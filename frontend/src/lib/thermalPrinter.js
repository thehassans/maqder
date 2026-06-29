/**
 * Shared thermal printer settings helper.
 * Reads from tenant.settings.thermalPrinter and provides sensible defaults.
 */

export const DEFAULT_THERMAL_SETTINGS = {
  paperWidth: 80,       // 58 or 80 (mm)
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
};

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
