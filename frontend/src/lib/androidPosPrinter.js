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
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cash Drawer</title>
<style>
  @page { size: 58mm auto; margin: 0; }
  * { margin: 0; padding: 0; }
  body { font-family: monospace; font-size: 1px; color: #000; white-space: pre; }
</style>
</head>
<body>${rawText}</body>
</html>`;
  return printViaSystemPrint(html);
}

export function isWebUsbSupported() {
  return typeof navigator !== 'undefined' && !!navigator.usb;
}

export function isWebSerialSupported() {
  return typeof navigator !== 'undefined' && !!navigator.serial;
}

let _usbDevice = null;

export async function openCashDrawerViaWebUSB(kickCodeStr) {
  if (!isWebUsbSupported()) throw new Error('WebUSB not supported on this device');

  const parts = (kickCodeStr || '27,112,0,50,250').split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
  const kickBytes = new Uint8Array(parts.length ? parts : [0x1B, 0x70, 0x00, 0x32, 0xFA]);

  let device = _usbDevice;
  try {
    if (!device) {
      device = await navigator.usb.requestDevice({
        filters: [
          { classCode: 7 },
          { vendorId: 0x04b8 },
          { vendorId: 0x0519 },
          { vendorId: 0x154f },
          { vendorId: 0x0fe6 },
          { vendorId: 0x0416 },
          { vendorId: 0x1659 },
          { vendorId: 0x28e9 },
          { vendorId: 0x0416 },
        ],
      });
      _usbDevice = device;
    }

    await device.open();
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }

    for (const iface of device.configuration.interfaces) {
      try {
        await device.claimInterface(iface.interfaceNumber);
        for (const alt of iface.alternates) {
          if (alt.interfaceClass === 7) {
            await device.selectAlternateInterface(iface.interfaceNumber, alt.alternateSetting);
            const endpointOut = alt.endpoints.find(ep => ep.direction === 'out');
            if (endpointOut) {
              await device.transferOut(endpointOut.endpointNumber, kickBytes);
              try { await device.releaseInterface(iface.interfaceNumber); } catch (_) {}
              return { status: 'success', message: 'Cash drawer opened via WebUSB' };
            }
          }
        }
        const endpointOut = iface.alternates[0]?.endpoints?.find(ep => ep.direction === 'out');
        if (endpointOut) {
          await device.transferOut(endpointOut.endpointNumber, kickBytes);
          try { await device.releaseInterface(iface.interfaceNumber); } catch (_) {}
          return { status: 'success', message: 'Cash drawer opened via WebUSB' };
        }
        try { await device.releaseInterface(iface.interfaceNumber); } catch (_) {}
      } catch (_) {}
    }

    throw new Error('No suitable USB printer interface found');
  } catch (err) {
    _usbDevice = null;
    throw err;
  }
}

export async function openCashDrawerViaSerial(kickCodeStr) {
  if (!isWebSerialSupported()) throw new Error('Web Serial API not supported on this device');

  const parts = (kickCodeStr || '27,112,0,50,250').split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
  const kickBytes = new Uint8Array(parts.length ? parts : [0x1B, 0x70, 0x00, 0x32, 0xFA]);

  const port = await navigator.serial.requestPort();
  await port.open({ baudRate: 9600 });

  const writer = port.writable.getWriter();
  await writer.write(kickBytes);
  writer.releaseLock();
  await port.close();

  return { status: 'success', message: 'Cash drawer opened via Web Serial' };
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

export function buildReceiptHtml({ businessName, businessNameAr, items, total, subtotal, tax, date, paymentMethod, paperWidth = 58, vatNumber, appendKickCode }) {
  const is58 = paperWidth === 58;
  const widthMm = is58 ? '58mm' : '80mm';
  const margin = is58 ? '2mm' : '3mm';
  const bodyFont = is58 ? '8pt' : '10pt';
  const headerFont = is58 ? '11pt' : '14pt';
  const smallFont = is58 ? '7pt' : '8pt';
  const totalFont = is58 ? '9pt' : '11pt';

  const itemsHtml = (items || []).map(i => {
    const name = i.name || 'Item';
    const price = i.price || '0.00';
    return `<tr><td style="padding:1pt 1mm 1pt 0;font-size:${bodyFont};line-height:1.2;word-break:break-word;white-space:normal;">${name}</td><td style="text-align:right;padding:1pt 0;font-size:${bodyFont};line-height:1.2;white-space:nowrap;vertical-align:top;">${price}</td></tr>`;
  }).join('');

  const sep = '<div style="border-top:1px solid #000;margin:3pt 0;"></div>';

  let kickCodeHtml = '';
  if (appendKickCode) {
    const parts = appendKickCode.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    let rawText = '';
    for (const b of parts) rawText += String.fromCharCode(b);
    kickCodeHtml = `<pre style="font-size:1px;line-height:1px;margin:0;padding:0;color:#000;overflow:hidden;">${rawText}</pre>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Receipt</title>
<style>
  @page { size: ${widthMm} auto; margin: ${margin}; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: ${bodyFont}; color: #000; background: #fff; line-height: 1.25; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  td { vertical-align: top; }
  .name-col { width: 62%; }
  .price-col { width: 38%; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div style="text-align:center;font-weight:bold;font-size:${headerFont};line-height:1.2;">${businessName || 'Maqder ERP'}</div>
  ${businessNameAr ? `<div style="text-align:center;font-size:${bodyFont};line-height:1.2;">${businessNameAr}</div>` : ''}
  ${vatNumber ? `<div style="text-align:center;font-size:${smallFont};">VAT: ${vatNumber}</div>` : ''}
  ${sep}
  <div style="text-align:center;font-weight:bold;font-size:${bodyFont};">RECEIPT</div>
  <div style="font-size:${smallFont};">Date: ${date || new Date().toLocaleString()}</div>
  ${paymentMethod ? `<div style="font-size:${smallFont};">Payment: ${paymentMethod}</div>` : ''}
  ${sep}
  ${itemsHtml ? `<table><colgroup><col class="name-col"><col class="price-col"></colgroup>${itemsHtml}</table>${sep}` : ''}
  ${subtotal ? `<table><tr><td style="padding:1pt 0;font-size:${bodyFont};">Subtotal</td><td style="text-align:right;padding:1pt 0;font-size:${bodyFont};white-space:nowrap;">${subtotal}</td></tr></table>` : ''}
  ${tax ? `<table><tr><td style="padding:1pt 0;font-size:${bodyFont};">VAT</td><td style="text-align:right;padding:1pt 0;font-size:${bodyFont};white-space:nowrap;">${tax}</td></tr></table>` : ''}
  ${total ? `<table><tr><td style="padding-top:3pt;font-weight:bold;border-top:1px solid #000;font-size:${totalFont};">TOTAL</td><td style="text-align:right;padding-top:3pt;font-weight:bold;border-top:1px solid #000;font-size:${totalFont};white-space:nowrap;">${total}</td></tr></table>` : ''}
  ${sep}
  <div style="text-align:center;font-size:${smallFont};">Thank you!</div>
  <div style="height:15pt"></div>
  ${kickCodeHtml}
</body>
</html>`;
}

export function printViaSystemPrint(html) {
  return new Promise((resolve, reject) => {
    try {
      // Approach 1: Open a new window with just the receipt — most reliable for printing
      const w = window.open('', '_blank', 'width=320,height=600');
      if (w) {
        w.document.open();
        w.document.write(html);
        w.document.close();

        const triggerPrint = () => {
          try {
            w.focus();
            w.print();
          } catch (_) {}
          // Close window after print dialog
          setTimeout(() => {
            try { w.close(); } catch (_) {}
            resolve({ status: 'success', message: 'Print dialog triggered' });
          }, 8000);
        };

        // Wait for the new window to render, then print
        if (w.document.readyState === 'complete') {
          setTimeout(triggerPrint, 300);
        } else {
          w.onload = () => setTimeout(triggerPrint, 300);
          setTimeout(triggerPrint, 1000); // fallback
        }
        return;
      }

      // Approach 2: Body swap with forced reflow + delay (fallback if window.open blocked)
      let bodyContent = html;
      let headContent = '';
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) bodyContent = bodyMatch[1];
      const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
      if (headMatch) headContent = headMatch[1];

      const originalHead = document.head.innerHTML;
      const originalBody = document.body.innerHTML;
      const originalBodyClass = document.body.className;
      const originalBodyStyle = document.body.getAttribute('style') || '';

      document.head.innerHTML = headContent;
      document.body.innerHTML = bodyContent;
      document.body.className = '';
      document.body.setAttribute('style', 'margin:0;padding:0;background:#fff;');

      // Force reflow so browser commits DOM changes before printing
      void document.body.offsetHeight;

      const restore = () => {
        document.head.innerHTML = originalHead;
        document.body.innerHTML = originalBody;
        document.body.className = originalBodyClass;
        document.body.setAttribute('style', originalBodyStyle);
        void document.body.offsetHeight;
      };

      const onAfterPrint = () => {
        window.removeEventListener('afterprint', onAfterPrint);
        restore();
        resolve({ status: 'success', message: 'Print dialog triggered' });
      };
      window.addEventListener('afterprint', onAfterPrint);

      // Delay to ensure browser has rendered the new content before printing
      setTimeout(() => {
        window.focus();
        window.print();
        setTimeout(() => {
          window.removeEventListener('afterprint', onAfterPrint);
          restore();
          resolve({ status: 'success', message: 'Print dialog triggered' });
        }, 8000);
      }, 400);
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
