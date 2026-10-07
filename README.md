# Nativa Bem Viver

Loja mobile com banners de grãos, castanhas e chás, categorias, pesquisa, favoritos, carrinho com quantidade e total e pedidos pelo site ou WhatsApp. Área administrativa com login para pedidos, clientes, notas, cadastro e edição de produtos, controle de banners, relatórios em PDF e configuração de WhatsApp.

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
3. supabase/migrations/202610070002_catalog_banners.sql
4. supabase/migrations/202610070003_categories_offers.sql
5. supabase/migrations/202610070004_image_storage.sql
6. supabase/migrations/202610070005_trash_image_banners.sql

**Atualização da instalação Nativa existente:** aplique as migrações ainda não executadas (003, 004 e 005), uma vez cada, antes de publicar esta versão. A 003 preserva as categorias existentes, permite renomeá-las junto com os produtos e banners e adiciona preços promocionais. A 004 cria o armazenamento público nativa-images para fotos da loja, com envio somente por administradores autorizados. Não altera pedidos antigos.

As tabelas nativa_* têm RLS habilitado. Visitantes leem apenas catálogo, banners visíveis e contato comercial. A função nativa_place_order valida o pedido, busca preços no banco e grava cliente e pedido em uma transação. Evita pedidos duplicados em tentativas repetidas e limita a seis pedidos por telefone a cada 15 minutos. Pedidos e clientes só podem ser lidos por administradores autorizados.

Em **Área da Nativa → Produtos**, cadastre ou edite nome, categoria, preço em reais, peso, foto, descrição, ingredientes, ordem e visibilidade. Ocultar preserva o item e os pedidos anteriores. Escolha uma categoria cadastrada, informe o preço normal e, opcionalmente, um preço promocional menor. Deixe a promoção vazia para encerrá-la. O desconto aparece na loja e é usado no carrinho e no pedido. Os pedidos anteriores mantêm os valores registrados.

Em **Categorias**, crie e renomeie categorias e escolha sua ordem. Elas aparecem na seleção de produtos e banners e nos filtros da loja. Renomear atualiza os produtos e banners associados.

Em produtos e banners, envie fotos JPG, PNG ou WebP de até 4 MB, escolha uma foto já disponível ou informe um endereço HTTPS. As fotos enviadas são convertidas para WebP, reduzidas para até 1920 pixels e publicadas no armazenamento da loja; não envie documentos ou fotos privadas. O produto ou banner só muda ao salvar. Cancelar após o envio deixa a foto armazenada, sem modificar o cadastro.

A migração 005 adiciona a Lixeira e o formato de banner em imagem. Ao excluir, pedidos saem das listas, totais e relatórios; produtos saem da loja e não podem ser pedidos. Administradores podem recuperar os itens na Lixeira. Produtos recuperados ficam ocultos até marcar Mostrar na loja. Não há exclusão permanente nem remoção de clientes.

Em **Banners**, escolha Imagem, título e botão ou Somente imagem e botão. O segundo formato não exige título nem descrição. Os banners ficaram menores, e as mensagens secundárias foram retiradas da vitrine. Edite mensagens, imagem, categoria do botão, ordem e visibilidade. Controle também o tempo entre banners (3–20 segundos) e a passagem automática. As preferências de movimento do visitante são respeitadas.

Em **Relatórios**, escolha período e situação e baixe um PDF com clientes, valores, canais e entrega. A soma exclui cancelados e representa pedidos, não pagamentos recebidos. O relatório consulta o período completo, até 5.000 pedidos; acima disso, pede um período menor para não gerar um resultado incompleto. Dados de clientes ficam no arquivo baixado, portanto compartilhe apenas com pessoas autorizadas.

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

Os testes usam PostgreSQL em memória (PGlite) e não gravam no Supabase. Cobrem acesso restrito, cálculo de preços, tentativas duplicadas, validação, cadastro administrativo, banners visíveis/ocultos, limite de pedidos, origem das requisições e paginação/totais do PDF.

O site está conectado ao GitHub e publicado na Netlify. A administração exige uma conta Supabase autorizada em nativa_admins. As categorias e promoções dependem da migração 003, e o envio de fotos depende da migração 004.

## Uso da loja

Catálogo, imagens, textos e preços são demonstrativos. Revise os dados reais e rótulos antes de atender clientes. Configure WhatsApp, entrega, estoque e pagamento. O limite por telefone é básico: antes de uma operação pública maior, adicione proteção contra automação e defina a política de privacidade e retenção.

Referências: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Next.js na Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/).

A migração 006 (`supabase/migrations/202610070006_banner_image_settings.sql`) adiciona o enquadramento das imagens dos banners. Aplicar antes desta versão. Em Banners, ajuste separadamente Celular e Computador: imagem inteira ou preencher, zoom e posição horizontal/vertical. É possível enviar uma arte diferente para celular. A prévia muda ao ajustar e só vai para a loja depois de Salvar alterações. Banners antigos mantêm o enquadramento padrão.
Em Apresentação por tela, selecione Celular ou Computador e escolha Imagem, título e botão ou Somente imagem e botão para cada um. É possível usar texto apenas no computador e uma arte pronta com botão no celular. Os textos são preservados ao trocar os formatos. A atualização usa a migração 006 já aplicada, sem nova alteração no banco.
