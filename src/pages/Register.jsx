import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { signUp } from "../services/authService";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must contain at least 8 characters.");
    setBusy(true);
    try {
      const result = await signUp({ fullName, email, password });
      if (!result.session) {
        toast.success("Account created. Check your email to confirm your address, then sign in.");
        navigate("/login");
      } else {
        toast.success("Your account is ready.");
        navigate("/");
      }
    } catch (err) { toast.error(err.message || "Unable to create account."); }
    finally { setBusy(false); }
  }

  return <><Navbar/>
    <main className="auth-page"><div className="auth-card">
      <span className="eyebrow">JOIN THE Chinny Trends COMMUNITY</span><h1>Create your <em>account.</em></h1><p>Sign up to keep in touch with our latest designs.</p><form onSubmit={submit}>
    <label>Full name<input value={fullName} onChange={e => setFullName(e.target.value)} required autoComplete="name"/></label>
    <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"/></label>
    <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength="8" required autoComplete="new-password"/><small>Use at least 8 characters.</small></label>
    <button className="button button-dark button-full" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
  </form><div className="auth-divider">ALREADY A MEMBER?</div><Link className="button button-outline button-full" to="/login">Sign in</Link></div></main><Footer/></>;
}
