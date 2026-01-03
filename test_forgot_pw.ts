
import { authService } from './src/features/auth/auth.service';
import { db } from './src/db';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';

console.log('🧪 Testing Forgot Password Flow...');

// 1. Setup Test User
const TEST_EMAIL = 'test-reset@uty.ac.id';
console.log(`Setting up user: ${TEST_EMAIL}`);

// Clean up existing
const existing = await db.query.users.findFirst({ where: eq(users.email, TEST_EMAIL) });
if (existing) {
  // Reset fields
  await db.update(users)
    .set({ resetToken: null, resetTokenExpires: null })
    .where(eq(users.id, existing.id));
} else {
  // Create if needed (Optional: assuming user exists or manually created)
  // For this test we assume admin@uty.ac.id exists from seeding or previous steps
}

// Use a known existing user or the one we just ensured
const targetEmail = 'admin@uty.ac.id'; 

try {
  // 2. Request Forgot Password
  console.log('📨 Requesting Forgot Password...');
  await authService.forgotPassword({ email: targetEmail });
  
  // 3. Verify Token in DB
  const user = await db.query.users.findFirst({
    where: eq(users.email, targetEmail),
  });

  if (!user || !user.resetToken) {
    throw new Error('Reset token not saved to DB');
  }

  console.log('✅ Token Saved:', user.resetToken);
  console.log('✅ Expiration:', user.resetTokenExpires);

  // 4. Reset Password
  console.log('🔐 Resetting Password...');
  const newPass = 'newpassword123';
  await authService.resetPassword({
    token: user.resetToken,
    newPassword: newPass,
  });

  console.log('✅ Password Reset Successfully');

  // Verify DB cleared
  const userAfter = await db.query.users.findFirst({ where: eq(users.id, user.id) });
  if (userAfter?.resetToken) {
    throw new Error('Token not cleared after reset');
  }
  console.log('✅ Token Cleared from DB');
  
  // Verify Login
  console.log('🔑 Verifying New Password Login...');
  await authService.login({ email: targetEmail, password: newPass });
  console.log('✅ Login with New Password Success');
  
  // Revert Password (optional, to keep seed data clean)
  const originalPass = 'password123';
  // Note: We can't easily revert via service without a token, so we'll just leave it or manual update if strict.
  
  process.exit(0);

} catch (error) {
  console.error('❌ Test Failed:', error);
  process.exit(1);
}
