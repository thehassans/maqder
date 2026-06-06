import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SaloonService from './backend/models/SaloonService.js';

dotenv.config({ path: './backend/.env' });

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/maqder').then(async () => {
  const services = await SaloonService.find({});
  console.log('Total services:', services.length);
  if (services.length > 0) {
    console.log(services[0]);
  }
  mongoose.disconnect();
}).catch(console.error);
