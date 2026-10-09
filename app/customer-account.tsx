"use client";
import { useState, type FormEvent } from "react";
import { brazilPhone } from "../lib/shop-features";
export type ShopUser = { name: string; phone: string };
export function CustomerAccount({
  user,
  onUser,
  close,
}: {
  user: ShopUser | null;
  onUser: (user: ShopUser | null) => void;
  close: () => void;
}) {
  const [phone, setPhone] = useState(user?.phone || ""),
    [name, setName] = useState(user?.name || ""),
    [editing, setEditing] = useState(!user),
    [error, setError] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const normalized = brazilPhone(phone);
      if (name.trim().length < 2 || name.trim().length > 100)
        throw new Error("Informe seu nome.");
      const profile = { phone: normalized, name: name.trim() };
      localStorage.setItem("nativa-cadastro-rapido", JSON.stringify(profile));
      onUser(profile);
      close();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível guardar seu cadastro neste aparelho.",
      );
    }
  };
  if (user && !editing)
    return (
      <div className="account-content">
        <h3>Olá, {user.name}!</h3>
        <p>{user.phone}</p>
        <p>
          Seu cadastro está salvo neste aparelho para preencher seus próximos
          pedidos.
        </p>
        <button
          type="button"
          className="secondary full"
          onClick={() => setEditing(true)}
        >
          Editar meu cadastro
        </button>
        <button
          className="text-button full"
          onClick={() => {
            try {
              localStorage.removeItem("nativa-cadastro-rapido");
              onUser(null);
              close();
            } catch {
              setError("Não foi possível remover o cadastro deste aparelho.");
            }
          }}
        >
          Sair e remover deste aparelho
        </button>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
      </div>
    );
  return (
    <form className="checkout-form" onSubmit={submit}>
      <p>
        É opcional e sem senha ou código. Seu cadastro fica neste aparelho para
        facilitar os próximos pedidos.
      </p>
      <label>
        Seu nome
        <input
          autoComplete="name"
          required
          minLength={2}
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <label>
        Celular com DDD
        <input
          type="tel"
          autoComplete="tel-national"
          inputMode="tel"
          placeholder="(71) 91234-5678"
          required
          maxLength={30}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button className="primary full">Salvar e continuar</button>
      <button type="button" className="text-button full" onClick={close}>
        Continuar sem cadastro
      </button>
    </form>
  );
}
