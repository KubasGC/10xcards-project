import { useState } from "react";
import { AuthForm } from "./AuthForm";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    // Minimum 8 characters, at least one uppercase, one lowercase, and one number
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    return hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
  };

  const validateForm = (): boolean => {
    const errors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!email.trim()) {
      errors.email = "Email jest wymagany";
    } else if (!validateEmail(email)) {
      errors.email = "Podaj prawidłowy adres email";
    }

    if (!password) {
      errors.password = "Hasło jest wymagane";
    } else if (!validatePassword(password)) {
      errors.password = "Hasło musi mieć co najmniej 8 znaków, dużą i małą literę oraz cyfrę";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Powtórzenie hasła jest wymagane";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Hasła muszą być identyczne";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle general error
        throw new Error(data?.error?.message || "Błąd rejestracji");
      }

      // Success - redirect to generate page
      window.location.href = "/generate";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (): {
    strength: string;
    color: string;
    width: string;
  } => {
    if (!password) return { strength: "", color: "bg-gray-200", width: "w-0" };

    const checks = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;

    if (score === 4) return { strength: "Silne", color: "bg-green-500", width: "w-full" };
    if (score >= 3) return { strength: "Średnie", color: "bg-yellow-500", width: "w-3/4" };
    if (score >= 2) return { strength: "Słabe", color: "bg-orange-500", width: "w-1/2" };
    return { strength: "Bardzo słabe", color: "bg-red-500", width: "w-1/4" };
  };

  const passwordStrength = getPasswordStrength();

  const footer = (
    <div className="text-gray-600">
      Masz już konto?{" "}
      <a href="/login" className="font-medium text-primary hover:text-primary/90 transition-colors">
        Zaloguj się
      </a>
    </div>
  );

  return (
    <AuthForm
      title="Zarejestruj się"
      subtitle="Zacznij tworzyć fiszki 10x szybciej"
      isLoading={isLoading}
      error={error}
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) {
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
              fieldErrors.email ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
            }`}
            placeholder="twoj@email.com"
            disabled={isLoading}
          />
          {fieldErrors.email && <p className="mt-2 text-sm text-red-600">{fieldErrors.email}</p>}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Hasło
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
              fieldErrors.password ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
            }`}
            placeholder="••••••••"
            disabled={isLoading}
          />

          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Siła hasła:</span>
                <span className={`text-xs font-medium text-gray-700`}>{passwordStrength.strength}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color} ${passwordStrength.width}`}
                ></div>
              </div>
            </div>
          )}

          {fieldErrors.password && <p className="mt-2 text-sm text-red-600">{fieldErrors.password}</p>}

          <ul className="mt-2 space-y-1 text-xs text-gray-600">
            <li className="flex items-center gap-2">
              <svg
                className={`w-3 h-3 ${password.length >= 8 ? "text-green-600" : "text-gray-400"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Co najmniej 8 znaków
            </li>
            <li className="flex items-center gap-2">
              <svg
                className={`w-3 h-3 ${/[A-Z]/.test(password) ? "text-green-600" : "text-gray-400"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Jedna duża litera
            </li>
            <li className="flex items-center gap-2">
              <svg
                className={`w-3 h-3 ${/[a-z]/.test(password) ? "text-green-600" : "text-gray-400"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Jedna mała litera
            </li>
            <li className="flex items-center gap-2">
              <svg
                className={`w-3 h-3 ${/[0-9]/.test(password) ? "text-green-600" : "text-gray-400"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Jedna cyfra
            </li>
          </ul>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Powtórz hasło
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword) {
                setFieldErrors((prev) => ({
                  ...prev,
                  confirmPassword: undefined,
                }));
              }
            }}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
              fieldErrors.confirmPassword ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"
            }`}
            placeholder="••••••••"
            disabled={isLoading}
          />
          {fieldErrors.confirmPassword && <p className="mt-2 text-sm text-red-600">{fieldErrors.confirmPassword}</p>}
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-start">
          <input
            id="terms"
            type="checkbox"
            required
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mt-1"
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
            Akceptuję{" "}
            <a href="/terms" className="font-medium text-primary hover:text-primary/90">
              regulamin
            </a>{" "}
            i{" "}
            <a href="/privacy" className="font-medium text-primary hover:text-primary/90">
              politykę prywatności
            </a>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Tworzenie konta..." : "Zarejestruj się"}
        </button>
      </form>
    </AuthForm>
  );
}
