import { z } from "zod";

export const emailSchema = z
  .string()
  .min(1, "Email обязателен")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Некорректный email");

export const passwordSchema = z
  .string()
  .min(8, "Пароль должен быть минимум 8 символов")
  .regex(/[A-Z]/, "Добавьте хотя бы одну заглавную букву")
  .regex(/[0-9]/, "Добавьте хотя бы одну цифру");

export const nameSchema = z
  .string()
  .min(1, "Введите имя")
  .max(100, "Имя слишком длинное");

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Введите пароль"),
});

export const giftBoxSchema = z.object({
  recipientEmail: emailSchema,
  recipientName: z.string().max(200).optional(),
  occasion: z.string().min(1, "Укажите повод").max(200),
  budget: z.number().positive("Бюджет должен быть положительным").optional().nullable(),
  message: z.string().max(1000, "Сообщение слишком длинное").optional(),
});

export function validateEmail(email: string): string | null {
  const result = emailSchema.safeParse(email);
  return result.success ? null : result.error.errors[0].message;
}

export function validatePassword(password: string): string | null {
  const result = passwordSchema.safeParse(password);
  return result.success ? null : result.error.errors[0].message;
}

export function validateGiftBox(data: {
  recipientEmail: string;
  occasion: string;
  budget?: string;
}): string | null {
  const result = giftBoxSchema.safeParse({
    recipientEmail: data.recipientEmail,
    occasion: data.occasion,
    budget: data.budget ? Number(data.budget) : null,
  });
  if (result.success) return null;
  return result.error.errors[0].message;
}
