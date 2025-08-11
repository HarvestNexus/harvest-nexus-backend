const Subscriber = require('../models/Subscriber');
const transporter = require('../config/gmail');

exports.subscribeNewsletter = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    await Subscriber.create({ email });

    await transporter.sendMail({
      from: `"Harvest Nexus" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🎉 Welcome to Harvest Nexus!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #f9f9f9; border-radius: 10px;">
          <h2 style="color: #2E7D32;">Welcome to Harvest Nexus!</h2>
          <p>We're excited to have you on board. 🎉</p>
          <p>From now on, you’ll receive updates, tips, and exclusive offers directly to your inbox.</p>
          <p style="margin-top: 20px;">Best regards,<br><strong>Harvest Nexus Team</strong></p>
        </div>
      `
    });

    return res.status(201).json({ message: 'Subscribed successfully!' });
  } catch (err) {
    console.error('Error subscribing to newsletter:', err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};
