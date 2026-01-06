import { MetadataRoute } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://fishit-if7.vercel.app';

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

  // Dynamic product pages - skip if API not available during build
  try {
    // Only fetch if not building with localhost API
    if (API_URL.includes('localhost') || API_URL.includes('127.0.0.1')) {
      console.log('Skipping dynamic sitemap generation during local build');
      return routes;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const res = await fetch(`${API_URL}/products?limit=1000`, { 
      signal: controller.signal,
      next: { revalidate: 3600 } 
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`API returned ${res.status}, using static routes only`);
      return routes;
    }

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
    console.warn('Failed to generate dynamic sitemap, using static routes only:', error instanceof Error ? error.message : 'Unknown error');
    return routes;
  }
}
