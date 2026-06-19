const express = require("express");
const router = express.Router();

const protect = require("../middleware/protect");
const productController = require("../controllers/productController");

/* ── PUBLIC ───────────────────────────────────── */
router.get("/", productController.getAllProducts);
router.get("/:id", productController.getProduct);

module.exports = router;
