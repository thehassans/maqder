const fs = require('fs');
const path = require('path');
const dir = 'C:\\\\Users\\\\kjh\\\\Desktop\\\\maqder\\\\frontend\\\\src\\\\pages\\\\khayyat';

const targetFiles = [
  path.join(dir, 'components', 'ui', 'MeasurementAtelierPanel.jsx'),
  path.join(dir, 'components', 'ui', 'DemoBlockedModal.jsx'),
  path.join(dir, 'StitchingForm.jsx'),
  path.join(dir, 'Dashboard.jsx')
];

targetFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('const t = (key, opts)')) {
      content = "const t = (key, opts) => opts?.defaultValue || key;\n" + content;
      fs.writeFileSync(file, content);
      console.log('Fixed:', file);
    }
  }
});
