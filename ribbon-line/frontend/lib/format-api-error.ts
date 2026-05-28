export function formatApiError(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as { detail?: string | Array<{ msg?: string; loc?: string[] }> };
    if (typeof parsed.detail === "string") return parsed.detail;
    if (Array.isArray(parsed.detail)) {
      return parsed.detail
        .map((item) => item.msg ?? "Validation error")
        .join(". ");
    }
  } catch {
    // not JSON
  }
  return raw || "Something went wrong. Please try again.";
}
