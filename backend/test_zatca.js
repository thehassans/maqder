import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from './models/Invoice.js';
import Tenant from './models/Tenant.js';
import ZatcaService from './utils/zatca/ZatcaService.js';

dotenv.config({ path: './.env' });
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/zatca-erp');

const run = async () => {
  const tenant = await Tenant.findOne();
  
  const offlineInvoice = {
    offlineId: 'uuid-1234',
    lineItems: [{
      lineNumber: 1,
      productId: new mongoose.Types.ObjectId(),
      productName: 'FLAG SIGN HERE',
      quantity: 1,
      unitPrice: 9.00,
      taxRate: 15,
      taxAmount: 1.17,
      lineTotal: 7.83,
      lineTotalWithTax: 9.00,
      taxCategory: 'S'
    }],
    subtotal: 7.83,
    totalTax: 1.17,
    grandTotal: 9.00,
    paymentMethod: 'cash',
    issueDate: new Date().toISOString()
  };
  
  try {
    const newInvoice = new Invoice({
      ...offlineInvoice,
      tenantId: tenant._id,
      flow: 'sell',
      businessContext: 'bakala',
      transactionType: 'B2C',
      invoiceTypeCode: '0200000',
      status: 'pending',
      createdBy: new mongoose.Types.ObjectId(),
    });

    if (!newInvoice.invoiceNumber) {
      const lastInvoice = await Invoice.findOne({ tenantId: tenant._id, invoiceNumber: { $regex: '^BAKALA-' } })
        .sort({ createdAt: -1 })
        .select('invoiceNumber');
      
      let seq = 1;
      if (lastInvoice && lastInvoice.invoiceNumber) {
        const parts = lastInvoice.invoiceNumber.split('-');
        const lastSeq = parseInt(parts[1], 10);
        if (!isNaN(lastSeq)) seq = lastSeq + 1;
      }
      newInvoice.invoiceNumber = 'BAKALA-' + seq;
    }

    const zatcaConfig = tenant.zatca || {};
    if (zatcaConfig.isOnboarded && zatcaConfig.privateKey) {
      const zatcaService = new ZatcaService({
        privateKey: zatcaConfig.privateKey,
        certificate: zatcaConfig.certificateSerialNumber,
        csid: zatcaConfig.productionCsid || zatcaConfig.complianceCsid,
        previousInvoiceHash: zatcaConfig.lastInvoiceHash
      });
      const processed = await zatcaService.processInvoice(
        newInvoice.toObject(),
        tenant.business,
        true
      );
      newInvoice.zatca = {
        ...processed,
        submissionStatus: 'pending'
      };
    }

    await newInvoice.save();
    console.log('Saved successfully!');
  } catch(e) {
    console.error('Error processing invoice:', e);
  }
  process.exit();
};
run();
