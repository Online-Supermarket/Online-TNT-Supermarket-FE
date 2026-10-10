import { createInvoicePdf } from './invoicePdf';

export function downloadInvoicePdf(invoice, fallbackPaymentMethod = 'COD') {
  const blob = createInvoicePdf(invoice, invoice.paymentMethod || fallbackPaymentMethod);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `TNT-invoice-${invoice.id}.pdf`;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    // Allow the browser time to start reading the PDF before releasing its URL.
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }
}
