// Saudi National ID / Iqama validation.
//
// Rules (as published by MOI / Absher):
//  - Exactly 10 digits.
//  - First digit determines type:
//      1 → Saudi National ID
//      2 → Iqama (Resident Identity)
//  - Luhn-style checksum: double every digit at an ODD position (1st, 3rd, ...),
//    split into digits, sum, and require the grand total to be divisible by 10.

export const SAUDI_ID_LENGTH = 10;

export function normalizeSaudiId(raw) {
  if (raw == null) return '';
  return String(raw).replace(/\D+/g, '');
}

export function getSaudiIdType(raw) {
  const id = normalizeSaudiId(raw);
  if (id.length !== SAUDI_ID_LENGTH) return null;
  if (id.startsWith('1')) return 'national_id';
  if (id.startsWith('2')) return 'iqama';
  return null;
}

export function validateSaudiIdChecksum(raw) {
  const id = normalizeSaudiId(raw);
  if (id.length !== SAUDI_ID_LENGTH) return false;
  if (!/^[12]/.test(id)) return false;

  let sum = 0;
  for (let i = 0; i < SAUDI_ID_LENGTH; i += 1) {
    let digit = Number(id[i]);
    if (Number.isNaN(digit)) return false;
    // Odd-indexed (1st, 3rd, ... in 1-based) → double and split.
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  return sum % 10 === 0;
}

export function describeSaudiId(raw) {
  const id = normalizeSaudiId(raw);
  const type = getSaudiIdType(id);
  const valid = validateSaudiIdChecksum(id);
  return {
    value: id,
    type,
    isSaudi: type === 'national_id',
    isIqama: type === 'iqama',
    valid,
  };
}

export default {
  SAUDI_ID_LENGTH,
  normalizeSaudiId,
  getSaudiIdType,
  validateSaudiIdChecksum,
  describeSaudiId,
};
