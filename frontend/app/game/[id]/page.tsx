import type { Metadata, ResolvingMetadata } from 'next';
import ProductDetailClient, { Product } from '@/components/product/ProductDetailClient';
import { AlertCircle } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
const API_URL = `${API_BASE.replace(/\/$/, '')}/api`;

async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_URL}/products/${id}`, {
      cache: 'no-store', // Always fresh data for dynamic stock
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: 'Produk Tidak Ditemukan | FishIt Marketplace',
    };
  }

  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: `${product.name} - Jual Murah Terpercaya | FishIt`,
    description: `Beli ${product.name} dengan harga Rp ${product.price.toLocaleString('id-ID')} hanya di FishIt Marketplace. Transaksi aman, otomatis, dan bergaransi.`,
    openGraph: {
      title: product.name,
      description: `Beli ${product.name} murah & aman. Stok: ${product.stock > 0 ? 'Tersedia' : 'Habis'}.`,
      images: [product.image_url || '/images/og-default.jpg', ...previousImages],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return (
      <div className="p-6 text-center min-h-screen pt-32">
        <div className="glass-card rounded-2xl p-12 border border-white/10 max-w-md mx-auto">
          <AlertCircle className="h-16 w-16 text-web3-accent-cyan mx-auto mb-4" />
          <p className="text-xl font-bold text-web3-text-primary mb-2">Produk tidak ditemukan</p>
          <p className="text-web3-text-secondary">Produk mungkin telah dihapus atau link salah.</p>
        </div>
      </div>
    );
  }

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image_url,
    description: `Beli ${product.name} di FishIt Marketplace`,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'IDR',
      price: product.price,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://fishit.com/game/${product.id}`,
      seller: {
        '@type': 'Organization',
        name: product.seller?.username || 'FishIt Seller'
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={product} />
    </>
  );
}
