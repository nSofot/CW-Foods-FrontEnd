export function formatNumber(amount) {
  const num = Number(amount);

  if (isNaN(num)) {
    return '0.00';
  }

  return num.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
