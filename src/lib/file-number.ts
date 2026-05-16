/**
 * Stable 4-digit file number from a handle.
 * Pure FNV-1a, modulo 9999. Used as the dossier identifier on every card.
 */
export function fileNumber(handle: string): string {
  let h = 2166136261;
  for (let i = 0; i < handle.length; i++) {
    h ^= handle.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const n = ((h >>> 0) % 9999) + 1;
  return String(n).padStart(4, "0");
}
