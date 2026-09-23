const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

dotenv.config();

const prisma = require("./prisma/client");
const authMiddleware = require("./middleware/authMiddleware");
const roleMiddleware = require("./middleware/roleMiddleware");
const accountRoutes = require("./routes/accountRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const serviceRecordRoutes = require("./routes/serviceRecordRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

app.use(express.json());
app.use(cookieParser());
// CLIENT_URL is a comma-separated list: every app front-end that talks to this gateway.
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

function toSafeUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function issueSession(res, user) {
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

// health check
app.get("/", (req, res) => {
  res.send("API is running");
});

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Role is never taken from the request body here - every public
    // registration is a plain USER. Admins are promoted separately.
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name, email, password: hashedPassword, role: "USER" },
      });

      // Every user needs at least one account before they can log a
      // transaction, so seed a default one they can rename or add to later.
      await tx.account.create({
        data: { userId: newUser.id, name: "Cash", type: "CASH" },
      });

      return newUser;
    });

    issueSession(res, user);

    res.status(201).json({
      message: "User registered successfully",
      user: toSafeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    issueSession(res, user);

    res.json({ message: "Logged in successfully", user: toSafeUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

app.get("/api/me", authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({ message: "Authorized", user: toSafeUser(user) });
});

app.get(
  "/api/admin",
  authMiddleware,
  roleMiddleware("ADMIN"),
  (req, res) => {
    res.json({ message: "Welcome admin" });
  }
);

app.use("/api/accounts", authMiddleware, accountRoutes);
app.use("/api/categories", authMiddleware, categoryRoutes);
app.use("/api/transactions", authMiddleware, transactionRoutes);
app.use("/api/vehicles", authMiddleware, vehicleRoutes);
app.use("/api/service-records", authMiddleware, serviceRecordRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
