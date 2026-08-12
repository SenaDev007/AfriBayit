import { z } from 'zod';

export const userRegisterSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  country: z.enum(['BJ', 'CI', 'BF', 'TG', 'SN']).optional(),
  role: z.enum(['buyer', 'seller', 'investor', 'tourist', 'artisan', 'agent', 'hotelier', 'trainer', 'notary', 'geometer', 'certified_agent', 'premium_agent', 'artisan_pro']).default('buyer'),
});

export const userLoginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  country: z.enum(['BJ', 'CI', 'BF', 'TG', 'SN']).optional(),
  city: z.string().optional(),
  bio: z.string().max(500).optional(),
  preferredLanguage: z.enum(['fr', 'en', 'sw', 'ha', 'wo', 'ar']).optional(),
  currency: z.enum(['XOF', 'EUR', 'USD', 'NGN', 'GHS', 'KES']).optional(),
});

export type UserRegisterInput = z.infer<typeof userRegisterSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
