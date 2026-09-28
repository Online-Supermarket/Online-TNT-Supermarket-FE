export const normalizeSriLankanPhone = (value = '') => {
  const input = value.trim();
  if (/^\+94[0-9]{9}$/.test(input)) return `0${input.slice(3)}`;
  return input;
};
export const isSriLankanPhone = (value) => /^0[0-9]{9}$/.test(normalizeSriLankanPhone(value));
export const isSriLankanNic = (value = '') => /^(?:[0-9]{9}[VvXx]|[0-9]{12})$/.test(value.trim());
export const normalizeVehicleIdentifier = (value = '') => value.trim().replace(/\s+/g, ' ').toUpperCase();
export const isVehicleNumber = (value) => /^[A-Z0-9][A-Z0-9 -]{1,49}$/.test(normalizeVehicleIdentifier(value));
export const isLicenseNumber = (value = '') => /^[A-Za-z0-9][A-Za-z0-9-]{3,49}$/.test(value.trim());
