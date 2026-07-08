/**
 * Android POS Printer Bridge
 *
 * Detects and communicates with built-in thermal printers on Android POS devices
 * (e.g. Dawai, AP80, Sunmi, etc.) via JavaScript interfaces injected into the WebView.
 *
 * Common bridge patterns supported:
 * - window.Android.printText(text) / window.Android.print(text)
 * - window.AndroidJS.print(text)
 * - window.ReceiptChannel.postMessage(payload)
 * - window.PrintInterface.printSome(text)
 * - window.pos.print(text)
 * - window.DatecsPrinter.printText(text)
 * - window.posprinter.print(text)
 */

const BRIDGE_NAMES = [
  'Android',
  'AndroidJS',
  'AndroidPrinter',
  'AndroidBridge',
  'AndroidInterface',
  'AndroidJsInterface',
  'ReceiptChannel',
  'PrintInterface',
  'pos',
  'posprinter',
  'DatecsPrinter',
  'PosPrinter',
  'Printer',
  'printer',
  'JsBridge',
  'WebViewJavascriptBridge',
  'webkit',
  'DM',
  'Dm',
  'sunmi',
  'SunmiPrinter',
  'sunmiPrinter',
  'JsPrint',
  'jsPrint',
  'NativePrinter',
  'nativePrinter',
  'ThermalPrinter',
  'thermalPrinter',
  'WoyouService',
  'woyouService',
  'EscPosPrinter',
  'escPosPrinter',
  'UsbPrinter',
  'usbPrinter',
  'PrintService',
  'printService',
  'AndroidPrintService',
  'CashDrawer',
  'cashDrawer',
  'Hardware',
  'hardware',
  'Device',
  'device',
  'NativeAPI',
  'nativeAPI',
  'JsInterface',
  'jsInterface',
  'Bridge',
  'bridge',
];

let _cachedBridge = undefined;

function isAndroidWebView() {
  if (typeof window === 'undefined') return false;
  const ua = (window.navigator?.userAgent || '').toLowerCase();
  const hasAndroid = ua.includes('android');
  const hasWV = ua.includes('wv') || ua.includes('webview') || ua.includes('crosswalk');
  return hasAndroid && (hasWV || !!detectBridge());
}

function getBridgeObject() {
  if (typeof window === 'undefined') return null;
  for (const name of BRIDGE_NAMES) {
    const obj = window[name];
    if (obj && typeof obj === 'object') {
      return { name, obj };
    }
  }
  return null;
}

export function detectBridge() {
  if (_cachedBridge !== undefined) return _cachedBridge;
  if (typeof window === 'undefined') return null;

  const found = getBridgeObject();
  if (!found) {
    _cachedBridge = null;
    return null;
  }

  const { name, obj } = found;

  const methods = {
    printText: null,
    printRaw: null,
    openCashDrawer: null,
    getStatus: null,
    feedPaper: null,
    setAlignment: null,
    setBold: null,
    setFontSize: null,
  };

  if (typeof obj.printText === 'function') methods.printText = 'printText';
  else if (typeof obj.print === 'function') methods.printText = 'print';
  else if (typeof obj.printSome === 'function') methods.printText = 'printSome';
  else if (typeof obj.printString === 'function') methods.printText = 'printString';

  if (typeof obj.printRaw === 'function') methods.printRaw = 'printRaw';
  else if (typeof obj.printRawData === 'function') methods.printRaw = 'printRawData';
  else if (typeof obj.sendData === 'function') methods.printRaw = 'sendData';
  else if (typeof obj.write === 'function') methods.printRaw = 'write';

  if (typeof obj.openCashDrawer === 'function') methods.openCashDrawer = 'openCashDrawer';
  else if (typeof obj.openCashBox === 'function') methods.openCashDrawer = 'openCashBox';
  else if (typeof obj.kickCashDrawer === 'function') methods.openCashDrawer = 'kickCashDrawer';
  else if (typeof obj.openDrawer === 'function') methods.openCashDrawer = 'openDrawer';
  else if (typeof obj.drawerOpen === 'function') methods.openCashDrawer = 'drawerOpen';
  else if (typeof obj.cashDrawerOpen === 'function') methods.openCashDrawer = 'cashDrawerOpen';
  else if (typeof obj.popCashDrawer === 'function') methods.openCashDrawer = 'popCashDrawer';
  else if (typeof obj.sendCommand === 'function') methods.openCashDrawer = 'sendCommand';

  if (typeof obj.getStatus === 'function') methods.getStatus = 'getStatus';
  else if (typeof obj.printerStatus === 'function') methods.getStatus = 'printerStatus';
  else if (typeof obj.getPrinterStatus === 'function') methods.getStatus = 'getPrinterStatus';

  if (typeof obj.feedPaper === 'function') methods.feedPaper = 'feedPaper';
  else if (typeof obj.feed === 'function') methods.feedPaper = 'feed';

  if (!methods.printText && name === 'ReceiptChannel' && typeof obj.postMessage === 'function') {
    methods.printText = 'postMessage';
  }

  if (!methods.printText && !methods.printRaw && !methods.openCashDrawer) {
    _cachedBridge = null;
    return null;
  }

  _cachedBridge = { name, obj, methods };
  return _cachedBridge;
}

