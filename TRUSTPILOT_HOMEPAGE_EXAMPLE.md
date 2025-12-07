# How to Add Trustpilot to Your Homepage

## Quick Integration Example

### Option 1: Add Trustpilot Section to Homepage (Recommended)

Open `app/(home)/page.tsx` and add the Trustpilot section:

```tsx
import TrustpilotSection from '@/components/shared/home/trustpilot-section'

export default async function HomePage() {
  // ... existing code ...

  return (
    <div className='font-cairo text-white overflow-x-hidden' dir='ltr'>
      {/* ... existing hero section ... */}
      
      {/* --- TRUSTPILOT REVIEWS --- */}
      <TrustpilotSection />
      
      {/* ... rest of homepage sections ... */}
    </div>
  )
}
```

**Where to Place:**
- **After Platforms Section**: Show trust signals early
- **Before Footer**: Last impression before leaving
- **After Product Sliders**: Break up product sections
- **Between Discover Sections**: Add social proof

### Option 2: Add Trustpilot to Footer

Open `components/shared/footer.tsx`:

```tsx
import TrustpilotRating from '@/components/shared/trustpilot-rating'

export default function Footer() {
  return (
    <footer>
      {/* Existing footer content */}
      
      {/* Add Trustpilot rating */}
      <div className="text-center py-4 border-t border-gray-800">
        <TrustpilotRating 
          rating={4.8} 
          reviewCount={1250}
          showLogo={true}
        />
      </div>
    </footer>
  )
}
```

### Option 3: Add Mini Widget to Specific Pages

**Add to Product Page** (`app/(root)/product/[slug]/page.tsx`):

```tsx
import TrustpilotWidget from '@/components/shared/trustpilot-widget'

export default async function ProductPage({ params }) {
  return (
    <div>
      {/* Product details */}
      
      {/* Trust badge */}
      <div className="my-8 p-6 bg-gray-900 rounded-xl">
        <h3 className="text-xl font-bold text-white mb-4 text-center">
          Trusted by Thousands of Gamers
        </h3>
        <TrustpilotWidget type="mini" />
      </div>
      
      {/* Reviews section */}
    </div>
  )
}
```

## 🎨 Customization Examples

### Custom Styled Widget Container

```tsx
<div className="bg-gradient-to-r from-purple-900 to-blue-900 p-8 rounded-2xl shadow-2xl">
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl font-bold text-white">Customer Reviews</h2>
    <TrustpilotRating rating={4.8} reviewCount={1250} showLogo={false} />
  </div>
  <TrustpilotWidget type="carousel" />
</div>
```

### Compact Header Badge

```tsx
<div className="flex items-center gap-2">
  <span className="text-sm text-gray-400">Rated</span>
  <TrustpilotRating rating={4.8} reviewCount={1250} showLogo={true} />
</div>
```

### Full-Width Reviews Section

```tsx
<section className="py-16 bg-gray-950">
  <div className="container mx-auto px-4">
    <div className="max-w-4xl mx-auto text-center mb-12">
      <h2 className="text-4xl font-bold text-white mb-4">
        Don't Just Take Our Word For It
      </h2>
      <p className="text-xl text-gray-300 mb-6">
        See why gamers trust DR.Gamer for their gaming needs
      </p>
      <TrustpilotRating rating={4.8} reviewCount={1250} showLogo={true} />
    </div>
    
    <TrustpilotWidget type="grid" />
    
    <div className="text-center mt-8">
      <a 
        href="https://www.trustpilot.com/review/dr-gamer.net"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
      >
        Read All Reviews
      </a>
    </div>
  </div>
</section>
```

## 🚀 Testing Your Integration

### Test Checklist:

1. [ ] Widget displays on homepage
2. [ ] Stars and rating show correctly
3. [ ] Click on widget opens Trustpilot page
4. [ ] Email includes review invitation button
5. [ ] Review link works when clicked
6. [ ] Customer data pre-filled on Trustpilot

### Test the Email Flow:

1. Make a test purchase
2. Confirm payment (as admin)
3. Check payment confirmation email
4. Click "⭐ Rate Us on Trustpilot" button
5. Verify Trustpilot review page opens
6. Check if name/email are pre-filled

## 📊 Monitor Success

Track these metrics in Trustpilot dashboard:

1. **Review Collection Rate**: Aim for 15-25% of customers
2. **Average Rating**: Target 4.5+
3. **Response Rate**: Respond to 100% of reviews
4. **Review Velocity**: Consistent flow of new reviews

## 🎯 Pro Tips

1. **First Reviews**: Ask your happiest customers first to build a strong base
2. **Timing**: Best time to ask is 24-48 hours after delivery
3. **Response**: Always respond to reviews (good and bad)
4. **Showcase**: Feature best reviews on social media
5. **Widget Placement**: A/B test different locations for maximum visibility

## 🔗 Useful Links

- **Your Trustpilot Profile**: https://www.trustpilot.com/review/dr-gamer.net
- **Business Dashboard**: https://businessapp.b2b.trustpilot.com/
- **Widget Library**: https://businessapp.b2b.trustpilot.com/reviews/widgets
- **Review Invitations**: https://businessapp.b2b.trustpilot.com/reviews/invitations

---

Ready to collect reviews and build trust! 🌟

