"use client";
import { useState } from "react";
import { Share2, Link as LinkIcon } from "lucide-react";
import { productLink } from "../lib/product-link";
export function ProductShare({
  product,
}: {
  product: { id: string; name: string };
}) {
  const [message, setMessage] = useState(""),
    [manualLink, setManualLink] = useState("");
  const copy = async () => {
    const url = productLink(window.location.origin, product.id);
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link do produto copiado!");
      setManualLink("");
    } catch {
      setManualLink(url);
      setMessage("Selecione e copie o link abaixo.");
    }
  };
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} | Villa Natura`,
          text: `Conheça ${product.name} na Villa Natura.`,
          url: productLink(window.location.origin, product.id),
        });
        setMessage("");
        return;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
      }
    }
    await copy();
  };
  return (
    <div className="product-share">
      <div className="product-share-buttons">
        <button
          type="button"
          className="secondary"
          onClick={share}
          aria-label={`Compartilhar ${product.name}`}
        >
          <Share2 size={17} />
          Compartilhar
        </button>
        <button
          type="button"
          className="secondary"
          onClick={copy}
          aria-label={`Copiar link de ${product.name}`}
        >
          <LinkIcon size={17} />
          Copiar link
        </button>
      </div>
      {message && <p role="status">{message}</p>}
      {manualLink && (
        <input
          aria-label="Link deste produto"
          readOnly
          value={manualLink}
          onFocus={(e) => e.currentTarget.select()}
        />
      )}
    </div>
  );
}
