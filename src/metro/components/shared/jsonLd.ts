// Small JSON-LD builders shared across metro pages (home/category/town) so each page
// doesn't hand-roll the same BreadcrumbList shape.

export interface BreadcrumbEntry {
  name: string;
  url: string;
}

export const breadcrumbJsonLd = (items: BreadcrumbEntry[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: item.url,
  })),
});
