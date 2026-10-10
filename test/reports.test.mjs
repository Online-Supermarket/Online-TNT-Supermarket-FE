import test from 'node:test';
import assert from 'node:assert/strict';
import { dateRange, isSale, totalsByCurrency, reportCsv } from '../src/utils/reporting.js';

test('report dates cover the full selected Sri Lankan day with an exclusive end', () => {
  assert.deepEqual(dateRange('2026-10-10', '2026-10-10'), { from: '2026-10-09T18:30:00.000Z', to: '2026-10-10T18:30:00.000Z' });
  assert.throws(() => dateRange('2026-10-11','2026-10-10'));
});
test('sales exclude unsuccessful and pending orders and do not add different currencies together', () => {
  const orders = [{ status:'Confirmed', total:100, currency:'LKR' }, { status:'Delivered', total:20, currency:'USD' }, { status:'Delivery', total:50, currency:'LKR' }, { status:'Cancelled', total:999, currency:'LKR' }, { status:'Pending', total:500, currency:'LKR' }, { status:'Rejected', total:40, currency:'LKR' }];
  assert.deepEqual(totalsByCurrency(orders.filter(isSale)), { LKR:150, USD:20 });
});
test('combined report includes cash, bank, full order IDs and escaped stock details', () => {
  const orders = [{ id:'cash-order-full-id', status:'Delivered', paymentMethod:'CashOnDelivery', total:100, currency:'LKR' }, { id:'bank-order-full-id', status:'Confirmed', paymentMethod:'BankTransfer', total:200, currency:'LKR' }];
  const products = [{ sku:'=HYPERLINK("bad")', name:'Rice, "Premium"', categoryName:'Food', stockQuantity:2, price:50 }];
  const csv = reportCsv('complete',orders,products,{ threshold:5 },'2026-10-10');
  for (const text of ['SALES SUMMARY','Cash on delivery','Bank transfer','cash-order-full-id','bank-order-full-id','STOCK DETAILS','Low stock','Rice, ""Premium""',"'=HYPERLINK"]) assert.ok(csv.includes(text),text);
  assert.ok(!reportCsv('sales',orders,products,{threshold:5},'today').includes('STOCK DETAILS'));
  assert.ok(!reportCsv('inventory',orders,products,{threshold:5},'today').includes('ORDER DETAILS'));
});
