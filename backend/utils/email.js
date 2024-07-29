import nodemailer from 'nodemailer';

const sendEmail = async (to, subject, text) => {
  // Create a transporter object using SMTP transport
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service
    auth: {
      user: process.env.EMAIL, // Your email address
      pass: process.env.PASSWORD, // Your email password or app-specific password
    },
  });

  // Email options
  const mailOptions = {
    from: process.env.EMAIL, // Sender address
    to, // List of receivers
    subject, // Subject line
    text, // Plain text body
  };

  // Send email
  await transporter.sendMail(mailOptions);
};

export default sendEmail;