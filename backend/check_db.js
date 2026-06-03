import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({path: path.resolve(process.cwd(), '../.env')});
dotenv.config({path: path.resolve(process.cwd(), '.env')});

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zatca-erp';
console.log('Connecting to:', uri);
mongoose.connect(uri).then(async () => {
  const admin = mongoose.connection.db.admin();
  const dbs = await admin.listDatabases();
  console.log('Databases:', dbs.databases.map(d => d.name).join(', '));
  
  for (const db of ['zatca-erp', 'maqder', 'test']) {
    try {
        const dbConn = mongoose.connection.useDb(db);
        const count = await dbConn.collection('bakalaproducts').countDocuments();
        console.log(`bakalaproducts count in ${db}:`, count);
        if(count > 0) {
            const sample = await dbConn.collection('bakalaproducts').findOne({});
            console.log('Sample product tenantId:', sample.tenantId);
        }
    } catch(e) {}
  }

  const maqderDb = mongoose.connection.useDb('zatca-erp');
  const userCount = await maqderDb.collection('users').countDocuments();
  console.log('Users in zatca-erp:', userCount);
  const user = await maqderDb.collection('users').findOne({});
  console.log('First user tenantId:', user?.tenantId);
  const tenant = await maqderDb.collection('tenants').findOne({_id: user?.tenantId});
  console.log('First user tenant businessTypes:', tenant?.businessTypes);
  
  mongoose.disconnect();
}).catch(console.error);
