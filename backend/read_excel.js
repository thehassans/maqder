import xlsx from 'xlsx';

const workbook = xlsx.readFile('../saudi-supermarket-data/SA-عينة-منتجات-السوبرماركت.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

console.log("Headers:", data[0]);
console.log("Row 1:", data[1]);
console.log("Row 2:", data[2]);
