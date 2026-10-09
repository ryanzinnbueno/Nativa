import { Tag, ShoppingCart } from "lucide-react";
import { money } from "./catalog";
import { sellingPrice } from "../lib/pricing";
type OfferProduct = {
  id: string;
  name: string;
  image: string;
  weight: string;
  price: number;
  sale_price?: number | null;
};
export function Offers({
  products,
  onAll,
  onProduct,
  onAdd,
  ready,
}: {
  products: OfferProduct[];
  onAll: () => void;
  onProduct: (id: string) => void;
  onAdd: (id: string) => void;
  ready: boolean;
}) {
  return (
    <section
      className="offers-section section"
      aria-labelledby="offers-heading"
    >
      <div className="section-title">
        <div>
          <span className="eyebrow">ESCOLHAS QUE VALEM APROVEITAR</span>
          <h2 id="offers-heading">Ofertas da Nativa.</h2>
        </div>
        <button className="text-button" onClick={onAll}>
          Ver todas as ofertas →
        </button>
      </div>
      {products.length ? (
        <div className="offer-cards">
          {products.slice(0, 8).map((p) => (
            <article className="offer-card" key={p.id}>
              <button
                className="offer-image"
                aria-label={`Ver oferta de ${p.name}`}
                onClick={() => onProduct(p.id)}
              >
                <img src={p.image} alt={p.name} loading="lazy" />
                <span>
                  <Tag size={13} />
                  Em oferta
                </span>
              </button>
              <div className="offer-content">
                <button
                  className="product-name"
                  onClick={() => onProduct(p.id)}
                >
                  {p.name}
                </button>
                <small>{p.weight}</small>
                <del>{money(p.price)}</del>
                <strong>{money(sellingPrice(p))}</strong>
                <button
                  className="secondary full"
                  disabled={!ready}
                  onClick={() => onAdd(p.id)}
                >
                  <ShoppingCart size={17} />
                  Adicionar
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="offers-empty">
          Novas ofertas chegam por aqui. Enquanto isso, conheça nossa seleção de
          produtos.
        </p>
      )}
    </section>
  );
}
