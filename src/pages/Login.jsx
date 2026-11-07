import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { signIn, sendPasswordReset } from "../services/authService";
import { supabase } from "../services/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const { user } = await signIn({ email, password });
      toast.success("Welcome back.");
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      const fallback = profile?.role === "owner" ? "/admin" : "/";
      navigate(location.state?.from?.pathname || fallback, { replace: true });
    } catch (err) {
      toast.error(err.message || "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!email) return toast.error("Enter your email address first.");
    try {
      await sendPasswordReset(email);
      toast.success("Password reset email sent.");
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <>
      <Navbar />
      <main className="auth-page">
        <div className="auth-card">
          <span className="eyebrow">WELCOME BACK</span>
          <h1>
            Sign in to <em>Chinny Trends</em>
          </h1>
          <p>Access your account and saved details.</p>
          <form onSubmit={submit}>
            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </label>
            <button className="button button-dark button-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <button className="auth-text-button" onClick={reset}>
            Forgot your password?
          </button>
          <div className="auth-divider">NEW TO Chinny Trends</div>
          <Link className="button button-outline button-full" to="/register">
            Create an account
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
