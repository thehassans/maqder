import mongoose from 'mongoose';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/maqder');
  const Tenant = mongoose.model('Tenant', new mongoose.Schema({ slug: String, businessType: String, businessTypes: [String] }, { strict: false }));
  const res = await Tenant.updateOne(
    { slug: 'sabir-global-travel-solution-company' },
    { $set: { businessType: 'travel_agency', businessTypes: ['travel_agency'] } }
  );
  console.log('Update result:', res);
  process.exit(0);
}

run();
