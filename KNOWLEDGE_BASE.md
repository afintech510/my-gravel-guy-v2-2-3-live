# MyGravelGuy Project Knowledge Base

## Project Overview

MyGravelGuy is a React/TypeScript web application for a gravel and construction materials delivery business. The platform enables customers to browse products, get quotes, place orders, and track deliveries while providing admin tools for order management, supplier coordination, and business analytics.

### Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API (CartContext, ZipCodeContext, BlogContext)
- **Backend**: Supabase (PostgreSQL, Edge Functions, Authentication, Storage)
- **Data Fetching**: TanStack React Query
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **Analytics**: Custom tracking system
- **Payment**: Stripe integration
- **SMS**: Twilio integration
- **Email**: Resend API

## Database Architecture

### Core Tables

#### Products (`products`)
- **Purpose**: Product catalog with sophisticated pricing models
- **Key Fields**:
  - `id`: UUID primary key
  - `name`, `description`, `short_description`: Product info
  - `price`: Base price per ton
  - `pricing_a`, `pricing_b`, `pricing_c`: Exponential pricing coefficients
  - `category`, `size`, `color`, `application`: Product categorization
  - `ton_yard_ratio`: Conversion factor between tons and cubic yards
  - `images`: Array of image URLs
  - `slug`: URL-friendly identifier

#### Orders (`orders`)
- **Purpose**: Customer orders and quotes
- **Key Fields**:
  - `order_id`: Human-readable order identifier
  - `product_id`: References product
  - `quantity`, `unit_price`, `total_price`: Order quantities and pricing
  - `delivery_*`: Address and contact information
  - `status`: Order status (pending, confirmed, processing, delivered, cancelled, Quote)
  - `fulfillment_status`: Logistics status enum
  - `quote_*`: Quote-specific fields (expires_at, converted, notes)
  - `supplier_*`: Supplier assignment and charges
  - `sales_person`, `sales_commission`: Sales tracking

#### Service ZIP Codes (`service_zip_codes`)
- **Purpose**: Geographic service area definition with pricing adjustments
- **Key Fields**:
  - `zip`: ZIP code (primary identifier)
  - `lat`, `lng`: Geographic coordinates
  - `city`, `state_name`: Location information
  - `price_adjustment`: Multiplier for regional pricing (e.g., 1.2 = 20% increase)

#### Suppliers (`suppliers`)
- **Purpose**: Supplier management and coordination
- **Key Fields**:
  - `name`, `email`, `phone`: Contact information
  - `address`: JSONB structured address
  - `service_areas`: Array of served ZIP codes
  - `materials`: Array of available materials
  - `active`: Operational status

#### Messages (`messages`)
- **Purpose**: SMS communication with customers
- **Key Fields**:
  - `phone_number`: Customer phone number
  - `body`: Message content
  - `direction`: inbound/outbound
  - `twilio_sid`: Twilio message ID
  - `order_id`: Associated order

### Specialized Tables

#### Blog System
- `blog_posts`: Content management with categories, SEO metadata
- `blog_categories`: Hierarchical content organization

#### Reviews System
- `customer_reviews`: Product reviews with ratings and admin responses

#### Financial Management
- `expenses`: Business expense tracking with categories and recurring items
- `expense_categories`: Expense classification system

#### Analytics
- `location_search`: ZIP code search tracking
- `quote_analytics`: Business metrics and conversion tracking

### Row Level Security (RLS)

The database uses comprehensive RLS policies:

- **Public Read**: Products, blog posts, reviews, delivery locations
- **Admin Only**: Orders management, supplier data, expenses, messaging
- **User-Specific**: Order access based on email matching
- **System Functions**: Rate limiting, analytics collection

## Business Logic Flows

### Pricing System

#### Exponential Pricing Model
The system uses a sophisticated exponential pricing model for bulk discounts:

**Formula**: `price = a * e^(b * quantity) + c`

- **Default Parameters**: a=400, b=-0.32, c=95
- **Product-Specific**: Each product can override coefficients
- **Volume Discounts**: Larger quantities get better per-unit prices
- **Minimum Pricing**: Prevents prices below 50% of base price or $50

#### ZIP Code Adjustments
- **Regional Pricing**: Price multipliers based on delivery location
- **Cache System**: Reduces database calls for pricing lookups
- **Service Area Validation**: Ensures delivery availability

