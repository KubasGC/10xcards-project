import { z } from "zod";

/**
 * Schemat walidacji dla danych logowania
 */
export const loginSchema = z.object({
  email: z.string().min(1, "Email jest wymagany").email("Podaj prawidłowy adres email"),
  password: z.string().min(1, "Hasło jest wymagane").min(6, "Hasło musi mieć co najmniej 6 znaków"),
});

/**
 * Schemat walidacji dla danych rejestracji
 */
export const registerSchema = z
  .object({
    email: z.string().min(1, "Email jest wymagany").email("Podaj prawidłowy adres email"),
    password: z.string().min(1, "Hasło jest wymagane").min(6, "Hasło musi mieć co najmniej 6 znaków"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

/**
 * Typy TypeScript wygenerowane ze schematów
 */
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Funkcje walidacji
 */
export const validateLoginInput = (data: unknown) => {
  return loginSchema.safeParse(data);
};

export const validateRegisterInput = (data: unknown) => {
  return registerSchema.safeParse(data);
};
