import React, { useEffect, useState } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function App(){
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [checkoutInfo, setCheckoutInfo] = useState({ name: '', email: '' });

  useEffect(() => { fetchProducts(); fetchCart(); }, []);

  async function fetchProducts(){ const r = await fetch(`${API}/api/products`); setProducts(await r.json()); }
  async function fetchCart(){ const r = await fetch(`${API}/api/cart`); setCart(await r.json()); }

  async function addToCart(productId){ await fetch(`${API}/api/cart`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ productId, qty: 1 }) }); fetchCart(); }
  async function removeItem(cartItemId){ await fetch(`${API}/api/cart/${cartItemId}`, { method: 'DELETE' }); fetchCart(); }
  function toggleSelect(itemId){ setCart(c => ({ ...c, items: c.items.map(it => it.id===itemId?{...it, selected: !it.selected}:it) })); }

  async function checkout(e){
    e.preventDefault();
    const selected = cart.items.filter(i => i.selected).map(i => i.id);
    if (selected.length === 0) return alert('Select items to checkout');
    const r = await fetch(`${API}/api/checkout`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ cartItems: selected, name: checkoutInfo.name, email: checkoutInfo.email }) });
    const { receipt } = await r.json();
    alert(`Receipt total: ₹${receipt.total} — timestamp: ${receipt.timestamp}`);
    setCheckoutInfo({ name:'', email:'' }); fetchCart();
  }

  return (<div className='wrap'>
    <header><h1>Mock E‑Com Store</h1></header>
    <main>
      <section className='products'><h2>Products</h2><div className='grid'>{products.map(p => (<div className='card' key={p.id}><div className='title'>{p.name}</div><div className='price'>₹{p.price}</div><button onClick={()=>addToCart(p.id)}>Add to Cart</button></div>))}</div></section>
      <aside className='cart'><h2>Cart</h2>{cart.items.length === 0 ? <div className='empty'>No items</div> : (<table className='cart-table'><thead><tr><th></th><th>Item</th><th>Qty</th><th>Price</th><th>Line</th><th></th></tr></thead><tbody>{cart.items.map(it => (<tr key={it.id}><td><input type='checkbox' checked={!!it.selected} onChange={()=>toggleSelect(it.id)} /></td><td>{it.name}</td><td>{it.qty}</td><td>₹{it.price}</td><td>₹{it.lineTotal}</td><td><button onClick={()=>removeItem(it.id)}>Remove</button></td></tr>))}</tbody><tfoot><tr><td colSpan='4'>Total</td><td>₹{cart.total}</td><td></td></tr></tfoot></table>)}<form onSubmit={checkout} className='checkout'><h3>Checkout</h3><input placeholder='Name' value={checkoutInfo.name} onChange={e=>setCheckoutInfo(s=>({...s,name:e.target.value}))} required /><input placeholder='Email' value={checkoutInfo.email} onChange={e=>setCheckoutInfo(s=>({...s,email:e.target.value}))} required /><button type='submit'>Pay (mock)</button></form></aside>
    </main></div>);
}