#### Complete Pricing Flow
```typescript
1. Base Product Price ($150/ton)
2. Apply Exponential Pricing (10 tons → ~$120/ton)
3. Apply ZIP Code Adjustment (1.2x → $144/ton)
4. Calculate Total ($144 × 10 = $1,440)
```

### Order Management

#### Order ID System
- **Base Orders**: Timestamp-based IDs (e.g., `20241201-143022`)
- **Multi-Item Orders**: Suffixed IDs (e.g., `20241201-143022-2`, `20241201-143022-3`)
- **Grouping Logic**: Orders with same base ID are grouped together

#### Order Statuses
- **Standard Flow**: pending → confirmed → processing → delivered
- **Quote Flow**: Quote → (conversion) → confirmed
- **Fulfillment Tracking**: Separate enum for logistics status

#### Quote System
- **Quote Generation**: Convert existing orders to quotes with expiration
- **Email Templates**: Automated quote proposals with product details
- **Conversion Tracking**: Monitor quote-to-order conversion rates

### Cart and Checkout

#### Cart Functionality
- **Persistent Storage**: localStorage with date serialization
- **Multi-Item Support**: Each product addition creates new cart item
- **Delivery Details**: Per-item delivery addresses and timing
- **Price Updates**: Real-time ZIP code-based price adjustments
- **Minimum Quantities**: 3-ton minimum enforced

#### Checkout Process
1. **Cart Review**: Validate delivery information completeness
2. **Stripe Integration**: Secure payment processing
3. **Order Creation**: Generate order records with proper IDs
4. **Email Notifications**: Customer and admin confirmations
5. **Analytics Tracking**: E-commerce event tracking

## Authentication & Authorization

### User Roles
- **Public Users**: Browse products, get quotes, place orders
- **Authenticated Users**: Access order history, manage quotes
- **Admins**: Full dashboard access, order management, system administration
- **Financial Admins**: Subset of users with expense management access

### Admin Email List
```typescript
const adminEmails = [
  'admin@mygravelguy.com',
  'manager@mygravelguy.com',
  'adam@easternbuilding.supply',
  'techminded.xyz@gmail.com',
  'ronnie@easternbuilding.supply'
];
```

### Session Management
- **Supabase Auth**: JWT-based authentication
- **Session Recovery**: Automatic session restoration
- **Admin Status**: Cached admin status checks

## Component Architecture

### Context Providers
- **CartContext**: Shopping cart state management
- **ZipCodeContext**: Location and service area management
- **BlogContext**: Content management state
- **ThemeProvider**: Dark/light mode handling

### Key Component Categories

#### Product Components
- **ProductGrid**: Product listing with filtering
- **ProductCard**: Individual product display
- **ProductCalculator**: Advanced pricing calculator with area inputs

#### Shopping Components
- **MaterialCalculator**: Area-based material estimation
- **ShoppingModule**: Quick product selection
- **CartItemCard**: Individual cart item management

#### Admin Dashboard
- **OrdersTable**: Order management interface
- **OrderDetailModal**: Comprehensive order editing
- **SuppliersTable**: Supplier management
- **FinancialCharts**: Business analytics visualization

#### Forms and Validation
- **React Hook Form**: Form state management
- **Zod Schemas**: Type-safe validation
- **Error Handling**: Comprehensive error states

### Design System

#### Theme Configuration
- **Primary Color**: `#14FF6A` (bright green)
- **HSL Color System**: Consistent color management
- **Dark Mode**: Complete dark/light theme support
- **Typography**: Montserrat, Playfair Display, Roboto Mono fonts

#### Component Standards
- **shadcn/ui**: Base component library
- **Semantic Tokens**: Design system variables
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG compliance focus

## API Integrations

### Supabase Edge Functions
- **send-email**: Email notifications via Resend
- **send-sms**: SMS messaging via Twilio
- **create-payment**: Stripe payment processing
- **chat**: AI chat functionality
- **voice-response**: Twilio voice handling

### External Services
- **Stripe**: Payment processing with webhook handling
- **Twilio**: SMS and voice communications
- **Resend**: Transactional email delivery
- **Google Maps**: Geocoding and address validation

## Development Guidelines

### Code Organization
- **Services**: Business logic and data access (`src/services/`)
- **Components**: UI components (`src/components/`)
- **Hooks**: Custom React hooks (`src/hooks/`)
- **Utils**: Helper functions (`src/utils/`)
- **Types**: TypeScript type definitions (`src/types/`)

