const nodemailer = require('nodemailer');

/**
 * Shared Nodemailer transporter (mail "session").
 * Configure via .env — use a Gmail App Password, not your normal password.
 */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

const sendMail = async ({ to, subject, text, html }) => {
    return transporter.sendMail({
        from: process.env.GMAIL_USER,
        to,
        subject,
        text,
        html,
    });
};

module.exports = {
    transporter,
    sendMail,
};
