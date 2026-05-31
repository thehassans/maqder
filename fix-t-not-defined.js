const fs = require('fs');
const path = require('path');
const dir = 'C:\\\\Users\\\\kjh\\\\Desktop\\\\maqder\\\\frontend\\\\src\\\\pages\\\\khayyat';

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk(dir, function(filePath) {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file uses `t(` and doesn't have `const { t }`
    if (/\bt\([^)]+\)/.test(content) && !content.includes('const { t }')) {
      
      // Inject the import
      if (!content.includes('useTranslation')) {
         // Some components are inside subfolders, so the relative path might be different.
         // Let's just use absolute-like or calculate relative path
         const depth = filePath.split(path.sep).length - dir.split(path.sep).length;
         let upDirs = '../../'; // base is khayyat (2 dirs up to src)
         if (depth > 1) {
            for(let i=1; i<depth; i++) upDirs += '../';
         }
         content = `import { useTranslation } from '${upDirs}lib/translations.js';\n` + content;
      }

      // Find where we injected language and inject t right after it
      const langInjectStr = "const { language } = useSelector(state => state.ui) || { language: 'en' };";
      if (content.includes(langInjectStr)) {
         content = content.replace(langInjectStr, langInjectStr + "\n  const { t } = useTranslation(language);");
      } else {
         // It might be using const { language } = useSelector(state => state.ui);
         const langStr2 = "const { language } = useSelector(state => state.ui);";
         if (content.includes(langStr2)) {
             content = content.replace(langStr2, langStr2 + "\n  const { t } = useTranslation(language);");
         } else {
             // Just inject it after the main component definition
             content = content.replace(/(const [A-Za-z0-9_]+ = \([^)]*\) => {)/, "$1\n  const { t } = useTranslation('en');");
             content = content.replace(/(export default function [A-Za-z0-9_]+\([^)]*\) {)/, "$1\n  const { t } = useTranslation('en');");
         }
      }

      fs.writeFileSync(filePath, content);
      console.log('Fixed t() in: ' + filePath);
    }
  }
});
