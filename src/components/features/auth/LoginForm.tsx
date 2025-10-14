import { useState } from "react";
import { AuthForm } from "./AuthForm";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = "Email jest wymagany";
    } else if (!validateEmail(email)) {
      errors.email = "Podaj prawidłowy adres email";
    }

    if (!password) {
      errors.password = "Hasło jest wymagane";
    } else if (password.length < 8) {
      errors.password = "Hasło musi mieć co najmniej 8 znaków";
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
      // TODO: Implement actual login logic with Supabase
      // const response = await fetch('/api/v1/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password })
      // });

      // if (!response.ok) {
      //   const data = await response.json();
      //   throw new Error(data.error || 'Błąd logowania');
      // }

      // window.location.href = '/generate';

      console.log("Login attempt:", { email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsLoading(false);
    }
  };

  const footer = (
    <div className="text-gray-600">
      Nie masz konta?{" "}
      <a href="/register" className="font-medium text-primary hover:text-primary/90 transition-colors">
        Zarejestruj się
      </a>
    </div>
  );

  return (
    <AuthForm
      title="Zaloguj się"
      subtitle="Witaj ponownie! Zaloguj się do swojego konta"
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
          {fieldErrors.password && <p className="mt-2 text-sm text-red-600">{fieldErrors.password}</p>}
        </div>

        {/* Forgot Password Link */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
              Zapamiętaj mnie
            </label>
          </div>
          <a
            href="/forgot-password"
            className="text-sm font-medium text-primary hover:text-primary/90 transition-colors"
          >
            Zapomniałeś hasła?
          </a>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Logowanie..." : "Zaloguj się"}
        </button>
      </form>
    </AuthForm>
  );
}
