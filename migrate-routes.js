const fs = require('fs');
const path = require('path');

const sourceDir = 'C:\\Users\\kjh\\Desktop\\khayyatos\\khayyatos\\backend\\routes';
const destDir = 'C:\\Users\\kjh\\Desktop\\maqder\\backend\\routes\\khayyat';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const routesToMigrate = [
  'worker.js',
  'embroideryDesigns.js',
  'fabric.js',
  'laundry.js',
  'stitching.js'
];

routesToMigrate.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(destDir, file);
  
  if (fs.existsSync(sourcePath)) {
    let content = fs.readFileSync(sourcePath, 'utf8');
    
    // Replace requires with imports
    content = content.replace(/const express = require\('express'\);/g, "import express from 'express';");
    content = content.replace(/const router = express\.Router\(\);/g, "const router = express.Router();");
    
    // Auth middleware
    content = content.replace(/const auth = require\('\.\.\/middleware\/auth'\);/g, "import { protect } from '../../middleware/authMiddleware.js';");
    // Replace auth middleware usage 'auth' with 'protect'
    content = content.replace(/router\.(get|post|put|delete)\('([^']+)', auth,/g, "router.$1('$2', protect,");
    
    // Replace Model requires with imports
    // Regex for: const Model = require('../models/Model');
    content = content.replace(/const ([A-Za-z]+) = require\('\.\.\/models\/([A-Za-z]+)'\);/g, (match, p1, p2) => {
      // Special case: we don't import Customer from Khayyat, we import it from main models
      if (p2 === 'Customer') return "import Customer from '../../models/Customer.js';";
      if (p2 === 'User') return ""; // We don't need User in Maqder
      if (p2 === 'SystemSettings') return ""; // Maqder handles settings inside tenant
      if (['Worker', 'Stitching', 'EmbroideryDesign', 'Fabric', 'Laundry'].includes(p2)) {
        return `import Khayyat${p2} from '../../models/khayyat/Khayyat${p2}.js';`;
      }
      return match;
    });

    // We renamed the models, so we must replace usage of Worker to KhayyatWorker, etc.
    content = content.replace(/\bWorker\b/g, "KhayyatWorker");
    content = content.replace(/\bStitching\b/g, "KhayyatStitching");
    content = content.replace(/\bEmbroideryDesign\b/g, "KhayyatEmbroideryDesign");
    content = content.replace(/\bFabric\b/g, "KhayyatFabric");
    content = content.replace(/\bLaundry\b/g, "KhayyatLaundry");

    // Replace req.user.id with req.user.tenantId
    content = content.replace(/req\.user\.id/g, 'req.user.tenantId');
    
    // Replace userId with tenantId
    content = content.replace(/userId:/g, 'tenantId:');
    
    // Remove multer/cloudinary for now to avoid breaking (Maqder handles uploads differently or we can leave them if they use base64).
    // Actually Khayyatos uses multer/cloudinary. Let's comment them out or replace with simple express.json limits
    content = content.replace(/const upload = require\('\.\.\/middleware\/upload'\);/g, "// const upload = require('../../middleware/upload');");
    content = content.replace(/upload\.single\('[^']+'\), /g, "");

    // Export router
    content = content.replace(/module\.exports = router;/g, "export default router;");
    
    fs.writeFileSync(destPath, content);
    console.log(`Migrated route ${file}`);
  }
});
