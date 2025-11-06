const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const { Low, JSONFile } = require('lowdb');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);

async function initDb(){
  await db.read();
  db.data = db.data || { products: [], cart: [] };
  if (!db.data.products || db.data.products.length === 0) {
    db.data.products = [
      { id: 'p1', name: 'Basic T-shirt', price: 299 },
      { id: 'p2', name: 'Sneakers', price: 1999 },
      { id: 'p3', name: 'Coffee Mug', price: 149 },
      { id: 'p4', name: 'Backpack', price: 1299 },
      { id: 'p5', name: 'Headphones', price: 2499 }
    ];
    await db.write();
  }
}
initDb();

app.get('/api/products', async (req, res) => {
  await db.read();
  res.json(db.data.products.slice(0, 10));
});

app.post('/api/cart', async (req, res) => {
  const { productId, qty } = req.body;
  if (!productId || typeof qty !== 'number') return res.status(400).json({ error: 'productId and qty required' });
  await db.read();
  const product = db.data.products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ error: 'product not found' });
  const existing = db.data.cart.find(item => item.productId === productId);
  if (existing) existing.qty += qty;
  else db.data.cart.push({ id: nanoid(), productId, qty });
  await db.write();
  res.json({ success: true });
});

app.delete('/api/cart/:id', async (req, res) => {
  const id = req.params.id;
  await db.read();
  db.data.cart = db.data.cart.filter(i => i.id !== id);
  await db.write();
  res.json({ success: true });
});

app.get('/api/cart', async (req, res) => {
  await db.read();
  const items = db.data.cart.map(ci => {
    const p = db.data.products.find(x => x.id === ci.productId) || {};
    return { id: ci.id, productId: ci.productId, name: p.name || 'Unknown', price: p.price || 0, qty: ci.qty, lineTotal: (p.price || 0) * ci.qty };
  });
  const total = items.reduce((s, it) => s + it.lineTotal, 0);
  res.json({ items, total });
});

app.post('/api/checkout', async (req, res) => {
  const { cartItems, name, email } = req.body;
  if (!cartItems || !Array.isArray(cartItems)) return res.status(400).json({ error: 'cartItems required' });
  await db.read();
  const items = db.data.cart.filter(ci => cartItems.includes(ci.id));
  const detailed = items.map(ci => {
    const p = db.data.products.find(x => x.id === ci.productId) || {};
    return { name: p.name || 'Unknown', qty: ci.qty, price: p.price || 0 };
  });
  const total = detailed.reduce((s, it) => s + it.qty * it.price, 0);
  db.data.cart = db.data.cart.filter(ci => !cartItems.includes(ci.id));
  await db.write();
  const receipt = { id: nanoid(), name: name || 'Guest', email: email || '', items: detailed, total, timestamp: new Date().toISOString() };
  res.json({ receipt });
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
