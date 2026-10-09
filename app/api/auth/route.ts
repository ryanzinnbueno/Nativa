import { createClient } from "../../../lib/supabase/server";
import { reply, sameOrigin } from "../../../lib/supabase/http";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return reply({ error: "Origem inválida." }, 403);
  try {
    const body = await request.json();
    if (
      typeof body.email !== "string" ||
      typeof body.password !== "string" ||
      body.email.length > 254 ||
      body.password.length > 256
    )
      return reply({ error: "Confira seu e-mail e senha." }, 400);
    const client = await createClient();
    const { error } = await client.auth.signInWithPassword({
      email: body.email.trim(),
      password: body.password,
    });
    if (error) return reply({ error: "E-mail ou senha inválidos." }, 401);
    const { data: allowed, error: roleError } =
      await client.rpc("nativa_is_admin");
    if (allowed !== true || roleError) {
      await client.auth.signOut({ scope: "local" });
      return reply(
        { error: "Esta conta não tem acesso à Área da Villa Natura." },
        403,
      );
    }
    return reply({ ok: true });
  } catch {
    return reply(
      {
        error:
          "Não foi possível entrar. Confira a conexão e a configuração da loja.",
      },
      503,
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
