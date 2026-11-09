/**
 * Turkish lira formatter. Built on the decimal formatter plus a literal symbol because Hermes on
 * Android ignores `currencyDisplay: 'narrowSymbol'` and prints "TRY" for non-Turkish locales.
 */
export function createLiraFormatter(
  language: string,
  fractionDigits = 2,
): { format: (value: number) => string } {
  const number = new Intl.NumberFormat(language, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  return { format: (value) => `₺${number.format(value)}` };
}
