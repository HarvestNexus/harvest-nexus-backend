require("dotenv").config();

const crypto = require("crypto");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const Payment = require("../models/paymentModel");
const DeliveryRequest = require("../models/deliveryRequestModel");
const Notification = require("../models/notificationModel");

const generateRef = () => "HN-" + crypto.randomBytes(4).toString("hex").toUpperCase();

/* ==================================================
   CREATE ORDER — Checkout (Buyer)
================================================== */
exports.createOrder = async (req, res) => {
  try {
    const { delivery_address, delivery_method, payment_method, logistics_id, notes } = req.body;

    if (!delivery_address || !payment_method)
      return res.status(400).json({ success: false, message: "Delivery address and payment method are required." });

    const cart = await Cart.findOne({ buyer_id: req.user.id });

    if (!cart || cart.items.length === 0)
      return res.status(400).json({ success: false, message: "Your cart is empty." });

    const orderItems = cart.items.map(item => ({
      product_id: item.product_id,
      farmer_id: item.farmer_id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
    }));

    const subtotal = orderItems.reduce((sum, i) => sum + i.subtotal, 0);
    const delivery_fee = delivery_method === "pickup" ? 0 : 500;
    const total_amount = subtotal + delivery_fee;

    const order = await Order.create({
      buyer_id: req.user.id,
      items: orderItems,
      delivery_address,
      delivery_method: delivery_method || "delivery",
      logistics_id: logistics_id || undefined,
      subtotal,
      delivery_fee,
      total_amount,
      payment_method,
      reference: generateRef(),
      notes,
    });

    await Payment.create({
      order_id: order._id,
      buyer_id: req.user.id,
      amount: total_amount,
      method: payment_method,
      status: "pending",
      reference: order.reference,
    });

    if (delivery_method !== "pickup" && logistics_id) {
      const addressStr = `${delivery_address.street}, ${delivery_address.city}, ${delivery_address.state}`;
      await DeliveryRequest.create({
        order_id: order._id,
        logistics_id,
        buyer_id: req.user.id,
        pickup_address: "Farmer location",
        delivery_address: addressStr,
        items_description: orderItems.map(i => `${i.name} x${i.quantity}`).join(", "),
        delivery_fee,
      });
    }

    await Cart.findOneAndUpdate({ buyer_id: req.user.id }, { $set: { items: [] } });

    const farmerIds = [...new Set(orderItems.map(i => i.farmer_id.toString()))];
    for (const farmerId of farmerIds) {
      await Notification.create({
        user_id: farmerId,
        user_role: "farmer",
        title: "New Order Received",
        message: `You have a new order. Reference: ${order.reference}`,
        type: "order",
        ref_id: order._id,
      });
    }

    return res.status(201).json({ success: true, message: "Order placed successfully.", data: order });
  } catch (err) {
    console.error("Create Order:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   GET BUYER'S ORDERS
================================================== */
exports.getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { buyer_id: req.user.id };
    if (status) filter.order_status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .populate("items.farmer_id", "full_name farm_name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error("Get Buyer Orders:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   GET SINGLE ORDER (Buyer)
================================================== */
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, buyer_id: req.user.id })
      .populate("items.farmer_id", "full_name farm_name phone_number email")
      .populate("logistics_id", "company_name phone_number vehicle_type");

    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    console.error("Get Order:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   CANCEL ORDER (Buyer)
================================================== */
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, buyer_id: req.user.id });

    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    if (!["pending", "confirmed"].includes(order.order_status))
      return res.status(400).json({ success: false, message: "Order cannot be cancelled at this stage." });

    order.order_status = "cancelled";
    await order.save();

    return res.status(200).json({ success: true, message: "Order cancelled successfully." });
  } catch (err) {
    console.error("Cancel Order:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   GET FARMER'S RECEIVED ORDERS
================================================== */
exports.getFarmerOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { "items.farmer_id": req.user.id };
    if (status) filter.order_status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .populate("buyer_id", "full_name email phone_number address")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error("Get Farmer Orders:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   FARMER CONFIRMS ORDER
================================================== */
exports.confirmOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, "items.farmer_id": req.user.id, order_status: "pending" },
      { order_status: "confirmed" },
      { new: true }
    );

    if (!order) return res.status(404).json({ success: false, message: "Order not found or already confirmed." });

    await Notification.create({
      user_id: order.buyer_id,
      user_role: "buyer",
      title: "Order Confirmed",
      message: `Your order ${order.reference} has been confirmed by the farmer.`,
      type: "order",
      ref_id: order._id,
    });

    return res.status(200).json({ success: true, message: "Order confirmed.", data: order });
  } catch (err) {
    console.error("Confirm Order:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   FARMER MARKS ORDER READY
================================================== */
exports.markOrderReady = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, "items.farmer_id": req.user.id, order_status: "confirmed" },
      { order_status: "processing" },
      { new: true }
    );

    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    await Notification.create({
      user_id: order.buyer_id,
      user_role: "buyer",
      title: "Order Ready",
      message: `Your order ${order.reference} is ready for pickup/delivery.`,
      type: "order",
      ref_id: order._id,
    });

    return res.status(200).json({ success: true, message: "Order marked as ready.", data: order });
  } catch (err) {
    console.error("Mark Order Ready:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
