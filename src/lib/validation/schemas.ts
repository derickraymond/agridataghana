import { z } from "zod";
import { REGISTRATION_TYPES } from "@/lib/config/roles";

const password = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128)
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

export const registerSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  phone: z.string().trim().regex(/^\+?[0-9 ]{7,20}$/, "Enter a valid phone number, e.g. +233 24 123 4567"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  password,
  location: z.string().trim().min(2, "Enter your town or region").max(160),
  account_type: z.enum(REGISTRATION_TYPES as [string, ...string[]], { message: "Choose an account type" }),
  consent_terms: z.literal("on", { message: "You must accept the Terms and Privacy Policy" }),
  consent_marketing: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password").max(128),
});

export const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

export const resetSchema = z
  .object({ password, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords do not match" });

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: z.string().trim().email("Enter a valid email address").max(254),
  subject: z.string().trim().min(3, "Enter a subject").max(160),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(4000),
});
