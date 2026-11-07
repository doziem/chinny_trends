import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Plus, Shirt, Eye, FileText } from "lucide-react";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    async function load() {
      const [all, live, drafts, latest] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("products").select("id,name,status,created_at").order("created_at", { ascending: false }).limit(5)
      ]);
      setStats({ total: all.count || 0, published: live.count || 0, drafts: drafts.count || 0 });
      setRecent(latest.data || []);
    }
    load().catch(console.error);
  }, []);

  return <div className="admin-content"><div className="admin-topline"><div><span className="eyebrow">YOUR ATELIER</span><h1>Good to see you, {profile?.full_name?.split(" ")[0] || "Owner"}.</h1><p>Here's what's happening with your catalogue.</p></div><Link to="/admin/products/new" className="button button-dark"><Plus size={17}/> Add a design</Link></div>
    <div className="stats-grid"><div className="stat-card"><span>Total designs</span><strong>{stats.total}</strong><Shirt/></div><div className="stat-card"><span>Published</span><strong>{stats.published}</strong><Eye/></div><div className="stat-card"><span>Drafts</span><strong>{stats.drafts}</strong><FileText/></div></div>
    <section className="admin-panel"><div className="panel-heading"><div><h2>Recently added</h2><p>Your latest catalogue updates</p></div><Link to="/admin/products">Manage products <ArrowUpRight size={15}/></Link></div>
      {recent.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Design</th><th>Status</th><th>Date added</th></tr></thead><tbody>{recent.map(p => <tr key={p.id}><td>{p.name}</td><td><span className={`status status-${p.status}`}>{p.status}</span></td><td>{new Date(p.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div> : <div className="empty-state"><p>Your catalogue is waiting for its first design.</p><Link to="/admin/products/new" className="under-link">Add your first design</Link></div>}
    </section>
  </div>;
}
