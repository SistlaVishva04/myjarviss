import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import BackgroundGrid from "@/components/BackgroundGrid";
import { z } from "zod";
import { API_BASE_URL } from "@/lib/api";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast.error(emailResult.error.errors[0].message);
      return;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast.error(passwordResult.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin
        ? `${API_BASE_URL}/api/auth/login`
        : `${API_BASE_URL}/api/auth/register`;
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      }, 10_000);

      if (!response.ok) {
        let message = "Authentication failed";

        try {
          const data = await response.json();
          if (data?.error || data?.message) {
            message = data.error || data.message;
          }
        } catch {
          // ignore JSON parse errors and fall back to generic message
        }

        if (!isLogin && response.status === 409) {
          toast.error("This email is already registered. Please login instead.");
          return;
        }

        throw new Error(message);
      }

      if (isLogin) {
        toast.success("Welcome back, Sir.");
      } else {
        toast.success("Account created successfully!");
      }

      navigate("/");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <BackgroundGrid />
      <div className="auth-layout">
        <a className="auth-brand" href="/" aria-label="myVishva home">
          <span className="brand-mark" aria-hidden="true">V</span>
          <span>myVishva</span>
        </a>
        <section className="auth-card" aria-labelledby="auth-heading">
          <h1 id="auth-heading" className="auth-title">
            {isLogin ? "Sign in to myVishva" : "Create your account"}
          </h1>
          <p className="auth-subtitle">
            Keep your conversation history across sessions.
          </p>

          <form onSubmit={handleAuth} className="auth-form">
            <div>
              <label className="auth-form-label" htmlFor="auth-email">Email address</label>
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="auth-field"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="auth-form-label" htmlFor="auth-password">Password</label>
              <Input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="auth-field"
                autoComplete={isLogin ? "current-password" : "new-password"}
                minLength={6}
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="auth-submit w-full">
              {loading ? "Connecting…" : isLogin ? "Sign in" : "Create account"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="auth-link w-full"
          >
            {isLogin ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </section>

        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="auth-link auth-guest"
        >
          Continue without signing in
        </Button>
      </div>
    </main>
  );
};

export default Auth;
