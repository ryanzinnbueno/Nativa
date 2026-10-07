"use client";
import { useEffect, useState } from "react";
import { Trash2, RotateCcw } from "lucide-react";
import { money } from "./catalog";
type Kind = "product" | "order";
async function move(kind: Kind, id: string, action: "delete" | "restore") {
  const r = await fetch("/api/admin/trash", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, id, action }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Não foi possível atualizar.");
}
export function TrashAction({
  kind,
  id,
  disabled = false,
  onDone,
}: {
  kind: Kind;
  id: string;
  disabled?: boolean;
  onDone: () => void | Promise<void>;
}) {
  const [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const noun = kind === "product" ? "produto" : "pedido";
  async function remove() {
    setBusy(true);
    setError("");
    try {
      await move(kind, id, "delete");
      await onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível excluir.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="trash-action">
      {confirm ? (
        <div className="remove-confirm">
          <p>Excluir este {noun}? Você poderá recuperá-lo na Lixeira.</p>
          <button
            type="button"
            className="danger-button"
            disabled={busy || disabled}
            onClick={remove}
          >
            {busy ? "Excluindo…" : "Confirmar exclusão"}
          </button>
          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={() => setConfirm(false)}
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="danger-button"
          disabled={disabled}
          onClick={() => setConfirm(true)}
        >
          <Trash2 size={16} />
          Excluir {noun}
        </button>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </div>
  );
}
type TrashData = {
  products: { id: string; name: string; deleted_at: string }[];
  orders: {
    id: string;
    total: number;
    deleted_at: string;
    nativa_customers: { name: string } | null;
  }[];
};
export function TrashPanel({
  onSaved,
}: {
  onSaved: () => void | Promise<void>;
}) {
  const [data, setData] = useState<TrashData | null>(null),
    [kind, setKind] = useState<Kind>("order"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(""),
    [message, setMessage] = useState("");
  async function read() {
    const r = await fetch("/api/admin/trash");
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Não foi possível carregar.");
    return d as TrashData;
  }
  useEffect(() => {
    let cancelled = false;
    read()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  async function restore(id: string) {
    setBusy(id);
    setError("");
    try {
      await move(kind, id, "restore");
      setData(await read());
      await onSaved();
      setMessage(
        kind === "product"
          ? "Produto recuperado. Em Produtos, marque Mostrar na loja quando estiver pronto."
          : "Pedido recuperado.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível recuperar.");
    } finally {
      setBusy("");
    }
  }
  const items = kind === "product" ? data?.products : data?.orders;
  return (
    <div className="management-panel">
      <p>
        Recupere pedidos e produtos excluídos. Produtos recuperados ficam
        ocultos até você escolher mostrá-los na loja.
      </p>
      <div className="management-toolbar">
        <button
          className={kind === "order" ? "primary" : "secondary"}
          disabled={!!busy}
          onClick={() => {
            setKind("order");
            setMessage("");
          }}
        >
          Pedidos
        </button>
        <button
          className={kind === "product" ? "primary" : "secondary"}
          disabled={!!busy}
          onClick={() => {
            setKind("product");
            setMessage("");
          }}
        >
          Produtos
        </button>
      </div>
      {message && (
        <p role="status" className="save-message">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {!data && !error && <p role="status">Carregando…</p>}
      <div className="trash-list">
        {items?.map((item) => (
          <div key={item.id} className="trash-item">
            <div>
              <strong>
                {"name" in item
                  ? item.name
                  : `Pedido #${item.id.slice(0, 8).toUpperCase()}`}
              </strong>
              {"total" in item && (
                <small>
                  {item.nativa_customers?.name || "Cliente"} ·{" "}
                  {money(item.total)}
                </small>
              )}
              <small>
                Excluído em{" "}
                {new Date(item.deleted_at).toLocaleDateString("pt-BR", {
                  timeZone: "America/Bahia",
                })}
              </small>
            </div>
            <button
              className="secondary"
              disabled={!!busy}
              onClick={() => restore(item.id)}
            >
              <RotateCcw size={16} />
              {busy === item.id ? "Recuperando…" : "Recuperar"}
            </button>
          </div>
        ))}
      </div>
      {items?.length === 0 && (
        <p>Nenhum {kind === "product" ? "produto" : "pedido"} na lixeira.</p>
      )}
      {items?.length === 500 && (
        <p>
          Mostrando os 500 itens mais recentes. Ao recuperar um item, os
          anteriores ficam disponíveis.
        </p>
      )}
    </div>
  );
}
