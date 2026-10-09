import { createClient } from "../../../lib/supabase/server";
import { reply, sameOrigin } from "../../../lib/supabase/http";
import { brazilPhone } from "../../../lib/shop-features";
import { customerAuthError } from "../../../lib/customer-auth-errors";
export const dynamic = "force-dynamic";
const profile = (user: {
  phone?: string;
  user_metadata: Record<string, unknown>;
}) => ({
  name:
    typeof user.user_metadata.name === "string"
      ? user.user_metadata.name.slice(0, 100)
      : "Cliente",
  phone: user.phone?.startsWith("+") ? user.phone : "+" + user.phone,
});
export async function GET() {
  try {
    const client = await createClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    return reply({ user: user?.phone ? profile(user) : null });
  } catch {
    return reply(
      { error: "Não foi possível conferir sua conta. Tente novamente." },
      503,
    );
  }
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return reply({ error: "Origem inválida." }, 403);
  try {
    const raw = await request.text();
    if (raw.length > 2000) return reply({ error: "Confira os campos." }, 400);
    const body = JSON.parse(raw);
    const phone = brazilPhone(body.phone);
    if (
      !/^\+55[1-9][0-9]9[0-9]{8}$/.test(phone) ||
      typeof body.password !== "string" ||
      body.password.length < 8 ||
      body.password.length > 72 ||
      !["login", "register"].includes(body.mode)
    )
      return reply(
        {
          error: "Informe o celular com DDD e uma senha de 8 a 72 caracteres.",
        },
        400,
      );
    const client = await createClient();
    if (body.mode === "register") {
      if (
        typeof body.name !== "string" ||
        body.name.trim().length < 2 ||
        body.name.trim().length > 100
      )
        return reply({ error: "Informe seu nome." }, 400);
      const { data, error } = await client.auth.signUp({
        phone,
        password: body.password,
        options: { data: { name: body.name.trim() } },
      });
      if (error) {
        const failure = customerAuthError(error, true);
        return reply({ error: failure.message }, failure.status);
      }
      if (!data.session || !data.user)
        return reply(
          {
            error:
              "O cadastro por telefone ainda não está disponível. Fale com a Villa Natura.",
          },
          503,
        );
      return reply({ user: profile(data.user) }, 201);
    }
    const { data, error } = await client.auth.signInWithPassword({
      phone,
      password: body.password,
    });
    if (error || !data.user) {
      const failure = customerAuthError(error || {}, false);
      return reply({ error: failure.message }, failure.status);
    }
    return reply({ user: profile(data.user) });
  } catch {
    return reply(
      {
        error: "Não foi possível entrar. Confira os campos e tente novamente.",
      },
      400,
    );
  }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return reply({ error: "Origem inválida." }, 403);
  try {
    const client = await createClient();
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) throw error;
    return reply({ ok: true });
  } catch {
    return reply({ error: "Não foi possível sair. Tente novamente." }, 503);
  }
}
