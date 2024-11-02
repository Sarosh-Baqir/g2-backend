const express = require("express");
const {
  createUser,
  loginUser,
  assignAdmin,
} = require("../controllers/userController");
const authenticateUser = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validateRequest");

const {
  signupValidationSchema,
  loginValidationSchema,
  assignAdminValidationSchema,
} = require("../validation_schemas/user.validation_schema");

const router = express.Router();

// Route to create a new user (sign-up)
router.post("/signup", validateRequest(signupValidationSchema), createUser);

// Route to login a user
router.post("/login", validateRequest(loginValidationSchema), loginUser);

// Route to assign admin role
router.post(
  "/assign-admin",
  authenticateUser,
  validateRequest(assignAdminValidationSchema),
  assignAdmin
);

module.exports = router;
