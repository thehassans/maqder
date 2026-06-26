import crypto from 'crypto';

/**
 * ZATCA UBL 2.1 XML Canonicalization (C14N 1.1) and Invoice Pre-Validation
 *
 * Implements XML Canonicalization per http://www.w3.org/2006/12/xml-c14n11
 * and pre-validation checks required by ZATCA E-Invoicing Phase 2.
 */

/**
 * Canonicalize XML string per C14N 1.1 rules.
 * This is a simplified implementation suitable for ZATCA UBL invoices.
 * For full compliance, use a dedicated library like xml-c14n in production.
 *
 * @param {string} xml - Raw XML string
 * @returns {string} Canonicalized XML
 */
export function canonicalizeXml(xml) {
  if (!xml) return '';

  let result = xml;

  result = result.replace(/<\?xml[^?]*\?>/g, '');

  result = result.replace(/<!--[\s\S]*?-->/g, '');

  result = result.replace(/>\s+</g, '><');

  result = result.replace(/\s+$/g, '');

  result = result.trim();

  result = result.replace(/\s+([a-zA-Z_:][a-zA-Z0-9_:.-]*)="([^"]*)"/g, (match, name, value) => {
    const escaped = escapeXmlValue(value);
    return ` ${name}="${escaped}"`;
  });

  result = result.replace(/&(?!(amp|lt|gt|quot|apos);)/g, '&amp;');
  result = result.replace(/<(?!\/)[^>]+[^/]>|<(?!\/)[^>]+\/>/g, (match) => {
    return match.replace(/\s+>/g, '>');
  });

  return result;
}

