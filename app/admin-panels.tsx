"use client";
import { useEffect, useState, FormEvent } from "react";
import {
  Plus,
  Download,
  Image as ImageIcon,
  Package,
  Check,
} from "lucide-react";
import { products as examples, money, statuses } from "./catalog";
import { Banner, defaultBanners } from "./banner-data";
import { type Category } from "./category-data";
import { ImageUpload } from "./image-upload";
import { BannerImageEditor } from "./banner-image-editor";
import { imageFrame } from "./banner-image";
import { bannerNeedsText } from "../lib/banner-presentation";
import { TrashAction } from "./trash-panel";
import { sellingPrice } from "../lib/pricing";
type Product = (typeof examples)[number] & {
  sale_price?: number | null;
  highlights?: string;
  usage?: string;
  active: boolean;
  position: number;
};
type Settings = {
  phone: string;
  banner_seconds: number;
  banner_autoplay: boolean;
};
type Catalog = {
  products: Product[];
  banners: Banner[];
  settings: Settings;
  categories: Category[];
};
async function request<T>(
  url: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const r = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Não foi possível salvar.");
  return d;
}
export function CatalogPanel({
  kind,
  onSaved,
}: {
  kind: "product" | "banner";
  onSaved: () => void;
}) {
  const [data, setData] = useState<Catalog | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState("");
  const [item, setItem] = useState<Product | Banner | null>(null),
    [isNew, setIsNew] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const load = async () => {
    setError("");
    try {
      setData(await request<Catalog>("/api/admin/catalog"));
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    let cancelled = false;
    void request<Catalog>("/api/admin/catalog")
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
  const items = kind === "product" ? data?.products : data?.banners;
  const edit = (value: Product | Banner, newItem = false) => {
    setSaved("");
    setError("");
    setItem({ ...value });
    setIsNew(newItem);
  };
  const fresh = () =>
    edit(
      kind === "product"
        ? {
            ...examples[0],
            id: crypto.randomUUID(),
            name: "",
            subtitle: "",
            weight: "",
            price: 0,
            sale_price: null,
            category: data?.categories[0]?.name || "",
            tag: "",
            description: "",
            ingredients: "",
            highlights: "",
            usage: "",
            active: true,
            position: data?.products.length || 0,
          }
        : {
            ...defaultBanners[0],
            id: crypto.randomUUID(),
            category: data?.categories[0]?.name || "",
            image_only: false,
            heading: "",
            heading_accent: "",
            title: "",
            accent: "",
            tag: "",
            description: "",
            position: data?.banners.length || 0,
          },
      true,
    );
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!item || uploadBusy) return;
    setBusy(true);
    setError("");
    setSaved("");
    try {
      await request("/api/admin/catalog", isNew ? "POST" : "PATCH", {
        kind,
        item,
      });
      setItem(null);
      await load();
      onSaved();
      setSaved(kind === "product" ? "Produto salvo." : "Banner salvo.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const field = (
    key: string,
    label: string,
    required = false,
    maxLength = 150,
  ) =>
    item && (
      <label>
        {label}
        <input
          required={required}
          maxLength={maxLength}
          value={String(
            (item as unknown as Record<string, unknown>)[key] ?? "",
          )}
          onChange={(e) => setItem({ ...item, [key]: e.target.value })}
        />
      </label>
    );
  return (
    <div className="management-panel">
      <div className="management-toolbar">
        <p>
          {kind === "product"
            ? "Cadastre, edite e escolha o que aparece na loja."
            : "Edite as imagens e mensagens da página inicial."}
        </p>
        <button
          className="primary"
          onClick={fresh}
          disabled={!data || busy || uploadBusy}
        >
          <Plus size={18} />
          {kind === "product" ? "Novo produto" : "Novo banner"}
        </button>
      </div>
      {error && (
        <div className="error" role="alert">
          {error} {!data && <button onClick={load}>Tentar novamente</button>}
        </div>
      )}
      {saved && (
        <p className="save-message" role="status">
          <Check size={18} />
          {saved}
        </p>
      )}
      {!data && !error && <p role="status">Carregando…</p>}
      {item ? (
        <form key={item.id} className="editor-card" onSubmit={submit}>
          <div className="editor-title">
            <h2>
              {isNew ? "Adicionar" : "Editar"}{" "}
              {kind === "product" ? "produto" : "banner"}
            </h2>
            <button
              type="button"
              className="text-button"
              onClick={() => setItem(null)}
              disabled={busy || uploadBusy}
            >
              Cancelar
            </button>
          </div>
          <div className="editor-grid">
            <div className="editor-photo">
              <img src={item.image} alt="Prévia da imagem" />
              <ImageUpload
                key={item.id}
                kind={kind}
                onBusy={setUploadBusy}
                onUploaded={(url) =>
                  setItem((current) =>
                    current ? { ...current, image: url } : current,
                  )
                }
              />
              <label>
                Escolher uma imagem da loja
                <select
                  value={item.image}
                  onChange={(e) => setItem({ ...item, image: e.target.value })}
                >
                  <option value={item.image}>Imagem atual</option>
                  {(kind === "product" ? examples : defaultBanners).map((p) => (
                    <option key={p.id} value={p.image}>
                      {"name" in p ? p.name : p.category}
                    </option>
                  ))}
                </select>
              </label>
              {field("image", "Endereço de outra imagem", true, 1500)}
              <small>
                Use uma imagem disponível na internet com endereço https://.
              </small>
            </div>
            <div className="editor-fields">
              {kind === "product" ? (
                <>
                  {field("name", "Nome do produto", true, 100)}
                  {field("subtitle", "Complemento", false, 150)}
                  <div className="editor-pair">
                    {field("weight", "Peso ou unidade", true, 60)}
                    <label>
                      Preço (R$)
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]+([.,][0-9]{1,2})?"
                        required
                        aria-label="Preço em reais"
                        defaultValue={
                          "price" in item
                            ? (item.price / 100).toFixed(2).replace(".", ",")
                            : ""
                        }
                        onChange={(e) => {
                          const n = Number(e.target.value.replace(",", "."));
                          if (Number.isFinite(n))
                            setItem({
                              ...item,
                              price: Math.round(n * 100),
                            } as Product);
                        }}
                      />
                    </label>
                  </div>
                  <label>
                    Preço promocional (R$){" "}
                    <span className="quiet">opcional</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]+([.,][0-9]{1,2})?"
                      aria-label="Preço promocional em reais"
                      placeholder="Deixe vazio para não ter promoção"
                      defaultValue={
                        "sale_price" in item && item.sale_price != null
                          ? (item.sale_price / 100).toFixed(2).replace(".", ",")
                          : ""
                      }
                      onChange={(e) => {
                        const value = e.target.value.trim();
                        const n = Number(value.replace(",", "."));
                        if (!value || Number.isFinite(n))
                          setItem({
                            ...item,
                            sale_price: value ? Math.round(n * 100) : null,
                          } as Product);
                      }}
                    />
                    <small>
                      Deve ser menor que o preço original. Aparece na loja e é
                      usado no pedido.
                    </small>
                  </label>
                  {field("tag", "Destaque curto", false, 60)}
                  {field("ingredients", "Ingredientes e cuidados", false, 2000)}
                  <label>
                    Destaques do produto
                    <textarea
                      maxLength={1000}
                      rows={4}
                      value={(item as Product).highlights || ""}
                      onChange={(e) =>
                        setItem({
                          ...item,
                          highlights: e.target.value,
                        } as Product)
                      }
                      placeholder="Escreva um destaque por linha"
                    />
                    <small>
                      Inclua características reais do produto, uma por linha.
                    </small>
                  </label>
                  <label>
                    Como usar ou consumir
                    <textarea
                      maxLength={1200}
                      rows={4}
                      value={(item as Product).usage || ""}
                      onChange={(e) =>
                        setItem({ ...item, usage: e.target.value } as Product)
                      }
                      placeholder="Sugestões de preparo e uso (opcional)"
                    />
                  </label>
                </>
              ) : (
                <>
                  <p>
                    Em Apresentação por tela, escolha como este banner aparece
                    no celular e no computador.
                  </p>
                  {bannerNeedsText(item as Banner) && (
                    <>
                      {field("heading", "Título", true, 40)}
                      {field(
                        "heading_accent",
                        "Complemento do título",
                        false,
                        40,
                      )}
                    </>
                  )}
                  {field("cta", "Texto do botão", true, 60)}
                  {field("alt", "Descrição da imagem", true, 180)}
                </>
              )}
              <label>
                {kind === "product"
                  ? "Categoria"
                  : "Categoria que o botão abre"}
                <select
                  required
                  value={item.category}
                  onChange={(e) =>
                    setItem({ ...item, category: e.target.value })
                  }
                >
                  <option value="" disabled>
                    Escolha a categoria
                  </option>
                  {data?.categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <small>Crie novas opções na aba Categorias.</small>
              </label>
              {(kind === "product" || bannerNeedsText(item as Banner)) && (
                <label>
                  Descrição
                  <textarea
                    maxLength={kind === "product" ? 2000 : 250}
                    value={item.description}
                    onChange={(e) =>
                      setItem({ ...item, description: e.target.value })
                    }
                  />
                </label>
              )}
              <div className="editor-pair">
                <label>
                  Ordem de exibição
                  <input
                    type="number"
                    min={0}
                    max={999}
                    required
                    value={item.position}
                    onChange={(e) =>
                      setItem({ ...item, position: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="check-field">
                  <input
                    type="checkbox"
                    checked={item.active}
                    onChange={(e) =>
                      setItem({ ...item, active: e.target.checked })
                    }
                  />
                  Mostrar na loja
                </label>
              </div>
              {kind === "product" && !isNew && (
                <TrashAction
                  kind="product"
                  id={item.id}
                  disabled={busy || uploadBusy}
                  onDone={async () => {
                    setItem(null);
                    await load();
                    onSaved();
                    setSaved("Produto movido para a lixeira.");
                  }}
                />
              )}
              {kind === "product" && (
                <button className="primary" disabled={busy || uploadBusy}>
                  {busy ? "Salvando…" : "Salvar alterações"}
                </button>
              )}
            </div>
          </div>
          {kind === "banner" && (
            <>
              <BannerImageEditor
                banner={item as Banner}
                onChange={setItem}
                onBusy={setUploadBusy}
                onMobileUploaded={(url) =>
                  setItem((current) => {
                    if (!current) return current;
                    const banner = current as Banner;
                    return {
                      ...banner,
                      image_settings: {
                        desktop: imageFrame(banner, "desktop"),
                        mobile: imageFrame(banner, "mobile"),
                        ...banner.image_settings,
                        mobile_image: url,
                      },
                    };
                  })
                }
              />
              <button className="primary" disabled={busy || uploadBusy}>
                {busy ? "Salvando…" : "Salvar alterações"}
              </button>
            </>
          )}
        </form>
      ) : (
        <div className="management-grid">
          {items?.map((p) => (
            <button
              className="management-card"
              key={p.id}
              onClick={() => edit(p)}
            >
              <img src={p.image} alt="" />
              <div>
                <span
                  className={"visibility-tag " + (p.active ? "active" : "")}
                >
                  {p.active ? "Visível" : "Oculto"}
                </span>
                <h3>
                  {"name" in p
                    ? p.name
                    : p.image_only
                      ? "Banner em imagem"
                      : p.heading + " " + p.heading_accent}
                </h3>
                <p>
                  {p.category}
                  {"price" in p ? " · " + money(sellingPrice(p)) : ""}
                </p>
                <small>Ordem {p.position} · Editar</small>
              </div>
            </button>
          ))}
        </div>
      )}
      {kind === "banner" && data && (
        <BannerSettings settings={data.settings} onSaved={onSaved} />
      )}
    </div>
  );
}
function BannerSettings({
  settings,
  onSaved,
}: {
  settings: Settings;
  onSaved: () => void;
}) {
  const [seconds, setSeconds] = useState(settings.banner_seconds),
    [autoplay, setAutoplay] = useState(settings.banner_autoplay),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <form
      className="editor-card banner-settings"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        try {
          await request("/api/store", "PATCH", {
            type: "banner-settings",
            banner_seconds: seconds,
            banner_autoplay: autoplay,
          });
          setMessage("Preferências salvas.");
          onSaved();
        } catch (e) {
          setMessage((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>
        <ImageIcon size={21} />
        Como os banners passam
      </h2>
      <div className="editor-pair">
        <label>
          Tempo entre banners (segundos)
          <input
            type="number"
            min={3}
            max={20}
            required
            value={seconds}
            onChange={(e) => setSeconds(Number(e.target.value))}
          />
        </label>
        <label className="check-field">
          <input
            type="checkbox"
            checked={autoplay}
            onChange={(e) => setAutoplay(e.target.checked)}
          />
          Passar automaticamente
        </label>
      </div>
      <small>
        A passagem automática respeita a preferência de movimento de cada
        visitante.
      </small>
      <button className="primary" disabled={busy}>
        {busy ? "Salvando…" : "Salvar preferências"}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
export function ReportsPanel() {
  const today = new Date().toLocaleDateString("sv-SE", {
    timeZone: "America/Bahia",
  });
  const [start, setStart] = useState(today.slice(0, 8) + "01"),
    [end, setEnd] = useState(today),
    [status, setStatus] = useState("Todos"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const download = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await request<{
        orders: import("../lib/order-report").ReportOrder[];
        start: string;
        end: string;
        status: string;
      }>("/api/admin/reports?" + new URLSearchParams({ start, end, status }));
      const { createOrderReport } = await import("../lib/order-report");
      createOrderReport(data).save(`nativa-pedidos-${start}-a-${end}.pdf`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="editor-card report-form" onSubmit={download}>
      <Package size={30} />
      <h2>Pedidos em um só lugar</h2>
      <p>
        Escolha o período e baixe um relatório com clientes, valores, situação
        dos pedidos e entrega.
      </p>
      <div className="editor-pair">
        <label>
          De
          <input
            type="date"
            required
            value={start}
            max={end}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label>
          Até
          <input
            type="date"
            required
            value={end}
            min={start}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
      </div>
      <label>
        Situação
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {["Todos", ...statuses].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <small>
        O relatório inclui os pedidos cancelados quando você escolher “Todos”.
        Eles não entram na soma dos valores.
      </small>
      <button className="primary" disabled={busy}>
        <Download size={18} />
        {busy ? "Preparando relatório…" : "Baixar relatório em PDF"}
      </button>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
    </form>
  );
}
