export function formatRs(amount) {
  if (amount === null || amount === undefined) {
    return 'Rs. 0.00';
  }

  // Remove commas, spaces, and Rs. if present
  const cleaned = String(amount).replace(/[^0-9.-]/g, '');
  const num = Number(cleaned);

  if (isNaN(num)) {
    return 'Rs. 0.00';
  }

  return `Rs. ${num.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
