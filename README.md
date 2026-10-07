# Nativa Bem Viver

Loja mobile com banners de grãos, castanhas e chás, categorias, pesquisa, favoritos, sacola e pedidos pelo site ou WhatsApp. CRM com login para pedidos, clientes, notas, exportação CSV e configuração de WhatsApp.

Esta versão usa **Next.js 16 + Supabase**, preparada para **Netlify**. Substitui Sites/Vinext/Cloudflare D1. Produtos e preços são demonstrativos. Não cobra pagamentos, reserva estoque nem calcula frete.

## Executar no computador

Use Node.js 24. Execute cada comando separadamente:

```cmd
npm ci
copy .env.example .env.local
npm run dev
```

Preencha .env.local com a URL e a chave **publishable** do Supabase (Project Settings → API Keys). A URL da Nativa já está no exemplo. Abra http://localhost:3000.

Não envie .env.local, senhas ou chaves secretas ao GitHub. Esta aplicação não precisa de service_role nem de sb_secret.

## Banco de dados

O projeto Nativa ztgmikmwpkhozrrfmuju já recebeu as tabelas e o catálogo desta versão. **Não execute novamente a migração inicial nesse projeto.** Para uma instalação em outro projeto vazio, execute no SQL Editor, nesta ordem:

1. supabase/migrations/202610070001_nativa.sql
2. supabase/seed.sql

As cinco tabelas nativa_* têm RLS habilitado. Visitantes leem apenas catálogo e contato comercial. A função nativa_place_order valida o pedido, busca preços no banco e grava cliente e pedido em uma transação. Evita pedidos duplicados em tentativas repetidas e limita a seis pedidos por telefone a cada 15 minutos. Pedidos e clientes só podem ser lidos por administradores autorizados.

No Table Editor, ajuste produtos em nativa_products. price é em centavos: 2290 corresponde a R$ 22,90. active=false retira o produto da loja; position ordena a exibição. Os preços de pedidos anteriores ficam preservados no próprio pedido.

## Primeiro administrador

O login do painel Supabase é separado do login do CRM.

1. No Supabase, abra **Authentication → Users → Add user → Create new user**.
2. Crie pessoalmente seu usuário com e-mail e senha. Não compartilhe a senha no chat. Para um usuário criado pelo proprietário, confirme seu e-mail no painel.
3. Copie o **User UID** do novo usuário.
4. Execute no SQL Editor, substituindo o marcador pelo UID verdadeiro:

```sql
insert into public.nativa_admins(user_id)
values ('COLE_O_USER_UID_AQUI'::uuid)
on conflict (user_id) do nothing;
```

5. Na loja, abra **Área da Nativa** e entre com esse e-mail e senha.
6. Em **Configurações**, salve o WhatsApp real da empresa: 55 + DDD + número.

Uma conta sem associação em nativa_admins não tem acesso ao CRM. Não existe cadastro público de administradores. Para retirar um acesso, remova sua associação no painel do proprietário.

## Publicar na Netlify

1. Importe **ryanzinnbueno/Nativa**. Na autorização do GitHub, prefira acesso somente a este repositório.
2. Escolha branch **main** e pasta base vazia (package.json está na raiz).
3. Build: **npm run build**. Publicação: **.next**. Node.js: **24**. netlify.toml já configura esses valores.
4. Adicione as variáveis reais no painel da Netlify, disponíveis em **Builds e Functions**, no contexto de produção:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
5. Publique. Depois de conectar, commits em main atualizam o site automaticamente. Alterações de variáveis exigem novo deploy.

Não coloque valores reais no repositório ou em netlify.toml. A Netlify Drop não monta as rotas de servidor desta aplicação; use a importação do GitHub para construir o Next.js.

## Verificações

```cmd
npm test
npm run lint
npm run typecheck
npm run build
```

Os seis testes usam PostgreSQL em memória (PGlite) e não gravam no Supabase. Cobrem acesso restrito, cálculo de preços, tentativas duplicadas, validação, permissões administrativas e limite de pedidos.

Na instalação Nativa foi verificado: cinco tabelas com RLS, catálogo com seis produtos acessível pela aplicação e CRM retornando 401 para visitantes. O checkout com gravação no projeto e o login administrativo ainda precisam de verificação após criar o administrador. A publicação Netlify depende de conectar o repositório.

## Uso da loja

Catálogo, imagens, textos e preços são demonstrativos. Revise os dados reais e rótulos antes de atender clientes. Configure WhatsApp, entrega, estoque e pagamento. O limite por telefone é básico: antes de uma operação pública maior, adicione proteção contra automação e defina a política de privacidade e retenção.

Referências: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Next.js na Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/).
