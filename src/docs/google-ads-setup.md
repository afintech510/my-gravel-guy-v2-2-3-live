
# Google Ads Conversion Tracking Setup Guide

## Overview
This guide will help you set up Google Ads conversion tracking for your My Gravel Guy application.

## Prerequisites
1. Google Analytics 4 property (already set up)
2. Google Ads account
3. Access to Google Tag Manager (optional but recommended)

## Step 1: Set Up Google Ads Account
1. Create a Google Ads account at [ads.google.com](https://ads.google.com)
2. Link your Google Ads account with your Google Analytics 4 property
3. Set up conversion tracking in Google Ads

## Step 2: Create Conversion Actions
In your Google Ads account, create the following conversion actions:

### Primary Conversions
1. **Purchase Conversion**
   - Name: "Purchase Completed"
   - Category: Purchase
   - Value: Use different values for each conversion
   - Count: One
   - Attribution model: Data-driven

2. **Lead Conversion (Quote Requests)**
   - Name: "Quote Request Submitted"
   - Category: Submit lead form
   - Value: Assign a consistent value or use different values
   - Count: One
   - Attribution model: Data-driven

### Secondary Conversions
3. **Add to Cart**
   - Name: "Add to Cart"
   - Category: Add to cart
   - Value: Use different values for each conversion
   - Count: Every

4. **Begin Checkout**
   - Name: "Checkout Initiated"
   - Category: Begin checkout
   - Value: Use different values for each conversion
   - Count: One

5. **Calculator Usage**
   - Name: "Calculator Used"
   - Category: Other
   - Value: Don't use a value for this conversion action
   - Count: One

## Step 3: Get Conversion IDs and Labels
After creating each conversion action, Google Ads will provide:
- Conversion ID (format: AW-XXXXXXXXX)
- Conversion Label (unique string for each action)

## Step 4: Update Your Code
Replace the placeholder values in `src/utils/googleAdsTracking.ts`:

```typescript
// Replace these with your actual values:
const PURCHASE_CONVERSION_ID = 'AW-YOUR_ACTUAL_CONVERSION_ID';
const PURCHASE_CONVERSION_LABEL = 'YOUR_ACTUAL_PURCHASE_LABEL';

const LEAD_CONVERSION_ID = 'AW-YOUR_ACTUAL_CONVERSION_ID';
const LEAD_CONVERSION_LABEL = 'YOUR_ACTUAL_LEAD_LABEL';

// And so on for each conversion type...
```

## Step 5: Test Your Implementation
1. Use Google Tag Assistant or Google Analytics Debugger
2. Test each conversion action in a staging environment
3. Verify conversions appear in Google Ads within 3 hours

## Step 6: Enhanced Conversion Setup (Optional)
For better tracking accuracy, consider setting up Enhanced Conversions:
1. In Google Ads, enable Enhanced Conversions for your conversion actions
2. Update the tracking code to include hashed customer information
3. Ensure compliance with privacy regulations

## Conversion Values Strategy
- **Purchase**: Use actual order value
- **Quote Request**: 
  - Residential projects: $500 estimated value
  - Commercial projects: $1000 estimated value
  - Product-specific quotes: Estimated based on typical order size
- **Add to Cart**: Use cart item value
- **Begin Checkout**: Use total cart value
- **Calculator Usage**: No value (engagement metric)

## Privacy and Compliance
- Ensure your privacy policy mentions conversion tracking
- Implement proper consent management
- Consider GDPR/CCPA compliance requirements
- Provide opt-out mechanisms where required

## Monitoring and Optimization
1. Monitor conversion data in Google Ads
2. Set up automated bidding strategies based on conversions
3. Create audiences based on conversion behavior
4. Use conversion data for campaign optimization

## Troubleshooting
- Conversions may take up to 3 hours to appear in Google Ads
- Use Google Tag Assistant to debug tracking issues
- Check browser console for any tracking errors
- Verify that Google Analytics is working correctly first

## Support
For technical issues with implementation, check:
1. Browser console for JavaScript errors
2. Google Analytics real-time reports
3. Google Ads conversion tracking status
4. Network tab for failed requests
