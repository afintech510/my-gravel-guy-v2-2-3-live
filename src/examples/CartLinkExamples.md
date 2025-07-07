# Cart Link Examples

## URL Format
```
https://yourdomain.com/add-to-cart?product={product_id}&tons={quantity}&zipCode={zip_code}&redirect={redirect_url}
```

## Parameters
- `product` (required): Product ID or slug
- `tons` (optional): Quantity in tons (defaults to 3, minimum 3)
- `zipCode` (optional): Customer's zip code for pricing calculations
- `redirect` (optional): Where to redirect after adding (defaults to cart)

## Example Links

### Basic Product Links
```
https://yourdomain.com/add-to-cart?product=crushed-gravel-57&tons=5
https://yourdomain.com/add-to-cart?product=river-rock&tons=3
https://yourdomain.com/add-to-cart?product=mason-sand&tons=10
```

### Links with Zip Code for Pricing
```
https://yourdomain.com/add-to-cart?product=crushed-gravel-57&tons=5&zipCode=12345
https://yourdomain.com/add-to-cart?product=river-rock&tons=7&zipCode=90210
```

### Links with Custom Redirect
```
https://yourdomain.com/add-to-cart?product=crushed-gravel-57&tons=5&redirect=/checkout
https://yourdomain.com/add-to-cart?product=river-rock&tons=3&redirect=/
```

## JavaScript Usage

### Import the utilities
```javascript
import { generateCartLink, EXAMPLE_CART_LINKS } from '../utils/cartLinkUtils';
```

### Generate links programmatically
```javascript
// Basic link
const link1 = generateCartLink({
  product: 'crushed-gravel-57',
  tons: 5
});

// Link with zip code
const link2 = generateCartLink({
  product: 'river-rock',
  tons: 7,
  zipCode: '12345'
});

// Link that redirects to checkout
const link3 = generateCartLink({
  product: 'mason-sand',
  tons: 10,
  zipCode: '90210',
  redirect: '/checkout'
});
```

### Use example links
```javascript
// Generate example links
const basicGravelLink = EXAMPLE_CART_LINKS.basicGravel();
const gravelWithZipLink = EXAMPLE_CART_LINKS.gravelWithZip('12345');
const checkoutLink = EXAMPLE_CART_LINKS.directToCheckout('river-rock', 5, '90210');
```

## Chatbase Integration

Use these links in your Chatbase responses:

```
"Great choice! You can add 5 tons of crushed gravel to your cart by clicking here:
https://yourdomain.com/add-to-cart?product=crushed-gravel-57&tons=5&zipCode=12345"

"Ready to order? Click here to add river rock to your cart and go directly to checkout:
https://yourdomain.com/add-to-cart?product=river-rock&tons=3&zipCode=90210&redirect=/checkout"
```

## Error Handling

The system handles various error cases:
- Invalid product IDs/slugs
- Missing required parameters
- Network errors during product lookup
- Invalid zip codes
- Pricing calculation failures

Users will see appropriate error messages and be redirected to the homepage if needed.