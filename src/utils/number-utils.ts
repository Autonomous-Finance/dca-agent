export function formatNumber(
  number: number,
  options: Intl.NumberFormatOptions = {},
) {
  return new Intl.NumberFormat(undefined, options).format(number)
}
