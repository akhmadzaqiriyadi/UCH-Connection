export const config = {
  // ... existing config
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || 'user@example.com',
    pass: process.env.SMTP_PASS || 'password',
    from: process.env.SMTP_FROM || '"UTY Connection" <no-reply@uty.ac.id>',
  },
};
