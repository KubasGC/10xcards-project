import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthForm } from "./AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { registerSchema, type RegisterInput } from "@/lib/schemas/auth.schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordStrengthIndicator } from "@/components/shared/PasswordStrengthIndicator";

export function RegisterForm() {
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onSubmit",
  });

  const { register, isLoading, error } = useAuth();

  const handleSubmit = async (values: RegisterInput) => {
    const isValid = await form.trigger();
    if (isValid) {
      register(values);
    }
  };

  const password = form.watch("password");

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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="twoj@email.com"
                    disabled={isLoading}
                    className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password Field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Hasło</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </FormControl>
                <PasswordStrengthIndicator password={password} />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confirm Password Field */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Powtórz hasło</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Tworzenie konta..." : "Zarejestruj się"}
          </Button>
        </form>
      </Form>
    </AuthForm>
  );
}
