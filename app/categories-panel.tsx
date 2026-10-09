"use client";
import { useState, useEffect } from "react";
import { Plus, Leaf } from "lucide-react";
import { type Category } from "./category-data";
import { ImageUpload } from "./image-upload";
import { categoryStories } from "../lib/category-stories";
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
    [uploading, setUploading] = useState(false),
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
          produtos e banners. Escolha também quais aparecem em “Qual é o seu
          momento?”.
        </p>
        <button
          className="primary"
          disabled={!data || busy}
          onClick={() => {
            setItem({
              id: crypto.randomUUID(),
              name: "",
              position: data?.categories.length || 0,
              featured: false,
              story_image: "",
              story_title: "",
              story_description: "",
              story_tag: "",
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
              disabled={busy || uploading}
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
          <label className="category-feature-toggle">
            <input
              type="checkbox"
              checked={item.featured ?? categoryStories([item], []).length > 0}
              onChange={(e) => setItem({ ...item, featured: e.target.checked })}
            />
            Mostrar em “Qual é o seu momento?”
          </label>
          {(item.featured ?? categoryStories([item], []).length > 0) && (
            <div className="category-feature-editor">
              <p>
                Escolha a imagem e os textos deste destaque. Campos vazios usam
                o nome da categoria e uma foto da seleção.
              </p>
              <label>
                Foto do destaque
                <input
                  maxLength={1500}
                  value={item.story_image || ""}
                  onChange={(e) =>
                    setItem({ ...item, story_image: e.target.value })
                  }
                  placeholder="Endereço da foto (opcional)"
                />
              </label>
              <ImageUpload
                kind="banner"
                onBusy={setUploading}
                onUploaded={(url) =>
                  setItem((current) =>
                    current ? { ...current, story_image: url } : null,
                  )
                }
              />
              <label>
                Título do destaque
                <input
                  maxLength={60}
                  value={item.story_title || ""}
                  onChange={(e) =>
                    setItem({ ...item, story_title: e.target.value })
                  }
                  placeholder={item.name}
                />
              </label>
              <label>
                Frase pequena no topo
                <input
                  maxLength={40}
                  value={item.story_tag || ""}
                  onChange={(e) =>
                    setItem({ ...item, story_tag: e.target.value })
                  }
                  placeholder="PARA O SEU DIA"
                />
              </label>
              <label>
                Descrição curta
                <input
                  maxLength={160}
                  value={item.story_description || ""}
                  onChange={(e) =>
                    setItem({ ...item, story_description: e.target.value })
                  }
                  placeholder="Descubra nossa seleção."
                />
              </label>
            </div>
          )}
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
          <button className="primary" disabled={busy || uploading}>
            {busy ? "Salvando…" : "Salvar categoria"}
          </button>
        </form>
      ) : (
        <div className="management-grid">
          {data?.categories.map((c) => (
            <article className="category-management-card" key={c.id}>
              <button
                className="category-edit-button"
                disabled={busy}
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
              <label className="category-feature-toggle featured-category-badge">
                <input
                  type="checkbox"
                  checked={c.featured ?? categoryStories([c], []).length > 0}
                  disabled={busy}
                  onChange={async (e) => {
                    const featured = e.target.checked;
                    setBusy(true);
                    setError("");
                    setMessage("");
                    try {
                      const r = await fetch("/api/admin/catalog", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          kind: "category",
                          item: { ...c, featured },
                        }),
                      });
                      const result = await r.json();
                      if (!r.ok)
                        throw new Error(
                          result.error || "Não foi possível salvar.",
                        );
                      setData(await loadCatalog());
                      onSaved();
                      setMessage(
                        featured
                          ? `${c.name} aparece em “Qual é o seu momento?”.`
                          : `${c.name} foi retirada dos destaques.`,
                      );
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
                Mostrar em “Qual é o seu momento?”
              </label>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
