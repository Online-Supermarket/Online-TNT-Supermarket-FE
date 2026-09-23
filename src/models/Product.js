/**
 * Product data model specification
 * Matches catalog.products PostgreSQL table:
 * - id: UUID (string)
 * - sku: string (required, unique)
 * - name: string (required)
 * - description: string | null (optional)
 * - price: number (required, >= 0)
 * - stockQuantity / stock_quantity: number (required, >= 0)
 * - active: boolean (default: true)
 * - category: { id: string, name: string }
 * - categoryId / category_id: UUID (string)
 *
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} sku
 * @property {string} name
 * @property {string|null} description
 * @property {number} price
 * @property {number} stockQuantity
 * @property {boolean} available
 * @property {boolean} active
 * @property {{ id: string, name: string }} category
 * @property {string} categoryId
 * @property {string|null} [imageUrl]
 * @property {string|null} [image_url]
 */

/**
 * Supermarket product SVG placeholder for empty or broken image URLs.
 */
export const PRODUCT_PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' width='400' height='300'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23f0fdf4'/%3E%3Cstop offset='100%25' stop-color='%23dcfce7'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23bg)'/%3E%3Cg fill='none' stroke='%2315803d' stroke-width='6' stroke-linecap='round' stroke-linejoin='round' transform='translate(150, 95) scale(4.2)'%3E%3Cpath d='M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z'/%3E%3Cline x1='3' y1='6' x2='21' y2='6'/%3E%3Cpath d='M16 10a4 4 0 0 1-8 0'/%3E%3C/g%3E%3Ctext x='200' y='235' font-family='sans-serif' font-size='16' font-weight='600' fill='%2315803d' text-anchor='middle'%3ETNT Supermarket%3C/text%3E%3C/svg%3E";

/**
 * Normalizes backend product payload (supporting both camelCase and snake_case)
 * @param {any} raw
 * @returns {Product}
 */
export function normalizeProduct(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      sku: '',
      name: '',
      description: null,
      price: 0,
      stockQuantity: 0,
      available: false,
      active: true,
      category: { id: '', name: 'Uncategorized' },
      categoryId: '',
      imageUrl: null,
      image_url: null,
    };
  }

  const categoryObj = raw.category && typeof raw.category === 'object'
    ? { id: String(raw.category.id || ''), name: String(raw.category.name || 'Uncategorized') }
    : { id: String(raw.categoryId || raw.category_id || ''), name: 'Uncategorized' };

  const categoryId = categoryObj.id || String(raw.categoryId || raw.category_id || '');

  const stockQuantity = Number(raw.stockQuantity ?? raw.stock_quantity ?? 0);
  const imageUrl = raw.imageUrl || raw.image_url || null;
  const reorderLevel = Number(raw.reorderLevel ?? raw.reorder_level ?? 10);
  const targetStockLevel = Number(raw.targetStockLevel ?? raw.target_stock_level ?? 50);
  const lastRestockedAt = raw.lastRestockedAt || raw.last_restocked_at || null;

  return {
    id: String(raw.id || ''),
    sku: String(raw.sku || '').trim(),
    name: String(raw.name || '').trim(),
    description: raw.description ? String(raw.description).trim() : null,
    price: Number(raw.price || 0),
    stockQuantity,
    available: typeof raw.available === 'boolean' ? raw.available : stockQuantity > 0,
    active: typeof raw.active === 'boolean' ? raw.active : true,
    category: categoryObj,
    categoryId,
    imageUrl: imageUrl ? String(imageUrl).trim() : null,
    image_url: imageUrl ? String(imageUrl).trim() : null,
    reorderLevel,
    targetStockLevel,
    lastRestockedAt,
  };
}

/**
 * Validates product input fields before creation or update.
 * @param {{ sku?: string, name?: string, description?: string, price?: number|string, stockQuantity?: number|string, categoryId?: string, imageUrl?: string }} input
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export function validateProductInput(input) {
  const errors = {};

  const sku = (input?.sku || '').trim();
  if (!sku) {
    errors.sku = 'SKU is required.';
  } else if (sku.length > 50) {
    errors.sku = 'SKU cannot exceed 50 characters.';
  }

  const name = (input?.name || '').trim();
  if (!name) {
    errors.name = 'Product name is required.';
  } else if (name.length > 100) {
    errors.name = 'Product name cannot exceed 100 characters.';
  }

  const description = (input?.description || '').trim();
  if (description.length > 500) {
    errors.description = 'Description cannot exceed 500 characters.';
  }

  const priceNum = Number(input?.price);
  if (input?.price === undefined || input?.price === '' || isNaN(priceNum)) {
    errors.price = 'Price is required and must be a valid number.';
  } else if (priceNum < 0) {
    errors.price = 'Price cannot be negative.';
  }

  const stockNum = Number(input?.stockQuantity);
  if (input?.stockQuantity === undefined || input?.stockQuantity === '' || isNaN(stockNum)) {
    errors.stockQuantity = 'Stock quantity is required.';
  } else if (stockNum < 0 || !Number.isInteger(stockNum)) {
    errors.stockQuantity = 'Stock quantity must be a non-negative whole integer.';
  }

  const categoryId = (input?.categoryId || '').trim();
  if (!categoryId) {
    errors.categoryId = 'Please select a product category.';
  }

  const imageUrl = (input?.imageUrl || input?.image_url || '').trim();
  if (imageUrl) {
    if (imageUrl.length > 2000) {
      errors.imageUrl = 'Image URL cannot exceed 2000 characters.';
    } else {
      try {
        const parsed = new URL(imageUrl);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          errors.imageUrl = 'Image URL must use http:// or https://';
        }
      } catch {
        errors.imageUrl = 'Please enter a valid URL (e.g. https://example.com/item.jpg).';
      }
    }
  }

  if (input?.reorderLevel !== undefined && input?.reorderLevel !== '') {
    const reorderNum = Number(input.reorderLevel);
    if (isNaN(reorderNum) || reorderNum < 0 || !Number.isInteger(reorderNum)) {
      errors.reorderLevel = 'Reorder level must be a non-negative integer.';
    }
  }

  if (input?.targetStockLevel !== undefined && input?.targetStockLevel !== '') {
    const targetNum = Number(input.targetStockLevel);
    const reorderNum = Number(input.reorderLevel ?? 10);
    if (isNaN(targetNum) || targetNum < 0 || !Number.isInteger(targetNum)) {
      errors.targetStockLevel = 'Target stock level must be a non-negative integer.';
    } else if (targetNum <= reorderNum) {
      errors.targetStockLevel = 'Target stock level must be greater than reorder level.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
