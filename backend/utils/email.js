const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use any email service, e.g., Gmail, SendGrid, etc.
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});

async function sendEmail(to, subject, text) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent:', mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

module.exports = { sendEmail };
