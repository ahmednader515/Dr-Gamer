# Trustpilot Integration Guide for DR.Gamer

## 📋 Overview

This guide will help you integrate Trustpilot to:
1. Collect website/service reviews from customers
2. Display Trustpilot reviews on your website
3. Send review invitations via email after payment confirmation
4. Show Trustpilot rating widgets on your site

## 🚀 Step 1: Create Trustpilot Business Account

1. Go to [Trustpilot Business Signup](https://businessapp.b2b.trustpilot.com/signup)
2. Fill in your business details:
   - Business name: **DR.Gamer**
   - Website: **https://dr-gamer.net**
   - Email: Your business email
3. Verify your email address
4. Complete your business profile

## 🔑 Step 2: Get API Credentials

### Access Trustpilot API Settings:

1. Log in to [Trustpilot Business](https://businessapp.b2b.trustpilot.com/)
2. Go to **Settings** → **Integrations** → **API**
3. Create new API credentials:
   - Click **"Create API Key"**
   - Name it: "DR.Gamer Website"
   - Select permissions: **Invitation API** and **Review API**
4. Save these credentials:
   - **API Key**
   - **API Secret**
   - **Business Unit ID**
   - **Template ID** (for review invitations)

### Get Your Template ID:

1. Go to **Reviews** → **Email Templates**
2. Create or select an email template for service reviews
3. Copy the **Template ID**

## 📦 Step 3: Install Trustpilot Package

We'll use Trustpilot's official API or create custom integration:

```bash
npm install axios
```

## 🔧 Step 4: Add Environment Variables

Add to your `.env` file:

```env
# Trustpilot Configuration
TRUSTPILOT_API_KEY="your-api-key-here"
TRUSTPILOT_API_SECRET="your-api-secret-here"
TRUSTPILOT_BUSINESS_UNIT_ID="your-business-unit-id"
TRUSTPILOT_SERVICE_REVIEW_TEMPLATE_ID="your-template-id"
TRUSTPILOT_USERNAME="your-trustpilot-username"
TRUSTPILOT_PASSWORD="your-trustpilot-password"
```

## 📧 Review Invitation Flow

### When to Send Review Invitations:

1. **After Payment Confirmed** - Ask for service review
2. **After Order Delivered** - Ask for product review (optional)
3. **7 Days After Purchase** - Follow-up reminder (optional)

### Types of Reviews:

1. **Service Review**: Overall experience with DR.Gamer
2. **Product Review**: Specific product feedback (optional for Trustpilot)

## 🎨 Trustpilot Widgets on Website

### Available Widgets:

1. **TrustBox Mini** - Shows rating and review count
2. **TrustBox Carousel** - Rotating customer reviews
3. **TrustBox Grid** - Grid of reviews
4. **TrustBox List** - List of reviews

### Get Widget Code:

1. Go to [Trustpilot Widgets](https://businessapp.b2b.trustpilot.com/reviews/widgets)
2. Choose a widget type
3. Customize design
4. Copy the embed code
5. Add to your website

## 🔗 Review Invitation Links

### Method 1: Direct Review Link (Simple)

Format:
```
https://www.trustpilot.com/evaluate/dr-gamer.net?stars=5
```

Parameters:
- `?stars=5` - Pre-select 5 stars (optional)
- `?name=John+Doe` - Pre-fill customer name
- `?email=john@example.com` - Pre-fill email

### Method 2: API Generated Links (Recommended)

Use Trustpilot's Invitation API to generate unique links with tracking.

## 📊 Benefits of Trustpilot

✅ **Credibility**: Independent review platform  
✅ **SEO**: Google shows stars in search results  
✅ **Trust**: Verified reviews increase conversions  
✅ **Analytics**: Detailed review insights  
✅ **Marketing**: Use reviews in ads and social media  

## 🎯 Implementation Strategy

### Phase 1: Basic Integration (Week 1)
- [ ] Create Trustpilot account
- [ ] Add Trustpilot widget to homepage
- [ ] Add review link to payment confirmation email

### Phase 2: API Integration (Week 2)
- [ ] Set up API credentials
- [ ] Implement automated invitation sending
- [ ] Track review responses

### Phase 3: Advanced Features (Week 3+)
- [ ] Display reviews on product pages
- [ ] Add review reminders
- [ ] Integrate with Google Reviews
- [ ] A/B test invitation timing

## 📈 Best Practices

1. **Timing**: Send invitation 24-48 hours after delivery
2. **Personalization**: Use customer's name in invitation
3. **Incentives**: Consider small discount for leaving review (if Trustpilot allows)
4. **Follow-up**: Send reminder after 7 days if no review
5. **Response**: Always respond to negative reviews quickly

## 🔒 Compliance

- Get customer consent to send review invitations
- Include unsubscribe option in review emails
- Follow GDPR guidelines for data handling
- Trustpilot doesn't allow incentivized reviews

## 📞 Support

- **Trustpilot Help**: https://support.trustpilot.com/
- **API Docs**: https://developers.trustpilot.com/
- **Business Dashboard**: https://businessapp.b2b.trustpilot.com/

---

Ready to implement? I'll now create the code integration!

