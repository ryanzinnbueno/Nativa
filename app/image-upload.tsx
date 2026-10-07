"use client";
import { useState, useRef } from "react";
import { Upload, CheckCircle2 } from "lucide-react";
export function ImageUpload({
  kind,
  onUploaded,
  onBusy,
}: {
  kind: "product" | "banner";
  onUploaded: (url: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="upload-photo">
      <input
        ref={input}
        className="visually-hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Escolher foto do dispositivo"
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setError("");
          setDone(false);
          if (
            !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
            file.size > 4 * 1024 * 1024
          ) {
            setError("Escolha uma foto JPG, PNG ou WebP de até 4 MB.");
            return;
          }
          setBusy(true);
          onBusy(true);
          try {
            const body = new FormData();
            body.append("image", file);
            body.append("kind", kind);
            const r = await fetch("/api/admin/images", {
              method: "POST",
              body,
            });
            const data = await r.json().catch(()=>({error:'Não foi possível enviar a foto. Tente novamente.'}));
            if (!r.ok || typeof data.url !== 'string')
              throw new Error(data.error || "Não foi possível enviar a foto.");
            onUploaded(data.url);
            setDone(true);
          } catch (e) {
            setError(e instanceof TypeError ? 'Verifique sua conexão e tente enviar a foto novamente.' : (e as Error).message);
          } finally {
            setBusy(false);
            onBusy(false);
          }
        }}
      />
      <button
        className="secondary full"
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        <Upload size={18} />
        {busy ? "Enviando foto…" : "Enviar foto do celular ou computador"}
      </button>
      <small>
        JPG, PNG ou WebP · até 4 MB. A foto será exibida na loja ao salvar.
      </small>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {done && (
        <p className="save-message" role="status">
          <CheckCircle2 size={17} />
          Foto enviada. Salve as alterações para usar na loja.
        </p>
      )}
    </div>
  );
}
