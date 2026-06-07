const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Replace phone numbers
      if (content.includes('+966595930045')) {
        content = content.replace(/\+966595930045/g, '+966596775485');
        changed = true;
      }

      // Replace built by text
      const oldBuiltBy1 = "Built with ❤️ for Saudi businesses by";
      const oldBuiltBy2 = "Built with ❤️ by";
      const newBuiltBy = "built by Eastern Workforce Solutions Establishment";

      if (content.includes(oldBuiltBy1)) {
        content = content.replace(new RegExp(oldBuiltBy1, 'g'), newBuiltBy);
        changed = true;
      }
      if (content.includes(oldBuiltBy2)) {
        content = content.replace(new RegExp(oldBuiltBy2, 'g'), newBuiltBy);
        changed = true;
      }
      
      const oldBuiltByAr1 = "صُنع بـ ❤️ للشركات السعودية بواسطة";
      const oldBuiltByAr2 = "صنع بـ ❤️ بواسطة";
      const newBuiltByAr = "صنع بواسطة Eastern Workforce Solutions Establishment";

      if (content.includes(oldBuiltByAr1)) {
        content = content.replace(new RegExp(oldBuiltByAr1, 'g'), newBuiltByAr);
        changed = true;
      }
      if (content.includes(oldBuiltByAr2)) {
        content = content.replace(new RegExp(oldBuiltByAr2, 'g'), newBuiltByAr);
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated', fullPath);
      }
    }
  }
}

replaceInDir(path.join(__dirname, 'frontend/src'));
console.log('Done');
