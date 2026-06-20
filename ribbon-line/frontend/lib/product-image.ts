const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

/**
 * Resolves product image paths to a browser-loadable absolute URL.
 * Relative paths like `/uploads/products/x.jpg` must point at the API host, not Next.js.
 */
export function resolveProductImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl?.trim()) return null;

  const value = imageUrl.trim();
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/assets/")) {
    return value;
  }

  const path = value.startsWith("/") ? value : `/${value}`;
  return `${API_BASE_URL}${path}`;
}
