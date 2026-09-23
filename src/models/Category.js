/**
 * Category data model specification
 * Matches catalog.categories PostgreSQL table:
 * - id: UUID (string)
 * - name: string (required, unique)
 * - description: string | null (optional)
 * - imageUrl / image_url: string | null (optional)
 *
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} name
 * @property {string|null} [description]
 * @property {string|null} [imageUrl]
 * @property {string|null} [image_url]
 */

/**
 * Supermarket category SVG placeholder for empty or broken image URLs.
 */
export const CATEGORY_PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' width='400' height='300'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23e6f4ea'/%3E%3Cstop offset='100%25' stop-color='%23ceead6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23bg)'/%3E%3Cg fill='none' stroke='%23137333' stroke-width='6' stroke-linecap='round' stroke-linejoin='round' transform='translate(150, 95) scale(4.2)'%3E%3Cpath d='M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z'/%3E%3Cline x1='3' y1='6' x2='21' y2='6'/%3E%3Cpath d='M16 10a4 4 0 0 1-8 0'/%3E%3C/g%3E%3Ctext x='200' y='235' font-family='sans-serif' font-size='16' font-weight='600' fill='%23137333' text-anchor='middle'%3ETNT Supermarket%3C/text%3E%3C/svg%3E";

/**
 * Normalizes backend category payload (supporting both camelCase and snake_case)
 * @param {any} raw
 * @returns {Category}
 */
export function normalizeCategory(raw) {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      name: '',
      description: null,
      imageUrl: null,
      image_url: null,
    };
  }

  const imageUrl = raw.imageUrl || raw.image_url || null;

  return {
    id: String(raw.id || ''),
    name: String(raw.name || '').trim(),
    description: raw.description ? String(raw.description).trim() : null,
    imageUrl: imageUrl ? String(imageUrl).trim() : null,
    image_url: imageUrl ? String(imageUrl).trim() : null,
  };
}

/**
 * Validates a category input object before creation or update.
 * @param {{ name?: string, description?: string, imageUrl?: string, image_url?: string }} input
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export function validateCategoryInput(input) {
  const errors = {};

  const name = (input?.name || '').trim();
  if (!name) {
    errors.name = 'Category name is required.';
  } else if (name.length > 100) {
    errors.name = 'Category name cannot exceed 100 characters.';
  }

  const description = (input?.description || '').trim();
  if (description.length > 500) {
    errors.description = 'Description cannot exceed 500 characters.';
  }

  const imageUrl = (input?.imageUrl || input?.image_url || '').trim();
  if (imageUrl.length > 2000) {
    errors.imageUrl = 'Image URL cannot exceed 2000 characters.';
  } else if (imageUrl && !/^https?:\/\//i.test(imageUrl) && !imageUrl.startsWith('data:image/')) {
    errors.imageUrl = 'Please enter a valid HTTP/HTTPS URL or data URI.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
