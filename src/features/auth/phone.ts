/** Accepts "98765 43210" (assumed India, +91) or "+91 98765 43210" and returns "+919876543210". */
export function toE164(input: string): string | null {
  const digits = input.replace(/[\s()-]/g, '')
  if (/^\d{10}$/.test(digits)) return `+91${digits}`
  if (/^\+[1-9]\d{9,14}$/.test(digits)) return digits
  return null
}
