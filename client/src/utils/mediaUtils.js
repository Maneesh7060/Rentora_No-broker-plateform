/**
 * Resolves a media / image URL into a fully-qualified URL if it is a relative upload path.
 * Handles local storage paths like `/uploads/profiles/...`, `/uploads/properties/...`
 * as well as remote absolute URLs (e.g. Unsplash, Cloudinary, data URLs).
 *
 * @param {string|null|undefined} pathOrUrl
 * @returns {string|null}
 */
export function getMediaUrl(pathOrUrl) {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return null;
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return null;

  // If already an absolute URL (http, https, data URI, blob)
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  const backendOrigin = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  if (trimmed.startsWith('/uploads')) {
    return `${backendOrigin}${trimmed}`;
  }

  if (trimmed.startsWith('uploads/')) {
    return `${backendOrigin}/${trimmed}`;
  }

  // If starts with single slash, prefix with backend origin
  if (trimmed.startsWith('/')) {
    return `${backendOrigin}${trimmed}`;
  }

  return trimmed;
}

export default getMediaUrl;
