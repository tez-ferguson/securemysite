import { timingSafeEqual } from 'crypto'

/**
 * Compare two strings in constant time to prevent timing-based secret leakage.
 * Returns true only if both strings are non-empty and identical.
 */
export function verifySecret(received: string | null | undefined, expected: string | null | undefined): boolean {
  if (!received || !expected) return false
  try {
    const a = Buffer.from(received)
    const b = Buffer.from(expected)
    // timingSafeEqual requires same length; compare lengths first without leaking
    if (a.length !== b.length) {
      // Still run timingSafeEqual on equal-length dummy buffers to avoid timing leak
      timingSafeEqual(Buffer.from(expected), Buffer.from(expected))
      return false
    }
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}
