import mongoose from 'mongoose';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import dotenv from 'dotenv';

// Load production environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.production') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

import Customer from '../models/Customer.js';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://hassansarwar2112_db_user:GvozITy6hCKgrIH4@maqder.se7slkz.mongodb.net/zatca-erp?retryWrites=true&w=majority&appName=Maqder";
const CSV_PATH = 'C:\\Users\\kjh\\Desktop\\Brilliantlines\\Customer.csv';

async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    if (!fs.existsSync(filePath)) {
      console.log(`File missing: ${filePath}`);
      return resolve([]);
    }
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        const cleanData = {};
        for (let key in data) {
          let cleanKey = key.replace(/^\uFEFF/, '').replace(/^"|"$/g, '').trim();
          cleanData[cleanKey] = data[key];
        }
        results.push(cleanData);
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

async function run() {
  try {
    console.log('Connecting to Production Database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    console.log(`Reading CSV from ${CSV_PATH}...`);
    const customersData = await readCSV(CSV_PATH);
    console.log(`Found ${customersData.length} records in CSV.`);

    let fixedCount = 0;
    const bulkUpdates = [];

    for (const row of customersData) {
      if (!row['Name']) continue;
      
      const vatNumber = row['VAT No'] || '';
      if (!vatNumber) continue;

      const companyName = row['Company Name'] || row['Name'];

      // Find customer by name or companyName
      const customer = await Customer.findOne({
        $or: [
          { name: companyName },
          { name: row['Name'] }
        ]
      });

      if (customer) {
        if (customer.vatNumber !== vatNumber) {
          bulkUpdates.push({
            updateOne: {
              filter: { _id: customer._id },
              update: { $set: { vatNumber: vatNumber } }
            }
          });
          fixedCount++;
        }
      }
    }

    if (bulkUpdates.length > 0) {
      console.log(`Applying ${bulkUpdates.length} VAT updates to the database...`);
      await Customer.bulkWrite(bulkUpdates);
      console.log(`Successfully fixed VAT for ${fixedCount} customers!`);
    } else {
      console.log('No missing VAT numbers found to update.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

run();
