import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api/products';

function App() {
  const [page, setPage] = useState('home');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ name: '', quantity: '', price: '' });
  const [editId, setEditId] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    axios
      .get(API_URL)
      .then((response) => {
        if (!ignore) {
          setProducts(response.data);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('Error fetching products:', error);
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (editId) {
        await axios.put(`${API_URL}/${editId}`, formData);
        setEditId(null);
      } else {
        await axios.post(API_URL, formData);
      }

      setFormData({ name: '', quantity: '', price: '' });
      await fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      quantity: product.quantity,
      price: product.price,
    });
    setEditId(product._id);
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setFormData({ name: '', quantity: '', price: '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;

    try {
      await axios.delete(`${API_URL}/${id}`);
      await fetchProducts();
      if (editId === id) handleCancelEdit();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const totalUnits = products.reduce((sum, product) => sum + Number(product.quantity), 0);
  const inventoryValue = products.reduce(
    (sum, product) => sum + Number(product.quantity) * Number(product.price),
    0,
  );
  const lowStockCount = products.filter((product) => Number(product.quantity) <= 5).length;
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setPage('home')} aria-label="Go to homepage">
          <span className="brand-mark">S</span>
          <span>StockFlow</span>
        </button>

        <nav className="nav-links" aria-label="Main navigation">
          <button className={page === 'home' ? 'nav-link active' : 'nav-link'} onClick={() => setPage('home')}>
            <span className="nav-icon">⌂</span> Overview
          </button>
          <button className={page === 'products' ? 'nav-link active' : 'nav-link'} onClick={() => setPage('products')}>
            <span className="nav-icon">▦</span> Products
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">JD</div>
          <div>
            <strong>James D.</strong>
            <span>Administrator</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {page === 'home' ? (
          <section className="page">
            <div className="page-heading">
              <div>
                <p className="eyebrow">DASHBOARD</p>
                <h1>Welcome back, James</h1>
                <p className="subtitle">Here’s what’s happening with your inventory today.</p>
              </div>
              <button className="primary-button" onClick={() => setPage('products')}>
                Manage inventory <span>→</span>
              </button>
            </div>

            <div className="stats-grid">
              <article className="stat-card">
                <div className="stat-icon blue">▦</div>
                <div><span>Total products</span><strong>{loading ? '—' : products.length}</strong></div>
              </article>
              <article className="stat-card">
                <div className="stat-icon violet">◫</div>
                <div><span>Units in stock</span><strong>{loading ? '—' : totalUnits}</strong></div>
              </article>
              <article className="stat-card">
                <div className="stat-icon green">₱</div>
                <div><span>Inventory value</span><strong>₱{inventoryValue.toLocaleString()}</strong></div>
              </article>
              <article className="stat-card">
                <div className="stat-icon amber">!</div>
                <div><span>Low stock</span><strong>{loading ? '—' : lowStockCount}</strong></div>
              </article>
            </div>

            <div className="dashboard-grid">
              <article className="panel activity-panel">
                <div className="panel-header">
                  <div><p className="eyebrow">INVENTORY</p><h2>Recent products</h2></div>
                  <button className="text-button" onClick={() => setPage('products')}>View all</button>
                </div>

                {loading ? <p className="empty-state">Loading products...</p> : products.length === 0 ? (
                  <p className="empty-state">No products yet. Add one from the Products page.</p>
                ) : (
                  <div className="recent-list">
                    {products.slice(0, 5).map((product) => (
                      <div className="recent-row" key={product._id}>
                        <div className="product-avatar">{product.name.charAt(0).toUpperCase()}</div>
                        <div className="recent-name"><strong>{product.name}</strong><span>{product.quantity} units</span></div>
                        <strong>₱{Number(product.price).toLocaleString()}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="panel stock-panel">
                <div className="panel-header">
                  <div><p className="eyebrow">STOCK STATUS</p><h2>Stock overview</h2></div>
                </div>
                <div className="donut" style={{ '--low': `${products.length ? (lowStockCount / products.length) * 100 : 0}%` }}>
                  <div><strong>{products.length}</strong><span>products</span></div>
                </div>
                <div className="legend">
                  <div><span className="dot healthy"></span><span>In stock</span><strong>{products.length - lowStockCount}</strong></div>
                  <div><span className="dot low"></span><span>Low stock</span><strong>{lowStockCount}</strong></div>
                </div>
              </article>
            </div>
          </section>
        ) : (
          <section className="page">
            <div className="page-heading">
              <div>
                <p className="eyebrow">CATALOG</p>
                <h1>Products</h1>
                <p className="subtitle">Add, update, and manage your inventory.</p>
              </div>
            </div>

            <div className="products-layout">
              <article className="panel form-panel">
                <div className="panel-header"><h2>{editId ? 'Edit product' : 'Add a product'}</h2></div>
                <form onSubmit={handleSubmit}>
                  <label>Product name
                    <input type="text" placeholder="e.g. Wireless Mouse" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} required />
                  </label>
                  <label>Quantity
                    <input type="number" min="0" placeholder="0" value={formData.quantity} onChange={(event) => setFormData({ ...formData, quantity: event.target.value })} required />
                  </label>
                  <label>Price (₱)
                    <input type="number" min="0" step="0.01" placeholder="0.00" value={formData.price} onChange={(event) => setFormData({ ...formData, price: event.target.value })} required />
                  </label>
                  <button type="submit" className="primary-button full-button">{editId ? 'Save changes' : 'Add product'}</button>
                  {editId && <button type="button" className="cancel-button" onClick={handleCancelEdit}>Cancel editing</button>}
                </form>
              </article>

              <article className="panel catalog-panel">
                <div className="catalog-toolbar">
                  <div><h2>Inventory</h2><span>{filteredProducts.length} products</span></div>
                  <input className="search-input" type="search" placeholder="Search products..." value={search} onChange={(event) => setSearch(event.target.value)} />
                </div>

                {loading ? <p className="empty-state">Loading products...</p> : filteredProducts.length === 0 ? (
                  <p className="empty-state">{products.length ? 'No products match your search.' : 'Your inventory is empty.'}</p>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Product</th><th>Stock</th><th>Price</th><th>Status</th><th aria-label="Actions"></th></tr></thead>
                      <tbody>
                        {filteredProducts.map((product) => (
                          <tr key={product._id}>
                            <td><div className="table-product"><div className="product-avatar">{product.name.charAt(0).toUpperCase()}</div><strong>{product.name}</strong></div></td>
                            <td>{product.quantity}</td>
                            <td>₱{Number(product.price).toLocaleString()}</td>
                            <td><span className={Number(product.quantity) <= 5 ? 'status low-status' : 'status'}>{Number(product.quantity) <= 5 ? 'Low stock' : 'In stock'}</span></td>
                            <td><div className="row-actions"><button onClick={() => handleEdit(product)} aria-label={`Edit ${product.name}`}>Edit</button><button className="delete-button" onClick={() => handleDelete(product._id)} aria-label={`Delete ${product.name}`}>Delete</button></div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;