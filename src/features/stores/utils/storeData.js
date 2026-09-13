export const normalizeStore = (store = {}) => ({
  id: store.id ?? store.storeId ?? store.storeID ?? store.StoreId,
  storeCode: store.storeCode ?? store.StoreCode ?? '',
  storeName: store.storeName ?? store.StoreName ?? '',
  address: {
    line1: store.address?.line1 ?? store.addressLine1 ?? store.AddressLine1 ?? '',
    line2: store.address?.line2 ?? store.addressLine2 ?? store.AddressLine2 ?? '',
    city: store.address?.city ?? store.city ?? store.City ?? '',
    postalCode: store.address?.postalCode ?? store.postalCode ?? store.PostalCode ?? '',
    country: store.address?.country ?? store.country ?? store.Country ?? '',
  },
  contactNumber: store.contactNumber ?? store.ContactNumber ?? '',
  email: store.email ?? store.Email ?? '',
  isActive: store.isActive ?? store.IsActive ?? false,
  createdAt: store.createdAt ?? store.CreatedAt ?? null,
  updatedAt: store.updatedAt ?? store.UpdatedAt ?? null,
});

export const normalizeStoreList = (payload) => {
  const items = payload?.items || payload?.data || payload?.stores || payload || [];
  const stores = Array.isArray(items) ? items.map(normalizeStore) : [];

  return {
    stores,
    total: payload?.total ?? payload?.totalCount ?? payload?.count ?? stores.length,
    page: payload?.page ?? payload?.pageNumber ?? 1,
    pageSize: payload?.pageSize ?? payload?.limit ?? stores.length,
  };
};

export const toStorePayload = (values) => ({
  storeCode: values.storeCode.trim(),
  storeName: values.storeName.trim(),
  address: {
    line1: values.address.line1.trim(),
    line2: values.address.line2.trim(),
    city: values.address.city.trim(),
    postalCode: values.address.postalCode.trim(),
    country: values.address.country.trim(),
  },
  contactNumber: values.contactNumber.trim(),
  email: values.email.trim(),
  isActive: values.isActive,
});
