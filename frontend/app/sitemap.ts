import { MetadataRoute } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://fishit.com'; // Ganti domain asli nanti

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const routes = [
    '',
    '/products',
    '/check-order',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic product pages
  try {
    const res = await fetch(`${API_URL}/products?limit=1000`, { next: { revalidate: 3600 } });
    const data = await res.json();
    const products = data.products || [];

    const productRoutes = products.map((product: any) => ({
      url: `${BASE_URL}/game/${product.id || product._id}`,
      lastModified: new Date(product.updatedAt || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...routes, ...productRoutes];
  } catch (error) {
    console.error('Failed to generate sitemap:', error);
    return routes;
  }
}