export function isAndroidPos() {
  return isAndroidWebView() && !!detectBridge();
}

export function isAndroidDevice() {
  if (typeof window === 'undefined') return false;
  const ua = (window.navigator?.userAgent || '').toLowerCase();
  return ua.includes('android');
}

export function getBridgeInfo() {
  const bridge = detectBridge();
  if (!bridge) return null;
  return {
    name: bridge.name,
    methods: Object.entries(bridge.methods)
      .filter(([, v]) => v !== null)
      .map(([k]) => k),
  };
}

export function diagnoseBridge() {
  if (typeof window === 'undefined') return { platform: 'server', bridges: [] };
  const ua = (window.navigator?.userAgent || '').toLowerCase();
  const isAndroid = ua.includes('android');
  const isWebView = ua.includes('wv') || ua.includes('webview') || ua.includes('crosswalk');

  const found = [];
  const printerKeywords = ['print', 'drawer', 'cash', 'pos', 'esc', 'usb', 'thermal', 'receipt', 'hardware', 'device', 'native', 'bridge', 'android', 'jsinterface'];

  for (const key of Object.getOwnPropertyNames(window)) {
    try {
      if (key === 'window' || key === 'self' || key === 'top' || key === 'parent' || key === 'frames' || key === 'document' || key === 'location' || key === 'navigator') continue;
      const obj = window[key];
      if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) continue;
      const lowerKey = key.toLowerCase();
      const isPrinterRelated = printerKeywords.some(kw => lowerKey.includes(kw));
      if (!isPrinterRelated) continue;

      const methodNames = [];
      try {
        for (const prop of Object.getOwnPropertyNames(Object.getPrototypeOf(obj) || obj)) {
          if (typeof obj[prop] === 'function') methodNames.push(prop);
        }
      } catch (_) {}
      try {
        for (const prop of Object.getOwnPropertyNames(obj)) {
          if (typeof obj[prop] === 'function' && !methodNames.includes(prop)) methodNames.push(prop);
        }
      } catch (_) {}

      found.push({ name: key, methods: methodNames.slice(0, 20) });
    } catch (_) {}
  }

  return {
    platform: isAndroid ? 'android' : 'other',
    isWebView,
    userAgent: ua.substring(0, 200),
    bridges: found,
  };
}

