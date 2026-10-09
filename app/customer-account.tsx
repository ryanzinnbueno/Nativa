"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Leaf, ArrowUpRight, Package, Eye, EyeOff } from "lucide-react";
import { money } from "./catalog";
export type ShopUser = { name: string; phone: string };
export type AccountMode = "welcome" | "login" | "register";
type MyOrder = {
  id: string;
  created: string;
  status: string;
  total: number;
  delivery: string;
  payment: string;
  address: string;
  items: { name: string; weight: string; qty: number; price: number }[];
};
export function CustomerAccount({
  user,
  onUser,
  close,
  initialMode = "login",
}: {
  user: ShopUser | null;
  onUser: (user: ShopUser | null) => void;
  close: () => void;
  initialMode?: AccountMode;
}) {
  const [mode, setMode] = useState<AccountMode>(initialMode),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [showPassword, setShowPassword] = useState(false),
    [orders, setOrders] = useState<MyOrder[]>([]),
    [loading, setLoading] = useState(false),
    [more, setMore] = useState(false),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (cancelled) return;
      setLoading(true);
      setError("");
      try {
        const r = await fetch("/api/customer-orders");
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        if (!cancelled) {
          setOrders(d.orders);
          setMore(d.hasMore);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user, refresh]);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    if (mode === "register" && f.get("password") !== f.get("confirm")) {
      setError("As senhas precisam ser iguais.");
      setBusy(false);
      return;
    }
    try {
      const r = await fetch("/api/customer-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          phone: f.get("phone"),
          password: f.get("password"),
          name: f.get("name"),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      onUser(d.user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (user)
    return (
      <div className="account-content my-orders">
        <span className="eyebrow">SUA CONTA VERDEVA</span>
        <h3>Olá, {user.name}!</h3>
        <p>{user.phone}</p>
        <div className="my-orders-heading">
          <h3>Meus pedidos</h3>
          <button
            className="text-button"
            disabled={loading || busy}
            onClick={() => setRefresh((v) => v + 1)}
          >
            Atualizar
          </button>
        </div>
        <p className="account-note">
          Pedidos feitos enquanto você estava conectado aparecem aqui.
        </p>
        {loading && <p role="status">Carregando seus pedidos…</p>}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {!loading && !error && !orders.length && (
          <div className="orders-empty">
            <Package size={30} />
            <h4>Seu primeiro pedido começa na loja.</h4>
            <p>
              Escolha seus favoritos e finalize conectado para acompanhar por
              aqui.
            </p>
            <button className="primary full" onClick={close}>
              Explorar produtos
            </button>
          </div>
        )}
        {orders.map((o) => (
          <details className="my-order" key={o.id}>
            <summary>
              <span>
                Pedido #{o.id.slice(0, 8).toUpperCase()}
                <small>
                  {new Date(o.created).toLocaleDateString("pt-BR", {
                    timeZone: "America/Bahia",
                  })}
                </small>
              </span>
              <span>
                <b>{money(o.total)}</b>
                <small className="my-order-status">{o.status}</small>
              </span>
            </summary>
            <div>
              {o.items.map((i, n) => (
                <p className="my-order-item" key={n}>
                  <span>
                    {i.qty} × {i.name}
                    <small>{i.weight}</small>
                  </span>
                  <b>{money(i.qty * i.price)}</b>
                </p>
              ))}
              <p>
                {o.delivery} · {o.payment}
              </p>
              {o.address && <p>{o.address}</p>}
              <small>Entrega e pagamento são confirmados pela Verdeva.</small>
            </div>
          </details>
        ))}
        {more && (
          <button
            className="secondary full"
            disabled={busy || loading}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const r = await fetch(
                  `/api/customer-orders?offset=${orders.length}`,
                );
                const d = await r.json();
                if (!r.ok) throw new Error(d.error);
                setOrders((v) => [...v, ...d.orders]);
                setMore(d.hasMore);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Ver mais pedidos
          </button>
        )}
        <button
          className="text-button full"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              const r = await fetch("/api/customer-auth", { method: "DELETE" });
              if (!r.ok)
                throw new Error("Não foi possível sair. Tente novamente.");
              onUser(null);
              setMode("login");
              setOrders([]);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Sair da minha conta
        </button>
      </div>
    );
  if (mode === "welcome")
    return (
      <div className="account-welcome">
        <span className="welcome-leaf">
          <Leaf size={32} />
        </span>
        <span className="eyebrow">BEM-VINDO À VERDEVA</span>
        <h2>
          Seu bem viver
          <br />
          começa aqui.
        </h2>
        <p>
          Crie sua conta para acompanhar seus pedidos e facilitar suas próximas
          compras.
        </p>
        <button className="primary full" onClick={() => setMode("register")}>
          Criar minha conta
          <ArrowUpRight size={18} />
        </button>
        <button className="secondary full" onClick={() => setMode("login")}>
          Já tenho conta · Entrar
        </button>
        <button className="text-button full" onClick={close}>
          Continuar sem cadastro
        </button>
      </div>
    );
  return (
    <form className="checkout-form account-form" onSubmit={submit}>
      <div className="account-tabs">
        <button
          type="button"
          aria-pressed={mode === "login"}
          onClick={() => {
            setMode("login");
            setError("");
          }}
        >
          Entrar
        </button>
        <button
          type="button"
          aria-pressed={mode === "register"}
          onClick={() => {
            setMode("register");
            setError("");
          }}
        >
          Criar conta
        </button>
      </div>
      <p>
        {mode === "register"
          ? "Cadastre seu celular e crie uma senha para acompanhar seus próximos pedidos."
          : "Entre com seu celular e senha para ver seus pedidos."}
      </p>
      <fieldset disabled={busy}>
        {mode === "register" && (
          <label>
            Seu nome
            <input
              name="name"
              autoComplete="name"
              minLength={2}
              maxLength={100}
              required
            />
          </label>
        )}
        <label>
          Celular com DDD
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(71) 91234-5678"
            required
            maxLength={30}
          />
        </label>
        <label>
          Senha
          <span className="password-field">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              minLength={8}
              maxLength={72}
              required
            />
            <button
              type="button"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
          {mode === "register" && <small>Use pelo menos 8 caracteres.</small>}
        </label>
        {mode === "register" && (
          <label>
            Confirmar senha
            <input
              name="confirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />
          </label>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="primary full" disabled={busy}>
          {busy
            ? "Aguarde…"
            : mode === "register"
              ? "Criar minha conta"
              : "Entrar e ver meus pedidos"}
        </button>
      </fieldset>
      <button type="button" className="text-button full" onClick={close}>
        Continuar sem entrar
      </button>
      {mode === "login" && (
        <small className="account-note">
          Esqueceu a senha? Fale com a Verdeva para receber orientação.
        </small>
      )}
    </form>
  );
}
