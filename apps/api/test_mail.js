require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

transporter.sendMail({
    from: "Finix <onboarding@resend.dev>",
    to: "juanpablorolo2007@gmail.com",
    subject: "Test sending email",
    text: "Test email from Node.js"
}).then(info => console.log(info)).catch(console.error);
