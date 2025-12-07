# Forgot Password Feature Setup Guide

This guide will help you set up the forgot password feature using Resend API for email delivery.

## 📋 What's Been Implemented

✅ **Database Schema**: Added `PasswordResetToken` model to track password reset requests  
✅ **Email Service**: Integrated Resend API for beautiful HTML email templates  
✅ **Server Actions**: Created secure password reset request and validation logic  
✅ **UI Pages**: Built forgot password and reset password pages with modern design  
✅ **Sign-In Integration**: Added "Forgot Password?" link to the sign-in page  

## 🚀 Setup Instructions

### Step 1: Install Required Packages

```bash
npm install resend
```

### Step 2: Get Resend API Key

1. Go to [Resend.com](https://resend.com) and create an account
2. Navigate to **API Keys** in the dashboard
3. Click **Create API Key**
4. Copy your API key

### Step 3: Configure Environment Variables

Add these variables to your `.env.local` file:

```env
# Resend API Configuration
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# App URL (update this in production)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Important Notes:**
- Replace `"re_xxxxxxxxxxxxxxxxxxxxx"` with your actual Resend API key
- For `RESEND_FROM_EMAIL`, use a verified domain email or the default `onboarding@resend.dev` for testing
- Update `NEXT_PUBLIC_APP_URL` to your production domain when deploying

### Step 4: Verify Your Domain (For Production)

For production use, you need to verify your domain in Resend:

1. Go to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records provided by Resend to your domain's DNS settings
5. Wait for verification (usually takes a few minutes to a few hours)

### Step 5: Run Database Migration

Generate and run the Prisma migration to create the `password_reset_tokens` table:

```bash
npx prisma migrate dev --name add_password_reset_tokens
```

Or if you prefer to push directly:

```bash
npx prisma db push
```

### Step 6: Generate Prisma Client

```bash
npx prisma generate
```

### Step 7: Test the Feature

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/sign-in`

3. Click the **"Forgot Password?"** link

4. Enter your email address and submit

5. Check your email inbox for the password reset link

6. Click the link in the email to reset your password

## 📁 Files Created

### Database Schema
- `prisma/schema.prisma` - Added `PasswordResetToken` model

### Email Service
- `lib/email.ts` - Resend email service with HTML template

### Server Actions
- `lib/actions/password-reset.actions.ts` - Password reset logic
  - `requestPasswordReset()` - Generates token and sends email
  - `resetPassword()` - Validates token and updates password
  - `verifyResetToken()` - Checks if token is valid

### UI Pages
- `app/(auth)/forgot-password/page.tsx` - Forgot password page
- `app/(auth)/forgot-password/forgot-password-form.tsx` - Form component
- `app/(auth)/reset-password/page.tsx` - Reset password page
- `app/(auth)/reset-password/reset-password-form.tsx` - Form component

### Modified Files
- `app/(auth)/sign-in/credentials-signin-form.tsx` - Added forgot password link

## 🔒 Security Features

- **Token Hashing**: Reset tokens are hashed using SHA-256 before storage
- **Token Expiration**: Reset links expire after 1 hour
- **One-Time Use**: Tokens are deleted after successful password reset
- **Rate Limiting**: Only one active reset token per user
- **No User Enumeration**: Same message returned whether user exists or not
- **OAuth Protection**: Prevents password reset for social login accounts

## 🎨 Email Template Features

- Responsive design that works on all devices
- Dark theme matching your DR.Gamer brand
- Purple gradient styling
- Clear call-to-action button
- Security warnings
- Fallback text link for email clients that block buttons

## 🧪 Testing in Development

During development, you can use Resend's test mode:

1. **Test Email Address**: Use `delivered@resend.dev` as a test recipient
2. **API Logs**: Check the Resend dashboard for email delivery logs
3. **Preview Emails**: Resend shows email previews in the dashboard

## 🚨 Troubleshooting

### Email Not Sending

1. **Check API Key**: Ensure `RESEND_API_KEY` is correctly set in `.env.local`
2. **Check From Email**: Verify `RESEND_FROM_EMAIL` is valid
3. **Domain Verification**: In production, make sure your domain is verified
4. **API Limits**: Free tier has rate limits - check Resend dashboard

### Token Invalid/Expired

1. **Check System Time**: Ensure server time is correct
2. **Token Expiry**: Tokens expire after 1 hour
3. **Database**: Verify `password_reset_tokens` table exists

### Emails Going to Spam

1. **Verify Domain**: Complete SPF/DKIM verification in Resend
2. **Content**: Avoid spam trigger words in custom email templates
3. **Sending Reputation**: New domains may have deliverability issues initially

## 📧 Customizing the Email Template

To customize the email template, edit `lib/email.ts`:

```typescript
export async function sendPasswordResetEmail({
  email,
  resetToken,
  userName,
}: SendPasswordResetEmailParams) {
  // Customize the HTML content here
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`
  
  // Modify the email subject, HTML, etc.
}
```

## 🌐 Production Deployment

### Environment Variables

Make sure to set these in your production environment:

```env
RESEND_API_KEY="your-production-api-key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

### Domain Setup

1. Add your production domain in Resend dashboard
2. Add the required DNS records (SPF, DKIM, DMARC)
3. Wait for verification
4. Update `RESEND_FROM_EMAIL` to use your verified domain

### Database Migration

Run the migration in your production database:

```bash
npx prisma migrate deploy
```

## 📊 Monitoring

Check the following in Resend dashboard:

- **Email Deliverability**: Track delivery rates
- **API Usage**: Monitor API call limits
- **Email Logs**: View sent emails and their status
- **Bounce Rates**: Monitor email bounce rates

## 🔗 Useful Links

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference/introduction)
- [Domain Verification Guide](https://resend.com/docs/dashboard/domains/introduction)

## ✅ Feature Complete!

Your forgot password feature is now fully functional with:
- ✅ Secure token generation and validation
- ✅ Beautiful branded email templates
- ✅ User-friendly UI with proper error handling
- ✅ Complete security measures
- ✅ Production-ready code

Users can now reset their passwords via email!

