const Product = require("../models/productModel");

/* ==================================================
   CREATE PRODUCT (Farmer only)
================================================== */
exports.createProduct = async (req, res) => {
  try {
    const { name, description, category, price, unit, quantity_available, images, location } = req.body;

    if (!name || !category || !price || !quantity_available)
      return res.status(400).json({ success: false, message: "Name, category, price and quantity are required." });

    const product = await Product.create({
      farmer_id: req.user.id,
      name,
      description,
      category,
      price,
      unit: unit || "kg",
      quantity_available,
      images: images || [],
      location,
    });

    return res.status(201).json({ success: true, message: "Product listed successfully.", data: product });
  } catch (err) {
    console.error("Create Product:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   GET ALL PRODUCTS — Marketplace (Public)
================================================== */
exports.getAllProducts = async (req, res) => {
  try {
    const { category, location, minPrice, maxPrice, search, page = 1, limit = 20 } = req.query;

    const filter = { status: "available" };

    if (category) filter.category = category;
    if (location) filter.location = { $regex: location, $options: "i" };
    if (search) filter.name = { $regex: search, $options: "i" };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Product.countDocuments(filter);

    const products = await Product.find(filter)
      .populate("farmer_id", "full_name farm_name location rating profile_image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("Get All Products:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   GET SINGLE PRODUCT (Public)
================================================== */
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("farmer_id", "full_name farm_name location rating profile_image phone_number email");

    if (!product || product.status === "removed")
      return res.status(404).json({ success: false, message: "Product not found." });

    return res.status(200).json({ success: true, data: product });
  } catch (err) {
    console.error("Get Product:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   GET FARMER'S OWN PRODUCTS
================================================== */
exports.getMyProducts = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { farmer_id: req.user.id };
    if (status) filter.status = status;

    const products = await Product.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: products });
  } catch (err) {
    console.error("Get My Products:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   UPDATE PRODUCT (Farmer only)
================================================== */
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, farmer_id: req.user.id });

    if (!product) return res.status(404).json({ success: false, message: "Product not found." });

    const allowedFields = ["name", "description", "category", "price", "unit", "quantity_available", "images", "location", "status"];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    });

    await product.save();

    return res.status(200).json({ success: true, message: "Product updated.", data: product });
  } catch (err) {
    console.error("Update Product:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   DELETE PRODUCT (Farmer only — soft delete)
================================================== */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, farmer_id: req.user.id },
      { status: "removed" },
      { new: true }
    );

    if (!product) return res.status(404).json({ success: false, message: "Product not found." });

    return res.status(200).json({ success: true, message: "Product removed from marketplace." });
  } catch (err) {
    console.error("Delete Product:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
