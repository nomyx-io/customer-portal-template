export function formatNumber(value: any) {
  const userLocale = navigator.language || "en-US";
  const formatter = new Intl.NumberFormat(userLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(value);
}
