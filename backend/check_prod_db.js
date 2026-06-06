import mongoose from 'mongoose';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

const MONGODB_URI = "mongodb+srv://hassansarwar2112_db_user:GvozITy6hCKgrIH4@maqder.se7slkz.mongodb.net/zatca-erp?retryWrites=true&w=majority&appName=Maqder";

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to Prod DB');
    
    // We can do raw db queries to see if taxNumber exists
    const db = mongoose.connection.db;
    const c1 = await db.collection('customers').findOne({ taxNumber: { $exists: true, $ne: '' } });
    console.log('taxNumber in any customer:', c1 ? c1.taxNumber : null);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
