// test_email.ts
import { mailer } from './src/lib/mailer';

console.log('📧 Testing Email System...');

try {
  const isConnected = await mailer.verifyConnection();
  if (!isConnected) {
    console.error('❌ SMTP Connection Failed');
    process.exit(1);
  }

  console.log('✅ SMTP Connection Verified');

  console.log('📨 Sending Test Email...');
  const result = await mailer.send({
    to: 'test-user@example.com',
    subject: 'UTY Connection - Test Email',
    html: '<h1>Hello!</h1><p>This is a test email from UTY Connection system.</p>',
    text: 'Hello! This is a test email from UTY Connection system.',
  });

  console.log('✅ Email Sent Successfully!');
  console.log('----------------------------------------');
  console.log('Message ID:', result.messageId);
  if (result.previewUrl) {
    console.log('🔗 PREVIEW HERE (Click to view):', result.previewUrl);
  }
  console.log('----------------------------------------');
  process.exit(0);
} catch (error) {
  console.error('❌ Error testing email:', error);
  process.exit(1);
}
