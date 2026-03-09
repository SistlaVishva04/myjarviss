import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import BackgroundGrid from "@/components/BackgroundGrid";
import { z } from "zod";

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
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

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
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <BackgroundGrid />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-orbitron text-3xl md:text-4xl font-bold tracking-[0.3em] text-primary text-glow">
            J.A.R.V.I.S.
          </h1>
          <p className="font-rajdhani text-xs md:text-sm text-muted-foreground tracking-widest mt-2">
            AUTHENTICATION REQUIRED
          </p>
        </motion.div>

        {/* Auth Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="bg-card/50 backdrop-blur-xl border border-primary/30 rounded-lg p-8">
            <h2 className="font-orbitron text-xl text-center text-primary mb-6 tracking-wider">
              {isLogin ? "SYSTEM ACCESS" : "NEW USER REGISTRATION"}
            </h2>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="font-rajdhani text-sm text-muted-foreground block mb-2">
                  EMAIL ADDRESS
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tony@starkindustries.com"
                  className="bg-background/50 border-primary/30 focus:border-primary font-rajdhani"
                  required
                />
              </div>

              <div>
                <label className="font-rajdhani text-sm text-muted-foreground block mb-2">
                  PASSWORD
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-background/50 border-primary/30 focus:border-primary font-rajdhani"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 font-orbitron tracking-wider mt-6"
              >
                {loading ? "PROCESSING..." : isLogin ? "AUTHENTICATE" : "CREATE ACCOUNT"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="font-rajdhani text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin ? "Need access? Create an account" : "Already have access? Login"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Continue as Guest */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="font-rajdhani text-muted-foreground hover:text-primary"
          >
            Continue without login (no history)
          </Button>
        </motion.div>
      </div>

      {/* Ambient glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none">
        <div 
          className="absolute inset-0 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, hsl(187 100% 50% / 0.3) 0%, transparent 50%)",
          }}
        />
      </div>
    </div>
  );
};

export default Auth;
