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
    if (content.includes('useSelector') && !content.includes('import { useSelector')) {
      content = "import { useSelector } from 'react-redux';\n" + content;
      fs.writeFileSync(filePath, content);
      console.log('Added missing import to: ' + filePath);
    }
  }
});
