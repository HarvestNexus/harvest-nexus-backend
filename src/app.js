require("dotenv").config();
require("./config/db");

const express = require("express");
const cors = require("cors");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Routes
const farmerRoutes = require("./routes/farmerRoutes");
const buyerRoutes = require("./routes/buyerRoutes");
const storageRoutes = require("./routes/storageRoutes");
const logisticsRoutes = require("./routes/logisticsRoutes");
const googleAuthRoutes = require("./routes/googleAuthRoutes");
const productRoutes = require("./routes/productRoutes");

// API Base Routes
app.use("/api/farmer", farmerRoutes);
app.use("/api/buyer", buyerRoutes);
app.use("/api/storage", storageRoutes);
app.use("/api/logistics", logisticsRoutes);
app.use("/api/auth", googleAuthRoutes);
app.use("/api/products", productRoutes);

app.get("/", (_req, res) => {
  res.status(200).send("🌾 Harvest Nexus API is running smoothly...");
});

app.use((err, _req, res, _next) => {
  console.error("Server Error:", err.message);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`✅ Harvest Nexus server running on port ${PORT}`)
);
