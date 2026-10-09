"use client";
import { useState } from "react";
import { ShoppingCart, Heart } from "lucide-react";
import { money } from "./catalog";
import { sellingPrice } from "../lib/pricing";
import {
  productImageFrame,
  fullProductImage,
  type ProductImageSettings,
} from "../lib/product-image";
import { ProductChoice } from "./product-choice";
import type { Product } from "./nativa";
import type { ProductExtras } from "../lib/product-options";
import { ProductImage } from "./product-image";
import { type ProductInformationData } from "./product-information";
type PreviewProduct = ProductInformationData &
  ProductExtras & {
    id: string;
    name: string;
    category: string;
    description: string;
    image: string;
    price: number;
    sale_price?: number | null;
    active: boolean;
    image_settings?: ProductImageSettings | null;
  };
export function ProductPreview({
  product: p,
  onFrame,
}: {
  product: PreviewProduct;
  onFrame: (frame: ProductImageSettings) => void;
}) {
  const [view, setView] = useState<"card" | "detail">("card");
  const f = productImageFrame(p.image_settings);
  const price = sellingPrice(p);
  const sale = price < p.price;
  return (
    <section className="product-preview" aria-label="Prévia do produto">
      <div className="product-preview-heading">
        <h3>Assim fica na loja</h3>
        <span>Prévia · ainda não salvo</span>
      </div>
      {!p.active && (
        <p className="preview-hidden">Este produto está oculto na loja.</p>
      )}
      <div
        className="banner-device-tabs"
        role="group"
        aria-label="Tipo de prévia"
      >
        <button
          type="button"
          aria-pressed={view === "card"}
          onClick={() => setView("card")}
        >
          Na vitrine
        </button>
        <button
          type="button"
          aria-pressed={view === "detail"}
          onClick={() => setView("detail")}
        >
          Produto aberto
        </button>
      </div>
      {view === "card" ? (
        <article className="product-card preview-product-card">
          <div className="product-photo">
            <ProductImage product={p} lazy={false} />
            {p.tag && <span className="product-tag">{p.tag}</span>}
            {sale && <span className="sale-badge">Em oferta</span>}
            <span className="favorite">
              <Heart size={18} />
            </span>
          </div>
          <div className="product-content">
            <small className="product-category">
              {p.category || "Categoria"}
            </small>
            <h3 className="product-name">{p.name || "Nome do produto"}</h3>
            <p>{p.subtitle}</p>
            <div className="product-bottom">
              <div>
                <small>{p.weight || "Peso ou unidade"}</small>
                {sale && <del className="original-price">{money(p.price)}</del>}
                <strong>{money(price)}</strong>
              </div>
              <span className="add">
                <ShoppingCart size={18} />
              </span>
            </div>
          </div>
        </article>
      ) : (
        <div className="preview-product-detail">
          <ProductChoice
            key={p.id + p.image}
            product={p as Product}
            ready={false}
            onAdd={() => {}}
          />
        </div>
      )}
      <details className="product-photo-adjustments">
        <summary>Ajustar tamanho e posição da foto</summary>
        <label>
          Como mostrar a foto
          <select
            value={f.fit}
            onChange={(e) =>
              onFrame({
                ...f,
                fit: e.target.value as ProductImageSettings["fit"],
              })
            }
          >
            <option value="cover">Preencher o espaço (pode cortar)</option>
            <option value="contain">Mostrar a foto inteira</option>
          </select>
        </label>
        <small>Use o zoom se a própria imagem tiver margens em branco.</small>
        {(
          [
            ["zoom", "Tamanho da foto", 100, 250],
            ["x", "Posição horizontal", 0, 100],
            ["y", "Posição vertical", 0, 100],
          ] as const
        ).map(([key, label, min, max]) => (
          <label key={key}>
            {label}: {f[key]}%
            <input
              type="range"
              min={min}
              max={max}
              value={f[key]}
              onChange={(e) => onFrame({ ...f, [key]: Number(e.target.value) })}
            />
          </label>
        ))}
        <button
          type="button"
          className="secondary"
          onClick={() => onFrame({ ...fullProductImage })}
        >
          Restaurar ajuste
        </button>
      </details>
    </section>
  );
}
