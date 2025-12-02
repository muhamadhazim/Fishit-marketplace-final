export function formatIDR(amount: number): string {
  if (amount === undefined || amount === null) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(amount);
}
