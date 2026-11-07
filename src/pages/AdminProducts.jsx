import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { getProducts, deleteProduct } from "../services/productService";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    try { setProducts(await getProducts({ includeDrafts: true })); }
    catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function remove(product) {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try { await deleteProduct(product); toast.success("Design deleted."); load(); }
    catch (err) { toast.error(err.message); }
  }

  return <div className="admin-content"><div className="admin-topline"><div><span className="eyebrow">CATALOGUE MANAGEMENT</span><h1>Products</h1><p>Create and manage the designs displayed on your website.</p></div><Link to="/admin/products/new" className="button button-dark"><Plus size={17}/> Add design</Link></div>
    <section className="admin-panel"><div className="panel-heading"><div><h2>All designs</h2><p>{products.length} item(s)</p></div></div>
      {loading ? <p className="muted">Loading products…</p> : products.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Design</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead><tbody>{products.map(p => <tr key={p.id}><td><div className="table-product"><img src={p.product_images?.[0]?.image_url || "https://placehold.co/80x100?text=Aso"} alt=""/><strong>{p.name}</strong></div></td><td>{new Intl.NumberFormat("en-NG", { style: "currency", currency: p.currency || "NGN", maximumFractionDigits: 0 }).format(p.price)}</td><td><span className={`status status-${p.status}`}>{p.status}</span></td><td><div className="table-actions"><Link aria-label="Edit product" to={`/admin/products/${p.id}/edit`}><Pencil size={17}/></Link><button aria-label="Delete product" onClick={() => remove(p)}><Trash2 size={17}/></button></div></td></tr>)}</tbody></table></div> : <div className="empty-state"><p>No designs yet.</p><Link to="/admin/products/new" className="under-link">Create your first design</Link></div>}
    </section>
  </div>;
}
