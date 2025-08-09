const Contact = require('../models/Contact');

exports.contact = async (req, res) => {
  const { name, email, phone, address, message } = req.body;

  if (!name || !email || !phone || !address || !message) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    await Contact.create({ name, email, phone, address, message });
    return res.status(201).json({ message: 'Your message has been sent successfully!' });
  } catch (err) {
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};
