import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const result = await mongoose.connection.collection('tenants').updateOne(
    { slug: 'maqder-saloon' },
    { $set: { businessType: 'saloon', businessTypes: ['saloon'] } }
  );
  
  console.log('Update result:', result);
  process.exit(0);
}

run();