export async function openCashDrawerViaSystemPrint(kickCodeStr) {
  const parts = (kickCodeStr || '27,112,0,50,250').split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
  let rawText = '';
  for (const b of parts) rawText += String.fromCharCode(b);

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: 58mm auto; margin: 0; }
  body { font-family: monospace; font-size: 1px; color: #000; margin: 0; padding: 0; white-space: pre; }
</style>
</head>
<body>${rawText}</body>
</html>`;
  return printViaSystemPrint(html);
}

function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function printText(text) {
  const bridge = detectBridge();
  if (!bridge) throw new Error('No Android POS printer bridge detected');

  const { obj, methods, name } = bridge;

  return new Promise((resolve, reject) => {
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Print timeout — bridge did not respond'));
      }
    }, 10000);

    window.onResponsePrintResult = (result) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        if (result && result.status === 'success') {
          resolve(result);
        } else if (result && result.status === 'error') {
          reject(new Error(result.message || 'Print failed'));
        } else {
          resolve(result || { status: 'success', message: 'Print sent' });
        }
      }
    };

    try {
      if (name === 'ReceiptChannel' && methods.printText === 'postMessage') {
        const payload = {
          type: 'text',
          data: text,
          timestamp: Date.now(),
        };
        obj.postMessage(JSON.stringify(payload));
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve({ status: 'success', message: 'Print sent via ReceiptChannel' });
          }
        }, 2000);
        return;
      }

      const fn = obj[methods.printText];
      const result = fn.call(obj, text);

      if (result instanceof Promise) {
        result.then((r) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve(r || { status: 'success', message: 'Print sent' });
          }
        }).catch((e) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            reject(e);
          }
        });
      } else {
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve({ status: 'success', message: 'Print sent via ' + name + '.' + methods.printText });
          }
        }, 1500);
      }
    } catch (err) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(err);
      }
    }
  });
}

export async function printRaw(bytes) {
  const bridge = detectBridge();
  if (!bridge) throw new Error('No Android POS printer bridge detected');

  const { obj, methods, name } = bridge;

  if (!methods.printRaw) {
    const text = new TextDecoder('utf-8').decode(bytes);
    return printText(text);
  }

  const base64 = bytesToBase64(new Uint8Array(bytes));

  return new Promise((resolve, reject) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Print timeout — bridge did not respond'));
      }
    }, 10000);

    window.onResponsePrintResult = (result) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        if (result && result.status === 'success') {
          resolve(result);
        } else {
          resolve(result || { status: 'success', message: 'Print sent' });
        }
      }
    };

    try {
      if (name === 'ReceiptChannel' && methods.printRaw === 'postMessage') {
        const payload = {
          type: 'raw',
          data: base64,
          timestamp: Date.now(),
        };
        obj.postMessage(JSON.stringify(payload));
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve({ status: 'success', message: 'Raw print sent via ReceiptChannel' });
          }
        }, 2000);
        return;
      }

      const fn = obj[methods.printRaw];
      const result = fn.call(obj, base64);

      if (result instanceof Promise) {
        result.then((r) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve(r || { status: 'success', message: 'Print sent' });
          }
        }).catch((e) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            reject(e);
          }
        });
      } else {
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            resolve({ status: 'success', message: 'Raw print sent via ' + name });
          }
        }, 1500);
      }
    } catch (err) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(err);
      }
    }
  });
}

export async function openCashDrawer() {
  const bridge = detectBridge();
  if (!bridge) throw new Error('No Android POS printer bridge detected');

  const { obj, methods } = bridge;

  if (methods.openCashDrawer) {
    try {
      const fn = obj[methods.openCashDrawer];
      // If it's sendCommand, pass the ESC/POS kick code
      if (methods.openCashDrawer === 'sendCommand') {
        const kickStr = '\x1B\x70\x00\x32\xFA';
        const result = fn.call(obj, kickStr);
        if (result instanceof Promise) return await result;
        return { status: 'success', message: 'Cash drawer command sent via sendCommand' };
      }
      const result = fn.call(obj);
      if (result instanceof Promise) {
        return await result;
      }
      return { status: 'success', message: 'Cash drawer command sent' };
    } catch (err) {
      throw err;
    }
  }

  if (methods.printRaw) {
    const kickCode = [0x1B, 0x70, 0x00, 0x32, 0xFA];
    return printRaw(new Uint8Array(kickCode));
  }

  if (methods.printText) {
    const kickStr = '\x1B\x70\x00\x32\xFA';
    return printText(kickStr);
  }

  throw new Error('Cash drawer control not supported by this bridge');
}

export async function openCashDrawerViaRaw(kickCodeStr) {
  const bridge = detectBridge();
  if (!bridge) throw new Error('No Android POS printer bridge detected');

  const parts = (kickCodeStr || '27,112,0,50,250').split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
  const bytes = new Uint8Array(parts);

  if (bridge.methods.printRaw) {
    return printRaw(bytes);
  }

  if (bridge.methods.printText) {
    let text = '';
    for (const b of parts) text += String.fromCharCode(b);
    return printText(text);
  }

  throw new Error('No raw print method available on bridge');
}

export async function getPrinterStatus() {
  const bridge = detectBridge();
  if (!bridge) throw new Error('No Android POS printer bridge detected');

  const { obj, methods } = bridge;

  if (!methods.getStatus) {
    return { status: 'unknown', message: 'Status query not supported' };
  }

  try {
    const fn = obj[methods.getStatus];
    const result = fn.call(obj);
    if (result instanceof Promise) {
      return await result;
    }
    return { status: 'ok', message: String(result || 'Ready') };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

export function buildEscPosReceipt({ businessName, businessNameAr, items, total, date, paperWidth = 58, encoding = 'utf8' }) {
  const esc = 0x1B;
  const gs = 0x1D;
  const chars = paperWidth === 58 ? 32 : 48;
  const sep = '-'.repeat(chars) + '\n';

  const parts = [
    [esc, 0x40],
    [esc, 0x61, 0x01],
    [esc, 0x45, 0x01],
    [gs, 0x21, 0x11],
  ];

  const textParts = [];
  textParts.push((businessName || 'Maqder ERP').substring(0, 16) + '\n');
  if (businessNameAr) textParts.push(businessNameAr + '\n');

  textParts.push(
    sep,
    '*** TEST RECEIPT ***\n',
    `Date: ${date || new Date().toLocaleString()}\n`,
    `Paper: ${paperWidth}mm | Cols: ${chars}\n`,
    sep,
  );

  if (items && items.length) {
    textParts.push(...items.map(i => `${i.name.padEnd(chars - 10)}${i.price.padStart(10)}\n`));
    textParts.push(sep);
  }

  if (total) {
    textParts.push(`Total: ${total}\n`, sep);
  }

  textParts.push('If you can read this,\nyour printer works!\n\n\n');

  const encoder = new TextEncoder();
  const allBytes = [
    ...parts[0],
    ...parts[1],
    ...parts[2],
    ...parts[3],
    ...encoder.encode(textParts.join('')),
    esc, 0x69,
  ];

  return new Uint8Array(allBytes);
}

export function buildReceiptHtml({ businessName, businessNameAr, items, total, subtotal, tax, date, paymentMethod, paperWidth = 58, vatNumber }) {
  const widthMm = paperWidth === 58 ? '58mm' : '80mm';
  const fontSize = paperWidth === 58 ? '9px' : '11px';
  const chars = paperWidth === 58 ? 32 : 48;

  const itemsHtml = (items || []).map(i => {
    const name = (i.name || '').substring(0, chars - 10);
    const price = (i.price || '0.00').padStart(10);
    return `<tr><td style="padding:1px 0;">${name}</td><td style="text-align:right;padding:1px 0;">${price}</td></tr>`;
  }).join('');

  const dashedLine = '<div style="border-top:1px dashed #000;margin:4px 0;"></div>';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Receipt</title>
<style>
  @page { size: ${widthMm} auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${widthMm}; font-family: monospace; font-size: ${fontSize}; color: #000; background: #fff; padding: 4px; }
</style>
</head>
<body>
  <div style="text-align:center;font-weight:bold;font-size:${paperWidth === 58 ? '12px' : '14px'};">${businessName || 'Maqder ERP'}</div>
  ${businessNameAr ? `<div style="text-align:center;">${businessNameAr}</div>` : ''}
  ${vatNumber ? `<div style="text-align:center;">VAT: ${vatNumber}</div>` : ''}
  ${dashedLine}
  <div style="text-align:center;font-weight:bold;">RECEIPT</div>
  <div>Date: ${date || new Date().toLocaleString()}</div>
  ${paymentMethod ? `<div>Payment: ${paymentMethod}</div>` : ''}
  ${dashedLine}
  ${itemsHtml ? `<table style="width:100%;border-collapse:collapse;">${itemsHtml}</table>${dashedLine}` : ''}
  ${subtotal ? `<table style="width:100%;border-collapse:collapse;"><tr><td style="padding:1px 0;">Subtotal</td><td style="text-align:right;padding:1px 0;">${subtotal}</td></tr></table>` : ''}
  ${tax ? `<table style="width:100%;border-collapse:collapse;"><tr><td style="padding:1px 0;">VAT</td><td style="text-align:right;padding:1px 0;">${tax}</td></tr></table>` : ''}
  ${total ? `<table style="width:100%;border-collapse:collapse;"><tr style="font-weight:bold;"><td style="padding-top:4px;font-weight:bold;border-top:1px solid #000;">TOTAL</td><td style="text-align:right;padding-top:4px;font-weight:bold;border-top:1px solid #000;">${total}</td></tr></table>` : ''}
  ${dashedLine}
  <div style="text-align:center;">Thank you!</div>
  <div style="height:20px"></div>
</body>
</html>`;
}

