// Accept existing local/international formatting without changing the phone number.
export const normalizeMobileNumber = (value = '') => {
  const compact = String(value ?? '').trim().replace(/[\s()-]/g, '');
  if (/^(?:\+94|94)7\d{8}$/.test(compact)) return `0${compact.replace(/^\+?94/, '')}`;
  return compact;
};
export const isMobileNumber = value => /^07\d{8}$/.test(normalizeMobileNumber(value));
export const MOBILE_NUMBER_ERROR = 'Enter a 10-digit mobile number, for example 077-1234567.';
