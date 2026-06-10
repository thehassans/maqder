/**
 * ZATCA Phase 2 Simplified Tax Invoice UBL 2.1 Builder
 * This creates a canonical UBL 2.1 XML string ready for hashing.
 */

export function buildB2CInvoiceXml(invoice, tenant) {
  // Extract data
  const invoiceId = invoice.invoiceNumber || invoice._id || 'INV-0001';
  const uuid = invoice.uuid || '00000000-0000-0000-0000-000000000000'; // UUID is required for Phase 2
  
  // Format dates
  const issueDate = new Date(invoice.createdAt || new Date());
  const dateStr = issueDate.toISOString().split('T')[0];
  const timeStr = issueDate.toISOString().split('T')[1].split('.')[0];
  
  // ICV and PIH
  const icv = invoice.zatca?.icv || 1;
  const pih = invoice.zatca?.pih || 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjZTllMzEwNjI2MzRiMjEzMWE1YTMzNzRkZjRmNmQyZThlMQ=='; // Default base64 hash if first invoice

  const sellerName = tenant?.business?.legalNameAr || tenant?.business?.legalNameEn || tenant?.name || 'Seller Name';
  const sellerVat = tenant?.business?.vatNumber || '300000000000003';
  const sellerAddress = tenant?.business?.address || {};
  
  // Totals
  const totalAmountWithoutVat = Number(invoice.subTotal || 0).toFixed(2);
  const totalVatAmount = Number(invoice.totalVat || 0).toFixed(2);
  const grandTotal = Number(invoice.grandTotal || 0).toFixed(2);

  // We use simple string concatenation to ensure canonicalization is predictable.
  // In a full production app with B2B, a proper XML builder would be used, but for B2C offline
  // where we just need to hash exactly what we send, building it exactly as a string ensures
  // the hash calculated offline precisely matches what the backend forwards.

  let xml = \`<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
    <ext:UBLExtensions>
        <ext:UBLExtension>
            <ext:ExtensionURI>urn:oasis:names:specification:ubl:dsig:enveloped:xades</ext:ExtensionURI>
            <ext:ExtensionContent>
                <!-- Cryptographic Stamp will be injected here during signing -->
                <sig:UBLDocumentSignatures xmlns:sig="urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2" xmlns:sac="urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2" xmlns:sbc="urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2">
                    <sac:SignatureInformation>
                        <cbc:ID>urn:oasis:names:specification:ubl:signature:1</cbc:ID>
                        <sbc:ReferencedSignatureID>urn:oasis:names:specification:ubl:signature:Invoice</sbc:ReferencedSignatureID>
                    </sac:SignatureInformation>
                </sig:UBLDocumentSignatures>
            </ext:ExtensionContent>
        </ext:UBLExtension>
    </ext:UBLExtensions>
    <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
    <cbc:ID>\${invoiceId}</cbc:ID>
    <cbc:UUID>\${uuid}</cbc:UUID>
    <cbc:IssueDate>\${dateStr}</cbc:IssueDate>
    <cbc:IssueTime>\${timeStr}</cbc:IssueTime>
    <cbc:InvoiceTypeCode name="0211010">388</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
    <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>
    <cac:AdditionalDocumentReference>
        <cbc:ID>ICV</cbc:ID>
        <cbc:UUID>\${icv}</cbc:UUID>
    </cac:AdditionalDocumentReference>
    <cac:AdditionalDocumentReference>
        <cbc:ID>PIH</cbc:ID>
        <cac:Attachment>
            <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">\${pih}</cbc:EmbeddedDocumentBinaryObject>
        </cac:Attachment>
    </cac:AdditionalDocumentReference>
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="CRN">\${tenant?.business?.crNumber || '1010010000'}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PostalAddress>
                <cbc:StreetName>\${sellerAddress.street || 'Street'}</cbc:StreetName>
                <cbc:BuildingNumber>\${sellerAddress.buildingNumber || '1234'}</cbc:BuildingNumber>
                <cbc:CitySubdivisionName>\${sellerAddress.district || 'District'}</cbc:CitySubdivisionName>
                <cbc:CityName>\${sellerAddress.city || 'Riyadh'}</cbc:CityName>
                <cbc:PostalZone>\${sellerAddress.postalCode || '12345'}</cbc:PostalZone>
                <cac:Country>
                    <cbc:IdentificationCode>SA</cbc:IdentificationCode>
                </cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>\${sellerVat}</cbc:CompanyID>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>\${sellerName}</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PostalAddress>
                <cac:Country>
                    <cbc:IdentificationCode>SA</cbc:IdentificationCode>
                </cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>\${invoice.customerName || 'Cash Customer'}</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingCustomerParty>
    <cac:Delivery>
        <cbc:ActualDeliveryDate>\${dateStr}</cbc:ActualDeliveryDate>
    </cac:Delivery>
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="SAR">\${totalVatAmount}</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="SAR">\${totalAmountWithoutVat}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="SAR">\${totalVatAmount}</cbc:TaxAmount>
            <cac:TaxCategory>
                <cbc:ID schemeAgencyID="6" schemeID="UN/ECE 5305">S</cbc:ID>
                <cbc:Percent>15.00</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID schemeAgencyID="6" schemeID="UN/ECE 5153">VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="SAR">\${totalAmountWithoutVat}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="SAR">\${totalAmountWithoutVat}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="SAR">\${grandTotal}</cbc:TaxInclusiveAmount>
        <cbc:AllowanceTotalAmount currencyID="SAR">0.00</cbc:AllowanceTotalAmount>
        <cbc:PrepaidAmount currencyID="SAR">0.00</cbc:PrepaidAmount>
        <cbc:PayableAmount currencyID="SAR">\${grandTotal}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
\`;

  // Add invoice lines
  let lines = invoice.items || [];
  if (lines.length === 0 && invoice.services) lines = invoice.services; // fallback for saloon/laundry models
  
  lines.forEach((line, index) => {
    const lineQty = line.quantity || 1;
    const linePrice = Number(line.price || 0).toFixed(2);
    const lineTotal = (lineQty * linePrice).toFixed(2);
    const lineVat = (lineTotal * 0.15).toFixed(2); // Assuming 15% standard
    
    xml += \`    <cac:InvoiceLine>
        <cbc:ID>\${index + 1}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="PCE">\${lineQty}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="SAR">\${lineTotal}</cbc:LineExtensionAmount>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="SAR">\${lineVat}</cbc:TaxAmount>
            <cbc:RoundingAmount currencyID="SAR">\${(Number(lineTotal) + Number(lineVat)).toFixed(2)}</cbc:RoundingAmount>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Name>\${line.name || line.description || 'Item'}</cbc:Name>
            <cac:ClassifiedTaxCategory>
                <cbc:ID schemeAgencyID="6" schemeID="UN/ECE 5305">S</cbc:ID>
                <cbc:Percent>15.00</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID schemeAgencyID="6" schemeID="UN/ECE 5153">VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:ClassifiedTaxCategory>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="SAR">\${linePrice}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>
\`;
  });

  xml += \`</Invoice>\`;

  // Remove empty lines and leading/trailing spaces for basic canonicalization
  // ZATCA hashing is sensitive to spaces and carriage returns
  return xml.replace(/>\\s+</g, '><').trim();
}
