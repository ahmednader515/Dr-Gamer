# Email Deliverability Setup Guide - Stop Emails Going to Spam

## 🚨 Why Emails Go to Spam

Emails go to spam primarily because your domain (`dr-gamer.net`) is not verified and authenticated. Email providers like Gmail, Outlook, and Yahoo check for:

1. **SPF Record** - Verifies who can send emails from your domain
2. **DKIM Record** - Adds a digital signature to your emails
3. **DMARC Record** - Tells email providers what to do with unauthenticated emails
4. **Domain Verification** - Proves you own the domain

## ✅ Step-by-Step Fix

### Step 1: Verify Your Domain in Resend

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click **"Add Domain"**
3. Enter your domain: `dr-gamer.net` (without www or http://)
4. Click **"Add"**

### Step 2: Get Your DNS Records from Resend

After adding your domain, Resend will provide you with 3 DNS records:

#### Example of what you'll see:

**SPF Record:**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

**DKIM Record:**
```
Type: TXT
Name: resend._domainkey
Value: v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4...
```

**DMARC Record (Optional but Recommended):**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@dr-gamer.net
```

### Step 3: Add DNS Records to Your Domain Provider

You need to add these records where your domain is registered (GoDaddy, Namecheap, Cloudflare, etc.)

#### For Cloudflare:

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain: `dr-gamer.net`
3. Go to **DNS** → **Records**
4. Click **"Add record"**

**Add SPF Record:**
- Type: `TXT`
- Name: `@`
- Content: `v=spf1 include:_spf.resend.com ~all`
- TTL: `Auto`
- Click **Save**

**Add DKIM Record:**
- Type: `TXT`
- Name: `resend._domainkey`
- Content: `[Copy from Resend dashboard]`
- TTL: `Auto`
- Click **Save**

**Add DMARC Record:**
- Type: `TXT`
- Name: `_dmarc`
- Content: `v=DMARC1; p=none; rua=mailto:dmarc@dr-gamer.net`
- TTL: `Auto`
- Click **Save**

#### For GoDaddy:

1. Log in to [GoDaddy](https://www.godaddy.com)
2. Go to **My Products** → **DNS**
3. Click **"Add"** under DNS Records

Follow the same steps as Cloudflare for each record.

#### For Namecheap:

1. Log in to [Namecheap](https://www.namecheap.com)
2. Go to **Domain List** → Select your domain
3. Go to **Advanced DNS**
4. Click **"Add New Record"**

Follow the same steps for each record.

### Step 4: Wait for DNS Propagation

- DNS changes can take **15 minutes to 48 hours** to propagate
- Usually takes 15-30 minutes for most providers
- You can check status in Resend dashboard

### Step 5: Verify in Resend Dashboard

1. Go back to [Resend Domains](https://resend.com/domains)
2. You should see a **green checkmark** next to your domain when verified
3. Status will change from "Pending" to "Verified"

## 🔧 Additional Email Deliverability Best Practices

### 1. Update Your Email Content

I'll update the email templates to improve deliverability:

#### Add Unsubscribe Link
Email providers like Gmail prefer emails with an unsubscribe option.

#### Add Plain Text Version
Emails with both HTML and plain text versions are less likely to be marked as spam.

#### Avoid Spam Trigger Words
Words like "FREE!!!", "URGENT!!!", "ACT NOW!!!" trigger spam filters.

### 2. Warm Up Your Domain

When you start sending emails from a new domain:
- Start with a small volume (10-20 emails/day)
- Gradually increase over 2-3 weeks
- This builds your sending reputation

### 3. Monitor Your Sending Reputation

Check your domain reputation:
- [Google Postmaster Tools](https://postmaster.google.com/)
- [Microsoft SNDS](https://sendersupport.olc.protection.outlook.com/snds/)

## 📊 Check DNS Propagation

Use these tools to verify your DNS records are set correctly:

1. **MXToolbox**: https://mxtoolbox.com/SuperTool.aspx
   - Enter: `dr-gamer.net`
   - Check SPF, DKIM, and DMARC records

2. **DNS Checker**: https://dnschecker.org/
   - Check if records are propagated globally

3. **Resend Dashboard**: Shows verification status

## 🧪 Test Email Deliverability

After setting up DNS records, test your emails:

### 1. Send Test Emails

Use [Mail Tester](https://www.mail-tester.com/):
1. Go to https://www.mail-tester.com/
2. Copy the test email address they provide
3. Send a test email from your app to that address
4. Check your score (aim for 8/10 or higher)

### 2. Check Spam Folders

Send test emails to:
- Gmail account
- Outlook/Hotmail account
- Yahoo account

Check if they land in inbox or spam folder.

## ⚠️ Temporary Solution (While Waiting for DNS)

If you need immediate email delivery while waiting for DNS verification:

### Option 1: Use Resend's Default Domain (Already Working)

Your `.env` file:
```env
RESEND_FROM_EMAIL="onboarding@resend.dev"
```

**Pros:**
- Works immediately
- No setup required
- Good deliverability

**Cons:**
- Generic sender name
- Less professional
- Limited to Resend branding

### Option 2: Add Reply-To Header

Update emails to show your domain in Reply-To field while using Resend's domain to send:

```typescript
await resend.emails.send({
  from: 'DR.Gamer <onboarding@resend.dev>',
  replyTo: 'support@dr-gamer.net',
  to: userEmail,
  // ... rest of email
})
```

## 📈 Expected Timeline

| Action | Time |
|--------|------|
| Add DNS records | 5 minutes |
| DNS propagation | 15 mins - 48 hours (usually 30 mins) |
| Resend verification | Immediate after propagation |
| First emails | Send immediately after verification |
| Build reputation | 2-3 weeks of consistent sending |
| Full deliverability | 1 month |

## 🎯 Checklist

- [ ] Add domain to Resend
- [ ] Copy SPF record from Resend
- [ ] Copy DKIM record from Resend  
- [ ] Copy DMARC record from Resend
- [ ] Add SPF to DNS provider
- [ ] Add DKIM to DNS provider
- [ ] Add DMARC to DNS provider
- [ ] Wait for propagation (30 mins - 48 hrs)
- [ ] Verify domain shows "Verified" in Resend
- [ ] Update RESEND_FROM_EMAIL to use your domain
- [ ] Send test email
- [ ] Check Mail Tester score
- [ ] Verify inbox delivery (not spam)

## 🆘 Troubleshooting

### Emails Still Going to Spam After Setup?

1. **Check DNS Records are Correct**
   ```bash
   nslookup -type=TXT dr-gamer.net
   nslookup -type=TXT resend._domainkey.dr-gamer.net
   nslookup -type=TXT _dmarc.dr-gamer.net
   ```

2. **Verify in Resend Dashboard**
   - Make sure domain shows "Verified" status

3. **Check Content**
   - Remove excessive exclamation marks
   - Avoid all caps
   - Include unsubscribe link
   - Balance text and images

4. **Warm Up Period**
   - Send to engaged users first
   - Gradually increase volume
   - Monitor bounce rates

5. **Contact Resend Support**
   - They can check your domain setup
   - Help with deliverability issues

## 📞 Need Help?

- **Resend Support**: support@resend.com
- **Resend Docs**: https://resend.com/docs
- **Email Deliverability Guide**: https://resend.com/docs/knowledge-base/email-deliverability

## 🎉 After Setup

Once your domain is verified and emails are being delivered:

1. Monitor your Resend dashboard for:
   - Delivery rates
   - Bounce rates
   - Spam complaints

2. Ask customers to:
   - Add `support@dr-gamer.net` to contacts
   - Mark first email as "Not Spam" if it goes to spam
   - Whitelist your domain

3. Build sender reputation by:
   - Sending consistently
   - Maintaining low bounce rates
   - Getting positive engagement (opens, clicks)

---

**Note**: The most important step is verifying your domain with proper DNS records. This is the #1 fix for emails going to spam!

