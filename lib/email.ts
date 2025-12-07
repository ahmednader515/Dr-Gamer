import { Resend } from 'resend'
import { generateTrustpilotReviewLink } from './services/trustpilot.service'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendPasswordResetEmailParams {
  email: string
  resetToken: string
  userName: string
}

interface OrderEmailParams {
  order: any
  userName: string
  userEmail: string
}

export async function sendPasswordResetEmail({
  email,
  resetToken,
  userName,
}: SendPasswordResetEmailParams) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`

  console.log('📧 Attempting to send password reset email...')
  console.log('📧 API Key present:', !!process.env.RESEND_API_KEY)
  console.log('📧 From email:', process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev')
  console.log('📧 To email:', email)
  console.log('📧 Reset URL:', resetUrl)

  try {
    const result = await resend.emails.send({
      from: `DR.Gamer <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: email,
      replyTo: process.env.RESEND_REPLY_TO || 'support@dr-gamer.net',
      subject: 'Reset Your Password - DR.Gamer',
      text: `Hello ${userName},

We received a request to reset your password for your DR.Gamer account.

Reset your password: ${resetUrl}

Security Notice:
This password reset link will expire in 1 hour. If you didn't request this password reset, please ignore this email and your password will remain unchanged.

Questions? Contact us at support@dr-gamer.net

DR.Gamer - Your Gaming Destination
`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0f0a1f;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #1a0f2e; border-radius: 12px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #2d1a5f 0%, #1f0a4d 100%);">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                          DR.Gamer
                        </h1>
                        <p style="margin: 10px 0 0 0; color: #a78bfa; font-size: 14px;">
                          The Xbox world at your fingertips
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px;">
                          Password Reset Request
                        </h2>
                        <p style="margin: 0 0 20px 0; color: #d1d5db; font-size: 16px; line-height: 1.6;">
                          Hello <strong style="color: #ffffff;">${userName}</strong>,
                        </p>
                        <p style="margin: 0 0 20px 0; color: #d1d5db; font-size: 16px; line-height: 1.6;">
                          We received a request to reset your password for your DR.Gamer account. Click the button below to create a new password:
                        </p>
                        
                        <!-- Reset Button -->
                        <table role="presentation" style="margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);">
                                Reset Password
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 20px 0; color: #d1d5db; font-size: 14px; line-height: 1.6;">
                          Or copy and paste this link into your browser:
                        </p>
                        <p style="margin: 0 0 20px 0; padding: 12px; background-color: #2d1a5f; border-radius: 6px; color: #a78bfa; font-size: 14px; word-break: break-all;">
                          ${resetUrl}
                        </p>
                        
                        <!-- Security Notice -->
                        <div style="margin: 30px 0 0 0; padding: 20px; background-color: #2d1a5f; border-left: 4px solid #ef4444; border-radius: 6px;">
                          <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 14px; font-weight: bold;">
                            ⚠️ Security Notice
                          </p>
                          <p style="margin: 0; color: #d1d5db; font-size: 14px; line-height: 1.6;">
                            This password reset link will expire in <strong style="color: #ffffff;">1 hour</strong>. If you didn't request this password reset, please ignore this email and your password will remain unchanged.
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background-color: #0f0a1f; text-align: center; border-top: 1px solid #2d1a5f;">
                        <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 14px;">
                          DR.Gamer - Your Gaming Destination
                        </p>
                        <p style="margin: 0; color: #6b7280; font-size: 12px;">
                          This is an automated email. Please do not reply to this message.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    console.log('✅ Email sent successfully!')
    console.log('📧 Resend response:', JSON.stringify(result, null, 2))
    
    return { success: true }
  } catch (error) {
    console.error('❌ Error sending password reset email:', error)
    console.error('❌ Error details:', JSON.stringify(error, null, 2))
    return { success: false, error: 'Failed to send email' }
  }
}

