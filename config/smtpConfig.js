module.exports.smtpConfig = {
  passwd: process.env.SMTP_PASSWORD,
  clientId: process.env.SMTP_CLIENT_ID,
  clientSecret: process.env.SMTP_CLIENT_SECRET,
  refreshToken: process.env.SMTP_REFRESH_TOKEN
}
