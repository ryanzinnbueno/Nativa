import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import VillaNatura, { type Product } from "../../nativa";
import { productPath } from "../../../lib/product-link";
export const dynamic = "force-dynamic";
const loadProduct = cache(async (id: string): Promise<Product | null> => {
  if (!id || id.length > 80) return null;
  const client = await createClient();
  const { data, error } = await client
    .from("nativa_products")
    .select(
      "id,name,subtitle,category,weight,price,sale_price,tag,image,image_settings,description,ingredients,highlights,usage,images,variants",
    )
    .eq("id", id)
    .eq("active", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (error)
    throw new Error("Não foi possível carregar este produto. Tente novamente.");
  return data as Product | null;
});
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await loadProduct(id);
  if (!product)
    return {
      title: "Produto indisponível | Villa Natura",
      robots: { index: false, follow: false },
    };
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    "https://nativa-bem-viver.netlify.app";
  const url = new URL(productPath(id), origin).href;
  const image = new URL(product.image, origin).href;
  const title = `${product.name} | Villa Natura`,
    description =
      product.description.slice(0, 180) ||
      `Conheça ${product.name} na Villa Natura.`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Villa Natura",
      images: [{ url: image, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await loadProduct(id);
  if (!product) notFound();
  return <VillaNatura initialProduct={product} />;
}
