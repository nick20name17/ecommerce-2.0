/**
 * Parse a YYYY-MM-DD string as local midnight (avoids UTC off-by-one when displaying).
 */
export const localDateStringToDate = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
