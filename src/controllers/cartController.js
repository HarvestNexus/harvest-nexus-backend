const Cart = require("../models/cartModel");
const Product = require("../models/productModel");

/* ==================================================
   GET CART
================================================== */
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ buyer_id: req.user.id })
      .populate("items.product_id", "name images status price");

    if (!cart) return res.status(200).json({ success: true, data: { items: [], total: 0 } });

    const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return res.status(200).json({ success: true, data: { items: cart.items, total } });
  } catch (err) {
    console.error("Get Cart:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   ADD TO CART
================================================== */
exports.addToCart = async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    if (!product_id)
      return res.status(400).json({ success: false, message: "Product ID is required." });

    const product = await Product.findById(product_id);

    if (!product || product.status !== "available")
      return res.status(404).json({ success: false, message: "Product is not available." });

    if (quantity > product.quantity_available)
      return res.status(400).json({ success: false, message: "Requested quantity exceeds available stock." });

    let cart = await Cart.findOne({ buyer_id: req.user.id });

    if (!cart) cart = new Cart({ buyer_id: req.user.id, items: [] });

    const existingItem = cart.items.find(i => i.product_id.toString() === product_id);

    if (existingItem) {
      existingItem.quantity += Number(quantity);
    } else {
      cart.items.push({
        product_id,
        farmer_id: product.farmer_id,
        name: product.name,
        price: product.price,
        quantity: Number(quantity),
      });
    }

    await cart.save();

    return res.status(200).json({ success: true, message: "Added to cart.", data: cart });
  } catch (err) {
    console.error("Add to Cart:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   UPDATE CART ITEM QUANTITY
================================================== */
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1)
      return res.status(400).json({ success: false, message: "Quantity must be at least 1." });

    const cart = await Cart.findOne({ buyer_id: req.user.id });

    if (!cart) return res.status(404).json({ success: false, message: "Cart not found." });

    const item = cart.items.id(itemId);

    if (!item) return res.status(404).json({ success: false, message: "Item not found in cart." });

    item.quantity = Number(quantity);
    await cart.save();

    return res.status(200).json({ success: true, message: "Cart updated.", data: cart });
  } catch (err) {
    console.error("Update Cart Item:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   REMOVE CART ITEM
================================================== */
exports.removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOneAndUpdate(
      { buyer_id: req.user.id },
      { $pull: { items: { _id: itemId } } },
      { new: true }
    );

    if (!cart) return res.status(404).json({ success: false, message: "Cart not found." });

    return res.status(200).json({ success: true, message: "Item removed from cart.", data: cart });
  } catch (err) {
    console.error("Remove Cart Item:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   CLEAR CART
================================================== */
exports.clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ buyer_id: req.user.id }, { $set: { items: [] } });

    return res.status(200).json({ success: true, message: "Cart cleared." });
  } catch (err) {
    console.error("Clear Cart:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
