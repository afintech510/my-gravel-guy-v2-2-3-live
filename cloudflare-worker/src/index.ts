/**
 * MyGravelGuy Prerender Worker
 *
 * Intercepts social-crawler / bot requests and injects page-specific
 * Open Graph and meta tags so that link previews on LinkedIn, Slack,
 * Facebook, WhatsApp, Twitter, etc. show the correct title, description,
 * and image for each page — even though the site is a client-side SPA.
 *
 * Non-bot traffic passes through to the origin unchanged.
 */

// ── Bot detection ────────────────────────────────────────────────────
const BOT_USER_AGENTS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'Slackbot',
  'WhatsApp',
  'Discordbot',
  'TelegramBot',
  'Googlebot',
  'bingbot',
  'Applebot',
  'Pinterestbot',
  'redditbot',
  'Embedly',
  'Quora Link Preview',
  'outbrain',
  'vkShare',
  'W3C_Validator',
  'Iframely',
];

function isBot(ua: string): boolean {
  const lower = ua.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => lower.includes(bot.toLowerCase()));
}

// ── Page metadata lookup ─────────────────────────────────────────────
interface PageMeta {
  title: string;
  description: string;
  type?: string;
  image?: string;
}

const DEFAULT_IMAGE =
  'https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images/og-image.png';

const DEFAULT_META: PageMeta = {
  title: 'My Gravel Guy | Bulk Gravel, Sand & Mulch Delivery Nationwide',
  description:
    'Order bulk gravel, sand, topsoil, mulch, and crushed stone online with instant delivered pricing. Free delivery included. Nationwide service.',
  image: DEFAULT_IMAGE,
};

/**
 * Static metadata for known routes.
 * For dynamic routes (products, blog posts, locations) we fall back to
 * DEFAULT_META — the Helmet tags in index.html are close enough and
 * will be improved once we add an API-based lookup.
 */
const ROUTE_META: Record<string, PageMeta> = {
  '/': {
    title: 'My Gravel Guy | Bulk Gravel, Sand & Mulch Delivery Nationwide',
    description:
      'Order bulk gravel, sand, topsoil, mulch, and crushed stone online with instant delivered pricing. Free delivery, nationwide service, volume discounts.',
  },
  '/shop': {
    title: 'Shop Bulk Materials | My Gravel Guy',
    description:
      'Browse 47+ bulk landscape materials — gravel, sand, dirt, mulch, crushed stone. Instant pricing, free delivery, volume discounts.',
  },
  '/products': {
    title: 'Gravel, Sand, Dirt & Mulch Products | My Gravel Guy',
    description:
      'Browse our full catalog of premium gravel, sand, dirt, mulch, and base materials. Filter by category, size, and type. Delivered nationwide with volume discounts.',
  },
  '/contractors': {
    title: 'Contractor Gravel & Aggregate Delivery | MyGravelGuy',
    description:
      'Nationwide aggregate sourcing and delivery for construction teams. One point of contact for gravel, stone, and sand across all 50 states.',
  },
  '/contractors/aggregate': {
    title: 'Aggregate Delivery for Contractors | MyGravelGuy',
    description:
      'One vendor for gravel, sand, base, and fill — delivered anywhere in the U.S. for construction professionals.',
  },
  '/blog': {
    title: 'Blog | My Gravel Guy',
    description:
      'Expert tips and advice on gravel, sand, and dirt for your landscaping and construction projects.',
  },
  '/reviews': {
    title: 'Customer Reviews | My Gravel Guy',
    description:
      'Read reviews from customers who have purchased from My Gravel Guy. See what people are saying about our bulk material delivery service.',
  },
  '/calculator': {
    title: 'Material Calculator | My Gravel Guy',
    description:
      'Calculate how much gravel, sand, or mulch you need for your project. Enter your dimensions and get an instant tonnage estimate.',
  },
  '/locations': {
    title: 'Delivery Locations | My Gravel Guy',
    description:
      'We deliver bulk gravel, sand, mulch, and crushed stone nationwide. Enter your ZIP code to see instant pricing.',
  },
  '/about': {
    title: 'About Us | My Gravel Guy',
    description:
      'Learn about My Gravel Guy — nationwide bulk landscape material delivery. One contact, any market, any jobsite.',
  },
  '/contact': {
    title: 'Contact Us | My Gravel Guy',
    description:
      'Get in touch with My Gravel Guy for bulk gravel, sand, and mulch delivery. Call, email, or fill out our contact form.',
  },
  '/faq': {
    title: 'FAQ | My Gravel Guy',
    description:
      'Frequently asked questions about ordering, delivery, pricing, and materials from My Gravel Guy.',
  },
  '/landing': {
    title: 'Buy Gravel Online | Bulk Gravel, Topsoil & Dirt Delivery',
    description:
      'Reserve bulk gravel, topsoil, and dirt online with a $199 refundable deposit. Wholesale prices, photo confirmation, nationwide delivery.',
  },
  '/57-crushed-stone': {
    title: '#57 Crushed Stone Delivery | My Gravel Guy',
    description:
      'Order #57 crushed stone delivered to your site. Volume discounts, instant pricing, free delivery included.',
    type: 'product',
  },
  '/quiz': {
    title: 'Product Quiz | My Gravel Guy',
    description:
      'Not sure which material you need? Take our quick quiz and get a personalized recommendation.',
  },
  '/delivery-map': {
    title: 'Delivery Map | My Gravel Guy',
    description:
      'See our delivery coverage area. We serve 33,700+ ZIP codes across all 50 states.',
  },
};

