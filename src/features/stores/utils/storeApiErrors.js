export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to manage stores.';
  if (status === 500) return 'The Store service is unavailable. Please try again shortly.';
  if (typeof data === 'string') return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;
  return fallback;
};

export const getValidationErrors = (error) => {
  const data = error?.response?.data;
  const errors = data?.errors || data?.validationErrors || {};

  if (Array.isArray(errors)) {
    return errors.reduce((acc, item) => {
      const field = item.field || item.propertyName || item.name;
      const message = item.message || item.errorMessage || item;
      if (field) acc[field] = message;
      return acc;
    }, {});
  }

  return Object.entries(errors).reduce((acc, [key, value]) => {
    acc[key] = Array.isArray(value) ? value.join(' ') : value;
    return acc;
  }, {});
};
