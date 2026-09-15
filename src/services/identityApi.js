import api, { API_BASE_URL } from './api';

// Compatibility export for existing imports. Authentication now uses the same
// Gateway client and token/error handling as every other API call.
const IDENTITY_API_URL = API_BASE_URL;
const identityApi = api;

export { IDENTITY_API_URL };
export default identityApi;
