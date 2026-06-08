/** True when every letter is uppercase (digits and punctuation are ignored). */
export function isAllCapsText(value: string): boolean {
  const letters = value.match(/[A-Za-zÀ-ÿ]/g);
  if (!letters?.length) return false;
  return letters.every(
    (ch) => ch === ch.toUpperCase() && ch !== ch.toLowerCase()
  );
}

/** Title-case letter groups when the whole value is all caps; otherwise unchanged. */
export function normalizeAllCapsText(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || !isAllCapsText(trimmed)) return value;

  return trimmed.replace(
    /[A-Za-zÀ-ÿ]+/g,
    (letters) =>
      letters.charAt(0).toUpperCase() + letters.slice(1).toLowerCase()
  );
}
