import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products`;

const ACCOUNTS = {
  james: { name: 'James', fullName: 'James D.', initials: 'JD', role: 'Administrator' },
  muriel: { name: 'Muriel', fullName: 'Muriel', initials: 'MU', role: 'Inventory Manager' },
};

function App() {
  const [page, setPage] = useState('landing');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', quantity: '', price: '' });
  const [editId, setEditId] = useState(null);
  const [accountKey, setAccountKey] = useState(() => {
    const saved = localStorage.getItem('stockflow-account');
    return saved === 'muriel' ? 'muriel' : 'james';
  });
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const currentAccount = ACCOUNTS[accountKey];

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(API_URL);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Could not connect to the backend. Start the server and try again.');
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
        if (!ignore) {
          setLoading(false);
          setError('Could not connect to the backend. Start the server and try again.');
        }
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
        setNotice('Product updated successfully.');
      } else {
        await axios.post(API_URL, formData);
        setNotice('Product added successfully.');
      }

      setError('');
      setFormData({ name: '', quantity: '', price: '' });
      await fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      setError(error.response?.data?.message || 'Could not save the product.');
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
      setNotice('Product deleted successfully.');
      setError('');
      if (editId === id) handleCancelEdit();
    } catch (error) {
      console.error('Error deleting product:', error);
      setError(error.response?.data?.message || 'Could not delete the product.');
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

  const switchAccount = (key) => {
    setAccountKey(key);
    localStorage.setItem('stockflow-account', key);
    setAccountMenuOpen(false);
  };

  if (page === 'landing') {
    return (
      <div className="landing-page">
        <header className="landing-header">
          <button className="landing-brand" onClick={() => setPage('landing')} aria-label="StockFlow homepage">
            <span className="brand-mark">S</span>
            <span>StockFlow</span>
          </button>
          <button className="landing-login" onClick={() => setPage('overview')}>Open dashboard</button>
        </header>

        <main className="landing-content">
          <section className="landing-copy">
            <p className="landing-eyebrow">INVENTORY MADE SIMPLE</p>
            <h1>Know what is in stock.<br />Act before it runs out.</h1>
            <p className="landing-subtitle">
              StockFlow gives you a clear view of your products, stock levels, and inventory value in one place.
            </p>
            <div className="landing-actions">
              <button className="primary-button" onClick={() => setPage('overview')}>View dashboard <span>→</span></button>
              <button className="secondary-button" onClick={() => setPage('products')}>Manage products</button>
            </div>
          </section>

          <section className="landing-preview" aria-label="Inventory preview">
            <div className="preview-header">
              <div>
                <p className="eyebrow">OVERVIEW</p>
                <h2>Inventory summary</h2>
              </div>
              <span className="preview-status">Live</span>
            </div>
            <div className="preview-stats">
              <div><span>Products</span><strong>{loading ? '—' : products.length}</strong></div>
              <div><span>Units</span><strong>{loading ? '—' : totalUnits}</strong></div>
              <div><span>Low stock</span><strong>{loading ? '—' : lowStockCount}</strong></div>
            </div>
            <div className="preview-products">
              {loading ? (
                <p className="empty-state">Loading inventory...</p>
              ) : products.length === 0 ? (
                <p className="empty-state">Your inventory is ready for its first product.</p>
              ) : products.slice(0, 4).map((product) => (
                <div className="preview-row" key={product._id}>
                  <div className="product-avatar">{product.name.charAt(0).toUpperCase()}</div>
                  <strong>{product.name}</strong>
                  <span>{product.quantity} units</span>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setPage('landing')} aria-label="Go to homepage">
          <span className="brand-mark">S</span>
          <span>StockFlow</span>
        </button>

        <nav className="nav-links" aria-label="Main navigation">
          <button className={page === 'overview' ? 'nav-link active' : 'nav-link'} onClick={() => setPage('overview')}>
            <span className="nav-icon">⌂</span> Overview
          </button>
          <button className={page === 'products' ? 'nav-link active' : 'nav-link'} onClick={() => setPage('products')}>
            <span className="nav-icon">▦</span> Products
          </button>
        </nav>

        <div className="account-switcher">
          <button className="account-button" onClick={() => setAccountMenuOpen(!accountMenuOpen)}>
            <span className="account-initials">{currentAccount.initials}</span>
            <span className="account-name">{currentAccount.name}</span>
            <span className="arrow">{accountMenuOpen ? '▲' : '▼'}</span>
          </button>

          {accountMenuOpen && (
            <div className="account-menu">
              {Object.entries(ACCOUNTS).map(([key, account]) => (
                <button
                  key={key}
                  className={`account-option ${accountKey === key ? 'active' : ''}`}
                  onClick={() => switchAccount(key)}
                >
                  <span className="account-initials">{account.initials}</span>
                  <span className="account-name">{account.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="avatar">{currentAccount.initials}</div>
          <div>
            <strong>{currentAccount.fullName}</strong>
            <span>{currentAccount.role}</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {(notice || error) && (
          <div className={`app-message ${error ? 'error-message' : ''}`} role={error ? 'alert' : 'status'}>
            <span>{error || notice}</span>
            <button type="button" aria-label="Dismiss message" onClick={() => { setNotice(''); setError(''); }}>×</button>
          </div>
        )}
        {page === 'overview' ? (
          <section className="page">
            <div className="page-heading">
              <div>
                <p className="eyebrow">DASHBOARD</p>
                <h1>Welcome back, {currentAccount.name}</h1>
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