export async function sendOrderConfirmationEmail({
  order,
  userName,
  userEmail,
}: OrderEmailParams) {
  console.log('📧 Sending order confirmation email to:', userEmail)

  try {
    const orderDetailsUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/orders/${order.id}`
    
    const result = await resend.emails.send({
      from: `DR.Gamer <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: userEmail,
      replyTo: process.env.RESEND_REPLY_TO || 'support@dr-gamer.net',
      subject: `Order Confirmation #${order.id.slice(-8)} - DR.Gamer`,
      text: `Hello ${userName},

Thank you for your order! We've received your order and will process it once payment is confirmed.

Order Summary:
- Order Number: #${order.id.slice(-8).toUpperCase()}
- Order Date: ${new Date(order.createdAt).toLocaleDateString()}
- Total Amount: ${Number(order.totalPrice).toFixed(2)} EGP
- Payment Status: Pending Confirmation

View your order details: ${orderDetailsUrl}

What's Next?
Our team will review your payment details and confirm your order shortly. You'll receive another email once your payment is confirmed and your order is being processed.

Questions? Contact us at support@dr-gamer.net

DR.Gamer - Your Gaming Destination
`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Confirmation</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0f0a1f;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #1a0f2e; border-radius: 12px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #2d1a5f 0%, #1f0a4d 100%);">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                          DR.Gamer
                        </h1>
                        <p style="margin: 10px 0 0 0; color: #a78bfa; font-size: 14px;">
                          The Xbox world at your fingertips
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Success Badge -->
                    <tr>
                      <td align="center" style="padding: 30px 40px 20px 40px;">
                        <div style="width: 64px; height: 64px; background-color: rgba(34, 197, 94, 0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                          <span style="font-size: 32px;">✓</span>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px; text-align: center;">
                          Order Received!
                        </h2>
                        <p style="margin: 0 0 20px 0; color: #d1d5db; font-size: 16px; line-height: 1.6; text-align: center;">
                          Hello <strong style="color: #ffffff;">${userName}</strong>,
                        </p>
                        <p style="margin: 0 0 30px 0; color: #d1d5db; font-size: 16px; line-height: 1.6; text-align: center;">
                          Thank you for your order! We've received your order and will process it once payment is confirmed.
                        </p>
                        
                        <!-- Order Summary Box -->
                        <div style="background-color: #2d1a5f; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
                          <h3 style="margin: 0 0 16px 0; color: #ffffff; font-size: 18px;">Order Summary</h3>
                          <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="padding: 8px 0; color: #9ca3af; font-size: 14px;">Order Number:</td>
                              <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right;">#${order.id.slice(-8).toUpperCase()}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #9ca3af; font-size: 14px;">Order Date:</td>
                              <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right;">${new Date(order.createdAt).toLocaleDateString()}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #9ca3af; font-size: 14px;">Total Amount:</td>
                              <td style="padding: 8px 0; color: #8b5cf6; font-size: 18px; font-weight: bold; text-align: right;">${Number(order.totalPrice).toFixed(2)} EGP</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #9ca3af; font-size: 14px;">Payment Status:</td>
                              <td style="padding: 8px 0; text-align: right;">
                                <span style="background-color: rgba(251, 191, 36, 0.2); color: #fbbf24; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                                  Pending Confirmation
                                </span>
                              </td>
                            </tr>
                          </table>
                        </div>
                        
                        <!-- View Order Button -->
                        <table role="presentation" style="margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <a href="${orderDetailsUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);">
                                View Order Details
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Info Box -->
                        <div style="margin: 30px 0 0 0; padding: 20px; background-color: #2d1a5f; border-left: 4px solid #3b82f6; border-radius: 6px;">
                          <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 14px; font-weight: bold;">
                            📝 What's Next?
                          </p>
                          <p style="margin: 0; color: #d1d5db; font-size: 14px; line-height: 1.6;">
                            Our team will review your payment details and confirm your order shortly. You'll receive another email once your payment is confirmed and your order is being processed.
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background-color: #0f0a1f; text-align: center; border-top: 1px solid #2d1a5f;">
                        <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 14px;">
                          DR.Gamer - Your Gaming Destination
                        </p>
                        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px;">
                          Questions? Contact us at support@dr-gamer.net
                        </p>
                        <p style="margin: 0; color: #6b7280; font-size: 12px;">
                          This is an automated email. Please do not reply to this message.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    console.log('✅ Order confirmation email sent successfully!')
    console.log('📧 Resend response:', JSON.stringify(result, null, 2))
    
    return { success: true }
  } catch (error) {
    console.error('❌ Error sending order confirmation email:', error)
    console.error('❌ Error details:', JSON.stringify(error, null, 2))
    return { success: false, error: 'Failed to send email' }
  }
}

