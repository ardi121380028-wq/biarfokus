"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthModalProps = {
  mode: "sign-in" | "sign-up";
  setMode: (mode: "sign-in" | "sign-up") => void;
  onClose: () => void;
};

export function AuthModal({ mode, setMode, onClose }: AuthModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isSignUp = mode === "sign-up";

  async function submitAuth() {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const result = isSignUp
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) {
        setError(result.error.message);
        return;
      }
      if (isSignUp) {
        setStatus("Akun dibuat. Cek email kamu untuk verifikasi sebelum login.");
        return;
      }
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Gagal memproses autentikasi.");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await getSupabaseBrowserClient().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (authError) setError(authError.message);
    } catch (oauthError) {
      setError(oauthError instanceof Error ? oauthError.message : "Gagal memulai Google login.");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    if (!email) {
      setError("Masukkan email terlebih dahulu.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await getSupabaseBrowserClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (authError) {
        setError(authError.message);
        return;
      }
      setStatus("Link reset password sudah dikirim ke email kamu.");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Gagal mengirim link reset password.");
    } finally {
      setLoading(false);
    }
  }

  return <div className="modal-backdrop" role="presentation" onClick={onClose}>
    <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" onClick={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose} aria-label="Tutup login">×</button>
      <div className="auth-heading"><h2 id="auth-title">{isSignUp ? "Create Account" : "Welcome Back"}</h2><p>Focus better. Finish more.</p></div>
      <button className="google-button" onClick={() => void signInWithGoogle()} disabled={loading}>G <span>Sign in With Google SSO</span></button>
      <div className="auth-divider"><span>OR</span></div>
      {isSignUp && <label className="auth-field">Username<input required placeholder="e.g ardikharisma_" /></label>}
      <label className="auth-field">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="e.g hello@example.com" /></label>
      <label className="auth-field">Password<div className="password-field"><input required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="***********" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Tampilkan password">{showPassword ? "◉" : "◌"}</button></div></label>
      {!isSignUp && <button className="forgot-button" onClick={() => void resetPassword()}>Forgot Password?</button>}
      <button className="auth-submit" onClick={() => void submitAuth()} disabled={loading}>{loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}</button>
      <small>By continuing, I agree to the <a href="#terms">Terms of service</a> and <a href="#privacy">Privacy policy</a>.</small>
      {error && <p className="auth-status auth-error">{error}</p>}
      {status && <p className="auth-status">{status}</p>}
      <p className="auth-switch">{isSignUp ? "Already Have Account?" : "Do not have an account?"} <button onClick={() => { setMode(isSignUp ? "sign-in" : "sign-up"); setError(null); setStatus(null); }}>{isSignUp ? "Sign In" : "Create Account"}</button></p>
    </section>
  </div>;
}
