const jwt = require("jsonwebtoken");

const protect = (...allowedRoles) => (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Not authorized. Token missing." });
  }

  try {
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};

module.exports = protect;