function escapeXmlValue(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Compute SHA-256 hash of canonicalized XML.
 * @param {string} xml - Raw or canonicalized XML
 * @returns {string} Base64-encoded hash
 */
export function computeXmlHash(xml) {
  const canonical = canonicalizeXml(xml);
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('base64');
}

/**
 * Validate an invoice object against ZATCA UBL 2.1 requirements before submission.
 *
 * @param {object} invoice - Invoice document or POJO
 * @param {object} tenant - Tenant document with business info
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateInvoiceForZatca(invoice, tenant) {
  const errors = [];
  const warnings = [];

  if (!invoice) {
    errors.push('Invoice is required');
    return { valid: false, errors, warnings };
  }

  if (!tenant) {
    errors.push('Tenant is required');
    return { valid: false, errors, warnings };
  }

  if (!invoice.invoiceNumber || String(invoice.invoiceNumber).trim().length === 0) {
    errors.push('Invoice number is required');
  }

  if (!invoice.issueDate) {
    errors.push('Issue date is required');
  }

  const sellerName = tenant?.business?.legalNameAr || tenant?.business?.legalNameEn || tenant?.name;
  if (!sellerName) {
    errors.push('Seller name (business.legalNameAr or business.legalNameEn) is required');
  }

  const vatNumber = tenant?.business?.vatNumber;
  if (!vatNumber) {
    errors.push('Seller VAT registration number is required');
  } else if (!/^[0-9]{15}$/.test(String(vatNumber))) {
    errors.push('Seller VAT number must be exactly 15 digits');
  }

  if (invoice.lineItems && invoice.lineItems.length > 0) {
    invoice.lineItems.forEach((line, idx) => {
      const lineNum = idx + 1;
      if (!line.productName && !line.name) {
        errors.push(`Line ${lineNum}: item name is required`);
      }
      if (line.quantity == null || Number(line.quantity) <= 0) {
        errors.push(`Line ${lineNum}: quantity must be a positive number`);
      }
      if (line.lineTotal == null || Number(line.lineTotal) < 0) {
        errors.push(`Line ${lineNum}: line total must be a non-negative number`);
      }
      const taxRate = line.taxRate ?? line.vatRate ?? 15;
      if (taxRate < 0 || taxRate > 100) {
        warnings.push(`Line ${lineNum}: tax rate ${taxRate}% is outside typical range (0-100%)`);
      }
    });
  } else {
    errors.push('Invoice must have at least one line item');
  }

  if (invoice.grandTotal == null || Number(invoice.grandTotal) < 0) {
    errors.push('Grand total must be a non-negative number');
  }

  if (invoice.totalTax == null || Number(invoice.totalTax) < 0) {
    errors.push('Total tax must be a non-negative number');
  }

  if (
    Number.isFinite(Number(invoice.grandTotal)) &&
    Number.isFinite(Number(invoice.totalTax)) &&
    Number(invoice.totalTax) > Number(invoice.grandTotal)
  ) {
    errors.push('Total tax cannot exceed grand total');
  }

  const lineItemsSum = (invoice.lineItems || []).reduce(
    (sum, l) => sum + Number(l.lineTotal || 0),
    0
  );
  if (
    Number.isFinite(lineItemsSum) &&
    Number.isFinite(Number(invoice.grandTotal)) &&
    Math.abs(lineItemsSum + Number(invoice.totalTax || 0) - Number(invoice.grandTotal)) > 0.01
  ) {
    warnings.push(
      `Line items sum (${lineItemsSum.toFixed(2)}) + tax (${Number(invoice.totalTax || 0).toFixed(2)}) does not match grand total (${Number(invoice.grandTotal).toFixed(2)})`
    );
  }

  if (!tenant?.zatca?.isOnboarded) {
    errors.push('Tenant is not onboarded for ZATCA Phase 2');
  }

  if (!tenant?.zatca?.productionCsid && tenant?.zatca?.environment === 'production') {
    errors.push('Tenant missing production CSID for production environment');
  }

  if (!tenant?.zatca?.privateKey) {
    errors.push('Tenant missing ECDSA private key for signing');
  }

  if (invoice.zatca?.previousInvoiceHash == null && (invoice.zatca?.icv ?? 0) > 0) {
    warnings.push('Invoice has ICV but no previous invoice hash - chain may be broken');
  }

  const transactionType = invoice.transactionType || 'B2C';
  if (!['B2C', 'B2B'].includes(transactionType)) {
    errors.push(`Invalid transaction type: ${transactionType} (must be B2C or B2B)`);
  }

  if (transactionType === 'B2B') {
    if (!invoice.buyer?.name && !invoice.customerName) {
      errors.push('B2B invoices require buyer name');
    }
    if (!invoice.buyer?.vatNumber && !invoice.customerVatNumber) {
      errors.push('B2B invoices require buyer VAT registration number');
    }
  }

  const currency = invoice.currency || tenant?.settings?.currency || 'SAR';
  if (currency !== 'SAR') {
    warnings.push(`ZATCA requires SAR currency, invoice uses ${currency}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a UBL XML string structure for ZATCA compliance.
 *
 * @param {string} xml - UBL XML string
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateUblXml(xml) {
  const errors = [];

  if (!xml || String(xml).trim().length === 0) {
    errors.push('XML content is empty');
    return { valid: false, errors };
  }

  const requiredElements = [
    { pattern: /<cbc:ProfileID>/, name: 'ProfileID' },
    { pattern: /<cbc:ID>/, name: 'Invoice ID (cbc:ID)' },
    { pattern: /<cbc:IssueDate>/, name: 'IssueDate' },
    { pattern: /<cbc:InvoiceTypeCode>/, name: 'InvoiceTypeCode' },
    { pattern: /<cac:AccountingSupplierParty>/, name: 'AccountingSupplierParty' },
    { pattern: /<cac:AccountingCustomerParty>/, name: 'AccountingCustomerParty' },
    { pattern: /<cac:TaxTotal>/, name: 'TaxTotal' },
    { pattern: /<cac:LegalMonetaryTotal>/, name: 'LegalMonetaryTotal' },
    { pattern: /<cac:InvoiceLine>/, name: 'InvoiceLine' },
  ];

  for (const el of requiredElements) {
    if (!el.pattern.test(xml)) {
      errors.push(`Missing required UBL element: ${el.name}`);
    }
  }

  if (!/<Invoice[^>]*xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"/.test(xml)) {
    errors.push('Missing UBL Invoice namespace');
  }

  if (!/xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"/.test(xml)) {
    errors.push('Missing CAC namespace');
  }

  if (!/xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"/.test(xml)) {
    errors.push('Missing CBC namespace');
  }

  const invoiceTypeMatch = xml.match(/<cbc:InvoiceTypeCode[^>]*>(\d+)<\/cbc:InvoiceTypeCode>/);
  if (invoiceTypeMatch) {
    const typeCode = invoiceTypeMatch[1];
    const validCodes = ['0100000', '0200000', '0300000', '0400000', '0500000', '0600000', '0700000', '0800000'];
    if (!validCodes.includes(typeCode)) {
      errors.push(`Invalid invoice type code: ${typeCode}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Full pre-submission validation combining invoice data and XML checks.
 *
 * @param {object} invoice - Invoice document
 * @param {object} tenant - Tenant document
 * @param {string} [xml] - Optional UBL XML string to validate
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function preSubmissionValidation(invoice, tenant, xml) {
  const invoiceValidation = validateInvoiceForZatca(invoice, tenant);
  const errors = [...invoiceValidation.errors];
  const warnings = [...invoiceValidation.warnings];

  if (xml) {
    const xmlValidation = validateUblXml(xml);
    errors.push(...xmlValidation.errors);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
