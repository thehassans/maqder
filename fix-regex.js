const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\kjh\\Desktop\\maqder\\frontend\\src\\pages\\khayyat';

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
    let original = content;

    // Fix .get('...')
    content = content.replace(/\.ge\(language === 'ar' \? '([^']+)' : '([^']+)'\)/g, ".get('$1')");
    // Fix .createElement('...')
    content = content.replace(/\.createElemen\(language === 'ar' \? '([^']+)' : '([^']+)'\)/g, ".createElement('$1')");
    // Fix .getContext('...')
    content = content.replace(/\.getContex\(language === 'ar' \? '([^']+)' : '([^']+)'\)/g, ".getContext('$1')");
    // Fix preventDefault()
    content = content.replace(/preventDefaul\(language === 'ar' \? '([^']+)' : '([^']+)'\)/g, "preventDefault('$1')");
    // Fix setTimeout()
    content = content.replace(/setTimeou\(language === 'ar' \? '([^']+)' : '([^']+)'\)/g, "setTimeout('$1')"); // wait setTimeout usually takes a function
    // Wait, let's just do a generic fix for anything ending with a letter before the (language...
    // The mistake was matching `t('...')` when it was part of a word like `get`.
    // So `ge t('...')` became `ge(language === 'ar' ? '...' : '...')`.
    // Let's replace `([a-zA-Z])\(language === 'ar' \? '([^']+)' : '([^']+)'\)` -> `$1t('$2')`
    // Because it replaced `t('...')` with `(language === 'ar' ? '...' : '...')`.
    // If it was preceded by `ge`, it became `ge(language...`.
    // So the letter before `(` is the end of the original word without `t`.
    content = content.replace(/([a-zA-Z])\(language === 'ar' \? '([^']+)' : '([^']+)'\)/g, "$1t('$2')");
    
    // Also, some files might be missing `const { language } = useSelector(state => state.ui);`
    // Let's ensure it's imported.
    if (content.includes('language ===') && !content.includes('const { language }')) {
      // Find the component function start
      content = content.replace(/(const [A-Za-z0-9_]+ = \([^)]*\) => {)/, "$1\n  const { language } = useSelector(state => state.ui) || { language: 'en' };");
      content = content.replace(/(export default function [A-Za-z0-9_]+\([^)]*\) {)/, "$1\n  const { language } = useSelector(state => state.ui) || { language: 'en' };");
      
      // Ensure useSelector is imported
      if (!content.includes('useSelector')) {
        content = "import { useSelector } from 'react-redux';\n" + content;
      }
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed ${path.basename(filePath)}`);
    }
  }
});
