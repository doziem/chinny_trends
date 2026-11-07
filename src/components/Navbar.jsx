import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, UserRound, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { signOut } from "../services/authService";
import { Brand } from "./Brand";

export default function Navbar() {
  const { user, isOwner } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    setOpen(false);
    navigate("/");
  }

  return <header className="site-header">
    <div className="container nav-inner">
      <Brand />
      <nav className={`nav-links ${open ? "nav-open" : ""}`}>
        <NavLink to="/" onClick={() => setOpen(false)}>Home</NavLink>
        <NavLink to="/shop" onClick={() => setOpen(false)}>Explore designs</NavLink>
        <NavLink to="/collections" onClick={() => setOpen(false)}>Collections</NavLink>
        <a href="/#story" onClick={() => setOpen(false)}>Our story</a>
        <a href="/#contact" onClick={() => setOpen(false)}>Contact</a>
        {user ? <>
          {isOwner && <Link to="/admin" className="nav-admin" onClick={() => setOpen(false)}><LayoutDashboard size={16}/> Dashboard</Link>}
          <button className="nav-account" onClick={handleLogout}><LogOut size={16}/> Sign out</button>
        </> : <Link className="button button-dark nav-login" to="/login" onClick={() => setOpen(false)}><UserRound size={16}/> Sign in</Link>}
      </nav>
      <button className="mobile-menu" aria-label="Toggle menu" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
    </div>
  </header>;
}
