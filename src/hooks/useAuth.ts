import { useState } from "react";
import type { LoginInput, RegisterInput } from "../lib/schemas/auth.schema";

interface UseAuthReturn {
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  isLoading: boolean;
  error: string;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const clearError = () => setError("");

  const login = async (data: LoginInput): Promise<void> => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.error?.message || "Błąd logowania");
      }

      // Success - redirect to dashboard page
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterInput): Promise<void> => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData?.error?.message || "Błąd rejestracji");
      }

      // Success - redirect to home page
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    register,
    isLoading,
    error,
    clearError,
  };
}
