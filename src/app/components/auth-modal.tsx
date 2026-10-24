"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAppContext } from "@/app/providers/app-provider";

type AuthModalProps = {
  mode: "sign-in" | "sign-up";
  setMode: (mode: "sign-in" | "sign-up") => void;
  onClose: () => void;
};

function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0 }}
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export function AuthModal({ mode, setMode, onClose }: AuthModalProps) {
  const { setTermsModalOpen } = useAppContext();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
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
      const displayName = username.trim() || email.split("@")[0] || "Teman Fokus";
      const result = isSignUp
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: displayName,
                name: displayName,
              },
            },
          })
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) {
        setError(result.error.message);
        return;
      }
      if (isSignUp) {
        if (result.data?.session) {
          onClose();
          return;
        }
        setStatus("Akun berhasil dibuat. Cek email kamu untuk verifikasi sebelum login.");
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
      <button className="google-button" onClick={() => void signInWithGoogle()} disabled={loading}>
        <GoogleIcon />
        <span>Lanjutkan dengan Google</span>
      </button>
      <div className="auth-divider"><span>OR</span></div>
      {isSignUp && (
        <label className="auth-field">
          Nama / Username
          <input
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="e.g ardikharisma_"
          />
        </label>
      )}
      <label className="auth-field">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="e.g hello@example.com" /></label>
      <label className="auth-field">Password<div className="password-field"><input required type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="***********" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Tampilkan password">{showPassword ? "◉" : "◌"}</button></div></label>
      {!isSignUp && <button className="forgot-button" onClick={() => void resetPassword()}>Forgot Password?</button>}
      <button className="auth-submit" onClick={() => void submitAuth()} disabled={loading}>{loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}</button>
      <small>
        Dengan melanjutkan, kamu menyetujui{" "}
        <button
          type="button"
          className="auth-legal-link"
          onClick={() => {
            onClose();
            setTermsModalOpen(true);
          }}
        >
          Ketentuan Layanan (TOS)
        </button>{" "}
        dan{" "}
        <button
          type="button"
          className="auth-legal-link"
          onClick={() => {
            onClose();
            setTermsModalOpen(true);
          }}
        >
          Kebijakan Privasi
        </button>
        .
      </small>
      {error && <p className="auth-status auth-error">{error}</p>}
      {status && <p className="auth-status">{status}</p>}
      <p className="auth-switch">{isSignUp ? "Already Have Account?" : "Do not have an account?"} <button onClick={() => { setMode(isSignUp ? "sign-in" : "sign-up"); setError(null); setStatus(null); }}>{isSignUp ? "Sign In" : "Create Account"}</button></p>
    </section>
  </div>;
}
