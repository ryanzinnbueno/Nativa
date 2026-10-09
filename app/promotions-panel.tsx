"use client";
import { useState, useEffect } from "react";
import { defaultPromotion, type Promotion } from "../lib/shop-features";
import { ImageUpload } from "./image-upload";
export function PromotionsPanel({ onSaved }: { onSaved: () => void }) {
  const [value, setValue] = useState<Promotion>(defaultPromotion),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [upload, setUpload] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/promotion")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        if (!cancelled) {
          setValue(d.promotion);
          setReady(true);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <form
      className="editor-card promotion-editor"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        setSaved(false);
        try {
          const r = await fetch("/api/admin/promotion", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(value),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error);
          setSaved(true);
          onSaved();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>Aviso de ofertas</h2>
      <p>
        Exibido uma vez por visita, somente quando houver produtos com preço
        promocional. Os preços são definidos na aba Produtos.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {!ready && !error && <p>Carregando…</p>}
      <fieldset disabled={!ready || busy || upload}>
        <label className="check-field">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => setValue({ ...value, enabled: e.target.checked })}
          />
          Mostrar aviso na loja
        </label>
        <label>
          Título
          <input
            required
            maxLength={100}
            value={value.title}
            onChange={(e) => setValue({ ...value, title: e.target.value })}
          />
        </label>
        <label>
          Mensagem
          <textarea
            maxLength={400}
            value={value.message}
            onChange={(e) => setValue({ ...value, message: e.target.value })}
          />
        </label>
        <label>
          Texto do botão
          <input
            required
            maxLength={60}
            value={value.cta}
            onChange={(e) => setValue({ ...value, cta: e.target.value })}
          />
        </label>
        <label>
          Imagem opcional
          <input
            maxLength={1500}
            value={value.image}
            placeholder="https://…"
            onChange={(e) => setValue({ ...value, image: e.target.value })}
          />
        </label>
        {value.image && (
          <>
            <img
              className="promotion-preview"
              src={value.image}
              alt="Prévia do aviso"
            />
            <button
              type="button"
              className="text-button"
              onClick={() => setValue({ ...value, image: "" })}
            >
              Remover imagem do aviso
            </button>
          </>
        )}
      </fieldset>
      {ready && (
        <ImageUpload
          kind="banner"
          onBusy={setUpload}
          onUploaded={(url) =>
            setValue((current) => ({ ...current, image: url }))
          }
        />
      )}
      <button className="primary" disabled={!ready || busy || upload}>
        {busy ? "Salvando…" : "Salvar aviso"}
      </button>
      {saved && <p role="status">Aviso salvo.</p>}
    </form>
  );
}
