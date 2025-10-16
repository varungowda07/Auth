const nodeMailer = require('nodemailer')

const transport = nodeMailer.createTransport({
    service:'gmail',
    auth:{
        user:process.env.EMAIL_ADDRESS,
        pass:process.env.PASSWORD
    }
})

module.exports = transport