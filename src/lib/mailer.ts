import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from './utils';

const createTransporter = async () => {
  // If no host is configured or we are in dev/test without credentials, use Ethereal
  if (config.env !== 'production' && (!config.smtp.host || config.smtp.host === 'smtp.gmail.com')) {
    logger.info('🧪 Using Ethereal Email for testing (Dummy Credentials)...');
    const testAccount = await nodemailer.createTestAccount();
    
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // Use Real Config
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
};

// Initialize transporter lazily
let transporter: nodemailer.Transporter;

// Verify connection configuration
const verifyConnection = async () => {
  try {
    if (!transporter) transporter = await createTransporter();
    await transporter.verify();
    logger.info('🚀 SMTP Transporter is ready');
    return true;
  } catch (error) {
    logger.error('❌ SMTP Connection Error:', error);
    return false;
  }
};

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const mailer = {
  verifyConnection,
  
  send: async ({ to, subject, html, text }: SendMailOptions) => {
    try {
      if (!transporter) transporter = await createTransporter();

      const info = await transporter.sendMail({
        from: config.smtp.from,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>?/gm, ''), // fallback plain text
      });
      
      logger.info(`📧 Email sent: ${info.messageId} to ${to}`);
      
      // If using Ethereal, log the preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        logger.info(`🔗 Preview URL: ${previewUrl}`);
      }

      return { success: true, messageId: info.messageId, previewUrl };
    } catch (error) {
      logger.error('❌ Failed to send email:', error);
      throw error;
    }
  }
};
