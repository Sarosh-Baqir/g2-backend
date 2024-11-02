const { z } = require("zod");

// Zod schema for user signup validation
const signupValidationSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" }),
  email: z.string().email({ message: "Invalid email format" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
});

// Zod schema for login validation
const loginValidationSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
});

// Zod schema for assigning admin
const assignAdminValidationSchema = z.object({
  agency_id: z.string().uuid({ message: "Invalid agency ID format" }),
  user_email: z.string().email({ message: "Invalid email format" }),
});

module.exports = {
  signupValidationSchema,
  loginValidationSchema,
  assignAdminValidationSchema,
};
