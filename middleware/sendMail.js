const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.API_KEY);

const sendMail = async ({ to, subject, html }) => {
  try {
    await sgMail.send({
      from: process.env.EMAIL_ADDRESS, // Must be verified in SendGrid
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error.response ? error.response.body : error);
    throw error;
  }
};

module.exports = sendMail;
