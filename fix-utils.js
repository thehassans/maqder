const fs = require('fs');

const file1 = 'C:\\\\Users\\\\kjh\\\\Desktop\\\\maqder\\\\frontend\\\\src\\\\pages\\\\khayyat\\\\components\\\\ui\\\\MeasurementCard.jsx';
let content1 = fs.readFileSync(file1, 'utf8');
content1 = "import { useTranslation } from '../../../../../lib/translations.js';\nimport { useSelector } from 'react-redux';\n" + content1;
content1 = content1.replace(/const MeasurementCard = \([^)]*\) => \{/, "const MeasurementCard = (props) => {\n  const { language } = useSelector(state => state.ui) || { language: 'en' };\n  const { t } = useTranslation(language);");
content1 = content1.replace(/const MeasurementCard = function\([^)]*\) \{/, "const MeasurementCard = function(props) {\n  const { language } = useSelector(state => state.ui) || { language: 'en' };\n  const { t } = useTranslation(language);");
// also match without props
content1 = content1.replace(/const MeasurementCard = \(\[?\{?[^)]*\]?\}?\) => \{/, (match) => match + "\n  const { language } = useSelector(state => state.ui) || { language: 'en' };\n  const { t } = useTranslation(language);");
fs.writeFileSync(file1, content1);

const file2 = 'C:\\\\Users\\\\kjh\\\\Desktop\\\\maqder\\\\frontend\\\\src\\\\pages\\\\khayyat\\\\utils\\\\printStitchingInvoice.js';
let content2 = fs.readFileSync(file2, 'utf8');
if (!content2.includes('const t =')) {
  content2 = "const t = (key) => key;\n" + content2;
  fs.writeFileSync(file2, content2);
}

const file3 = 'C:\\\\Users\\\\kjh\\\\Desktop\\\\maqder\\\\frontend\\\\src\\\\pages\\\\khayyat\\\\utils\\\\saudi.js';
let content3 = fs.readFileSync(file3, 'utf8');
if (!content3.includes('const t =')) {
  content3 = "const t = (key) => key;\n" + content3;
  fs.writeFileSync(file3, content3);
}

console.log('Fixed utility files!');
