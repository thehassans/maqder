const { MongoClient } = require('mongodb');
async function run() {
  const client = new MongoClient('mongodb+srv://hussainqadeer5050_db_user:J3QrTrKg5R8e2g@maqder.y0e2lgm.mongodb.net/?appName=MAQDER');
  await client.connect();
  const db = client.db('test');
  
  const c1 = await db.collection('customers').findOne({ taxNumber: { $exists: true, $ne: '' } });
  console.log('taxNumber:', c1 ? c1.taxNumber : null);
  
  const c2 = await db.collection('customers').findOne({ vatNumber: { $exists: true, $ne: '' } });
  console.log('vatNumber:', c2 ? c2.vatNumber : null);
  
  await client.close();
}
run().catch(console.dir);
