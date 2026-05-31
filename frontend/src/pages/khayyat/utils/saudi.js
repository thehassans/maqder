const saudiRiyalFormatter = new Intl.NumberFormat('en-SA', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

export const canonicalSaudiMobile = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';

  let normalized = digits;
  if (normalized.startsWith('00966')) normalized = normalized.slice(5);
  else if (normalized.startsWith('966')) normalized = normalized.slice(3);
  if (normalized.startsWith('0')) normalized = normalized.slice(1);
  if (normalized.length > 9) normalized = normalized.slice(-9);

  return normalized;
};

export const buildSaudiPhoneNeedles = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return [];

  const canonical = canonicalSaudiMobile(digits);
  if (!canonical || canonical.length < 3) return [];

  return Array.from(new Set([
    digits,
    canonical,
    `0${canonical}`,
    `966${canonical}`,
    `+966${canonical}`
  ]));
};

export const normalizeSaudiPhone = (value, { defaultPrefix = true } = {}) => {
  const raw = String(value ?? '').trim();
  const cleaned = raw.replace(/[^\d+]/g, '');

  if (!cleaned) {
    return defaultPrefix ? '+966' : '';
  }

  let digits = cleaned.replace(/\D/g, '');
  if (digits.startsWith('00966')) digits = digits.slice(5);
  else if (digits.startsWith('966')) digits = digits.slice(3);
  else if (digits.startsWith('0')) digits = digits.slice(1);

  if (digits.length > 9) digits = digits.slice(-9);

  if (!digits) {
    return defaultPrefix ? '+966' : '';
  }

  return `+966${digits}`;
};

export const formatSaudiRiyal = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return saudiRiyalFormatter.format(0);
  return saudiRiyalFormatter.format(amount);
};
