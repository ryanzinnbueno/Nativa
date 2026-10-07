"use client";
import HeroCarousel from "./hero-carousel";
import { useEffect, useState, useRef, useCallback, FormEvent } from "react";
import {
  Leaf,
  ShoppingBag,
  ShoppingCart,
  Search,
  Plus,
  Minus,
  X,
  Menu,
  Check,
  Heart,
  SlidersHorizontal,
  Package,
  Users,
  LayoutDashboard,
  MessageCircle,
  Store,
  ChevronRight,
  Truck,
  ShieldCheck,
  ArrowUpRight,
  Download,
  Settings,
  Camera as Instagram,
  CheckCircle2,
  ShoppingBasket,
  Flower2,
  Wheat,
  Nut,
  Sun,
} from "lucide-react";
import { products as demoProducts, money, statuses } from "./catalog";
type Product = (typeof demoProducts)[number];
type CartItem = { id: string; qty: number };
type Customer = {
  id: string;
  name: string;
  phone: string;
  notes: string;
  created: string;
};
type Order = {
  id: string;
  customer_id: string;
  items: {
    id: string;
    name: string;
    weight: string;
    price: number;
    qty: number;
  }[];
  total: number;
  status: string;
  channel: string;
  delivery: string;
  address: string;
  payment: string;
  notes: string;
  created: string;
};
const categories = [
  { name: "Todos", icon: Leaf },
  { name: "Castanhas", icon: Nut },
  { name: "Grãos e cereais", icon: Wheat },
  { name: "Chás e ervas", icon: Flower2 },
  { name: "Frutas secas", icon: Sun },
];
const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
type StoreData = {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  phone: string;
};
type OrderResult = { id: string; total: number; items: Order["items"] };
async function api<T = StoreData>(
  method = "GET",
  body?: unknown,
  scope = "public",
) {
  const r = await fetch(
    "/api/store" + (scope === "admin" ? "?scope=admin" : ""),
    {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  );
  const data = (await r.json()) as T & { error?: string };
  if (!r.ok) throw new Error(data.error || "Algo deu errado. Tente novamente.");
  return data;
}
function Modal({
  children,
  close,
  title,
  wide = false,
}: {
  children: React.ReactNode;
  close: () => void;
  title: string;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const previous = useRef<HTMLElement | null>(null);
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  }, [close]);
  useEffect(() => {
    previous.current = document.activeElement as HTMLElement;
    const prior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = setTimeout(
      () =>
        ref.current
          ?.querySelector<HTMLElement>("button,input,select,textarea,a")
          ?.focus(),
      50,
    );
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const all = ref.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input,select,textarea,a[href]",
        );
        if (!all?.length) return;
        const first = all[0],
          last = all[all.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = prior;
      document.removeEventListener("keydown", key);
      previous.current?.focus();
    };
  }, []);
  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={"modal " + (wide ? "wide" : "")}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" aria-label="Fechar" onClick={close}>
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Logo() {
  return (
    <span className="logo">
      <Leaf size={30} strokeWidth={1.4} />
      <span>
        nativa<small>BEM VIVER</small>
      </span>
    </span>
  );
}
export default function Nativa() {
  const [view, setView] = useState("loja"),
    [category, setCategory] = useState("Todos"),
    [search, setSearch] = useState(""),
    [sort, setSort] = useState("destaques"),
    [cart, setCart] = useState<CartItem[]>([]),
    [favorite, setFavorite] = useState<string[]>([]),
    [favoriteOnly, setFavoriteOnly] = useState(false),
    [selected, setSelected] = useState<Product | null>(null),
    [cartOpen, setCartOpen] = useState(false),
    [checkout, setCheckout] = useState(false),
    [toast, setToast] = useState(""),
    [menu, setMenu] = useState(false),
    [orders, setOrders] = useState<Order[]>([]),
    [customers, setCustomers] = useState<Customer[]>([]),
    [phone, setPhone] = useState(""),
    [phoneDraft, setPhoneDraft] = useState(""),
    [tab, setTab] = useState("overview"),
    [loading, setLoading] = useState(false),
    [loadError, setLoadError] = useState(""),
    [crmSearch, setCrmSearch] = useState(""),
    [statusFilter, setStatusFilter] = useState("Todos"),
    [currentOrder, setCurrentOrder] = useState<Order | null>(null),
    [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null),
    [notes, setNotes] = useState(""),
    [saving, setSaving] = useState(false),
    [delivery, setDelivery] = useState("Retirada"),
    [success, setSuccess] = useState<{
      id: string;
      total: number;
      wa: string;
      channel: string;
    } | null>(null),
    [submitError, setSubmitError] = useState("");
  const [cartReady, setCartReady] = useState(false),
    [products, setProducts] = useState(demoProducts),
    [admin, setAdmin] = useState(false),
    [loginError, setLoginError] = useState(""),
    [loginBusy, setLoginBusy] = useState(false);
  const requestKey = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (
      view !== "loja" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const elements = document.querySelectorAll(
      ".category-stories .section-title,.category-story-grid,.catalog .section-title,.about-copy,.closing",
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("nativa-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    elements.forEach((el) => {
      el.classList.add("nativa-reveal");
      observer.observe(el);
    });
    return () => {
      observer.disconnect();
      elements.forEach((el) =>
        el.classList.remove("nativa-reveal", "nativa-revealed"),
      );
    };
  }, [view]);
  const notify = (s: string) => {
    setToast(s);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 3500);
  };
  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const d = await api("GET", undefined, "admin");
      setAdmin(true);
      setOrders(d.orders);
      setCustomers(d.customers);
      setPhone(d.phone);
      setPhoneDraft(d.phone);
    } catch (e) {
      setAdmin(false);
      setOrders([]);
      setCustomers([]);
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  const loadStore = useCallback(async () => {
    try {
      const d = await api();
      setProducts(d.products);
      setCart((c) => c.filter((i) => d.products.some((p) => p.id === i.id)));
      setPhone(d.phone);
      setPhoneDraft(d.phone);
    } catch {
      /* Keep the catalog preview; checkout reports connection errors. */
    }
  }, []);
  // Restore the cart from external session storage once, before persisting changes.
  useEffect(() => {
    let draft: CartItem[] = [];
    try {
      const value = JSON.parse(sessionStorage.getItem("nativa-sacola") || "[]");
      if (Array.isArray(value))
        draft = value.filter(
          (i) =>
            demoProducts.some((p) => p.id === i.id) &&
            Number.isInteger(i.qty) &&
            i.qty > 0 &&
            i.qty <= 99,
        );
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore external persisted state on mount.
    setCart(draft);
    setCartReady(true);
    void loadStore();
  }, [loadStore]);
  useEffect(() => {
    if (cartReady) {
      try {
        sessionStorage.setItem("nativa-sacola", JSON.stringify(cart));
      } catch {}
    }
  }, [cart, cartReady]);
  const add = (p: Product) => {
    setCart((c) =>
      c.find((i) => i.id === p.id)
        ? c.map((i) =>
            i.id === p.id ? { ...i, qty: Math.min(99, i.qty + 1) } : i,
          )
        : [...c, { id: p.id, qty: 1 }],
    );
    notify(p.name + " na sua sacola");
  };
  const change = (id: string, n: number) =>
    setCart((c) =>
      c
        .map((i) => (i.id === id ? { ...i, qty: Math.min(99, i.qty + n) } : i))
        .filter((i) => i.qty > 0),
    );
  const count = cart.reduce((s, i) => s + i.qty, 0),
    total = cart.reduce(
      (s, i) => s + products.find((p) => p.id === i.id)!.price * i.qty,
      0,
    );
  const filtered = products
    .filter(
      (p) =>
        (category === "Todos" || p.category === category) &&
        (!favoriteOnly || favorite.includes(p.id)) &&
        (p.name + " " + p.subtitle)
          .toLocaleLowerCase("pt-BR")
          .includes(search.toLocaleLowerCase("pt-BR")),
    )
    .sort((a, b) =>
      sort === "menor"
        ? a.price - b.price
        : sort === "maior"
          ? b.price - a.price
          : 0,
    );
  const toggleFavorite = (id: string) =>
    setFavorite((f) =>
      f.includes(id) ? f.filter((i) => i !== id) : [...f, id],
    );
  const shop = () => {
    setView("loja");
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openCRM = () => {
    setView("crm");
    setMenu(false);
    load();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const about = () => {
    setView("loja");
    setMenu(false);
    setTimeout(
      () =>
        document
          .getElementById("sobre")
          ?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  };
  const beginCheckout = () => {
    requestKey.current = crypto.randomUUID();
    setCartOpen(false);
    setCheckout(true);
    setSuccess(null);
    setSubmitError("");
  };
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      channel =
        (e.nativeEvent as SubmitEvent).submitter?.getAttribute(
          "data-channel",
        ) || "Site";
    if (channel === "WhatsApp" && !phone) {
      setSubmitError(
        "Configure o WhatsApp da loja no CRM antes de usar esta opção.",
      );
      return;
    }
    setSaving(true);
    setSubmitError("");
    const data = {
      name: f.get("name"),
      phone: f.get("phone"),
      delivery,
      address: f.get("address") || "",
      payment: f.get("payment"),
      notes: f.get("notes"),
      items: cart,
      channel,
      requestKey: requestKey.current,
    };
    try {
      const result = await api<OrderResult>("POST", data);
      const message = `Olá, Nativa! Meu pedido #${result.id.slice(0, 8).toUpperCase()}:\n\n${result.items.map((i) => `${i.qty}x ${i.name} (${i.weight}) — ${money(i.price * i.qty)}`).join("\n")}\n\nSubtotal: ${money(result.total)}\nNome: ${data.name}\nTelefone: ${data.phone}\n${delivery}${data.address ? ": " + data.address : ""}\nPagamento: ${data.payment}\n${data.notes ? "Observações: " + data.notes : ""}\nEntrega e disponibilidade a confirmar.`;
      setSuccess({
        ...result,
        channel,
        wa: phone
          ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
          : "",
      });
      setCart([]);
      if (admin) load();
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };
  const update = async (body: unknown) => {
    setSaving(true);
    try {
      await api("PATCH", body, "admin");
      await load();
      notify("Alterações salvas");
      return true;
    } catch (e) {
      notify((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  };
  const login = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginBusy(true);
    setLoginError("");
    const f = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: f.get("email"),
          password: f.get("password"),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await load();
    } catch (e) {
      setLoginError((e as Error).message);
    } finally {
      setLoginBusy(false);
    }
  };
  const logout = async () => {
    try {
      const r = await fetch("/api/auth", { method: "DELETE" });
      if (!r.ok) throw new Error("Não foi possível sair. Tente novamente.");
      setAdmin(false);
      setOrders([]);
      setCustomers([]);
      setCurrentOrder(null);
      setCurrentCustomer(null);
      setLoadError("");
      notify("Você saiu da Área da Nativa");
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const activeOrders = orders.filter((o) => o.status !== "Cancelado"),
    revenue = activeOrders.reduce((s, o) => s + o.total, 0),
    openOrders = orders.filter(
      (o) => !["Concluído", "Cancelado"].includes(o.status),
    );
  const customerFor = (o: Order) =>
    customers.find((c) => c.id === o.customer_id);
  const listOrders = orders.filter(
    (o) =>
      (statusFilter === "Todos" || o.status === statusFilter) &&
      (customerFor(o)?.name + " " + o.id)
        .toLowerCase()
        .includes(crmSearch.toLowerCase()),
  );
  const exportCSV = () => {
    const esc = (s: unknown) =>
      '"' +
      String(s ?? "")
        .replace(/^[=+@-]/, "'")
        .replace(/"/g, '""') +
      '"';
    const rows = [
      [
        "Pedido",
        "Cliente",
        "Telefone",
        "Total (R$)",
        "Status",
        "Canal",
        "Data",
      ],
      ...orders.map((o) => [
        o.id,
        customerFor(o)?.name,
        customerFor(o)?.phone,
        (o.total / 100).toFixed(2),
        o.status,
        o.channel,
        o.created,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob(
        ["\ufeff" + rows.map((r) => r.map(esc).join(";")).join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "nativa-pedidos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="announcement">
        <Leaf size={14} />
        <span>Pequenas escolhas. Uma vida mais natural.</span>
        <span className="announcement-right">Conheça a Nativa</span>
      </div>
      <header className="header">
        <div className="header-inner">
          <button
            className="brand-button"
            onClick={shop}
            aria-label="Nativa início"
          >
            <Logo />
          </button>
          <nav className="desktop-nav">
            <button className={view === "loja" ? "active" : ""} onClick={shop}>
              Nossa loja
            </button>
            <button onClick={about}>Sobre nós</button>
            <a
              href="https://www.instagram.com/nativabemviver/"
              target="_blank"
              rel="noreferrer"
            >
              Instagram <ArrowUpRight size={13} />
            </a>
          </nav>
          <div className="header-actions">
            <button className="crm-link" onClick={openCRM}>
              <LayoutDashboard size={17} />
              Área da Nativa
            </button>
            <button
              className="icon-btn favorites-button"
              onClick={() => {
                shop();
                setFavoriteOnly((v) => !v);
                setTimeout(
                  () =>
                    document
                      .getElementById("catalogo")
                      ?.scrollIntoView({ behavior: "smooth" }),
                  60,
                );
              }}
              aria-label="Ver favoritos"
            >
              <Heart size={21} fill={favoriteOnly ? "currentColor" : "none"} />
            </button>
            <button
              className="bag-btn"
              onClick={() => setCartOpen(true)}
              aria-label={`Abrir sacola com ${count} itens`}
            >
              <ShoppingBag size={20} />
              <span className="bag-text">Sacola</span>
              <span className="bag-count">{count}</span>
            </button>
            <button
              className="icon-btn mobile-menu"
              onClick={() => setMenu(!menu)}
              aria-label="Menu"
              aria-expanded={menu}
            >
              <Menu />
            </button>
          </div>
        </div>
        {menu && (
          <nav className="menu-panel">
            <button onClick={shop}>Nossa loja</button>
            <button onClick={about}>Sobre nós</button>
            <button onClick={openCRM}>Área da Nativa • CRM</button>
          </nav>
        )}
      </header>
      {view === "loja" ? (
        <main>
          <HeroCarousel
            onExplore={(c) => {
              setCategory(c);
              setSearch("");
              setFavoriteOnly(false);
              document
                .getElementById("catalogo")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          />
          <div className="benefits">
            <div>
              <Leaf />
              <span>
                Ingredientes naturais
                <small>Mais simplicidade na sua rotina</small>
              </span>
            </div>
            <div>
              <ShoppingBag />
              <span>
                Compre do seu jeito<small>Pelo site ou pelo WhatsApp</small>
              </span>
            </div>
            <div>
              <Heart />
              <span>
                Cuidado em cada escolha
                <small>Uma seleção feita para você</small>
              </span>
            </div>
          </div>
          <section
            className="category-stories section"
            aria-labelledby="category-stories-title"
          >
            <div className="section-title">
              <div>
                <span className="eyebrow">
                  UM UNIVERSO DE ESCOLHAS NATURAIS
                </span>
                <h2 id="category-stories-title">Qual é o seu momento?</h2>
              </div>
              <span className="quiet">
                Explore por categoria, no seu ritmo.
              </span>
            </div>
            <div className="category-story-grid">
              {[
                {
                  title: "Castanhas e sabores",
                  description: "Uma pausa com mais sabor.",
                  category: "Castanhas",
                  image: "/images/category-castanhas.webp?v=1",
                  eyebrow: "PARA SUA PAUSA",
                },
                {
                  title: "Chás e infusões",
                  description: "Desacelere. Saboreie o momento.",
                  category: "Chás e ervas",
                  image: "/images/category-chas.webp?v=1",
                  eyebrow: "PARA O SEU RITUAL",
                },
                {
                  title: "Grãos e cereais",
                  description: "O simples que faz parte do dia.",
                  category: "Grãos e cereais",
                  image: "/images/category-graos.webp?v=1",
                  eyebrow: "PARA SUA ROTINA",
                },
              ].map((card, index) => (
                <button
                  key={card.category}
                  className={"category-story category-story-" + index}
                  onClick={() => {
                    setCategory(card.category);
                    setSearch("");
                    setFavoriteOnly(false);
                    document
                      .getElementById("catalogo")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  aria-label={`Explorar ${card.title}`}
                >
                  <img src={card.image} alt="" loading="lazy" />
                  <div className="category-story-copy">
                    <span>{card.eyebrow}</span>
                    <h3>{card.title}</h3>
                    <p>{card.description}</p>
                    <span className="category-story-link">
                      Explorar categoria <Plus size={16} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <span className="category-swipe">
              Deslize para descobrir mais categorias
            </span>
          </section>
          <section id="catalogo" className="catalog section">
            <div className="section-title">
              <div>
                <span className="eyebrow">SUA DESPENSA, MAIS NATURAL</span>
                <h2>
                  Encontre seu próximo favorito<span>.</span>
                </h2>
              </div>
              <span className="quiet">
                Um pouco de natureza em cada produto.
              </span>
            </div>
            <div className="catalog-tools">
              <div className="categories" aria-label="Categorias">
                {categories.map((c) => (
                  <button
                    key={c.name}
                    className={category === c.name ? "selected" : ""}
                    onClick={() => setCategory(c.name)}
                  >
                    <c.icon size={17} />
                    {c.name}
                  </button>
                ))}
              </div>
              <label className="search">
                <Search size={18} />
                <input
                  placeholder="O que você procura?"
                  aria-label="Buscar produtos"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    aria-label="Limpar busca"
                  >
                    <X size={16} />
                  </button>
                )}
              </label>
            </div>
            <div className="results-row">
              <span>
                {filtered.length} produtos{favoriteOnly ? " favoritos" : ""}{" "}
                <small>• catálogo de exemplo</small>
                {favoriteOnly && (
                  <button
                    className="text-button"
                    onClick={() => setFavoriteOnly(false)}
                  >
                    Ver todos
                  </button>
                )}
              </span>
              <label>
                <SlidersHorizontal size={15} />
                <select
                  aria-label="Ordenar produtos"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="destaques">Nossa seleção</option>
                  <option value="menor">Menor preço</option>
                  <option value="maior">Maior preço</option>
                </select>
              </label>
            </div>
            <div className="product-grid">
              {filtered.map((p, i) => (
                <article
                  className="product-card"
                  key={p.id}
                  style={{ animationDelay: `${i * 65}ms` }}
                >
                  <div className={"product-photo product-" + p.id}>
                    <button
                      className="product-view"
                      onClick={() => setSelected(p)}
                      aria-label={`Ver ${p.name}`}
                    >
                      <img
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = "/images/mix.jpg";
                        }}
                      />
                    </button>
                    <span className="product-tag">{p.tag}</span>
                    <button
                      className="favorite"
                      onClick={() => toggleFavorite(p.id)}
                      aria-label={`Favoritar ${p.name}`}
                      aria-pressed={favorite.includes(p.id)}
                    >
                      <Heart
                        size={18}
                        fill={favorite.includes(p.id) ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                  <div className="product-content">
                    <small className="product-category">{p.category}</small>
                    <button
                      className="product-name"
                      onClick={() => setSelected(p)}
                    >
                      {p.name}
                    </button>
                    <p>{p.subtitle}</p>
                    <div className="product-bottom">
                      <div>
                        <small>{p.weight}</small>
                        <strong>{money(p.price)}</strong>
                      </div>
                      <button
                        className="add"
                        onClick={() => add(p)}
                        aria-label={`Adicionar ${p.name} à sacola`}
                      >
                        <ShoppingCart size={21} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {!filtered.length && (
              <div className="empty">
                <Search size={32} />
                <h3>Nenhum produto por aqui.</h3>
                <p>Experimente outra busca ou categoria.</p>
                <button
                  className="secondary"
                  onClick={() => {
                    setCategory("Todos");
                    setSearch("");
                    setFavoriteOnly(false);
                  }}
                >
                  Ver todos os produtos
                </button>
              </div>
            )}
          </section>
          <section id="sobre" className="about section">
            <div className="about-art">
              <img
                src="/images/hero.jpg"
                alt="Ingredientes naturais para o dia a dia"
                loading="lazy"
              />
              <div className="about-label">
                <Leaf size={22} />
                <span>
                  Mais perto da natureza.
                  <br />
                  Mais perto de você.
                </span>
              </div>
            </div>
            <div className="about-copy">
              <span className="eyebrow">PRAZER, SOMOS A NATIVA</span>
              <h2>
                Natural é viver
                <br />
                com <em>mais cuidado.</em>
              </h2>
              <p>
                Acreditamos que o bem viver pode começar no simples: em um novo
                sabor, numa pausa para o chá, no cuidado com o que chega à sua
                mesa.
              </p>
              <p>
                A Nativa é um convite para fazer escolhas mais naturais, no seu
                ritmo. Explore nossa seleção e encontre o que combina com sua
                rotina.
              </p>
              <a
                className="about-social"
                href="https://www.instagram.com/nativabemviver/"
                target="_blank"
                rel="noreferrer"
              >
                <Instagram size={19} />
                @nativabemviver <ArrowUpRight size={17} />
              </a>
              <small className="draft-note">
                Texto de apresentação sugerido para esta primeira versão.
              </small>
            </div>
          </section>
          <section className="closing section">
            <Leaf size={31} />
            <h2>
              Seu próximo cuidado
              <br />
              pode começar aqui.
            </h2>
            <p>Escolha seus favoritos. A gente cuida do próximo passo.</p>
            <button
              className="primary"
              onClick={() =>
                document
                  .getElementById("catalogo")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Escolher meus produtos
            </button>
          </section>
        </main>
      ) : !admin ? (
        <main className="admin-login">
          <div className="settings-card">
            <ShieldCheck size={30} />
            <span className="eyebrow">ÁREA DA NATIVA</span>
            <h1>Cuidar do negócio.</h1>
            <p>
              Entre com sua conta de administrador para acompanhar pedidos e
              clientes.
            </p>
            <form className="checkout-form" onSubmit={login}>
              <label>
                E-mail
                <input
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  maxLength={254}
                />
              </label>
              <label>
                Senha
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={256}
                />
              </label>
              {(loginError || loadError) && (
                <div className="error" role="alert">
                  {loginError || loadError}
                </div>
              )}
              <button className="primary full" disabled={loginBusy || loading}>
                {loginBusy || loading
                  ? "Entrando…"
                  : "Entrar na Área da Nativa"}
              </button>
            </form>
            <button className="text-button" onClick={shop}>
              Voltar à loja
            </button>
          </div>
        </main>
      ) : (
        <main className="crm">
          <aside className="crm-sidebar">
            <div>
              <span className="eyebrow">ÁREA DA NATIVA</span>
              <h2>
                Um cuidado
                <br />
                com o negócio.
              </h2>
            </div>
            {[
              { id: "overview", label: "Visão geral", icon: LayoutDashboard },
              { id: "orders", label: "Pedidos", icon: Package },
              { id: "customers", label: "Clientes", icon: Users },
              { id: "settings", label: "Configurações", icon: Settings },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setCrmSearch("");
                }}
                className={tab === t.id ? "selected" : ""}
              >
                <t.icon size={19} />
                {t.label}
                {t.id === "orders" && <small>{orders.length}</small>}
              </button>
            ))}
            <div className="crm-sidebar-bottom">
              <ShieldCheck size={20} />
              <span>
                Acesso restrito<small>Gestão da Nativa</small>
              </span>
            </div>
          </aside>
          <div className="crm-main">
            <div className="crm-heading">
              <div>
                <span className="eyebrow">
                  NATIVA /{" "}
                  {tab === "overview"
                    ? "VISÃO GERAL"
                    : tab === "orders"
                      ? "PEDIDOS"
                      : tab === "customers"
                        ? "CLIENTES"
                        : "CONFIGURAÇÕES"}
                </span>
                <h1>
                  {tab === "overview"
                    ? "Tudo em seu ritmo."
                    : tab === "orders"
                      ? "Cada pedido, um cuidado."
                      : tab === "customers"
                        ? "Gente que faz parte."
                        : "Do seu jeito."}
                </h1>
                <p>
                  {tab === "overview"
                    ? "Acompanhe os pedidos e os próximos passos da sua loja."
                    : tab === "orders"
                      ? "Da primeira escolha até a entrega."
                      : tab === "customers"
                        ? "Conheça seus clientes e mantenha o atendimento próximo."
                        : "Prepare o atendimento da Nativa."}
                </p>
              </div>
              <div className="admin-actions">
                <button className="secondary" onClick={shop}>
                  <Store size={17} />
                  Ver loja
                </button>
                <button className="text-button" onClick={logout}>
                  Sair
                </button>
              </div>
            </div>
            <div className="crm-mobile-tabs">
              {[
                ["overview", "Visão geral"],
                ["orders", "Pedidos"],
                ["customers", "Clientes"],
                ["settings", "Ajustes"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={tab === id ? "selected" : ""}
                  onClick={() => {
                    setTab(id);
                    setCrmSearch("");
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {loadError && (
              <div className="error">
                {loadError} <button onClick={load}>Tentar novamente</button>
              </div>
            )}
            {loading && (
              <div role="status" className="loading">
                Atualizando os dados…
              </div>
            )}
            {tab === "overview" && (
              <>
                <div className="metrics">
                  <div>
                    <span>
                      <ShoppingBag size={18} />
                      Valor em pedidos
                    </span>
                    <strong>{money(revenue)}</strong>
                    <small>
                      Sem pedidos cancelados • não é receita recebida
                    </small>
                  </div>
                  <div>
                    <span>
                      <Package size={18} />
                      Em andamento
                    </span>
                    <strong>
                      {openOrders.length.toString().padStart(2, "0")}
                    </strong>
                    <small>Pedidos que precisam do seu cuidado</small>
                  </div>
                  <div>
                    <span>
                      <Users size={18} />
                      Clientes
                    </span>
                    <strong>
                      {customers.length.toString().padStart(2, "0")}
                    </strong>
                    <small>Pessoas cadastradas pelos pedidos</small>
                  </div>
                </div>
                <div className="crm-section-head">
                  <h2>Últimos pedidos</h2>
                  <button
                    className="text-button"
                    onClick={() => setTab("orders")}
                  >
                    Ver todos <ChevronRight size={16} />
                  </button>
                </div>
                {orders.length ? (
                  <div className="order-list">
                    {orders.slice(0, 5).map((o) => (
                      <button
                        className="order-row"
                        key={o.id}
                        onClick={() => setCurrentOrder(o)}
                      >
                        <span className="avatar">
                          {initials(customerFor(o)?.name || "Cliente")}
                        </span>
                        <div>
                          <strong>{customerFor(o)?.name}</strong>
                          <small>
                            #{o.id.slice(0, 8).toUpperCase()} • {o.channel}
                          </small>
                        </div>
                        <span
                          className={
                            "status status-" + o.status.replace(" ", "-")
                          }
                        >
                          {o.status}
                        </span>
                        <b>{money(o.total)}</b>
                        <ChevronRight size={18} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="empty">
                    <ShoppingBasket size={35} />
                    <h3>Sua história começa no primeiro pedido.</h3>
                    <p>
                      Monte uma sacola na loja e finalize um pedido de teste.
                      <br />
                      Ele aparece aqui, junto com o cadastro do cliente.
                    </p>
                    <button className="primary" onClick={shop}>
                      Fazer meu primeiro teste
                    </button>
                  </div>
                )}
                <div className="crm-tip">
                  <MessageCircle size={24} />
                  <div>
                    <h3>Uma conversa também é um cuidado.</h3>
                    <p>
                      {phone
                        ? "Seu WhatsApp está pronto para receber os pedidos."
                        : "Adicione o WhatsApp da Nativa para receber a sacola pronta na conversa."}
                    </p>
                  </div>
                  <button
                    className="secondary"
                    onClick={() => setTab("settings")}
                  >
                    {phone ? "Ver configuração" : "Configurar WhatsApp"}
                  </button>
                </div>
              </>
            )}
            {tab === "orders" && (
              <>
                <div className="crm-filters">
                  <label className="search">
                    <Search size={18} />
                    <input
                      value={crmSearch}
                      onChange={(e) => setCrmSearch(e.target.value)}
                      placeholder="Buscar cliente ou pedido"
                    />
                  </label>
                  <select
                    aria-label="Filtrar status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option>Todos</option>
                    {statuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    className="secondary"
                    disabled={!orders.length}
                    onClick={exportCSV}
                  >
                    <Download size={16} />
                    Exportar
                  </button>
                </div>
                <div className="pipeline">
                  {statuses.slice(0, 4).map((s) => (
                    <button
                      key={s}
                      className={statusFilter === s ? "selected" : ""}
                      onClick={() =>
                        setStatusFilter(statusFilter === s ? "Todos" : s)
                      }
                    >
                      <span>{s}</span>
                      <strong>
                        {orders.filter((o) => o.status === s).length}
                      </strong>
                    </button>
                  ))}
                </div>
                <div className="order-list">
                  {listOrders.map((o) => (
                    <button
                      className="order-row"
                      key={o.id}
                      onClick={() => setCurrentOrder(o)}
                    >
                      <span className="avatar">
                        {initials(customerFor(o)?.name || "Cliente")}
                      </span>
                      <div>
                        <strong>{customerFor(o)?.name}</strong>
                        <small>
                          #{o.id.slice(0, 8).toUpperCase()} •{" "}
                          {new Date(o.created).toLocaleDateString("pt-BR", {
                            timeZone: "America/Bahia",
                          })}
                        </small>
                      </div>
                      <span
                        className={
                          "status status-" + o.status.replace(" ", "-")
                        }
                      >
                        {o.status}
                      </span>
                      <b>{money(o.total)}</b>
                      <ChevronRight size={18} />
                    </button>
                  ))}
                </div>
                {!listOrders.length && (
                  <div className="empty">
                    <Package size={32} />
                    <h3>Nenhum pedido encontrado.</h3>
                    <p>Os pedidos feitos na loja aparecem aqui.</p>
                  </div>
                )}
              </>
            )}
            {tab === "customers" && (
              <>
                <label className="search customer-search">
                  <Search size={18} />
                  <input
                    value={crmSearch}
                    onChange={(e) => setCrmSearch(e.target.value)}
                    placeholder="Buscar nome ou telefone"
                  />
                </label>
                <div className="customer-grid">
                  {customers
                    .filter((c) =>
                      (c.name + " " + c.phone)
                        .toLowerCase()
                        .includes(crmSearch.toLowerCase()),
                    )
                    .map((c) => {
                      const own = orders.filter((o) => o.customer_id === c.id);
                      return (
                        <button
                          className="customer-card"
                          key={c.id}
                          onClick={() => {
                            setCurrentCustomer(c);
                            setNotes(c.notes);
                          }}
                        >
                          <span className="avatar">{initials(c.name)}</span>
                          <h3>{c.name}</h3>
                          <p>{c.phone}</p>
                          <div>
                            <span>
                              {own.length} pedido{own.length !== 1 ? "s" : ""}
                            </span>
                            <strong>
                              {money(
                                own
                                  .filter((o) => o.status !== "Cancelado")
                                  .reduce((s, o) => s + o.total, 0),
                              )}
                            </strong>
                          </div>
                          <small>
                            {c.notes
                              ? "Tem notas de atendimento"
                              : "Adicionar uma nota de atendimento"}
                          </small>
                        </button>
                      );
                    })}
                </div>
                {!customers.filter((c) =>
                  (c.name + " " + c.phone)
                    .toLowerCase()
                    .includes(crmSearch.toLowerCase()),
                ).length && (
                  <div className="empty">
                    <Users size={32} />
                    <h3>Nenhum cliente encontrado.</h3>
                    <p>O cadastro é criado ao finalizar um pedido.</p>
                  </div>
                )}
              </>
            )}
            {tab === "settings" && (
              <div className="settings-card">
                <MessageCircle size={30} />
                <h2>WhatsApp da Nativa</h2>
                <p>
                  Os clientes podem continuar o pedido com uma mensagem que já
                  inclui os produtos e os dados de entrega.
                </p>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await update({ type: "settings", phone: phoneDraft });
                  }}
                >
                  <label>
                    Número com código do país
                    <input
                      type="tel"
                      placeholder="55 + DDD + número"
                      value={phoneDraft}
                      onChange={(e) => setPhoneDraft(e.target.value)}
                      maxLength={20}
                    />
                  </label>
                  <small>
                    Exemplo de formato: 55 11 99999 9999. Use o número real da
                    empresa.
                  </small>
                  <button className="primary" disabled={saving}>
                    {saving ? "Salvando…" : "Salvar configuração"}
                  </button>
                </form>
                <div className="setting-note">
                  <ShieldCheck size={19} />
                  <p>
                    A loja recebe pedidos sem exigir conta do cliente. Apenas
                    administradores autorizados acessam o CRM. O catálogo é
                    ilustrativo; pagamento, estoque e frete devem ser
                    confirmados pela loja.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      )}
      <footer className="footer">
        <div className="footer-inner">
          <Logo />
          <p>O natural faz parte de você.</p>
          <div>
            <button onClick={about}>Sobre nós</button>
            <a
              href="https://www.instagram.com/nativabemviver/"
              target="_blank"
              rel="noreferrer"
            >
              <Instagram size={18} />
              Instagram
            </a>
            <button onClick={openCRM}>Área da Nativa</button>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Nativa Bem Viver</span>
          <span>MVP • produtos, imagens e preços ilustrativos</span>
        </div>
        <div className="image-credits">
          Foto de seleção:{" "}
          <a
            href="https://foto.wuestenigel.com/foto/4146-vielfalt-an-nuessen-samen-und-trockenfruechten-in-glasbehaeltern"
            target="_blank"
            rel="noreferrer"
          >
            Marco Verch
          </a>{" "}
          ·{" "}
          <a
            href="https://creativecommons.org/licenses/by/2.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY 2.0
          </a>
          . Fotos de produto: Jeppi, NÖM, Nerada, Hoi Mei Tong, Natugrão e
          Arimex.
        </div>
      </footer>
      {view === "loja" && (
        <nav className="mobile-bottom">
          <button onClick={shop}>
            <Store size={20} />
            <span>Loja</span>
          </button>
          <button
            onClick={() =>
              document
                .getElementById("catalogo")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <Search size={20} />
            <span>Explorar</span>
          </button>
          <button onClick={about}>
            <Leaf size={20} />
            <span>A Nativa</span>
          </button>
          <button onClick={() => setCartOpen(true)}>
            <span className="mobile-bag">
              <ShoppingBag size={20} />
              {count > 0 && <b>{count}</b>}
            </span>
            <span>Sacola</span>
          </button>
        </nav>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          {toast}
        </div>
      )}
      {selected && (
        <Modal
          close={() => setSelected(null)}
          title="Um pouco mais sobre esse favorito"
          wide
        >
          <div className="product-detail">
            <img src={selected.image} alt={selected.name} />
            <div>
              <span className="eyebrow">{selected.category}</span>
              <h2>{selected.name}</h2>
              <p>{selected.description}</p>
              <span className="detail-weight">
                {selected.weight} • {selected.subtitle}
              </span>
              <strong>{money(selected.price)}</strong>
              <button className="primary" onClick={() => add(selected)}>
                <ShoppingCart size={18} aria-hidden="true" />
                Adicionar à sacola
              </button>
              <details>
                <summary>Ingredientes e informações</summary>
                <p>{selected.ingredients}</p>
                <small>
                  Informações ilustrativas. Confirme o rótulo e a
                  disponibilidade com a loja.
                </small>
              </details>
            </div>
          </div>
        </Modal>
      )}
      {cartOpen && (
        <Modal close={() => setCartOpen(false)} title={`Sua sacola (${count})`}>
          <div className="cart-content">
            {cart.length ? (
              cart.map((i) => {
                const p = products.find((p) => p.id === i.id)!;
                return (
                  <div className="cart-row" key={i.id}>
                    <img src={p.image} alt="" />
                    <div>
                      <h3>{p.name}</h3>
                      <small>{p.weight}</small>
                      <div className="quantity">
                        <button
                          aria-label={`Diminuir ${p.name}`}
                          onClick={() => change(i.id, -1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span>{i.qty}</span>
                        <button
                          aria-label={`Aumentar ${p.name}`}
                          onClick={() => change(i.id, 1)}
                          disabled={i.qty >= 99}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <strong>{money(p.price * i.qty)}</strong>
                    <button
                      className="icon-btn remove"
                      aria-label={`Remover ${p.name}`}
                      onClick={() =>
                        setCart((c) => c.filter((x) => x.id !== i.id))
                      }
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="empty">
                <ShoppingBag size={40} />
                <h3>Ainda tem espaço para o natural.</h3>
                <p>Escolha seus favoritos para começar.</p>
                <button className="primary" onClick={() => setCartOpen(false)}>
                  Explorar produtos
                </button>
              </div>
            )}
            {cart.length > 0 && (
              <div className="cart-summary">
                <div>
                  <span>Subtotal</span>
                  <strong>{money(total)}</strong>
                </div>
                <small>Entrega e disponibilidade a confirmar com a loja.</small>
                <button className="primary full" onClick={beginCheckout}>
                  Continuar meu pedido <ShoppingBag size={18} />
                </button>
                <button
                  className="text-button full"
                  onClick={() => setCartOpen(false)}
                >
                  Continuar escolhendo
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
      {checkout && (
        <Modal
          close={() => {
            if (!saving) setCheckout(false);
          }}
          title={success ? "Seu pedido foi registrado" : "Só mais um cuidado"}
        >
          {success ? (
            <div className="success">
              <span className="success-icon">
                <Check size={34} />
              </span>
              <span className="eyebrow">PEDIDO REGISTRADO</span>
              <h2>Obrigada pela sua escolha.</h2>
              <p>
                Pedido <b>#{success.id.slice(0, 8).toUpperCase()}</b>
                <br />
                Subtotal: {money(success.total)}
              </p>
              <p>
                {success.channel === "WhatsApp"
                  ? "Continue no WhatsApp para enviar sua mensagem à loja."
                  : "Seu pedido está no CRM da Nativa, aguardando confirmação."}
              </p>
              <small>
                Nenhum pagamento foi cobrado. Entrega e disponibilidade a
                confirmar.
              </small>
              {success.wa && (
                <a
                  className="primary full"
                  href={success.wa}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={19} />
                  Continuar no WhatsApp
                </a>
              )}
              {admin && (
                <button
                  className="secondary full"
                  onClick={() => {
                    setCheckout(false);
                    openCRM();
                  }}
                >
                  Ver pedido no CRM
                </button>
              )}
              <button
                className="text-button full"
                onClick={() => {
                  setCheckout(false);
                  shop();
                }}
              >
                Voltar à loja
              </button>
            </div>
          ) : (
            <form className="checkout-form" onSubmit={submit}>
              <p>Como podemos preparar sua escolha?</p>
              <div className="checkout-total">
                <ShoppingBag size={19} />
                <span>{count} itens na sacola</span>
                <strong>{money(total)}</strong>
              </div>
              <label>
                Seu nome
                <input
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Como podemos chamar você?"
                />
              </label>
              <label>
                Telefone com DDD
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  pattern="[0-9 ()+\-]{10,20}"
                  maxLength={20}
                  placeholder="(00) 00000-0000"
                />
              </label>
              <fieldset>
                <legend>Como você prefere receber?</legend>
                <div className="delivery-options">
                  {[
                    { name: "Retirada", icon: Store },
                    { name: "Entrega", icon: Truck },
                  ].map((d) => (
                    <label
                      key={d.name}
                      className={delivery === d.name ? "selected" : ""}
                    >
                      <input
                        type="radio"
                        name="delivery"
                        checked={delivery === d.name}
                        onChange={() => setDelivery(d.name)}
                      />
                      <d.icon size={19} />
                      {d.name}
                    </label>
                  ))}
                </div>
              </fieldset>
              {delivery === "Entrega" && (
                <label>
                  Endereço completo
                  <textarea
                    name="address"
                    autoComplete="street-address"
                    required
                    minLength={8}
                    maxLength={400}
                    placeholder="Rua, número, bairro, cidade e CEP"
                  />
                </label>
              )}
              <label>
                Preferência de pagamento
                <select name="payment">
                  <option>A combinar</option>
                  <option>Pix</option>
                  {delivery === "Retirada" && (
                    <option>Cartão na retirada</option>
                  )}
                </select>
              </label>
              <label>
                Algum cuidado especial?{" "}
                <span className="quiet">(opcional)</span>
                <textarea
                  name="notes"
                  maxLength={1000}
                  placeholder="Conte para a gente…"
                />
              </label>
              <small>
                Pedido de teste, sem cobrança. Entrega, pagamento e
                disponibilidade serão confirmados pela loja.
              </small>
              {submitError && (
                <div className="error" role="alert">
                  {submitError}
                </div>
              )}
              <button
                className="primary full"
                type="submit"
                data-channel="Site"
                disabled={saving}
              >
                {saving ? "Registrando…" : "Finalizar pedido pelo site"}
              </button>
              <button
                className="whatsapp full"
                type="submit"
                data-channel="WhatsApp"
                disabled={saving || !phone}
              >
                <MessageCircle size={19} />
                Pedir pelo WhatsApp
              </button>
              {!phone && (
                <small className="center">
                  WhatsApp aguardando configuração na Área da Nativa.
                </small>
              )}
            </form>
          )}
        </Modal>
      )}
      {currentOrder && (
        <Modal
          close={() => setCurrentOrder(null)}
          title={`Pedido #${currentOrder.id.slice(0, 8).toUpperCase()}`}
        >
          <div className="order-detail">
            <h3>{customerFor(currentOrder)?.name}</h3>
            <p>
              {customerFor(currentOrder)?.phone} • {currentOrder.channel}
            </p>
            <small>
              {new Date(currentOrder.created).toLocaleString("pt-BR", {
                timeZone: "America/Bahia",
              })}
            </small>
            {currentOrder.items.map((i) => (
              <div className="detail-line" key={i.id}>
                <span>
                  {i.qty} × {i.name}
                  <small>{i.weight}</small>
                </span>
                <strong>{money(i.price * i.qty)}</strong>
              </div>
            ))}
            <div className="detail-line total">
              <span>Subtotal</span>
              <strong>{money(currentOrder.total)}</strong>
            </div>
            <p>
              <b>{currentOrder.delivery}</b>
              {currentOrder.address && " • " + currentOrder.address}
            </p>
            <p>Pagamento: {currentOrder.payment} • aguardando confirmação</p>
            {currentOrder.notes && (
              <blockquote>{currentOrder.notes}</blockquote>
            )}
            <label>
              Status do pedido
              <select
                disabled={saving}
                value={
                  orders.find((o) => o.id === currentOrder.id)?.status ||
                  currentOrder.status
                }
                onChange={async (e) => {
                  await update({
                    type: "status",
                    id: currentOrder.id,
                    status: e.target.value,
                  });
                }}
              >
                {statuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
        </Modal>
      )}
      {currentCustomer && (
        <Modal
          close={() => setCurrentCustomer(null)}
          title="Cuidar do relacionamento"
        >
          <div className="customer-detail">
            <span className="avatar">{initials(currentCustomer.name)}</span>
            <h2>{currentCustomer.name}</h2>
            <p>{currentCustomer.phone}</p>
            <label>
              Notas de atendimento
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={3000}
                placeholder="Preferências, combinações e próximos cuidados…"
              />
            </label>
            <button
              className="primary full"
              disabled={saving}
              onClick={() =>
                update({ type: "notes", id: currentCustomer.id, notes })
              }
            >
              {saving ? "Salvando…" : "Salvar nota"}
            </button>
            <h3>Histórico de pedidos</h3>
            {orders
              .filter((o) => o.customer_id === currentCustomer.id)
              .map((o) => (
                <div className="detail-line" key={o.id}>
                  <span>
                    #{o.id.slice(0, 8).toUpperCase()}
                    <small>{o.status}</small>
                  </span>
                  <strong>{money(o.total)}</strong>
                </div>
              ))}
          </div>
        </Modal>
      )}
    </>
  );
}
