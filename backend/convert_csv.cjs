const fs = require('fs');
const csv = require('csv-parser');
const results = [];

fs.createReadStream('C:/Users/kjh/Desktop/Brilliantlines/Customer.csv')
  .pipe(csv())
  .on('data', (data) => {
    const cleanData = {};
    for (let key in data) {
      let cleanKey = key.replace(/^\uFEFF/, '').replace(/^"|"$/g, '').trim();
      cleanData[cleanKey] = data[key];
    }
    if (cleanData['Name'] && cleanData['VAT No']) {
      results.push({
        name: cleanData['Name'],
        companyName: cleanData['Company Name'] || cleanData['Name'],
        vat: cleanData['VAT No']
      });
    }
  })
  .on('end', () => {
    fs.writeFileSync('C:/Users/kjh/Desktop/maqder/backend/vat_data.json', JSON.stringify(results, null, 2));
    console.log('Wrote ' + results.length + ' records');
  });
