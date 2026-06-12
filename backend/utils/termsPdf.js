import { jsPDF } from 'jspdf';

export const generateTermsPdf = async ({ tenantName, billingCleared }) => {
  // Use jsPDF in node
  const doc = new jsPDF();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(26, 61, 40); // Dark Green
  doc.text('Maqder ERP', 105, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('Terms and Conditions', 105, 30, { align: 'center' });

  // Date & Tenant Info
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // Slate 500
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
  doc.text(`Tenant: ${tenantName || 'Customer'}`, 20, 56);

  // Billing Status
  if (billingCleared) {
    doc.setFillColor(220, 252, 231); // Green 100
    doc.rect(20, 65, 170, 15, 'F');
    doc.setTextColor(22, 101, 52); // Green 800
    doc.setFont(undefined, 'bold');
    doc.text('BILLING STATUS: CLEARED', 105, 75, { align: 'center' });
    doc.setFont(undefined, 'normal');
  } else {
    doc.setFillColor(254, 243, 199); // Amber 100
    doc.rect(20, 65, 170, 15, 'F');
    doc.setTextColor(146, 64, 14); // Amber 800
    doc.setFont(undefined, 'bold');
    doc.text('BILLING STATUS: PENDING', 105, 75, { align: 'center' });
    doc.setFont(undefined, 'normal');
  }

  // Terms Content
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  const termsText = `Welcome to Maqder ERP. By using our services, you agree to the following terms:

1. Service Provision: Maqder ERP provides cloud-based enterprise resource planning solutions.
2. Data Privacy: We ensure your business data is encrypted and secure. We do not share your data.
3. Subscription & Billing: 
   - Subscriptions are billed according to your chosen plan.
   - Access may be restricted if payments are overdue.
4. Support: Technical support is provided during normal business hours.
5. Termination: You may terminate your subscription at any time. Data will be retained for 30 days post-termination before deletion.

Thank you for choosing Maqder ERP as your business partner.`;

  const splitText = doc.splitTextToSize(termsText, 170);
  doc.text(splitText, 20, 95);

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('This is a computer-generated document and requires no physical signature.', 105, 280, { align: 'center' });

  // Convert to Buffer
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
};
