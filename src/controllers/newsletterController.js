const Subscriber = require('../models/Subscriber');

exports.newsletter = async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Invalid email address.' });
  }

  try {
    const existing = await Subscriber.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already subscribed.' });
    }

    await Subscriber.create({ email });

    return res.status(201).json({ message: 'Thank you for subscribing!' });
  } catch (err) {
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};
