const nodeMailer = require('nodemailer');

const transport = nodeMailer.createTransport({
    service: 'SendGrid',
    auth: {
        user: 'apikey',
        pass: process.env.API_KEY,
    },
});

module.exports = transport;
