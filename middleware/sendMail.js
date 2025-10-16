const nodeMailer = require('nodemailer');

const transport = nodeMailer.createTransport({
    service: 'SendGrid',
    auth: {
        user: process.env.SENDGRID_USERNAME,
        pass: process.env.SENDGRID_PASSWORD,
    },
});

module.exports = transport;
