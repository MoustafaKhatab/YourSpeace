#!/usr/bin/env node
/** Quick smoke: product variants. Run: node scripts/smoke-variants.js (with server NOT required — in-process). */
require('dotenv').config();
const http = require('http');
const app = require('../src/app');

function req(port, method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: '/api' + path,
        method,
        headers: {
          ...(data
            ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
            : {}),
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let json = null;
          try {
            json = raw ? JSON.parse(raw) : null;
          } catch {
            json = { raw };
          }
          resolve({ status: res.statusCode, json });
        });
      }
    );
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

const server = app.listen(0, async () => {
  const port = server.address().port;
  const results = [];
  const pass = (name, ok, detail) => {
    results.push({ name, ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  };

  try {
    const ts = Date.now();
    const sellerReg = await req(port, 'POST', '/auth/register', {
      email: `seller-var-${ts}@example.com`,
      password: 'secret123',
      first_name: 'Sam',
      last_name: 'Seller',
      role: 'SELLER',
    });
    pass('seller register', sellerReg.status === 201, String(sellerReg.status));
    const auth = { 'x-session-id': sellerReg.json.session.session_id };

    const storeName = `VarShop-${ts}`;
    await req(port, 'POST', '/store/create-store', { name: storeName, description: 'v' }, auth);

    const cats = await req(port, 'GET', '/category/get-categories');
    const categoryId = cats.json?.categories?.[0]?.category_id
      ? Number(cats.json.categories[0].category_id)
      : null;

    const noVar = await req(
      port,
      'POST',
      '/product/create-product',
      { title: `NoVar-${ts}`, hidden: false },
      auth
    );
    pass('create without variants → 400', noVar.status === 400, String(noVar.status));

    const created = await req(
      port,
      'POST',
      '/product/create-product',
      {
        title: `Phone-${ts}`,
        hidden: false,
        ...(categoryId ? { category_id: categoryId } : {}),
        variants: [
          { color: 'Black', size: 'M', stock: 10, price: 19.99 },
          { color: 'White', size: 'L', stock: 5, price: 21.5 },
        ],
      },
      auth
    );
    pass(
      'create with variants → 201',
      created.status === 201 && created.json?.product?.variants?.length === 2,
      String(created.status)
    );
    const productId = created.json.product.product_id;
    console.log(JSON.stringify(created.json.product, null, 2));

    const byId = await req(port, 'GET', `/product/get-product/${productId}`);
    pass('get-product variants', byId.status === 200 && byId.json.product.variants.length === 2);

    const updated = await req(
      port,
      'PUT',
      `/product/update-product/${productId}`,
      { variants: [{ color: 'Blue', size: 'S', stock: 3, price: 18 }] },
      auth
    );
    pass('update replace variants', updated.status === 200 && updated.json.product.variants.length === 1);

    const empty = await req(
      port,
      'PUT',
      `/product/update-product/${productId}`,
      { variants: [] },
      auth
    );
    pass('empty variants → 400', empty.status === 400);

    const failed = results.filter((r) => !r.ok);
    console.log(`\nPassed ${results.length - failed.length}/${results.length}`);
    server.close(() => process.exit(failed.length ? 1 : 0));
  } catch (e) {
    console.error('ERROR', e.message);
    server.close(() => process.exit(1));
  }
});