export async function sendOrderPaidEmail({
  order,
  userName,
  userEmail,
}: OrderEmailParams) {
  console.log('📧 Sending order paid confirmation email to:', userEmail)

  try {
    const orderDetailsUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/orders/${order.id}`
    
    // Generate Trustpilot review link
    const trustpilotReviewLink = generateTrustpilotReviewLink({
      customerName: userName,
      customerEmail: userEmail,
      orderId: order.id,
    })
    
    const result = await resend.emails.send({
      from: `DR.Gamer <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: userEmail,
      replyTo: process.env.RESEND_REPLY_TO || 'support@dr-gamer.net',
      subject: `Payment Confirmed - Order #${order.id.slice(-8)} - DR.Gamer`,
      text: `Hello ${userName},

Great news! Your payment has been confirmed and your order is now being processed. Your gaming adventure is on its way!

Order Details:
- Order Number: #${order.id.slice(-8).toUpperCase()}
- Payment Date: ${new Date(order.paidAt || order.updatedAt).toLocaleDateString()}
- Total Paid: ${Number(order.totalPrice).toFixed(2)} EGP
- Payment Status: ✓ Paid

View your order details: ${orderDetailsUrl}

What's Next?
Your order is now being prepared for delivery. You'll receive your game codes and account details via email or WhatsApp shortly.
Expected delivery: ${new Date(order.expectedDeliveryDate).toLocaleDateString()}

═══════════════════════════════════════

⭐ HELP US IMPROVE! Rate Your Experience

We'd love to hear about your experience with DR.Gamer! Your feedback helps us serve you better.

Rate us on Trustpilot: ${trustpilotReviewLink}

Your review takes just 2 minutes and helps other gamers make informed decisions.

═══════════════════════════════════════

Questions? Contact us at support@dr-gamer.net

DR.Gamer - Your Gaming Destination
`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Confirmed</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0f0a1f;">
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #1a0f2e; border-radius: 12px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #2d1a5f 0%, #1f0a4d 100%);">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                          DR.Gamer
                        </h1>
                        <p style="margin: 10px 0 0 0; color: #a78bfa; font-size: 14px;">
                          The Xbox world at your fingertips
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Success Badge -->
                    <tr>
                      <td align="center" style="padding: 30px 40px 20px 40px;">
                        <div style="width: 64px; height: 64px; background-color: rgba(34, 197, 94, 0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                          <span style="font-size: 32px;">💳</span>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px;">
                        <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 24px; text-align: center;">
                          Payment Confirmed!
                        </h2>
                        <p style="margin: 0 0 20px 0; color: #d1d5db; font-size: 16px; line-height: 1.6; text-align: center;">
                          Hello <strong style="color: #ffffff;">${userName}</strong>,
                        </p>
                        <p style="margin: 0 0 30px 0; color: #d1d5db; font-size: 16px; line-height: 1.6; text-align: center;">
                          Great news! Your payment has been confirmed and your order is now being processed. Your gaming adventure is on its way!
                        </p>
                        
                        <!-- Order Summary Box -->
                        <div style="background-color: #2d1a5f; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
                          <h3 style="margin: 0 0 16px 0; color: #ffffff; font-size: 18px;">Order Details</h3>
                          <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="padding: 8px 0; color: #9ca3af; font-size: 14px;">Order Number:</td>
                              <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right;">#${order.id.slice(-8).toUpperCase()}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #9ca3af; font-size: 14px;">Payment Date:</td>
                              <td style="padding: 8px 0; color: #ffffff; font-size: 14px; text-align: right;">${new Date(order.paidAt || order.updatedAt).toLocaleDateString()}</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #9ca3af; font-size: 14px;">Total Paid:</td>
                              <td style="padding: 8px 0; color: #8b5cf6; font-size: 18px; font-weight: bold; text-align: right;">${Number(order.totalPrice).toFixed(2)} EGP</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; color: #9ca3af; font-size: 14px;">Payment Status:</td>
                              <td style="padding: 8px 0; text-align: right;">
                                <span style="background-color: rgba(34, 197, 94, 0.2); color: #22c55e; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                                  ✓ Paid
                                </span>
                              </td>
                            </tr>
                          </table>
                        </div>
                        
                        <!-- View Order Button -->
                        <table role="presentation" style="margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <a href="${orderDetailsUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);">
                                View Order Details
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Info Box -->
                        <div style="margin: 30px 0 0 0; padding: 20px; background-color: #2d1a5f; border-left: 4px solid #22c55e; border-radius: 6px;">
                          <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 14px; font-weight: bold;">
                            🎮 What's Next?
                          </p>
                          <p style="margin: 0; color: #d1d5db; font-size: 14px; line-height: 1.6;">
                            Your order is now being prepared for delivery. You'll receive your game codes and account details via email or WhatsApp shortly. Expected delivery: ${new Date(order.expectedDeliveryDate).toLocaleDateString()}
                          </p>
                        </div>

                        <!-- Trustpilot Review Invitation -->
                        <div style="margin: 30px 0 0 0; padding: 30px; background: linear-gradient(135deg, #2d1a5f 0%, #1f0a4d 100%); border-radius: 12px; text-align: center; border: 2px solid #8b5cf6;">
                          <div style="margin-bottom: 15px;">
                            <span style="font-size: 32px;">⭐⭐⭐⭐⭐</span>
                          </div>
                          <h3 style="margin: 0 0 15px 0; color: #ffffff; font-size: 20px; font-weight: bold;">
                            How Was Your Experience?
                          </h3>
                          <p style="margin: 0 0 20px 0; color: #d1d5db; font-size: 15px; line-height: 1.6;">
                            Your feedback helps us improve and helps other gamers make informed decisions. Share your experience with DR.Gamer!
                          </p>
                          <table role="presentation" style="margin: 0 auto;">
                            <tr>
                              <td align="center">
                                <a href="${trustpilotReviewLink}" style="display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #000000; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(251, 191, 36, 0.4);">
                                  ⭐ Rate Us on Trustpilot
                                </a>
                              </td>
                            </tr>
                          </table>
                          <p style="margin: 15px 0 0 0; color: #9ca3af; font-size: 12px;">
                            Takes only 2 minutes • Your opinion matters
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background-color: #0f0a1f; text-align: center; border-top: 1px solid #2d1a5f;">
                        <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 14px;">
                          DR.Gamer - Your Gaming Destination
                        </p>
                        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px;">
                          Questions? Contact us at support@dr-gamer.net
                        </p>
                        <p style="margin: 0; color: #6b7280; font-size: 12px;">
                          This is an automated email. Please do not reply to this message.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    console.log('✅ Order paid confirmation email sent successfully!')
    console.log('📧 Resend response:', JSON.stringify(result, null, 2))
    
    return { success: true }
  } catch (error) {
    console.error('❌ Error sending order paid confirmation email:', error)
    console.error('❌ Error details:', JSON.stringify(error, null, 2))
    return { success: false, error: 'Failed to send email' }
  }
}

