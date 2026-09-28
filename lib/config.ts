// Browser requests use the same-origin Next.js proxy by default to avoid backend CORS errors.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api/lppm";
