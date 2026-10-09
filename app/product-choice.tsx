"use client";
import { useState } from "react";
import type { Product } from "./nativa";
import { ProductImage } from "./product-image";
import { ProductInformation } from "./product-information";
import { ProductShare } from "./product-share";
import { optionProduct } from "../lib/product-options";
import { sellingPrice } from "../lib/pricing";
import { money } from "./catalog";
import { ShoppingCart } from "lucide-react";
export function ProductChoice({
  product,
  ready,
  onAdd,
}: {
  product: Product;
  ready: boolean;
  onAdd: (variant?: string) => void;
}) {
  const [photo, setPhoto] = useState(product.image);
  const [variant, setVariant] = useState("");
  const p = optionProduct(product, variant);
  const photos = [...new Set([product.image, ...(product.images || [])])];
  return (
    <div className="product-detail">
      <div>
        <ProductImage
          product={{ ...product, image: photo }}
          className="product-detail-photo"
          lazy={false}
        />
        {photos.length > 1 && (
          <div
            className="product-photo-thumbnails"
            aria-label="Fotos do produto"
          >
            {photos.map((image, index) => (
              <button
                key={image}
                type="button"
                aria-label={`Ver foto ${index + 1}`}
                aria-pressed={photo === image}
                onClick={() => setPhoto(image)}
              >
                <img src={image} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <span className="eyebrow">{product.category}</span>
        <h2>{product.name}</h2>
        <p>{product.description}</p>
        {!!product.variants?.length && (
          <label className="product-option-label">
            Escolha o peso ou unidade
            <select
              aria-label="Escolha o peso ou unidade"
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
            >
              <option value="">
                {product.weight} — {money(sellingPrice(product))}
              </option>
              {product.variants.map((v) => (
                <option value={v.id} key={v.id}>
                  {v.weight} — {money(sellingPrice(v))}
                </option>
              ))}
            </select>
          </label>
        )}
        <span className="detail-weight">
          {p.weight} • {p.subtitle}
        </span>
        {p.sale_price != null && (
          <del className="original-price">De {money(p.price)}</del>
        )}
        <strong>{money(sellingPrice(p))}</strong>
        <button
          className="primary"
          disabled={!ready}
          onClick={() => onAdd(variant || undefined)}
        >
          <ShoppingCart size={18} />
          Adicionar à sacola
        </button>
        <ProductShare product={product} />
        <ProductInformation product={p} />
      </div>
    </div>
  );
}
