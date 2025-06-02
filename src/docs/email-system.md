
# Email System Documentation

## Overview

The My Gravel Guy email system provides automated transactional emails for order confirmations and internal notifications. The system is built with modern best practices including mobile responsiveness, error handling, retry logic, and comprehensive monitoring.

## Architecture

### Components

1. **Email Templates** (`src/utils/emailTemplates.ts`)
   - Customer confirmation emails
   - Internal sales notification emails
   - Mobile-responsive HTML templates with branding

2. **Email Service** (`src/services/emailService.ts`)
   - Centralized email sending logic
   - Error handling and retry mechanisms
   - Email result tracking and logging

3. **Edge Function** (`supabase/functions/send-email/index.ts`)
   - Handles actual email sending via Resend API
   - CORS support and error handling
   - Email tracking and analytics

4. **Email Tester** (`src/components/dashboard/EmailTester.tsx`)
   - Testing interface for email functionality
   - Test history and result tracking
   - Sample order data generation

## Features

### ✅ Enhanced Email Templates
- **Mobile-Responsive Design**: Optimized for all screen sizes
- **Professional Branding**: Consistent with My Gravel Guy brand
- **Rich Content**: Order details, delivery information, contact details
- **Dark Mode Support**: Email templates adapt to user preferences
- **Accessibility**: Proper heading structure and alt text

### ✅ Robust Email Service
- **Retry Logic**: Exponential backoff for failed sends
- **Error Handling**: Comprehensive error tracking and logging
- **Result Tracking**: Detailed success/failure reporting
- **Type Safety**: Full TypeScript support

### ✅ Email Testing
- **Interactive Dashboard**: Easy-to-use testing interface
- **Test History**: Track all test attempts and results
- **Multiple Test Types**: Customer, internal, and combined email tests
- **Real-time Status**: Live feedback on email sending status

### ✅ Monitoring & Analytics
- **Email Tracking**: Tracking pixels for email analytics
- **Comprehensive Logging**: Detailed console logs for debugging
- **Result Reporting**: Structured email result objects
- **Error Monitoring**: Detailed error reporting with timestamps

## Configuration

### Required Environment Variables
- `RESEND_API_KEY`: Your Resend API key (stored in Supabase secrets)

### Domain Configuration
- Verify your sending domain in Resend dashboard
- Configure DNS records (SPF, DKIM, DMARC)
- Update the "from" email address in the send-email function

## Usage

### Sending Customer Confirmation Emails

```typescript
import { sendOrderConfirmationEmail } from '@/services/emailService';

const result = await sendOrderConfirmationEmail({
  order_id: 'ORDER-123',
  customer_email: 'customer@example.com',
  customer_name: 'John Doe',
  total_amount: 425.00,
  items: [
    {
      product_name: 'Crushed Stone #57',
      quantity: 5,
      total_price: 425.00,
      delivery_date: '2024-01-15T10:00:00Z',
      delivery_address: {
        street: '123 Main St',
        city: 'Springfield',
        state: 'CA',
        zip: '90210'
      },
      contact_info: {
        name: 'John Doe',
        email: 'customer@example.com',
        phone: '(555) 123-4567'
      },
      delivery_time_preference: 'morning',
      delivery_instructions: 'Call upon arrival'
    }
  ]
});

if (result.success) {
  console.log('Email sent successfully:', result.emailId);
} else {
  console.error('Email failed:', result.error);
}
```

### Sending Internal Notification Emails

```typescript
import { sendInternalNotificationEmail } from '@/services/emailService';

const result = await sendInternalNotificationEmail(orderData, 'sales@mygravelguy.com');
```

### Sending Both Emails

```typescript
import { sendBothOrderEmails } from '@/services/emailService';

const results = await sendBothOrderEmails(orderData);

console.log('Customer email:', results.customerEmail.success);
console.log('Internal email:', results.internalEmail.success);
console.log('Overall success:', results.overallSuccess);
```

## Email Templates

### Customer Confirmation Email Features
- ✅ Order confirmation with thank you message
- ✅ Complete order details with itemized breakdown
- ✅ Delivery information with date, time, and address
- ✅ Special delivery instructions
- ✅ Order total with professional formatting
- ✅ What's next section with clear steps
- ✅ Contact information and support links
- ✅ Mobile-responsive design
- ✅ Professional branding and styling

### Internal Notification Email Features
- ✅ Urgent action required alerts
- ✅ Order priority levels based on value
- ✅ Complete customer contact information
- ✅ Detailed order breakdown
- ✅ Delivery scheduling information
- ✅ Action items checklist
- ✅ Quick action buttons (email, call)
- ✅ Professional internal formatting

## Error Handling

The email system includes comprehensive error handling:

1. **Validation**: Email format and required field validation
2. **Retry Logic**: Exponential backoff for temporary failures
3. **Error Logging**: Detailed error messages and stack traces
4. **Graceful Degradation**: Order processing continues even if emails fail
5. **User Feedback**: Clear success/failure messages to users

## Testing

### Using the Email Tester Dashboard

1. Navigate to the dashboard Email Tester section
2. Enter your email address for customer email tests
3. Choose test type:
   - **Customer Email**: Test order confirmation email
   - **Internal Email**: Test sales notification email
   - **Both Emails**: Test complete email flow

### Test History

The Email Tester maintains a history of recent test attempts, showing:
- Test type and timestamp
- Success/failure status
- Email IDs for successful sends
- Error messages for failed attempts
- Recipient email addresses

## Monitoring

### Console Logging

The system provides detailed console logs for monitoring:
- Email attempt logs with timestamps
- Recipient validation
- Retry attempts and delays
- Success confirmations with email IDs
- Error details with stack traces

### Email Analytics

Email templates include tracking pixels for analytics:
- Customer email open tracking
- Internal email open tracking
- Order ID correlation for tracking

## Best Practices

1. **Always validate email addresses** before sending
2. **Handle failures gracefully** - don't break order flow
3. **Log all email attempts** for debugging and monitoring
4. **Test email templates** regularly in different email clients
5. **Monitor email deliverability** and reputation
6. **Keep email content concise** but informative
7. **Ensure mobile responsiveness** for all templates
8. **Use clear call-to-action buttons** for user engagement

## Troubleshooting

### Common Issues

1. **Emails not sending**: Check RESEND_API_KEY configuration
2. **Emails going to spam**: Verify domain authentication (SPF, DKIM)
3. **Template rendering issues**: Test in multiple email clients
4. **Mobile display problems**: Use email testing tools

### Debug Steps

1. Check console logs for error messages
2. Use Email Tester to test individual components
3. Verify Supabase secrets configuration
4. Test email templates in email client preview tools
5. Monitor Resend dashboard for delivery status

## Future Enhancements

### Potential Improvements
- [ ] Email sequencing and follow-up campaigns
- [ ] Advanced email analytics dashboard
- [ ] A/B testing for email templates
- [ ] Personalized email content
- [ ] Email preference management
- [ ] Automated email scheduling
- [ ] Integration with CRM systems

### Performance Optimizations
- [ ] Email template caching
- [ ] Batch email sending for high volume
- [ ] Queue system for email processing
- [ ] Advanced retry strategies
- [ ] Email delivery optimization

## Support

For email system support:
- Check this documentation first
- Review console logs for error details
- Use Email Tester for debugging
- Contact development team with specific error messages
- Monitor Resend dashboard for delivery issues

---

*Last updated: June 2024*
*Documentation version: 1.0*
