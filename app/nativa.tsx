"use client";
import { ProductImage } from "./product-image";
import { ProductChoice } from "./product-choice";
import {
  cartKey,
  optionProduct,
  type ProductExtras,
} from "../lib/product-options";
import type { ProductImageSettings } from "../lib/product-image";
import HeroCarousel from "./hero-carousel";
import { defaultBanners, type Banner } from "./banner-data";
import { TrashPanel, TrashAction } from "./trash-panel";
import { CatalogPanel, ReportsPanel } from "./admin-panels";
import { CategoriesPanel } from "./categories-panel";
import { defaultCategories, type Category } from "./category-data";
import { categoryStories } from "../lib/category-stories";
import { sellingPrice } from "../lib/pricing";
import {
  defaultPromotion,
  isOffer,
  searchMatches,
  type Promotion,
} from "../lib/shop-features";
import {
  CustomerAccount,
  type ShopUser,
  type AccountMode,
} from "./customer-account";
import { PromotionsPanel } from "./promotions-panel";
import { Offers } from "./offers";
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
  CheckCircle2,
  ShoppingBasket,
  Flower2,
  Wheat,
  Nut,
  Sun,
  UserRound,
  Tag,
} from "lucide-react";
import { products as demoProducts, money, statuses } from "./catalog";
export type Product = (typeof demoProducts)[number] &
  ProductExtras & {
    image_settings?: ProductImageSettings | null;
    sale_price?: number | null;
    highlights?: string;
    usage?: string;
  };
