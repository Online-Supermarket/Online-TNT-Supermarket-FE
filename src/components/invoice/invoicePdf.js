export const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const paymentLabel = (method) => method === 'BankTransfer' ? 'Bank Transfer' : 'Cash on Delivery';
export const readableStatus = (status) => String(status || 'Pending').replace(/([a-z])([A-Z])/g, '$1 $2');
export const invoiceDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Render at 2x resolution so downloaded invoices retain Unicode customer/product names.
// Each page is embedded in an A4 PDF; long baskets and addresses flow onto new pages.
export function renderInvoicePages(invoice, fallbackMethod) {
  const pages = [];
  const green = '#123e30', muted = '#65796f', pale = '#f0f5ef';
  let canvas, ctx, y;
  const rect = (x, top, width, height, color) => { ctx.fillStyle = color; ctx.fillRect(x, top, width, height); };
  const text = (value, x, top, size = 10, color = green, bold = false, align = 'left') => {
    ctx.font = `${bold ? 'bold' : 'normal'} ${size}px Arial, sans-serif`;
    ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(String(value), x, top);
  };
  const wrap = (value, width, size = 10) => {
    ctx.font = `${size}px Arial, sans-serif`;
    const lines = []; let line = '';
    for (const char of String(value || '')) {
      if (char === '\n' || ctx.measureText(line + char).width > width) {
        lines.push(line); line = char === '\n' ? '' : char;
      } else line += char;
    }
    if (line) lines.push(line);
    return lines;
  };
  const startPage = (continued = false) => {
    canvas = document.createElement('canvas'); canvas.width = 1190; canvas.height = 1684;
    ctx = canvas.getContext('2d'); ctx.scale(2, 2); pages.push(canvas);
    rect(0, 0, 595, 842, '#ffffff'); rect(0, 0, 595, 8, '#c1d994');
    rect(0, 8, 595, 130, green);
    text('TNT', 38, 58, 32, '#ffffff', true);
    text('ONLINE SUPERMARKET', 39, 80, 10, '#d5e5d4', true);
    text('Fresh essentials. Delivered with care.', 39, 111, 10, '#d5e5d4');
    text('INVOICE', 557, 60, 25, '#ffffff', true, 'right');
    text(continued ? 'CONTINUED' : invoiceDate(invoice.createdAt), 557, 85, 10, '#d5e5d4', false, 'right');
    text(`Order reference: ${invoice.id}`, 38, 162, 9, muted);
    y = 192;
  };
  const ensure = (height) => { if (y + height > 745) startPage(true); };
  const tableHeader = () => {
    rect(38, y, 519, 28, green);
    text('ITEM DESCRIPTION', 50, y + 18, 9, '#ffffff', true);
    text('QTY', 344, y + 18, 9, '#ffffff', true, 'right');
    text('UNIT PRICE', 439, y + 18, 9, '#ffffff', true, 'right');
    text('AMOUNT', 545, y + 18, 9, '#ffffff', true, 'right'); y += 28;
  };
  startPage();
  text('DELIVER TO', 38, y, 9, muted, true);
  text('ORDER DETAILS', 334, y, 9, muted, true); y += 22;
  const address = invoice.address || {};
  const addressLines = [address.recipientName, address.line1, address.line2, address.city, address.phone].filter(Boolean).flatMap(line => wrap(line, 265));
  const detailLines = [readableStatus(invoice.status), paymentLabel(invoice.paymentMethod || fallbackMethod), ...(invoice.paymentStatus ? [`Payment: ${readableStatus(invoice.paymentStatus)}`] : [])].flatMap(line => wrap(line, 223));
  for (let i = 0; i < Math.max(addressLines.length, detailLines.length); i++) {
    ensure(16);
    if (addressLines[i]) text(addressLines[i], 38, y, 10, green, i === 0);
    if (detailLines[i]) text(detailLines[i], 334, y); y += 16;
  }
  y += 24; ensure(75); tableHeader();
  for (const [index, item] of (invoice.items || []).entries()) {
    const lines = wrap(item.name || 'Item', 257);
    for (let offset = 0; offset < lines.length; offset += 28) {
      const chunk = lines.slice(offset, offset + 28);
      const height = Math.max(44, chunk.length * 15 + 24);
      if (y + height > 745) { startPage(true); tableHeader(); }
      rect(38, y, 519, height, index % 2 === 0 ? pale : '#ffffff');
      chunk.forEach((line, i) => text(line, 50, y + 25 + i * 15));
      if (offset === 0) {
        text(item.quantity, 344, y + 25, 10, green, false, 'right');
        text(money(item.unitPrice), 439, y + 25, 10, green, false, 'right');
        text(money(item.lineTotal), 545, y + 25, 10, green, true, 'right');
      }
      y += height;
    }
  }
  y += 24; ensure(151);
  text('Subtotal', 334, y + 12, 10, muted); text(money(invoice.subtotal), 545, y + 12, 11, green, false, 'right');
  text('Delivery fee', 334, y + 37, 10, muted); text(money(invoice.deliveryFee), 545, y + 37, 11, green, false, 'right');
  rect(321, y + 53, 236, 51, green);
  text('TOTAL', 334, y + 84, 11, '#ffffff', true); text(money(invoice.total), 545, y + 84, 17, '#ffffff', true, 'right');
  text('All amounts are in Sri Lankan Rupees (LKR).', 557, y + 125, 8, muted, false, 'right');
  pages.forEach((page, index) => {
    ctx = page.getContext('2d');
    rect(38, 773, 519, 1, '#dce6dd');
    text('Thank you for shopping with TNT.', 38, 797, 12, green, true);
    text('Fresh picks. Everyday happiness.', 38, 814, 9, muted);
    text(`${index + 1} / ${pages.length}`, 557, 809, 9, muted, false, 'right');
  });
  return pages;
}

export function createInvoicePdf(invoice, paymentMethod) {
  const pages = renderInvoicePages(invoice, paymentMethod);
  const encoder = new TextEncoder();
  const objects = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push(`<< /Type /Pages /Kids [${pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ')}] /Count ${pages.length} >>`);
  pages.forEach((canvas, index) => {
    const id = 3 + index * 3;
    const bytes = Uint8Array.from(atob(canvas.toDataURL('image/jpeg', 0.96).split(',')[1]), char => char.charCodeAt(0));
    const stream = 'q 595 0 0 842 0 0 cm /Im1 Do Q';
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im1 ${id + 2} 0 R >> >> /Contents ${id + 1} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    objects.push([encoder.encode(`<< /Type /XObject /Subtype /Image /Width 1190 /Height 1684 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`), bytes, encoder.encode('\nendstream')]);
  });
  const parts = [encoder.encode('%PDF-1.4\n')]; let length = parts[0].length; const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(length);
    const chunks = [encoder.encode(`${index + 1} 0 obj\n`), ...(Array.isArray(object) ? object : [encoder.encode(object)]), encoder.encode('\nendobj\n')];
    chunks.forEach(chunk => { parts.push(chunk); length += chunk.length; });
  });
  const xref = length;
  parts.push(encoder.encode(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`));
  return new Blob(parts, { type: 'application/pdf' });
}