### Best Practices
- **TypeScript**: Strict type checking enabled
- **Error Handling**: Comprehensive try/catch blocks
- **Logging**: Detailed console logging for debugging
- **Caching**: Strategic caching for performance
- **Testing**: Component and utility testing

### File Naming Conventions
- **Components**: PascalCase (e.g., `OrderDetailModal.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Services**: camelCase (e.g., `orderService.ts`)
- **Utils**: camelCase (e.g., `dateUtils.ts`)

## Business Rules & Constraints

### Order Management Rules
1. **Minimum Order**: 3 tons per product
2. **Order Grouping**: Items with same base order ID are managed together
3. **Quote Expiration**: 30-day default expiration on quotes
4. **Status Transitions**: Defined workflows for order progression

### Pricing Rules
1. **Exponential Discounts**: Volume pricing based on mathematical model
2. **Regional Adjustments**: ZIP code-based price modifications
3. **Minimum Pricing**: Floor prices prevent unrealistic discounts
4. **Cache Strategy**: Price adjustments cached for performance

### Service Area Rules
1. **ZIP Code Validation**: Only service defined ZIP codes
2. **Delivery Scheduling**: Flexible delivery date selection
3. **Contact Requirements**: Phone number mandatory for delivery

### Admin Functions
1. **Order Modification**: Admins can update all order fields
2. **Supplier Assignment**: Manual supplier selection and charge entry
3. **Quote Conversion**: Convert quotes to orders with price adjustments
4. **Status Management**: Control order and fulfillment status

## Performance Considerations

### Frontend Optimization
- **React Query**: Data caching and background updates
- **LocalStorage**: Cart persistence and user preferences
- **Component Lazy Loading**: Route-based code splitting
- **Image Optimization**: Responsive images and lazy loading

### Database Optimization
- **Indexes**: Strategic indexing on frequently queried fields
- **RLS Policies**: Efficient row-level security implementation
- **Caching**: Application-level caching for ZIP code adjustments
- **Query Optimization**: Efficient joins and filtering

### API Performance
- **Rate Limiting**: Prevent API abuse
- **Edge Functions**: Serverless function optimization
- **Webhook Handling**: Efficient event processing
- **Error Recovery**: Robust error handling and retries

## Security Considerations

### Data Protection
- **RLS Policies**: Database-level access control
- **Input Validation**: Comprehensive form validation
- **SQL Injection**: Parameterized queries via Supabase
- **XSS Prevention**: Proper input sanitization

### Authentication Security
- **JWT Tokens**: Secure token management
- **Session Management**: Proper session handling
- **Admin Verification**: Email-based admin role verification
- **Rate Limiting**: API endpoint protection

### Financial Data
- **PCI Compliance**: Stripe handles sensitive payment data
- **Order Integrity**: Immutable order records
- **Audit Trail**: Order status change tracking
- **Data Encryption**: Supabase handles data encryption

## Monitoring & Analytics

### Business Metrics
- **Order Volume**: Track order creation and completion
- **Quote Conversion**: Monitor quote-to-order rates
- **Regional Performance**: ZIP code-based analytics
- **Revenue Tracking**: Sales and commission reporting

### Technical Monitoring
- **Error Tracking**: Application error monitoring
- **Performance Metrics**: Page load and API response times
- **User Behavior**: Navigation and interaction tracking
- **System Health**: Database and service status

## Deployment & Environment

### Environment Configuration
- **Production**: Deployed via Lovable platform
- **Environment Variables**: Supabase keys and API configurations
- **Domain Management**: Custom domain support
- **SSL/Security**: Automatic HTTPS and security headers

### Backup & Recovery
- **Database Backups**: Supabase automated backups
- **Code Repository**: Git-based version control
- **Asset Storage**: Supabase storage with CDN
- **Disaster Recovery**: Multi-region Supabase deployment

## Future Enhancements

### Planned Features
1. **SEO-Optimized Landing Pages**: Dynamic routing for materials and locations
2. **Advanced Analytics**: Enhanced business intelligence dashboard
3. **Mobile App**: React Native mobile application
4. **API Expansion**: Third-party integrations and webhooks
5. **Machine Learning**: Predictive analytics for demand forecasting

### Scalability Considerations
1. **Database Scaling**: Prepare for increased order volume
2. **CDN Integration**: Optimize asset delivery
3. **Caching Strategy**: Implement Redis for enhanced caching
4. **Microservices**: Consider service decomposition for complex features

---

*This knowledge base serves as the definitive guide for understanding and maintaining the MyGravelGuy platform. It should be updated as the system evolves and new features are added.*