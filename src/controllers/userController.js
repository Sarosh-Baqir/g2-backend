const { user } = require("../../db/schema/user");
const { agencyUser } = require("../../db/schema/agencyUser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const generateUUID = require("../utils/uuid");
const { eq, and } = require("drizzle-orm");
const database = require("../../db/database");

const createUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userId = generateUUID();
    const hashedPassword = await bcrypt.hash(password, 10);

    const User = await database.insert(user).values({
      user_id: userId,
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({ message: "User created successfully", User });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const User = await database
      .select()
      .from(user)
      .where(eq(user.email, email));

    if (!User.length) {
      return res.status(401).json({ message: "User not registered!" });
    }

    const isPasswordValid = await bcrypt.compare(password, User[0].password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Incorrect credentials!" });
    }

    //const token = generateToken(User[0]);
    // Generate tokens
    const accessToken = generateAccessToken(User[0]);
    const refreshToken = generateRefreshToken(User[0]);
    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: { id: User[0].user_id, email: User[0].email },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Generate Access Token
const generateAccessToken = (user) => {
  return jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, {
    expiresIn: "1h", // Set a short expiration time for access tokens
  });
};

// Generate Refresh Token
const generateRefreshToken = (user) => {
  return jwt.sign({ userId: user.user_id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "2h", // Set a longer expiration time for refresh tokens
  });
};

const refreshToken = async (req, res) => {
  const { token } = req.body;

  if (!token)
    return res.status(403).json({ message: "Refresh token required" });

  try {
    // Verify refresh token
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    // Generate new tokens
    const newAccessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const newRefreshToken = jwt.sign(
      { userId: decoded.userId },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

const assignAdmin = async (req, res) => {
  const { agency_id, user_email } = req.body;
  const creator_id = req.userId;

  try {
    const creatorInAgency = await database
      .select()
      .from(agencyUser)
      .where(
        and(
          eq(agencyUser.agency_id, agency_id),
          eq(agencyUser.user_id, creator_id),
          eq(agencyUser.is_admin, true)
        )
      );

    if (!creatorInAgency.length) {
      return res
        .status(403)
        .json({ message: "You are not authorized to assign admin" });
    }

    const User = await database
      .select()
      .from(user)
      .where(eq(user.email, user_email));

    if (!User.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const AgencyUser = await database
      .select()
      .from(agencyUser)
      .where(
        and(
          eq(agencyUser.agency_id, agency_id),
          eq(agencyUser.user_id, User[0].user_id),
          eq(agencyUser.is_admin, false)
        )
      );

    if (!AgencyUser.length) {
      return res
        .status(404)
        .json({ message: "User is not part of the agency" });
    }

    await database
      .update(agencyUser)
      .set({ is_admin: true })
      .where(
        and(
          eq(agencyUser.agency_id, agency_id),
          eq(agencyUser.user_id, User[0].user_id)
        )
      );

    res.status(200).json({ message: "Admin assigned successfully", User });
  } catch (error) {
    console.error("Error assigning admin:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = {
  createUser,
  loginUser,
  assignAdmin,
  refreshToken,
};
