const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'مستهدفات ومنجزات الهيئة عن العام المالي 24-25 نهائي.xlsx');
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);

console.log(JSON.stringify(data, null, 2));
