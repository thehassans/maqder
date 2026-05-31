const fs = require('fs');
const path = require('path');

const sourceDir = 'C:\\Users\\kjh\\Desktop\\khayyatos\\khayyatos\\backend\\models';
const destDir = 'C:\\Users\\kjh\\Desktop\\maqder\\backend\\models\\khayyat';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const modelsToMigrate = [
  'Worker.js',
  'Stitching.js',
  'EmbroideryDesign.js',
  'Fabric.js',
  'Laundry.js'
];

modelsToMigrate.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(destDir, `Khayyat${file}`);
  
  if (fs.existsSync(sourcePath)) {
    let content = fs.readFileSync(sourcePath, 'utf8');
    
    // Replace CJS with ESM
    content = content.replace(/const mongoose = require\('mongoose'\);/g, "import mongoose from 'mongoose';");
    content = content.replace(/module\.exports = mongoose\.model\('(.*?)', (.*?)\);/g, "const Khayyat$1 = mongoose.model('Khayyat$1', $2);\nexport default Khayyat$1;");
    
    // Replace userId with tenantId
    content = content.replace(/userId:/g, 'tenantId:');
    content = content.replace(/ref: 'User'/g, "ref: 'Tenant'");
    
    // Some indexes might have userId, replace them
    content = content.replace(/userId: 1/g, 'tenantId: 1');
    content = content.replace(/userId: -1/g, 'tenantId: -1');
    
    fs.writeFileSync(destPath, content);
    console.log(`Migrated ${file} to Khayyat${file}`);
  } else {
    console.log(`File not found: ${sourcePath}`);
  }
});
