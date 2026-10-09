"use client";
import type { CSSProperties } from "react";
import {
  productImageFrame,
  type ProductImageSettings,
} from "../lib/product-image";
export function ProductImage({
  product,
  className = "",
  lazy = true,
}: {
  product: {
    image: string;
    name: string;
    image_settings?: ProductImageSettings | null;
  };
  className?: string;
  lazy?: boolean;
}) {
  const f = productImageFrame(product.image_settings);
  const style = {
    "--product-fit": f.fit,
    "--product-position": `${f.x}% ${f.y}%`,
    "--product-zoom": f.zoom / 100,
  } as CSSProperties;
  return (
    <div className={`product-image-frame ${className}`} style={style}>
      {product.image ? (
        <img
          src={product.image}
          alt={product.name || "Foto do produto"}
          loading={lazy ? "lazy" : "eager"}
          onError={(e) => {
            e.currentTarget.onerror = null;
            if (!e.currentTarget.src.endsWith("/images/mix.jpg"))
              e.currentTarget.src = "/images/mix.jpg";
          }}
        />
      ) : (
        <span className="product-image-placeholder">
          Escolha uma foto para ver a prévia
        </span>
      )}
    </div>
  );
}
