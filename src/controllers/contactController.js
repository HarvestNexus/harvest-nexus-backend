const Contact = require('../models/Contact');
const transporter = require('../config/gmail');

exports.contact = async (req, res) => {
  const { name, email, phone, address, message } = req.body;

  if (!name || !email || !phone || !address || !message) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    await Contact.create({ name, email, phone, address, message });
    await transporter.sendMail({
      from: `"Harvest Nexus" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "✅ We Received Your Message!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #f9f9f9; border-radius: 10px;">
          <h2 style="color: #2E7D32;">Hello ${name},</h2>
          <p>Thank you for contacting <strong>Harvest Nexus</strong>. We have received your message and will respond shortly.</p>
          <div style="padding: 15px; background: #ffffff; border-radius: 8px; margin-top: 15px;">
            <p><strong>Your Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <p style="margin-top: 20px;">📍 <strong>Address you provided:</strong> ${address}</p>
          <p style="margin-top: 20px;">Best regards,<br><strong>Harvest Nexus Team</strong></p>
        </div>
      `
    });

    return res.status(201).json({ message: 'Your message has been sent successfully!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};
