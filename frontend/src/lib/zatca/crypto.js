import { ec as EC } from 'elliptic';
import { sha256 } from 'js-sha256';

const ec = new EC('secp256k1');

/**
 * Parses a PEM formatted private key to a hex string suitable for elliptic.
 */
function parsePemToHex(pem) {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/-----BEGIN EC PRIVATE KEY-----/g, '')
    .replace(/-----END EC PRIVATE KEY-----/g, '')
    .replace(/\\s/g, ''); // remove newlines and spaces

  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Very rudimentary ASN.1 parsing to extract the 32-byte secp256k1 private key.
  // In a production environment, you should use an ASN.1 parser or node-forge.
  // We'll extract the last 32 bytes which usually contain the raw key in SEC1 EC private key format.
  // A robust implementation should properly parse PKCS#8 or SEC1.
  
  // For simplicity and assuming standard OpenSSL output for secp256k1:
  // The private key is exactly 32 bytes.
  let keyBytes;
  
  // Search for the OCTET STRING tag (0x04) followed by length 32 (0x20)
  for (let i = 0; i < bytes.length - 33; i++) {
    if (bytes[i] === 0x04 && bytes[i+1] === 0x20) {
      keyBytes = bytes.slice(i + 2, i + 34);
      break;
    }
  }

  // Fallback if rudimentary parse fails
  if (!keyBytes) {
      // Just take the last 32 bytes (often works for standard EC keys if no public key is appended)
      keyBytes = bytes.slice(bytes.length - 32);
  }

  return Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Computes the SHA-256 hash of a string and returns it as Base64.
 * @param {string} text - The XML or text to hash.
 * @returns {string} - Base64 encoded SHA-256 hash.
 */
export function hashXml(text) {
  const hashHex = sha256(text);
  const hashBytes = new Uint8Array(hashHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  return btoa(String.fromCharCode.apply(null, hashBytes));
}

/**
 * Signs a base64 hash using the provided private key PEM.
 * @param {string} hashBase64 - The base64 hash of the XML.
 * @param {string} privateKeyPem - The tenant's private key in PEM format.
 * @returns {string} - Base64 encoded ECDSA signature.
 */
export function signHash(hashBase64, privateKeyPem) {
  if (!privateKeyPem) throw new Error('Private key is required for signing.');

  const privKeyHex = parsePemToHex(privateKeyPem);
  const keyPair = ec.keyFromPrivate(privKeyHex, 'hex');

  const binaryHash = atob(hashBase64);
  const hashBytes = new Uint8Array(binaryHash.length);
  for (let i = 0; i < binaryHash.length; i++) {
    hashBytes[i] = binaryHash.charCodeAt(i);
  }

  // Sign
  const signature = keyPair.sign(hashBytes);
  const r = signature.r.toArrayLike(Uint8Array, 'be', 32);
  const s = signature.s.toArrayLike(Uint8Array, 'be', 32);
  
  // ZATCA requires raw ECDSA signature (r + s) for the QR code Tag 7
  // So we concat R and S arrays directly (64 bytes total).
  const rawSignature = new Uint8Array(64);
  rawSignature.set(r, 0);
  rawSignature.set(s, 32);

  return btoa(String.fromCharCode.apply(null, rawSignature));
}

/**
 * Extracts the ECDSA Public Key from a Private Key PEM.
 * @param {string} privateKeyPem 
 * @returns {string} - Base64 encoded uncompressed public key.
 */
export function getPublicKeyFromPem(privateKeyPem) {
  const privKeyHex = parsePemToHex(privateKeyPem);
  const keyPair = ec.keyFromPrivate(privKeyHex, 'hex');
  const pubPoint = keyPair.getPublic();
  const x = pubPoint.getX().toArrayLike(Uint8Array, 'be', 32);
  const y = pubPoint.getY().toArrayLike(Uint8Array, 'be', 32);
  
  // Uncompressed public key format: 0x04 + X + Y
  const pubKeyBytes = new Uint8Array(65);
  pubKeyBytes[0] = 0x04;
  pubKeyBytes.set(x, 1);
  pubKeyBytes.set(y, 33);
  
  return btoa(String.fromCharCode.apply(null, pubKeyBytes));
}

/**
 * Helper to encode TLV (Tag-Length-Value)
 */
function encodeTLV(tag, valueBytes) {
  const length = valueBytes.length;
  if (length > 255) throw new Error(\`TLV Tag \${tag} value is too long (\${length} bytes)\`);
  
  const buffer = new Uint8Array(2 + length);
  buffer[0] = tag;
  buffer[1] = length;
  buffer.set(valueBytes, 2);
  return buffer;
}

/**
 * Generates the full Phase 2 TLV QR Code (Tags 1-9)
 */
export function generatePhase2Qr({
  sellerName,
  vatNumber,
  invoiceDate,
  totalAmount,
  vatAmount,
  xmlHashBase64,
  signatureBase64,
  publicKeyBase64,
  certificateSignatureBase64
}) {
  const encoder = new TextEncoder();
  
  const t1 = encodeTLV(1, encoder.encode(sellerName));
  const t2 = encodeTLV(2, encoder.encode(vatNumber));
  
  // Timestamp formatting
  const timestamp = invoiceDate instanceof Date 
    ? invoiceDate.toISOString() 
    : new Date(invoiceDate).toISOString();
  const t3 = encodeTLV(3, encoder.encode(timestamp));
  
  const t4 = encodeTLV(4, encoder.encode(Number(totalAmount).toFixed(2)));
  const t5 = encodeTLV(5, encoder.encode(Number(vatAmount).toFixed(2)));
  
  // Tag 6: Hash
  const hashBytes = Uint8Array.from(atob(xmlHashBase64), c => c.charCodeAt(0));
  const t6 = encodeTLV(6, hashBytes);
  
  // Tag 7: Signature
  const sigBytes = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));
  const t7 = encodeTLV(7, sigBytes);
  
  // Tag 8: Public Key
  const pubBytes = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
  const t8 = encodeTLV(8, pubBytes);

  // Tag 9: Certificate Signature (if provided, else omit or use empty for Phase 1 testing)
  let t9 = new Uint8Array(0);
  if (certificateSignatureBase64) {
    const certSigBytes = Uint8Array.from(atob(certificateSignatureBase64), c => c.charCodeAt(0));
    t9 = encodeTLV(9, certSigBytes);
  }

  // Concat all tags
  const totalLength = t1.length + t2.length + t3.length + t4.length + t5.length + t6.length + t7.length + t8.length + t9.length;
  const qrBytes = new Uint8Array(totalLength);
  
  let offset = 0;
  qrBytes.set(t1, offset); offset += t1.length;
  qrBytes.set(t2, offset); offset += t2.length;
  qrBytes.set(t3, offset); offset += t3.length;
  qrBytes.set(t4, offset); offset += t4.length;
  qrBytes.set(t5, offset); offset += t5.length;
  qrBytes.set(t6, offset); offset += t6.length;
  qrBytes.set(t7, offset); offset += t7.length;
  qrBytes.set(t8, offset); offset += t8.length;
  qrBytes.set(t9, offset); offset += t9.length;
  
  return btoa(String.fromCharCode.apply(null, qrBytes));
}