export async function sendOrderDeliveredEmail({
  order,
  userName,
  userEmail,
}: OrderEmailParams) {
  console.log('📧 Sending order delivered email to:', userEmail)

  try {
    const orderDetailsUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/orders/${order.id}`
    const deliveredAt = order.deliveredAt || new Date()

    const result = await resend.emails.send({
      from: `DR.Gamer <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>` ,
      to: userEmail,
      replyTo: process.env.RESEND_REPLY_TO || 'support@dr-gamer.net',
      subject: `Order Delivered - #${order.id.slice(-8)} - DR.Gamer`,
      text: `Hello ${userName},

Great news! Your order has been delivered and is ready for you to enjoy.

Order Number: #${order.id.slice(-8).toUpperCase()}
Delivered At: ${new Date(deliveredAt).toLocaleString()}

View your order details: ${orderDetailsUrl}

Need help? We're here for you at support@dr-gamer.net.

Happy gaming!
DR.Gamer Team
`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Delivered</title>
          </head>
          <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#0f0a1f;color:#d1d5db;">
            <table role="presentation" style="width:100%;border-collapse:collapse;">
              <tr>
                <td align="center" style="padding:40px 0;">
                  <table role="presentation" style="width:600px;border-collapse:collapse;background-color:#1a0f2e;border-radius:12px;overflow:hidden;">
                    <tr>
                      <td style="padding:40px;text-align:center;background:linear-gradient(135deg,#2d1a5f 0%,#1f0a4d 100%);">
                        <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;">DR.Gamer</h1>
                        <p style="margin:10px 0 0 0;color:#a78bfa;font-size:14px;">The Xbox world at your fingertips</p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding:30px 40px 10px 40px;">
                        <div style="width:64px;height:64px;background-color:rgba(34,197,94,0.15);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:32px;">🚚</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 40px 40px 40px;text-align:left;">
                        <h2 style="margin:0 0 20px 0;color:#ffffff;font-size:24px;text-align:center;">Your Order Is Delivered!</h2>
                        <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;">Hello <strong style="color:#ffffff;">${userName}</strong>,</p>
                        <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;">Great news! We've completed delivery for your order. Your digital items are ready for you.</p>
                        <div style="background-color:#2d1a5f;border-radius:8px;padding:24px;margin-bottom:24px;">
                          <h3 style="margin:0 0 16px 0;color:#ffffff;font-size:18px;">Order Summary</h3>
                          <table style="width:100%;border-collapse:collapse;font-size:14px;">
                            <tr>
                              <td style="padding:8px 0;color:#9ca3af;">Order Number</td>
                              <td style="padding:8px 0;color:#ffffff;text-align:right;">#${order.id.slice(-8).toUpperCase()}</td>
                            </tr>
                            <tr>
                              <td style="padding:8px 0;color:#9ca3af;">Delivered At</td>
                              <td style="padding:8px 0;color:#ffffff;text-align:right;">${new Date(deliveredAt).toLocaleString()}</td>
                            </tr>
                            <tr>
                              <td style="padding:8px 0;color:#9ca3af;">Total Paid</td>
                              <td style="padding:8px 0;color:#8b5cf6;font-size:18px;font-weight:bold;text-align:right;">${Number(order.totalPrice).toFixed(2)} EGP</td>
                            </tr>
                          </table>
                        </div>
                        <table role="presentation" style="margin:30px auto;">
                          <tr>
                            <td align="center">
                              <a href="${orderDetailsUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#8b5cf6 0%,#6d28d9 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;">View Order Details</a>
                            </td>
                          </tr>
                        </table>
                        <div style="margin:24px 0 0 0;padding:20px;border-radius:8px;border-left:4px solid #8b5cf6;background-color:#2d1a5f;">
                          <p style="margin:0 0 10px 0;color:#ffffff;font-size:15px;font-weight:bold;">Need Assistance?</p>
                          <p style="margin:0;font-size:14px;">If you have any questions or need support, reply to this email or reach out to support@dr-gamer.net.</p>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:30px 40px;background-color:#0f0a1f;text-align:center;border-top:1px solid #2d1a5f;">
                        <p style="margin:0 0 10px 0;color:#9ca3af;font-size:14px;">DR.Gamer - Your Gaming Destination</p>
                        <p style="margin:0;color:#6b7280;font-size:12px;">Questions? Contact us at support@dr-gamer.net</p>
                        <p style="margin:10px 0 0 0;color:#6b7280;font-size:12px;">This is an automated email. Please do not reply to this message.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    console.log('✅ Order delivered email sent successfully!')
    console.log('📧 Resend response:', JSON.stringify(result, null, 2))
    return { success: true }
  } catch (error) {
    console.error('❌ Error sending order delivered email:', error)
    console.error('❌ Error details:', JSON.stringify(error, null, 2))
    return { success: false, error: 'Failed to send email' }
  }
}

