"use client";
import type { ProductExtras, ProductOption } from "../lib/product-options";
import { ImageUpload } from "./image-upload";
export function ProductExtrasEditor({
  product: p,
  onChange,
  onBusy,
}: {
  product: ProductExtras;
  onChange: (extras: ProductExtras) => void;
  onBusy: (busy: boolean) => void;
}) {
  const variants = p.variants || [],
    images = p.images || [];
  const update = (index: number, value: Partial<ProductOption>) =>
    onChange({
      variants: variants.map((v, i) => (i === index ? { ...v, ...value } : v)),
    });
  return (
    <div className="product-extras-editor">
      <details>
        <summary>Mais fotos ({images.length})</summary>
        <p>
          A foto principal aparece na vitrine. As demais aparecem ao abrir o
          produto.
        </p>
        <div className="extra-photo-list">
          {images.map((image, i) => (
            <div key={image}>
              <img src={image} alt={`Foto adicional ${i + 1}`} />
              <button
                type="button"
                onClick={() =>
                  onChange({ images: images.filter((_, n) => n !== i) })
                }
              >
                Remover foto {i + 1}
              </button>
            </div>
          ))}
        </div>
        {images.length < 7 && (
          <ImageUpload
            kind="product"
            onBusy={onBusy}
            onUploaded={(url) =>
              onChange({ images: [...new Set([...images, url])] })
            }
          />
        )}
      </details>
      <details>
        <summary>Outros pesos ou unidades ({variants.length})</summary>
        <p>
          O peso e preço acima são a opção principal. Adicione aqui outras
          opções.
        </p>
        {variants.map((v, i) => (
          <fieldset key={v.id}>
            <legend>Opção {i + 2}</legend>
            <label>
              Peso ou unidade
              <input
                required
                maxLength={60}
                placeholder="Ex.: 250 g ou 1 unidade"
                value={v.weight}
                onChange={(e) => update(i, { weight: e.target.value })}
              />
            </label>
            <div className="editor-pair">
              <label>
                Preço (R$)
                <input
                  required
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]+([.,][0-9]{1,2})?"
                  defaultValue={(v.price / 100).toFixed(2)}
                  onChange={(e) =>
                    update(i, {
                      price: Math.round(
                        Number(e.target.value.replace(",", ".")) * 100,
                      ),
                    })
                  }
                />
              </label>
              <label>
                Promoção (R$), opcional
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]+([.,][0-9]{1,2})?"
                  defaultValue={
                    v.sale_price == null ? "" : (v.sale_price / 100).toFixed(2)
                  }
                  onChange={(e) =>
                    update(i, {
                      sale_price: e.target.value.trim()
                        ? Math.round(
                            Number(e.target.value.replace(",", ".")) * 100,
                          )
                        : null,
                    })
                  }
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() =>
                onChange({ variants: variants.filter((_, n) => n !== i) })
              }
            >
              Remover opção
            </button>
          </fieldset>
        ))}
        {variants.length < 19 && (
          <button
            type="button"
            onClick={() =>
              onChange({
                variants: [
                  ...variants,
                  {
                    id: crypto.randomUUID(),
                    weight: "",
                    price: 0,
                    sale_price: null,
                  },
                ],
              })
            }
          >
            Adicionar peso ou unidade
          </button>
        )}
      </details>
    </div>
  );
}
