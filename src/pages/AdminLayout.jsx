import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Shirt, PlusCircle, LogOut, ExternalLink, Layers } from "lucide-react";
import { signOut } from "../services/authService";
import { Brand } from "../components/Brand";

export default function AdminLayout() {
  const navigate = useNavigate();
  async function logout() { await signOut(); navigate("/"); }
  return <div className="admin-shell">
    <aside className="admin-sidebar"><Brand/><span className="admin-label">WORKSPACE</span>
      <NavLink end to="/admin"><LayoutDashboard size={17}/> Overview</NavLink>
      <NavLink to="/admin/products"><Shirt size={17}/> Products</NavLink>
      <NavLink to="/admin/collections"><Layers size={17}/> Collections</NavLink>
      <NavLink to="/admin/products/new"><PlusCircle size={17}/> Add a design</NavLink>
      <div className="admin-sidebar-bottom"><a href="/" target="_blank" rel="noreferrer"><ExternalLink size={16}/> View website</a><button onClick={logout}><LogOut size={16}/> Sign out</button></div>
    </aside>
    <main className="admin-main"><Outlet/></main>
  </div>;
}
