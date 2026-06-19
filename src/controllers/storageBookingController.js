const Storage = require("../models/storageModel");
const StorageBooking = require("../models/storageBookingModel");
const Notification = require("../models/notificationModel");

/* ==================================================
   BROWSE AVAILABLE STORAGE (Farmer)
================================================== */
exports.getAllStorage = async (req, res) => {
  try {
    const { location, storage_type, page = 1, limit = 20 } = req.query;

    const filter = { is_available: true, isVerified: true };
    if (location) filter.storage_location = { $regex: location, $options: "i" };
    if (storage_type) filter.storage_type = storage_type;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Storage.countDocuments(filter);

    const storages = await Storage.find(filter)
      .select("-password")
      .sort({ rating: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: storages,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    console.error("Get All Storage:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   BOOK STORAGE (Farmer)
================================================== */
exports.bookStorage = async (req, res) => {
  try {
    const { storage_id, produce_type, quantity, duration_days, start_date, notes } = req.body;

    if (!storage_id || !produce_type || !quantity || !duration_days || !start_date)
      return res.status(400).json({ success: false, message: "All fields are required." });

    const storage = await Storage.findById(storage_id);

    if (!storage || !storage.is_available)
      return res.status(404).json({ success: false, message: "Storage facility not available." });

    const startDate = new Date(start_date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Number(duration_days));

    const total_price = storage.price_per_unit
      ? storage.price_per_unit * Number(quantity) * Number(duration_days)
      : null;

    const booking = await StorageBooking.create({
      farmer_id: req.user.id,
      storage_id,
      produce_type,
      quantity: Number(quantity),
      duration_days: Number(duration_days),
      start_date: startDate,
      end_date: endDate,
      total_price,
      notes,
    });

    await Notification.create({
      user_id: storage_id,
      user_role: "storage",
      title: "New Storage Booking Request",
      message: `A farmer wants to store ${quantity} units of ${produce_type} for ${duration_days} days.`,
      type: "storage",
      ref_id: booking._id,
    });

    return res.status(201).json({ success: true, message: "Storage booking request sent.", data: booking });
  } catch (err) {
    console.error("Book Storage:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   GET FARMER'S OWN BOOKINGS
================================================== */
exports.getMyBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { farmer_id: req.user.id };
    if (status) filter.status = status;

    const bookings = await StorageBooking.find(filter)
      .populate("storage_id", "storage_name storage_location storage_type price_per_unit capacity")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: bookings });
  } catch (err) {
    console.error("Get My Bookings:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ==================================================
   CANCEL BOOKING (Farmer)
================================================== */
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await StorageBooking.findOne({ _id: req.params.id, farmer_id: req.user.id });

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found." });

    if (!["pending"].includes(booking.status))
      return res.status(400).json({ success: false, message: "Only pending bookings can be cancelled." });

    booking.status = "cancelled";
    await booking.save();

    return res.status(200).json({ success: true, message: "Booking cancelled." });
  } catch (err) {
    console.error("Cancel Booking:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
