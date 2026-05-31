import fs from 'fs';
import path from 'path';

const srcDir = 'c:\\Users\\kjh\\Desktop\\khayyatos\\khayyatos\\backend\\routes';
const destDir = 'c:\\Users\\kjh\\Desktop\\maqder\\backend\\routes\\khayyat';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = ['stitching.js', 'embroideryDesigns.js', 'fabric.js', 'laundry.js', 'payment.js'];

files.forEach(file => {
  let content = fs.readFileSync(path.join(srcDir, file), 'utf8');

  // Convert requires to imports
  content = content.replace(/const\s+(.+?)\s+=\s+require\(['"](.+?)['"]\);/g, (match, vars, pth) => {
    // If it's a model
    if (pth.startsWith('../models/')) {
      const modelName = pth.split('/').pop();
      if (['User', 'Tenant', 'Customer'].includes(modelName)) {
        return `import ${modelName} from '../../models/${modelName}.js';`;
      }
      return `import Khayyat${modelName} from '../../models/khayyat/Khayyat${modelName}.js';`;
    }
    // Auth middleware
    if (pth.startsWith('../middleware/auth')) {
      return `import { protect } from '../../middleware/auth.js';`;
    }
    // Ignore gemini/whatsapp/upload imports
    if (pth.includes('gemini') || pth.includes('whatsapp') || pth.includes('upload') || pth.includes('demoGuard') || pth.includes('saudi') || pth.includes('measurements')) {
      return ''; // remove these imports to avoid missing files, we'll patch functions
    }
    if (pth === 'express' || pth === 'fs' || pth === 'path' || pth === 'sharp') {
      return `import ${vars} from '${pth}';`;
    }
    return match;
  });

  // Export default router
  content = content.replace(/module\.exports\s*=\s*router;/, 'export default router;');

  // Models replacement
  content = content.replace(/\bWorker\b/g, 'KhayyatWorker');
  content = content.replace(/\bStitching\b/g, 'KhayyatStitching');
  content = content.replace(/\bPayment\b/g, 'KhayyatPayment');
  content = content.replace(/\bEmbroideryDesign\b/g, 'KhayyatEmbroideryDesign');
  content = content.replace(/\bFabric\b/g, 'KhayyatFabric');
  content = content.replace(/\bLaundry\b/g, 'KhayyatLaundry');
  content = content.replace(/\bLaundryPayment\b/g, 'KhayyatLaundryPayment'); // Wait, LaundryPayment model?

  // We didn't create KhayyatLaundryPayment model. Let's fix that. I'll create it later.

  // Middleware replacements
  content = content.replace(/verifyToken,\s*isUser/g, 'protect');
  content = content.replace(/verifyToken,\s*isWorker/g, 'protectWorker'); // For worker.js
  content = content.replace(/blockDemoWrites,\s*upload\.single\([^)]+\),?/g, ''); // strip out upload
  content = content.replace(/blockDemoWrites,?/g, '');

  // Req properties
  content = content.replace(/req\.user\._id/g, 'req.user.tenantId');
  content = content.replace(/userId:\s*req\.user\.tenantId/g, 'tenantId: req.user.tenantId');
  content = content.replace(/userId/g, 'tenantId'); // This might be broad, but mostly correct for schemas
  // Specifically fix user queries
  content = content.replace(/req\.user\.tenantId/g, 'req.user.tenantId');

  // Strip removed functions
  content = content.replace(/await translateMany\([^)]+\)/g, '{}');
  content = content.replace(/buildFallbackI18n\([^)]+\)/g, '{}');
  content = content.replace(/whatsappService\.[a-zA-Z]+\([^)]+\)\s*\.then\([^)]+\)\s*\.catch\([^)]+\);?/g, '');
  content = content.replace(/persistMeasurementImage\([^)]+\)/g, 'null');
  content = content.replace(/removeUploadedAssetByUrl\([^)]+\);?/g, '');

  // Save modified content
  fs.writeFileSync(path.join(destDir, file), content);
});