type CartItem = { id: string; qty: number; variant?: string };
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
    variant?: string;
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
const baseCategories = [
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
  categories: Category[];
  banners?: Banner[];
  banner_seconds?: number;
  banner_autoplay?: boolean;
  promotion?: Promotion;
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
  className = "",
}: {
  children: React.ReactNode;
  close: () => void;
  title: string;
  wide?: boolean;
  className?: string;
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
        className={"modal " + (wide ? "wide " : "") + className}
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
        Villa Natura<small>PRODUTOS NATURAIS</small>
      </span>
    </span>
  );
}
export default function VillaNatura({
  initialProduct,
}: { initialProduct?: Product } = {}) {
  const [view, setView] = useState("loja"),
    [category, setCategory] = useState("Todos"),
    [search, setSearch] = useState(""),
    [sort, setSort] = useState("destaques"),
    [cart, setCart] = useState<CartItem[]>([]),
    [favorite, setFavorite] = useState<string[]>([]),
    [favoriteOnly, setFavoriteOnly] = useState(false),
    [selected, setSelected] = useState<Product | null>(initialProduct || null),
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
    [products, setProducts] = useState<Product[]>(
      initialProduct
        ? [
            initialProduct,
            ...demoProducts.filter((p) => p.id !== initialProduct.id),
          ]
        : demoProducts,
    ),
    [admin, setAdmin] = useState(false),
    [loginError, setLoginError] = useState(""),
    [loginBusy, setLoginBusy] = useState(false);
  const [banners, setBanners] = useState(defaultBanners);
  const [bannerSeconds, setBannerSeconds] = useState(7);
  const [bannerAutoplay, setBannerAutoplay] = useState(true);
  const [storeError, setStoreError] = useState("");
  const [storeCategories, setStoreCategories] = useState(defaultCategories);
  const [offersOnly, setOffersOnly] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountMode, setAccountMode] = useState<AccountMode>("login");
  const [shopUser, setShopUser] = useState<ShopUser | null>(null);
  const [promotion, setPromotion] = useState<Promotion>(defaultPromotion);
  const [promotionOpen, setPromotionOpen] = useState(false);
  const offerProducts = products.filter(isOffer);
  const promoKey = JSON.stringify(promotion);
  useEffect(() => {
    let cancelled = false;
    void fetch("/api/customer-auth")
      .then(async (r) => {
        const d = await r.json();
        if (cancelled) return;
        if (r.ok && d.user) {
          setShopUser(d.user);
          return;
        }
        try {
          if (!initialProduct && !localStorage.getItem("nativa-boas-vindas")) {
            setAccountMode("welcome");
            setAccountOpen(true);
          }
        } catch {}
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialProduct]);
  const closeAccount = () => {
    setAccountOpen(false);
    setAccountMode("login");
    try {
      localStorage.setItem("nativa-boas-vindas", "1");
      localStorage.removeItem("nativa-cadastro-rapido");
    } catch {}
  };
  useEffect(() => {
    if (
      !cartReady ||
      storeError ||
      !promotion.enabled ||
      !offerProducts.length ||
      view !== "loja" ||
      cartOpen ||
      checkout ||
      selected ||
      accountOpen
    )
      return;
    try {
      if (sessionStorage.getItem("nativa-aviso-ofertas") === promoKey) return;
    } catch {}
    const timer = setTimeout(() => setPromotionOpen(true), 6000);
    return () => clearTimeout(timer);
  }, [
    cartReady,
    storeError,
    promotion.enabled,
    offerProducts.length,
    promoKey,
    view,
    cartOpen,
    checkout,
    selected,
    accountOpen,
  ]);
  const dismissPromotion = () => {
    setPromotionOpen(false);
    try {
      sessionStorage.setItem("nativa-aviso-ofertas", promoKey);
    } catch {}
  };
  const categories = [
    { name: "Todos", icon: Leaf },
    ...storeCategories.map((c) => ({
      name: c.name,
      icon: baseCategories.find((b) => b.name === c.name)?.icon || Leaf,
    })),
  ];
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
      setStoreError("");
      setProducts(d.products);
      setStoreCategories(d.categories);
      setCategory((c) =>
        c === "Todos" || d.categories.some((cat) => cat.name === c)
          ? c
          : "Todos",
      );
      if (d.banners) setBanners(d.banners);
      setPromotion(d.promotion ?? defaultPromotion);
      setBannerSeconds(d.banner_seconds ?? 7);
      setBannerAutoplay(d.banner_autoplay ?? true);
      setCart((c) =>
        c.filter((i) =>
          d.products.some(
            (p) =>
              p.id === i.id &&
              (!i.variant || p.variants?.some((v) => v.id === i.variant)),
          ),
        ),
      );
      setPhone(d.phone);
      setPhoneDraft(d.phone);
    } catch {
      setStoreError("Não foi possível atualizar a loja. Tente novamente.");
    }
  }, []);
  // Validate persisted IDs against the current catalog, including newly registered items.
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      let available: Product[] = demoProducts;
      try {
        const d = await api();
        if (cancelled) return;
        available = d.products;
        setProducts(d.products);
        setStoreCategories(d.categories);
        setCategory((c) =>
          c === "Todos" || d.categories.some((cat) => cat.name === c)
            ? c
            : "Todos",
        );
        if (d.banners) setBanners(d.banners);
        setPromotion(d.promotion ?? defaultPromotion);
        setBannerSeconds(d.banner_seconds ?? 7);
        setBannerAutoplay(d.banner_autoplay ?? true);
        setPhone(d.phone);
        setPhoneDraft(d.phone);
      } catch {
        if (!cancelled)
          setStoreError(
            "Não foi possível carregar os produtos. Seu carrinho foi preservado. Tente novamente.",
          );
        return;
      }
      if (cancelled) return;
      let draft: CartItem[] = [];
      try {
        const value = JSON.parse(
          sessionStorage.getItem("nativa-sacola") || "[]",
        );
        const seen = new Set<string>();
        if (Array.isArray(value))
          draft = value.filter((i) => {
            if (
              !i ||
              typeof i.id !== "string" ||
              seen.has(cartKey(i)) ||
              !available.some(
                (p) =>
                  p.id === i.id &&
                  (!i.variant || p.variants?.some((v) => v.id === i.variant)),
              ) ||
              !Number.isInteger(i.qty) ||
              i.qty < 1 ||
              i.qty > 99
            )
              return false;
            seen.add(cartKey(i));
            return true;
          });
      } catch {}
      setCart(draft);
      setCartReady(true);
    };
    void restore();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (cartReady) {
      try {
        sessionStorage.setItem("nativa-sacola", JSON.stringify(cart));
      } catch {}
    }
  }, [cart, cartReady]);
  const add = (p: Product, variant?: string) => {
    if (p.variants?.length && variant === undefined) {
      setSelected(p);
      return;
    }
    const key = cartKey({ id: p.id, variant });
    if (!cartReady) return;
    setCart((c) =>
      c.find((i) => cartKey(i) === key)
        ? c.map((i) =>
            cartKey(i) === key ? { ...i, qty: Math.min(99, i.qty + 1) } : i,
          )
        : [...c, { id: p.id, qty: 1, ...(variant ? { variant } : {}) }],
    );
    notify(p.name + " na sua sacola");
  };
  const change = (id: string, n: number) =>
    setCart((c) =>
      c
        .map((i) =>
          cartKey(i) === id ? { ...i, qty: Math.min(99, i.qty + n) } : i,
        )
        .filter((i) => i.qty > 0),
    );
  const count = cart.reduce((s, i) => s + i.qty, 0),
    total = cart.reduce(
      (s, i) =>
        s +
        (products.find((p) => p.id === i.id)
          ? sellingPrice(
              optionProduct(
                products.find((p) => p.id === i.id)!,
                i.variant,
              ),
            )
          : 0) *
          i.qty,
      0,
    );
  const filtered = products
    .filter(
      (p) =>
        (category === "Todos" || p.category === category) &&
        (!favoriteOnly || favorite.includes(p.id)) &&
        (!offersOnly || isOffer(p)) &&
        searchMatches(p, search),
    )
    .sort((a, b) =>
      sort === "menor"
        ? sellingPrice(a) - sellingPrice(b)
        : sort === "maior"
          ? sellingPrice(b) - sellingPrice(a)
          : 0,
    );
  const toggleFavorite = (id: string) =>
    setFavorite((f) =>
      f.includes(id) ? f.filter((i) => i !== id) : [...f, id],
    );
  const shop = () => {
    setView("loja");
    setOffersOnly(false);
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openOffers = () => {
    setView("loja");
    setMenu(false);
    setOffersOnly(true);
    setCategory("Todos");
    setSearch("");
    setFavoriteOnly(false);
    setTimeout(
      () =>
        document
          .getElementById("catalogo")
          ?.scrollIntoView({ behavior: "smooth" }),
      60,
    );
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
        ) || (phone ? "WhatsApp" : "Site");
    if (saving) return;
    if (channel === "WhatsApp" && !phone) {
      setSubmitError(
        "O atendimento por WhatsApp não está disponível. Finalize seu pedido pelo site.",
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
      accountOrder: !!shopUser,
    };
    try {
      const result = await api<OrderResult>("POST", data);
      const message = `Olá, Villa Natura! Meu pedido #${result.id.slice(0, 8).toUpperCase()}:\n\n${result.items.map((i) => `${i.qty}x ${i.name} (${i.weight}) — ${money(i.price * i.qty)}`).join("\n")}\n\nSubtotal: ${money(result.total)}\nNome: ${data.name}\nTelefone: ${data.phone}\n${delivery}${data.address ? ": " + data.address : ""}\nPagamento: ${data.payment}\n${data.notes ? "Observações: " + data.notes : ""}\nEntrega e disponibilidade a confirmar.`;
      const wa = phone
        ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
        : "";
      setSuccess({
        ...result,
        channel,
        wa,
      });
      setCart([]);
      if (admin) load();
      if (channel === "WhatsApp" && wa) {
        try {
          window.location.assign(wa);
        } catch {
          notify("Pedido recebido! Use o botão para abrir o WhatsApp.");
        }
      }
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
      notify("Você saiu da Área da Villa Natura");
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

  return (
    <>
      <div className="announcement">
        <Leaf size={14} />
        <span>Pequenas escolhas. Uma vida mais natural.</span>
        <span className="announcement-right">Conheça a Villa Natura</span>
      </div>
      <header className="header">
        <div className="header-inner">
          <button
            className="brand-button"
            onClick={shop}
            aria-label="Villa Natura início"
          >
            <Logo />
          </button>
          <nav className="desktop-nav">
            <button className={view === "loja" ? "active" : ""} onClick={shop}>
              Nossa loja
            </button>
            <button onClick={about}>Sobre nós</button>
            <button onClick={openOffers}>Ofertas</button>
          </nav>
          <div className="header-actions">
            <button
              className="icon-btn"
              aria-label="Minha conta"
              onClick={() => setAccountOpen(true)}
            >
              <UserRound size={21} />
            </button>
            <button className="crm-link" onClick={openCRM}>
              <LayoutDashboard size={17} />
              Área da Villa Natura
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
              <ShoppingCart size={20} />
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
            <button onClick={openOffers}>Ofertas</button>
            <button
              onClick={() => {
                setMenu(false);
                setAccountOpen(true);
              }}
            >
              Minha conta
            </button>
            <button onClick={about}>Sobre nós</button>
            <button onClick={openCRM}>Área da Villa Natura</button>
          </nav>
        )}
        {view === "loja" && (
          <form
            className="top-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              setCategory("Todos");
              setFavoriteOnly(false);
              setOffersOnly(false);
              document
                .getElementById("catalogo")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <Search size={19} />
            <input
              aria-label="Pesquisar na loja"
              placeholder="O que você procura? Castanhas, chás…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                aria-label="Limpar pesquisa do topo"
                onClick={() => setSearch("")}
              >
                <X size={18} />
              </button>
            )}
            <button type="submit" aria-label="Pesquisar produtos">
              <Search size={19} />
            </button>
          </form>
        )}
      </header>
      {view === "loja" ? (
        <main>
          <HeroCarousel
            slides={banners}
            seconds={bannerSeconds}
            autoplay={bannerAutoplay}
            onExplore={(c) => {
              setCategory(c);
              setOffersOnly(false);
              setSearch("");
              setFavoriteOnly(false);
              document
                .getElementById("catalogo")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          />
          {storeError && (
            <div className="error section" role="alert">
              {storeError}{" "}
              <button onClick={() => window.location.reload()}>
                Tentar novamente
              </button>
            </div>
          )}
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
          <Offers
            products={offerProducts}
            ready={cartReady}
            onAll={openOffers}
            onProduct={(id) =>
              setSelected(products.find((p) => p.id === id) || null)
            }
            onAdd={(id) => {
              const p = products.find((p) => p.id === id);
              if (p) add(p);
            }}
          />
          {categoryStories(storeCategories, products).length > 0 && (
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
                {categoryStories(storeCategories, products).map(
                  (card, index) => (
                    <button
                      key={card.id}
                      className={"category-story category-story-" + index}
                      onClick={() => {
                        setCategory(card.category);
                        setOffersOnly(false);
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
                  ),
                )}
              </div>
              <span className="category-swipe">
                Deslize para descobrir mais categorias
              </span>
            </section>
          )}
          <section id="catalogo" className="catalog section">
            <div className="section-title">
              <div>
                <span className="eyebrow">SUA DESPENSA, MAIS NATURAL</span>
                <h2>
                  {offersOnly
                    ? "Produtos em oferta"
                    : "Encontre seu próximo favorito"}
                  <span>.</span>
                </h2>
              </div>
              <span className="quiet">
                Um pouco de natureza em cada produto.
              </span>
            </div>
            <div className="catalog-tools">
              <button
                className={"offers-filter " + (offersOnly ? "selected" : "")}
                aria-pressed={offersOnly}
                onClick={() => setOffersOnly((v) => !v)}
              >
                <Tag size={17} />
                Só ofertas
              </button>
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
                <small>• escolha seus favoritos</small>
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
            {offersOnly && (
              <p className="offers-description">
                Preços promocionais para aproveitar suas escolhas.{" "}
                <button
                  className="text-button"
                  onClick={() => setOffersOnly(false)}
                >
                  Ver todos os produtos
                </button>
              </p>
            )}
            <div className="product-grid">
              {filtered.map((original, i) => {
                const p =
                  offersOnly && original.sale_price == null
                    ? optionProduct(
                        original,
                        original.variants?.find((v) => isOffer(v))?.id,
                      )
                    : original;
                return (
                  <article
                    className="product-card"
                    key={p.id}
                    style={{ animationDelay: `${i * 65}ms` }}
                  >
                    <button
                      className="card-open"
                      onClick={() => setSelected(original)}
                      aria-label={`Abrir ${p.name}`}
                    />
                    <div className={"product-photo product-" + p.id}>
                      <ProductImage product={p} />
                      <span className="product-tag">{p.tag}</span>
                      {p.sale_price != null && (
                        <span className="sale-badge">Em oferta</span>
                      )}
                      <button
                        className="favorite"
                        onClick={() => toggleFavorite(p.id)}
                        aria-label={`Favoritar ${p.name}`}
                        aria-pressed={favorite.includes(p.id)}
                      >
                        <Heart
                          size={18}
                          fill={
                            favorite.includes(p.id) ? "currentColor" : "none"
                          }
                        />
                      </button>
                    </div>
                    <div className="product-content">
                      <small className="product-category">{p.category}</small>
                      <h3 className="product-name">{p.name}</h3>
                      <p>{p.subtitle}</p>
                      <div className="product-bottom">
                        <div>
                          <small>{p.weight}</small>
                          {p.sale_price != null && (
                            <del
                              className="original-price"
                              aria-label="Preço original"
                            >
                              {money(p.price)}
                            </del>
                          )}
                          <strong>{money(sellingPrice(p))}</strong>
                        </div>
                        <button
                          className="add"
                          disabled={!cartReady}
                          onClick={() => add(original)}
                          aria-label={`Adicionar ${p.name} à sacola`}
                        >
                          <ShoppingCart size={21} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
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
              <span className="eyebrow">PRAZER, SOMOS A VILLA NATURA</span>
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
                A Villa Natura é um convite para fazer escolhas mais naturais,
                no seu ritmo. Explore nossa seleção e encontre o que combina com
                sua rotina.
              </p>
              <small className="draft-note">
                Escolhas naturais para acompanhar seu dia.
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
            <span className="eyebrow">ÁREA DA VILLA NATURA</span>
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
                  : "Entrar na Área da Villa Natura"}
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
              <span className="eyebrow">ÁREA DA VILLA NATURA</span>
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
              { id: "products", label: "Produtos", icon: Package },
              { id: "categories", label: "Categorias", icon: Leaf },
              { id: "banners", label: "Banners", icon: SlidersHorizontal },
              { id: "promotions", label: "Promoções", icon: Tag },
              { id: "reports", label: "Relatórios", icon: Download },
              { id: "trash", label: "Lixeira", icon: Package },
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
                Acesso restrito<small>Gestão da Villa Natura</small>
              </span>
            </div>
          </aside>
          <div className="crm-main">
            <div className="crm-heading">
              <div>
                <span className="eyebrow">
                  VILLA NATURA /{" "}
                  {tab === "overview"
                    ? "VISÃO GERAL"
                    : tab === "orders"
                      ? "PEDIDOS"
                      : tab === "customers"
                        ? "CLIENTES"
                        : tab === "products"
                          ? "PRODUTOS"
                          : tab === "categories"
                            ? "CATEGORIAS"
                            : tab === "banners"
                              ? "BANNERS"
                              : tab === "reports"
                                ? "RELATÓRIOS"
                                : tab === "trash"
                                  ? "LIXEIRA"
                                  : tab === "promotions"
                                    ? "PROMOÇÕES"
                                    : "CONFIGURAÇÕES"}
                </span>
                <h1>
                  {tab === "overview"
                    ? "Tudo em seu ritmo."
                    : tab === "orders"
                      ? "Cada pedido, um cuidado."
                      : tab === "customers"
                        ? "Gente que faz parte."
                        : tab === "products"
                          ? "Sua seleção natural."
                          : tab === "categories"
                            ? "Cada escolha, seu lugar."
                            : tab === "banners"
                              ? "Uma vitrine com a sua cara."
                              : tab === "reports"
                                ? "Um olhar sobre os pedidos."
                                : tab === "trash"
                                  ? "Recupere quando precisar."
                                  : tab === "promotions"
                                    ? "Uma seleção para aproveitar."
                                    : "Do seu jeito."}
                </h1>
                <p>
                  {tab === "overview"
                    ? "Acompanhe os pedidos e os próximos passos da sua loja."
                    : tab === "orders"
                      ? "Da primeira escolha até a entrega."
                      : tab === "customers"
                        ? "Conheça seus clientes e mantenha o atendimento próximo."
                        : "Prepare o atendimento da Villa Natura."}
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
                ["products", "Produtos"],
                ["categories", "Categorias"],
                ["banners", "Banners"],
                ["promotions", "Promoções"],
                ["reports", "Relatórios"],
                ["trash", "Lixeira"],
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
                      Os pedidos feitos pelos clientes vão aparecer aqui.
                      <br />
                      Você poderá acompanhar cada etapa e falar com o cliente.
                    </p>
                    <button className="primary" onClick={shop}>
                      Conhecer a loja
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
                        : "Adicione o WhatsApp da Villa Natura para receber a sacola pronta na conversa."}
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
                    onClick={() => setTab("reports")}
                  >
                    <Download size={16} />
                    Relatório em PDF
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
            {tab === "categories" && (
              <CategoriesPanel
                onSaved={() => {
                  void loadStore();
                }}
              />
            )}
            {(tab === "products" || tab === "banners") && (
              <CatalogPanel
                key={tab}
                kind={tab === "products" ? "product" : "banner"}
                onSaved={() => {
                  void loadStore();
                }}
              />
            )}
            {tab === "reports" && <ReportsPanel />}
            {tab === "promotions" && (
              <PromotionsPanel onSaved={() => void loadStore()} />
            )}
            {tab === "trash" && <TrashPanel onSaved={loadStore} />}
            {tab === "settings" && (
              <div className="settings-card">
                <MessageCircle size={30} />
                <h2>WhatsApp da Villa Natura</h2>
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
                    pessoas autorizadas acessam esta área. Os pedidos são
                    recebidos para confirmação; pagamento, disponibilidade e
                    entrega devem ser confirmados pela loja.
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
            <button onClick={openCRM}>Área da Villa Natura</button>
            <button onClick={openOffers}>Ofertas</button>
            <button onClick={() => setAccountOpen(true)}>Minha conta</button>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Villa Natura</span>
          <span>Confirme valores e disponibilidade com a loja.</span>
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
            <span>A Villa Natura</span>
          </button>
          <button onClick={() => setCartOpen(true)}>
            <span className="mobile-bag">
              <ShoppingCart size={20} />
              {count > 0 && <b>{count}</b>}
            </span>
            <span>Sacola</span>
          </button>
        </nav>
      )}
      {view === "loja" && count > 0 && !cartOpen && !checkout && !selected && (
        <button
          className="floating-cart"
          onClick={() => setCartOpen(true)}
          aria-label={`Abrir carrinho com ${count} itens, ${money(total)}`}
        >
          <span className="floating-cart-icon">
            <ShoppingCart size={23} />
            <b key={count}>{count}</b>
          </span>
          <span>
            <strong>Ver carrinho</strong>
            <small>
              {count} {count === 1 ? "item" : "itens"} · {money(total)}
            </small>
          </span>
          <ChevronRight size={18} />
        </button>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          {toast}
        </div>
      )}
      {accountOpen && (
        <Modal
          title={shopUser ? "Minha conta" : "Bem-vindo à Villa Natura"}
          close={closeAccount}
          className={
            accountMode === "welcome" && !shopUser ? "welcome-modal" : ""
          }
        >
          <CustomerAccount
            user={shopUser}
            onUser={setShopUser}
            close={closeAccount}
            initialMode={accountMode}
          />
        </Modal>
      )}
      {promotionOpen &&
        promotion.enabled &&
        offerProducts.length > 0 &&
        !storeError &&
        view === "loja" &&
        !accountOpen &&
        !cartOpen &&
        !checkout &&
        !selected && (
          <Modal
            title={promotion.title}
            close={dismissPromotion}
            className="promotion-modal"
          >
            <div className="promotion-notice">
              <div className="promotion-visual">
                <img
                  src={promotion.image || offerProducts[0].image}
                  alt={
                    promotion.image
                      ? "Seleção de ofertas da Villa Natura"
                      : offerProducts[0].name
                  }
                />
                <span className="promotion-brand">
                  <Leaf size={16} /> Villa Natura <small>NATURAL</small>
                </span>
                <span className="promotion-sticker">
                  Escolhas
                  <br />
                  especiais <Leaf size={19} />
                </span>
              </div>
              <div className="promotion-copy">
                <span className="promotion-eyebrow">
                  UM CONVITE PARA BEM VIVER
                </span>
                <h2>{promotion.title}</h2>
                <p>{promotion.message}</p>
                <span className="promotion-count">
                  <Tag size={14} />
                  {offerProducts.length}{" "}
                  {offerProducts.length === 1
                    ? "produto em oferta"
                    : "produtos em oferta"}
                </span>
                <button
                  className="primary full"
                  onClick={() => {
                    dismissPromotion();
                    openOffers();
                  }}
                >
                  {promotion.cta}
                  <ArrowUpRight size={18} />
                </button>
                <button className="text-button full" onClick={dismissPromotion}>
                  Continuar explorando
                </button>
              </div>
            </div>
          </Modal>
        )}
      {selected && (
        <Modal
          key={selected.id}
          close={() => setSelected(null)}
          title={selected.name}
          wide
        >
          <ProductChoice
            key={selected.id}
            product={selected}
            ready={cartReady}
            onAdd={(variant) => add(selected, variant || "")}
          />
          {products.some(
            (p) => p.category === selected.category && p.id !== selected.id,
          ) && (
            <section className="related-products">
              <h3>Você também pode gostar</h3>
              <div>
                {products
                  .filter(
                    (p) =>
                      p.category === selected.category && p.id !== selected.id,
                  )
                  .slice(0, 3)
                  .map((p) => (
                    <button key={p.id} onClick={() => setSelected(p)}>
                      <img src={p.image} alt="" loading="lazy" />
                      <span>
                        {p.name}
                        <small>{p.weight}</small>
                        <b>{money(sellingPrice(p))}</b>
                      </span>
                    </button>
                  ))}
              </div>
            </section>
          )}
        </Modal>
      )}
      {cartOpen && (
        <Modal close={() => setCartOpen(false)} title={`Sua sacola (${count})`}>
          <div className="cart-content">
            {cart.length ? (
              cart.map((i) => {
                const original = products.find((p) => p.id === i.id);
                if (!original) return null;
                const p = optionProduct(original, i.variant);
                return (
                  <div className="cart-row" key={cartKey(i)}>
                    <img src={p.image} alt="" />
                    <div>
                      <h3>{p.name}</h3>
                      <small>{p.weight}</small>
                      <div className="quantity">
                        <button
                          aria-label={`Diminuir ${p.name}`}
                          onClick={() => change(cartKey(i), -1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span>{i.qty}</span>
                        <button
                          aria-label={`Aumentar ${p.name}`}
                          onClick={() => change(cartKey(i), 1)}
                          disabled={i.qty >= 99}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <strong>{money(sellingPrice(p) * i.qty)}</strong>
                    <button
                      className="icon-btn remove"
                      aria-label={`Remover ${p.name}`}
                      onClick={() =>
                        setCart((c) =>
                          c.filter((x) => cartKey(x) !== cartKey(i)),
                        )
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
                  ? "Seu pedido já foi recebido pela loja. No WhatsApp, toque em Enviar para iniciar a conversa. Se ele não abriu, use o botão abaixo."
                  : "Recebemos seu pedido! A Villa Natura vai confirmar os próximos passos com você."}
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
                  Acompanhar pedido
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
                  defaultValue={shopUser?.name || ""}
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
                  defaultValue={shopUser?.phone || ""}
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
                Nenhum pagamento é cobrado nesta etapa. Entrega, pagamento e
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
                data-channel={phone ? "WhatsApp" : "Site"}
                disabled={saving}
              >
                {phone && <MessageCircle size={19} />}
                {saving
                  ? "Registrando…"
                  : phone
                    ? "Finalizar e abrir WhatsApp"
                    : "Finalizar pedido pelo site"}
              </button>
              {phone && (
                <small className="center">
                  O WhatsApp abrirá com a mensagem pronta. Toque em Enviar para
                  conversar com a loja.
                </small>
              )}
              {phone && (
                <button
                  className="secondary full"
                  type="submit"
                  data-channel="Site"
                  disabled={saving}
                >
                  Finalizar somente pelo site
                </button>
              )}
              {!phone && (
                <small className="center">
                  Para falar com a Villa Natura, finalize seu pedido pelo site.
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
              <div className="detail-line" key={cartKey(i)}>
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
            <TrashAction
              kind="order"
              id={currentOrder.id}
              disabled={saving}
              onDone={async () => {
                setCurrentOrder(null);
                await loadStore();
                notify("Pedido movido para a lixeira.");
              }}
            />
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
