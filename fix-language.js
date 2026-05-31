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
  if (filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    const componentRegex = /(const [A-Z][a-zA-Z0-9_]* = \([^)]*\) => \{)([\s\S]*?)(\n\};)/g;
    
    content = content.replace(componentRegex, (match, def, body, end) => {
        if (body.includes('language ===') && !body.includes('useSelector(')) {
            modified = true;
            return def + "\n  const { language } = useSelector(state => state.ui) || { language: 'en' };" + body + end;
        }
        return match;
    });

    const componentRegex2 = /(const [A-Z][a-zA-Z0-9_]* = \(\{[^}]*\}\) => \{)([\s\S]*?)(\n\};)/g;
    content = content.replace(componentRegex2, (match, def, body, end) => {
        if (body.includes('language ===') && !body.includes('useSelector(')) {
            modified = true;
            return def + "\n  const { language } = useSelector(state => state.ui) || { language: 'en' };" + body + end;
        }
        return match;
    });

    if (modified) {
      if (!content.includes('useSelector')) {
         content = "import { useSelector } from 'react-redux';\n" + content;
      }
      fs.writeFileSync(filePath, content);
      console.log('Fixed missing language inside components in: ' + filePath);
    }
  }
});