export async function sendOrderCancellationEmail({
  order,
  userName,
  userEmail,
  reason,
}: OrderEmailParams & { reason?: string }) {
  console.log('📧 Sending order cancellation email to:', userEmail)

  const cancellationReason = reason && reason.trim() ? reason.trim() : 'No additional details were provided.'

  try {
    const orderDetailsUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/orders/${order.id}`
    const cancelledAt = order.cancelledAt || new Date()

    const result = await resend.emails.send({
      from: `DR.Gamer <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>` ,
      to: userEmail,
      replyTo: process.env.RESEND_REPLY_TO || 'support@dr-gamer.net',
      subject: `Order Cancelled - #${order.id.slice(-8)} - DR.Gamer`,
      text: `Hello ${userName},

We wanted to let you know that your order #${order.id.slice(-8).toUpperCase()} has been cancelled as of ${new Date(cancelledAt).toLocaleString()}.

Reason provided:
${cancellationReason}

If you have any questions or believe this was a mistake, please contact us at support@dr-gamer.net and we'll be happy to assist.

You can view the order details here: ${orderDetailsUrl}

Thank you,
DR.Gamer Support Team
`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Cancelled</title>
          </head>
          <body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#0f0a1f;color:#d1d5db;">
            <table role="presentation" style="width:100%;border-collapse:collapse;">
              <tr>
                <td align="center" style="padding:40px 0;">
                  <table role="presentation" style="width:600px;border-collapse:collapse;background-color:#1a0f2e;border-radius:12px;overflow:hidden;">
                    <tr>
                      <td style="padding:40px;text-align:center;background:linear-gradient(135deg,#4c1d95 0%,#1f0a4d 100%);">
                        <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;">DR.Gamer</h1>
                        <p style="margin:10px 0 0 0;color:#a78bfa;font-size:14px;">The Xbox world at your fingertips</p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding:30px 40px 10px 40px;">
                        <div style="width:64px;height:64px;background-color:rgba(239,68,68,0.15);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:32px;">⚠️</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 40px 40px 40px;text-align:left;">
                        <h2 style="margin:0 0 20px 0;color:#ffffff;font-size:24px;text-align:center;">Order Cancellation Notice</h2>
                        <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;">Hello <strong style="color:#ffffff;">${userName}</strong>,</p>
                        <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;">We’re sorry to inform you that your order has been cancelled. Please review the reason below:</p>
                        <div style="background-color:#2d1a5f;border-radius:8px;padding:20px;margin-bottom:24px;border-left:4px solid #ef4444;">
                          <h3 style="margin:0 0 12px 0;color:#ffffff;font-size:18px;">Cancellation Details</h3>
                          <p style="margin:0 0 12px 0;font-size:14px;">Order Number: <strong style="color:#ffffff;">#${order.id.slice(-8).toUpperCase()}</strong></p>
                          <p style="margin:0 0 12px 0;font-size:14px;">Cancelled At: <strong style="color:#ffffff;">${new Date(cancelledAt).toLocaleString()}</strong></p>
                          <p style="margin:0;font-size:14px;line-height:1.6;"><strong style="color:#ffffff;">Reason:</strong> ${cancellationReason}</p>
                        </div>
                        <div style="margin:0 0 24px 0;padding:20px;border-radius:8px;background-color:#33214f;border-left:4px solid #8b5cf6;">
                          <p style="margin:0;font-size:14px;line-height:1.6;">If you have already made a payment, a refund will be processed according to the payment method. For further details or clarification, please reply to this email or contact us at <a href="mailto:support@dr-gamer.net" style="color:#a78bfa;text-decoration:none;">support@dr-gamer.net</a>.</p>
                        </div>
                        <table role="presentation" style="margin:30px auto;">
                          <tr>
                            <td align="center">
                              <a href="${orderDetailsUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#ef4444 0%,#b91c1c 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;">View Order Details</a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:0;font-size:14px;line-height:1.6;">We appreciate your understanding. If you need further assistance, our support team is ready to help.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:30px 40px;background-color:#0f0a1f;text-align:center;border-top:1px solid #2d1a5f;">
                        <p style="margin:0 0 10px 0;color:#9ca3af;font-size:14px;">DR.Gamer - Your Gaming Destination</p>
                        <p style="margin:0;color:#6b7280;font-size:12px;">Questions? Contact us at support@dr-gamer.net</p>
                        <p style="margin:10px 0 0 0;color:#6b7280;font-size:12px;">This is an automated email. Please do not reply to this message.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })

    console.log('✅ Order cancellation email sent successfully!')
    console.log('📧 Resend response:', JSON.stringify(result, null, 2))
    return { success: true }
  } catch (error) {
    console.error('❌ Error sending order cancellation email:', error)
    console.error('❌ Error details:', JSON.stringify(error, null, 2))
    return { success: false, error: 'Failed to send email' }
  }
}

