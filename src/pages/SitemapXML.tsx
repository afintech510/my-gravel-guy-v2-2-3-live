
import React from 'react';

const SitemapXML = () => {
  // Set the content type to XML
  React.useEffect(() => {
    // Set response headers for XML content
    const setHeaders = () => {
      if (typeof document !== 'undefined') {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Type';
        meta.content = 'application/xml; charset=utf-8';
        document.head.appendChild(meta);
      }
    };
    setHeaders();
  }, []);

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main Pages -->
  <url>
    <loc>https://mygravelguy.com/</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/about</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/contact</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Shop & Products -->
  <url>
    <loc>https://mygravelguy.com/shop</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/products</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/bulk-landscape-materials</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Tools & Calculators -->
  <url>
    <loc>https://mygravelguy.com/product-calculator</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Locations -->
  <url>
    <loc>https://mygravelguy.com/locations</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Texas Locations -->
  <url>
    <loc>https://mygravelguy.com/locations/austin-tx</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/locations/dallas-tx</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/locations/houston-tx</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/locations/san-antonio-tx</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/locations/fort-worth-tx</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/locations/el-paso-tx</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/locations/arlington-tx</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- West Coast Locations -->
  <url>
    <loc>https://mygravelguy.com/locations/phoenix-az</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/locations/los-angeles-ca</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/locations/san-francisco-ca</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/locations/seattle-wa</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/locations/denver-co</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/locations/portland-or</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/locations/sacramento-ca</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/locations/salt-lake-city-ut</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Midwest & East Coast Locations -->
  <url>
    <loc>https://mygravelguy.com/locations/chicago-il</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/locations/new-york-ny</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/locations/boston-ma</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Southeast Locations -->
  <url>
    <loc>https://mygravelguy.com/locations/miami-fl</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/locations/atlanta-ga</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/locations/nashville-tn</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/locations/new-orleans-la</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/locations/charlotte-nc</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/locations/birmingham-al</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/locations/jacksonville-fl</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Central Locations -->
  <url>
    <loc>https://mygravelguy.com/locations/kansas-city-mo</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/locations/omaha-ne</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/locations/des-moines-ia</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Delivery & Maps -->
  <url>
    <loc>https://mygravelguy.com/delivery-map</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/delivery</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <!-- Shopping Cart -->
  <url>
    <loc>https://mygravelguy.com/cart</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>never</changefreq>
    <priority>0.3</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/checkout</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>never</changefreq>
    <priority>0.3</priority>
  </url>

  <!-- Information & Help -->
  <url>
    <loc>https://mygravelguy.com/faq</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/reviews</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/blog</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Legal Pages -->
  <url>
    <loc>https://mygravelguy.com/privacy</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/terms</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  
  <url>
    <loc>https://mygravelguy.com/refund</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>

  <!-- Sitemap -->
  <url>
    <loc>https://mygravelguy.com/sitemap</loc>
    <lastmod>2025-06-14</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
</urlset>`;

  return (
    <div>
      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
        {sitemapContent}
      </pre>
    </div>
  );
};

export default SitemapXML;