function getMetaForPath(pathname: string): PageMeta {
  // Exact match first
  if (ROUTE_META[pathname]) {
    return { ...DEFAULT_META, ...ROUTE_META[pathname] };
  }

  // Prefix matches for dynamic routes
  if (pathname.startsWith('/products/')) {
    const slug = pathname.replace('/products/', '').replace(/-/g, ' ');
    const name = slug.charAt(0).toUpperCase() + slug.slice(1);
    return {
      title: `${name} | My Gravel Guy`,
      description: `Order ${name} delivered to your site. Volume discounts, instant pricing, free delivery included.`,
      type: 'product',
      image: DEFAULT_IMAGE,
    };
  }

  if (pathname.startsWith('/blog/')) {
    return {
      title: 'Blog | My Gravel Guy',
      description:
        'Expert tips and advice on gravel, sand, and dirt for your landscaping and construction projects.',
      image: DEFAULT_IMAGE,
    };
  }

  if (pathname.startsWith('/locations/')) {
    const slug = pathname.replace('/locations/', '').replace(/-/g, ' ');
    const name = slug
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return {
      title: `Gravel Delivery in ${name} | My Gravel Guy`,
      description: `Bulk gravel, sand, mulch, and crushed stone delivery in ${name}. Instant pricing, free delivery.`,
      image: DEFAULT_IMAGE,
    };
  }

  return { ...DEFAULT_META };
}

// ── HTMLRewriter handler ─────────────────────────────────────────────
class MetaTagRewriter {
  private meta: PageMeta;
  private url: string;
  private injected = false;

  constructor(meta: PageMeta, url: string) {
    this.meta = meta;
    this.url = url;
  }

  element(element: Element) {
    const tag = element.tagName;

    // Replace <title> content
    if (tag === 'title') {
      element.setInnerContent(this.meta.title);
      return;
    }

    // Handle <meta> tags
    if (tag === 'meta') {
      const name = element.getAttribute('name');
      const property = element.getAttribute('property');

      if (name === 'description') {
        element.setAttribute('content', this.meta.description);
      } else if (property === 'og:title') {
        element.setAttribute('content', this.meta.title);
      } else if (property === 'og:description') {
        element.setAttribute('content', this.meta.description);
      } else if (property === 'og:url') {
        element.setAttribute('content', this.url);
      } else if (property === 'og:type' && this.meta.type) {
        element.setAttribute('content', this.meta.type);
      } else if (property === 'og:image' && this.meta.image) {
        element.setAttribute('content', this.meta.image);
      }
    }

    // Handle <link rel="canonical">
    if (tag === 'link' && element.getAttribute('rel') === 'canonical') {
      element.setAttribute('href', this.url);
    }
  }
}

// ── Main handler ─────────────────────────────────────────────────────
export default {
  async fetch(request: Request): Promise<Response> {
    const ua = request.headers.get('user-agent') || '';

    // Non-bot traffic: pass through to origin unchanged
    if (!isBot(ua)) {
      return fetch(request);
    }

    const url = new URL(request.url);
    const meta = getMetaForPath(url.pathname);
    const canonicalUrl = `https://mygravelguy.com${url.pathname}`;

    // Fetch the page from origin
    const originResponse = await fetch(request);

    // Only rewrite HTML responses
    const contentType = originResponse.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return originResponse;
    }

    // Use HTMLRewriter to inject correct meta tags
    return new HTMLRewriter()
      .on('title', new MetaTagRewriter(meta, canonicalUrl))
      .on('meta[name="description"]', new MetaTagRewriter(meta, canonicalUrl))
      .on('meta[property="og:title"]', new MetaTagRewriter(meta, canonicalUrl))
      .on('meta[property="og:description"]', new MetaTagRewriter(meta, canonicalUrl))
      .on('meta[property="og:url"]', new MetaTagRewriter(meta, canonicalUrl))
      .on('meta[property="og:type"]', new MetaTagRewriter(meta, canonicalUrl))
      .on('meta[property="og:image"]', new MetaTagRewriter(meta, canonicalUrl))
      .on('link[rel="canonical"]', new MetaTagRewriter(meta, canonicalUrl))
      .transform(originResponse);
  },
};
