"use client";
import { useState, useEffect } from "react";
import { Plus, Leaf } from "lucide-react";
import { type Category } from "./category-data";
type Catalog = { categories: Category[]; products: { category: string }[] };
async function loadCatalog(): Promise<Catalog> {
  const r = await fetch("/api/admin/catalog");
  const d = await r.json();
  if (!r.ok)
    throw new Error(d.error || "Não foi possível carregar as categorias.");
  return d;
}
export function CategoriesPanel({ onSaved }: { onSaved: () => void }) {
  const [data, setData] = useState<Catalog | null>(null),
    [item, setItem] = useState<Category | null>(null),
    [isNew, setIsNew] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => {
    let cancelled = false;
    void loadCatalog()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <div className="management-panel">
      <div className="management-toolbar">
        <p>
          Organize sua seleção. As categorias cadastradas ficam disponíveis nos
          produtos e banners.
        </p>
        <button
          className="primary"
          disabled={!data || busy}
          onClick={() => {
            setItem({
              id: crypto.randomUUID(),
              name: "",
              position: data?.categories.length || 0,
            });
            setIsNew(true);
            setMessage("");
            setError("");
          }}
        >
          <Plus size={18} />
          Nova categoria
        </button>
      </div>
      {error && (
        <div className="error" role="alert">
          {error}
          {!data && (
            <button
              onClick={() => {
                setError("");
                void loadCatalog()
                  .then(setData)
                  .catch((e) => setError(e.message));
              }}
            >
              Tentar novamente
            </button>
          )}
        </div>
      )}
      {message && (
        <p className="save-message" role="status">
          {message}
        </p>
      )}
      {!data && !error && <p role="status">Carregando…</p>}
      {item ? (
        <form
          className="editor-card category-editor"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              const r = await fetch("/api/admin/catalog", {
                method: isNew ? "POST" : "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kind: "category", item }),
              });
              const result = await r.json();
              if (!r.ok) throw new Error(result.error);
              setData(await loadCatalog());
              setItem(null);
              setMessage("Categoria salva.");
              onSaved();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="editor-title">
            <h2>{isNew ? "Nova categoria" : "Editar categoria"}</h2>
            <button
              type="button"
              className="text-button"
              disabled={busy}
              onClick={() => setItem(null)}
            >
              Cancelar
            </button>
          </div>
          <label>
            Nome da categoria
            <input
              required
              maxLength={60}
              value={item.name}
              onChange={(e) => setItem({ ...item, name: e.target.value })}
            />
          </label>
          <label>
            Ordem de exibição
            <input
              type="number"
              required
              min={0}
              max={999}
              value={item.position}
              onChange={(e) =>
                setItem({ ...item, position: Number(e.target.value) })
              }
            />
          </label>
          <small>
            Ao alterar o nome, os produtos e banners desta categoria serão
            atualizados juntos.
          </small>
          <button className="primary" disabled={busy}>
            {busy ? "Salvando…" : "Salvar categoria"}
          </button>
        </form>
      ) : (
        <div className="management-grid">
          {data?.categories.map((c) => (
            <button
              className="category-management-card"
              key={c.id}
              onClick={() => {
                setItem({ ...c });
                setIsNew(false);
                setError("");
                setMessage("");
              }}
            >
              <Leaf size={26} />
              <h3>{c.name}</h3>
              <p>
                {data.products.filter((p) => p.category === c.name).length}{" "}
                produtos
              </p>
              <small>Ordem {c.position} · Editar</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
