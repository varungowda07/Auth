const nodeMailer = require('nodemailer');

const transport = nodeMailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,      // SSL port
    secure: true,   // true for 465, false for 587
    auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.PASSWORD, // App password
    },
});

module.exports = transport;
