import { useState, useEffect } from "react";

type AuthUser = {
  id: string;
  email?: string | null;
};

type AuthSession = {
  user: AuthUser;
} | null;

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          if (!isMounted) return;
          setUser(null);
          setSession(null);
          return;
        }

        const data = await response.json();
        if (!isMounted) return;

        const currentUser: AuthUser | null = data.user ?? null;
        setUser(currentUser);
        setSession(currentUser ? { user: currentUser } : null);
      } catch (error) {
        console.error("Error loading auth session:", error);
        if (!isMounted) return;
        setUser(null);
        setSession(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error during sign out:", error);
    } finally {
      setUser(null);
      setSession(null);
    }
  };

  return { user, session, loading, signOut };
};
