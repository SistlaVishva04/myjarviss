import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "@/lib/api";
import { fetchWithTimeout, RequestTimeoutError } from "@/lib/fetchWithTimeout";

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
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/session`, {
          method: "GET",
          credentials: "include",
        });
        if (isMounted) {
          setBackendAvailable(response.ok);
          setSessionError(
            response.ok ? null : "Session service is unavailable. You can continue as a guest.",
          );
        }

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
          if (!(error instanceof RequestTimeoutError)) {
            console.warn("Auth session unavailable; continuing as a guest.");
          }
          if (!isMounted) return;
          setBackendAvailable(false);
          setSessionError(
            error instanceof RequestTimeoutError
              ? "The session check timed out. You can continue as a guest."
              : "The backend is unavailable. You can continue as a guest.",
          );
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

  useEffect(() => {
    let isMounted = true;
    const checkBackendHealth = async () => {
      try {
        const response = await fetchWithTimeout(
          `${API_BASE_URL}/api/health`,
          { method: "GET" },
          3_000,
        );
        if (isMounted) {
          setBackendAvailable(response.ok);
          if (response.ok) setSessionError(null);
        }
      } catch {
        if (isMounted) setBackendAvailable(false);
      }
    };
    const intervalId = window.setInterval(() => void checkBackendHealth(), 30_000);
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const reportBackendStatus = useCallback((available: boolean) => {
    setBackendAvailable(available);
  }, []);

  const signOut = async () => {
    try {
      await fetchWithTimeout(`${API_BASE_URL}/api/auth/logout`, {
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

  return {
    user,
    session,
    loading,
    signOut,
    backendAvailable,
    sessionError,
    reportBackendStatus,
  };
};