export function printViaSystemPrint(html) {
  return new Promise((resolve, reject) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100vh;border:0;z-index:99999;background:#fff;';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();

      const cleanup = () => {
        try { document.body.removeChild(iframe); } catch (_) {}
      };

      const onAfterPrint = () => {
        window.removeEventListener('afterprint', onAfterPrint);
        cleanup();
        resolve({ status: 'success', message: 'Print dialog triggered' });
      };
      window.addEventListener('afterprint', onAfterPrint);

      const doPrint = () => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (e) {
          try { window.focus(); window.print(); } catch (e2) {
            cleanup();
            reject(e2);
            return;
          }
        }
        setTimeout(() => {
          cleanup();
          window.removeEventListener('afterprint', onAfterPrint);
          resolve({ status: 'success', message: 'Print dialog triggered' });
        }, 5000);
      };

      iframe.onload = doPrint;
      setTimeout(doPrint, 500);
    } catch (err) {
      reject(err);
    }
  });
}

export async function testPrint(options = {}) {
  const bridge = detectBridge();

  if (bridge) {
    try {
      const bytes = buildEscPosReceipt({
        businessName: options.businessName || 'Maqder ERP',
        businessNameAr: options.businessNameAr || '',
        paperWidth: options.paperWidth || 58,
        date: new Date().toLocaleString(),
      });

      if (bridge.methods.printRaw) {
        await printRaw(bytes);
      } else {
        const text = new TextDecoder('utf-8').decode(bytes);
        await printText(text);
      }

      return {
        success: true,
        message: `Test receipt printed via ${bridge.name} bridge`,
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Failed to print test receipt',
      };
    }
  }

  if (isAndroidDevice() || typeof window !== 'undefined') {
    try {
      const html = buildReceiptHtml({
        businessName: options.businessName || 'Maqder ERP',
        businessNameAr: options.businessNameAr || '',
        paperWidth: options.paperWidth || 58,
        date: new Date().toLocaleString(),
        items: [
          { name: 'Item 1', price: 'SAR 10.00' },
          { name: 'Item 2', price: 'SAR 15.00' },
        ],
        subtotal: 'SAR 25.00',
        tax: 'SAR 0.00',
        total: 'SAR 25.00',
      });
      await printViaSystemPrint(html);
      return {
        success: true,
        message: 'Test receipt sent to Android system print service',
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Failed to print via system print service',
      };
    }
  }

  return {
    success: false,
    message: 'No printer bridge or system print service available',
  };
}
