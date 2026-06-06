import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(process.cwd(), '.env.production') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://hassansarwar2112_db_user:GvozITy6hCKgrIH4@maqder.se7slkz.mongodb.net/zatca-erp?retryWrites=true&w=majority&appName=Maqder";

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB for VAT recovery...');

    // First, try to recover using raw DB collection since Mongoose might hide 'taxNumber'
    const db = mongoose.connection.db;
    const customersCollection = db.collection('customers');
    
    // Find all customers that have taxNumber but missing or empty vatNumber
    const customersWithTaxNum = await customersCollection.find({
      taxNumber: { $exists: true, $ne: '' },
      $or: [
        { vatNumber: { $exists: false } },
        { vatNumber: '' },
        { vatNumber: null }
      ]
    }).toArray();

    let directFixedCount = 0;
    for (const c of customersWithTaxNum) {
      await customersCollection.updateOne(
        { _id: c._id },
        { $set: { vatNumber: c.taxNumber } }
      );
      directFixedCount++;
    }
    
    console.log(`Directly recovered VAT numbers for ${directFixedCount} customers from hidden 'taxNumber' field.`);

    // Then, for any remaining customers, fall back to extracting from invoices
    const customers = await Customer.find({ vatNumber: { $in: [null, '', undefined] } });
    console.log(`Found ${customers.length} remaining customers with missing VAT numbers. Attempting invoice fallback...`);

    let fallbackFixedCount = 0;

    for (const customer of customers) {
      const invoice = await Invoice.findOne({
        customerId: customer._id,
        'buyer.vatNumber': { $exists: true, $ne: '' }
      }).select('buyer.vatNumber');

      if (invoice && invoice.buyer && invoice.buyer.vatNumber) {
        customer.vatNumber = invoice.buyer.vatNumber;
        await customer.save();
        fallbackFixedCount++;
        console.log(`Recovered VAT ${customer.vatNumber} from invoice for customer ${customer.name}`);
      }
    }

    console.log(`\nSuccessfully recovered VAT numbers for ${directFixedCount + fallbackFixedCount} customers in total!`);
    process.exit(0);
  } catch (err) {
    console.error('Error recovering VAT numbers:', err);
    process.exit(1);
  }
}

run();
