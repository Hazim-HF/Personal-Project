const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = authMiddleware;
