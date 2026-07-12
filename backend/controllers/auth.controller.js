const jwt = require("jsonwebtoken");
const { User, ROLES } = require("../models/User");

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "8h",
    }
  );
}

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Name, email, password, and role are all required.",
      });
    }

    if (!ROLES.includes(role)) {
      return res.status(400).json({
        message: `Role must be one of: ${ROLES.join(", ")}`,
      });
    }

    const existing = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existing) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    return res.status(500).json({
      message: "Could not create account.",
      error: err.message,
    });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Email, password, and role are required.",
      });
    }

    if (!ROLES.includes(role)) {
      return res.status(400).json({
        message: `Role must be one of: ${ROLES.join(", ")}`,
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const match = await user.comparePassword(password);

    if (!match) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (user.role !== role) {
      return res.status(401).json({
        message: "The selected role does not match this account's role.",
      });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    return res.status(500).json({
      message: "Login failed.",
      error: err.message,
    });
  }
};

// GET /api/auth/roles
exports.getRoles = (req, res) => {
  return res.json({
    roles: ROLES,
  });
};