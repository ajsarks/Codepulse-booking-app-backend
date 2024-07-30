import express from 'express';
import sendEmail from '../utils/email.js'; // Adjust the path as necessary

const router = express.Router();

router.post('/', async (req, res) => {
  const { name, email, message, amount } = req.body;

  // Determine the subject based on the presence of the amount field
  const subject = amount ? 'New donation request' : 'New message from contact form';
  const text = amount 
    ? `Name: ${name}\nEmail: ${email}\nAmount: ${amount}`
    : `Name: ${name}\nEmail: ${email}\nMessage: ${message}`;

  try {
    // Ensure the email is sent to your email address
    await sendEmail(process.env.EMAIL, subject, text);
    res.status(200).send({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send({ success: false, message: 'Error sending email: ' + error.message });
  }
});

export default router;