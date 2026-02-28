#!/usr/bin/env node
/**
 * Generate Sitemap for MyGravelGuy
 *
 * Fetches all dynamic pages from Supabase (products, blog posts, locations,
 * market materials) and combines with static routes to generate sitemap.xml.
 *
 * Run: node scripts/generate-sitemap.mjs
 * Integrated into build: "build": "node scripts/generate-sitemap.mjs && vite build"
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const SUPABASE_URL = 'https://losrkjvrcambvgijfism.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvc3JranZyY2FtYnZnaWpmaXNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4OTI0NjIsImV4cCI6MjA2MTQ2ODQ2Mn0.LdtyGNA5PmayO9VYcNRsO12DCAg0iS460rtTsDsS5B8';

const BASE_URL = 'https://mygravelguy.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Static pages with their priorities and change frequencies
const STATIC_PAGES = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },
  { path: '/products', priority: 0.9, changefreq: 'weekly' },
  { path: '/shop', priority: 0.9, changefreq: 'weekly' },
  { path: '/bulk-landscape-materials', priority: 0.8, changefreq: 'weekly' },
  { path: '/locations', priority: 0.8, changefreq: 'weekly' },
  { path: '/product-calculator', priority: 0.8, changefreq: 'monthly' },
  { path: '/calculator', priority: 0.8, changefreq: 'monthly' },
  { path: '/blog', priority: 0.7, changefreq: 'weekly' },
  { path: '/about', priority: 0.7, changefreq: 'monthly' },
  { path: '/contact', priority: 0.7, changefreq: 'monthly' },
  { path: '/faq', priority: 0.6, changefreq: 'monthly' },
  { path: '/reviews', priority: 0.6, changefreq: 'weekly' },
  { path: '/delivery-map', priority: 0.6, changefreq: 'weekly' },
  { path: '/delivery', priority: 0.6, changefreq: 'monthly' },
  { path: '/privacy', priority: 0.3, changefreq: 'yearly' },
  { path: '/terms', priority: 0.3, changefreq: 'yearly' },
  { path: '/refund', priority: 0.3, changefreq: 'yearly' },
];

// Hardcoded location slugs as fallback (from src/data/locations/)
const FALLBACK_LOCATION_SLUGS = [
  'austin-tx', 'dallas-tx', 'houston-tx', 'san-antonio-tx', 'fort-worth-tx', 'el-paso-tx', 'arlington-tx',
  'phoenix-az', 'los-angeles-ca', 'san-francisco-ca', 'seattle-wa', 'denver-co', 'portland-or', 'sacramento-ca', 'salt-lake-city-ut',
  'chicago-il', 'new-york-ny', 'boston-ma',
  'miami-fl', 'atlanta-ga', 'nashville-tn', 'new-orleans-la', 'charlotte-nc', 'birmingham-al', 'jacksonville-fl',
  'kansas-city-mo', 'omaha-ne', 'des-moines-ia',
];

function formatDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

function createUrlEntry(path, lastmod, priority = 0.5, changefreq = 'weekly') {
  return `  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function fetchMarketMaterialPages() {
  console.log('Fetching active market material pages...');

  const { data, error } = await supabase
    .from('market_materials')
    .select('slug_path, updated_at')
    .eq('status', 'active')
    .not('slug_path', 'is', null);

  if (error) {
    console.warn('  Warning: Could not fetch market materials:', error.message);
    return [];
  }

  return (data || []).map(row => ({
    path: `/${row.slug_path}`,
    lastmod: formatDate(row.updated_at),
    priority: 0.9,
    changefreq: 'weekly'
  }));
}

async function fetchBlogPosts() {
  console.log('Fetching blog posts...');

  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug, published_at, created_at')
    .not('published_at', 'is', null);

  if (error) {
    console.warn('  Warning: Could not fetch blog posts:', error.message);
    return [];
  }

  return (data || []).map(row => ({
    path: `/blog/${row.slug}`,
    lastmod: formatDate(row.published_at || row.created_at),
    priority: 0.6,
    changefreq: 'monthly'
  }));
}

async function fetchLocations() {
  console.log('Fetching delivery locations...');

  const { data, error } = await supabase
    .from('delivery_locations')
    .select('slug, created_at')
    .not('slug', 'is', null);

  if (error || !data || data.length === 0) {
    if (error) {
      console.warn('  Warning: Could not fetch locations from DB:', error.message);
    }
    console.log('  Using fallback location slugs...');
    const today = formatDate(new Date());
    return FALLBACK_LOCATION_SLUGS.map(slug => ({
      path: `/locations/${slug}`,
      lastmod: today,
      priority: 0.7,
      changefreq: 'monthly'
    }));
  }

  return data.map(row => ({
    path: `/locations/${row.slug}`,
    lastmod: formatDate(row.created_at),
    priority: 0.7,
    changefreq: 'monthly'
  }));
}

async function fetchProducts() {
  console.log('Fetching products...');

  const { data, error } = await supabase
    .from('products')
    .select('slug, created_at')
    .not('slug', 'is', null);

  if (error) {
    console.warn('  Warning: Could not fetch products:', error.message);
    return [];
  }

  return (data || []).map(row => ({
    path: `/products/${row.slug}`,
    lastmod: formatDate(row.created_at),
    priority: 0.8,
    changefreq: 'weekly'
  }));
}

async function main() {
  console.log('Generating sitemap...\n');

  const today = formatDate(new Date());

  // Fetch all dynamic pages in parallel
  const [marketPages, blogPosts, locations, products] = await Promise.all([
    fetchMarketMaterialPages(),
    fetchBlogPosts(),
    fetchLocations(),
    fetchProducts(),
  ]);

  // Build URL entries
  const urlEntries = [];

  // Add static pages
  for (const page of STATIC_PAGES) {
    urlEntries.push(createUrlEntry(page.path, today, page.priority, page.changefreq));
  }

  // Add dynamic pages (deduplicate by path)
  const seen = new Set(STATIC_PAGES.map(p => p.path));
  for (const page of [...products, ...marketPages, ...blogPosts, ...locations]) {
    if (!seen.has(page.path)) {
      seen.add(page.path);
      urlEntries.push(createUrlEntry(page.path, page.lastmod, page.priority, page.changefreq));
    }
  }

  // Generate sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>`;

  console.log(`\nSitemap Summary:`);
  console.log(`  Static pages: ${STATIC_PAGES.length}`);
  console.log(`  Products: ${products.length}`);
  console.log(`  Market material pages: ${marketPages.length}`);
  console.log(`  Blog posts: ${blogPosts.length}`);
  console.log(`  Locations: ${locations.length}`);
  console.log(`  Total URLs: ${urlEntries.length}\n`);

  // Write to public directory
  const outputPath = join(__dirname, '..', 'public', 'sitemap.xml');
  writeFileSync(outputPath, sitemap);
  console.log(`Sitemap written to: ${outputPath}`);

  return urlEntries.length;
}

main().catch(console.error);
