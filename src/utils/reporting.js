export const paymentName = method => ({ CashOnDelivery: 'Cash on delivery', COD: 'Cash on delivery', BankTransfer: 'Bank transfer' }[method] || 'Unspecified');
export const isSale = order => ['Confirmed', 'Delivery', 'Delivered'].includes(order.status);
export const formatMoney = (value, currency = 'LKR') => `${currency === 'LKR' ? 'Rs.' : currency} ${Number(value || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const totalsByCurrency = orders => orders.reduce((totals, order) => {
  const currency = order.currency || 'LKR';
  totals[currency] = (totals[currency] || 0) + Number(order.total || 0);
  return totals;
}, {});
export const showTotals = orders => Object.entries(totalsByCurrency(orders)).map(([currency, value]) => formatMoney(value, currency)).join(' / ') || formatMoney(0);
export function dateRange(from, to) {
  if (from && to && from > to) throw new Error('From date must be on or before To date.');
  return {
    from: from ? new Date(`${from}T00:00:00+05:30`).toISOString() : '',
    to: to ? new Date(new Date(`${to}T00:00:00+05:30`).getTime() + 86400000).toISOString() : '',
  };
}
const cell = value => {
  let text = String(value ?? '');
  if (typeof value !== 'number' && /^[\s]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};
export function reportCsv(kind, orders, products, filters, generatedAt) {
  const rows = [
    ['TNT ONLINE SUPERMARKET', 'Sales & Stock Report'],
    ['209/23 New Kandy Road, Nittambuwa', '077 - 3162025'],
    ['Generated at', generatedAt], ['Order date from', filters.from || 'All dates'], ['Order date to', filters.to || 'All dates'],
    ['Order status', filters.status || 'All'], ['Payment method', filters.paymentMethod ? paymentName(filters.paymentMethod) : 'All'],
    ['Low-stock threshold', filters.threshold], ['Stock view', filters.stock || 'All products'],
    ['Sales basis', 'Confirmed, Delivery and Delivered orders; order totals include delivery and tax. Not a cash collection statement.'],
    ['Stock basis', 'Current active stock snapshot; date and payment filters apply only to orders. Stock value uses retail price, not cost.'], [],
  ];
  if (kind !== 'inventory') {
    rows.push(['SALES SUMMARY'], ['Payment type', 'Currency', 'Sales total']);
    for (const method of ['CashOnDelivery', 'BankTransfer', 'Unknown']) {
      const sales = orders.filter(isSale).filter(o => method === 'Unknown' ? !['CashOnDelivery','COD','BankTransfer'].includes(o.paymentMethod) : method === 'CashOnDelivery' ? ['CashOnDelivery','COD'].includes(o.paymentMethod) : o.paymentMethod === method);
      for (const [currency, total] of Object.entries(totalsByCurrency(sales))) rows.push([paymentName(method), currency, Number(total.toFixed(2))]);
    }
    rows.push([], ['ORDER DETAILS'], ['Order ID', 'Created at', 'Status', 'Payment method', 'Payment status', 'Subtotal', 'Tax', 'Delivery fee', 'Total', 'Currency', 'Included in sales']);
    orders.forEach(o => rows.push([o.id, o.createdAt, o.status, paymentName(o.paymentMethod), o.paymentStatus, o.subtotal, o.tax, o.deliveryFee, o.total, o.currency || 'LKR', isSale(o) ? 'Yes' : 'No']));
  }
  if (kind !== 'sales') {
    rows.push([], ['STOCK SUMMARY'], ['Products', products.length], ['Units on hand', products.reduce((sum,p) => sum + Number(p.stockQuantity), 0)], ['Stock retail value (LKR)', Number(products.reduce((sum,p) => sum + Number(p.price) * Number(p.stockQuantity), 0).toFixed(2))], [], ['STOCK DETAILS'], ['SKU', 'Product', 'Category', 'Stock quantity', 'Retail price (LKR)', 'Retail value (LKR)', 'Stock status']);
    products.forEach(p => rows.push([p.sku, p.name, p.categoryName, p.stockQuantity, p.price, Number((p.price * p.stockQuantity).toFixed(2)), p.stockQuantity <= 0 ? 'Out of stock' : p.stockQuantity <= filters.threshold ? 'Low stock' : 'In stock']));
  }
  return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n');
}
