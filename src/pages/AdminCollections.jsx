import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { deleteCollection, getCollections } from "../services/collectionService";

export default function AdminCollections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try { setCollections(await getCollections({ includeInactive: true })); }
    catch (err) { setError(err.message || "Could not load collections."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function remove(collection) {
    if (!window.confirm(`Delete "${collection.name}"? Its designs will remain, but will no longer belong to this collection.`)) return;
    try {
      const { cleanupError } = await deleteCollection(collection.id);
      toast.success("Collection deleted.");
      if (cleanupError) toast.error(`Collection deleted, but its cover image could not be removed: ${cleanupError.message}`);
      await load();
    }
    catch (err) { toast.error(err.message || "Could not delete collection."); }
  }

  return <div className="admin-content"><div className="admin-topline"><div><span className="eyebrow">CATALOGUE MANAGEMENT</span><h1>Collections</h1><p>Create and manage groups of designs.</p></div><Link to="/admin/collections/new" className="button button-dark"><Plus size={17}/> Add collection</Link></div>
    <section className="admin-panel"><div className="panel-heading"><div><h2>All collections</h2><p>{collections.length} item(s)</p></div></div>
      {loading ? <p className="muted">Loading collections…</p> : error ? <p role="alert">{error}</p> : collections.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Collection</th><th>Status</th><th>Featured</th><th>Actions</th></tr></thead><tbody>{collections.map(collection => <tr key={collection.id}><td><strong>{collection.name}</strong></td><td>{collection.is_active ? "Active" : "Inactive"}</td><td>{collection.is_featured ? "Yes" : "No"}</td><td><div className="table-actions"><Link aria-label={`Edit ${collection.name}`} to={`/admin/collections/${collection.id}/edit`}><Pencil size={17}/></Link><button aria-label={`Delete ${collection.name}`} onClick={() => remove(collection)}><Trash2 size={17}/></button></div></td></tr>)}</tbody></table></div> : <div className="empty-state"><p>No collections yet.</p><Link to="/admin/collections/new" className="under-link">Create your first collection</Link></div>}
    </section>
  </div>;
}
