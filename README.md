# Villa Natura Bem Viver

Loja mobile com banners de grãos, castanhas e chás, categorias, pesquisa, favoritos, carrinho com quantidade e total e pedidos pelo site ou WhatsApp. Área administrativa com login para pedidos, clientes, notas, cadastro e edição de produtos, controle de banners, relatórios em PDF e configuração de WhatsApp.

Esta versão usa **Next.js 16 + Supabase**, preparada para **Netlify**. Substitui Sites/Vinext/Cloudflare D1. Produtos e preços são demonstrativos. Não cobra pagamentos, reserva estoque nem calcula frete.

## Executar no computador

Use Node.js 24. Execute cada comando separadamente:

```cmd
npm ci
copy .env.example .env.local
npm run dev
```

Preencha .env.local com a URL e a chave **publishable** do Supabase (Project Settings → API Keys). A URL da Villa Natura já está no exemplo. Abra http://localhost:3000.

Não envie .env.local, senhas ou chaves secretas ao GitHub. Esta aplicação não precisa de service_role nem de sb_secret.

## Banco de dados

O projeto Villa Natura ztgmikmwpkhozrrfmuju já recebeu as tabelas e o catálogo desta versão. **Não execute novamente a migração inicial nesse projeto.** Para uma instalação em outro projeto vazio, execute no SQL Editor, nesta ordem:

1. supabase/migrations/202610070001_nativa.sql
2. supabase/seed.sql
3. supabase/migrations/202610070002_catalog_banners.sql
4. supabase/migrations/202610070003_categories_offers.sql
5. supabase/migrations/202610070004_image_storage.sql
6. supabase/migrations/202610070005_trash_image_banners.sql

**Atualização da instalação Villa Natura existente:** aplique as migrações ainda não executadas (003, 004 e 005), uma vez cada, antes de publicar esta versão. A 003 preserva as categorias existentes, permite renomeá-las junto com os produtos e banners e adiciona preços promocionais. A 004 cria o armazenamento público nativa-images para fotos da loja, com envio somente por administradores autorizados. Não altera pedidos antigos.

As tabelas nativa_* têm RLS habilitado. Visitantes leem apenas catálogo, banners visíveis e contato comercial. A função nativa_place_order valida o pedido, busca preços no banco e grava cliente e pedido em uma transação. Evita pedidos duplicados em tentativas repetidas e limita a seis pedidos por telefone a cada 15 minutos. Pedidos e clientes só podem ser lidos por administradores autorizados.

Em **Área da Villa Natura → Produtos**, cadastre ou edite nome, categoria, preço em reais, peso, foto, descrição, ingredientes, ordem e visibilidade. Ocultar preserva o item e os pedidos anteriores. Escolha uma categoria cadastrada, informe o preço normal e, opcionalmente, um preço promocional menor. Deixe a promoção vazia para encerrá-la. O desconto aparece na loja e é usado no carrinho e no pedido. Os pedidos anteriores mantêm os valores registrados.

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

5. Na loja, abra **Área da Villa Natura** e entre com esse e-mail e senha.
6. Em **Configurações**, salve o WhatsApp real da empresa: 55 + DDD + número.

Uma conta sem associação em nativa_admins não tem acesso ao CRM. Não existe cadastro público de administradores. Para retirar um acesso, remova sua associação no painel do proprietário.

## Publicar na Netlify

1. Importe **ryanzinnbueno/Villa Natura**. Na autorização do GitHub, prefira acesso somente a este repositório.
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

Ofertas e cadastro rápido (migração 007): aplique `supabase/migrations/202610090007_promotions.sql` antes de publicar. A vitrine Ofertas e o filtro Só ofertas mostram somente preços promocionais válidos. A barra de pesquisa do topo busca nomes, complementos e categorias, com ou sem acentos.

Em Promoções no painel, configure o aviso: ativação, título, mensagem, botão e imagem opcional. O aviso aparece após seis segundos, uma vez por sessão e configuração, somente se houver ofertas, sem interromper carrinho, cadastro ou checkout.

Minha conta usa Supabase Auth com celular e senha (mínimo 8 caracteres). Aplique a migração 009 antes de publicar e habilite o provedor Phone, com confirmação por telefone desativada para o fluxo solicitado sem SMS. Mantenha as configurações de e-mail dos administradores. A primeira visita mostra opções de criar conta, entrar ou continuar sem cadastro. As senhas nunca são guardadas no navegador; as sessões usam cookies HttpOnly, SameSite=Lax e Secure em produção. O histórico mostra os pedidos feitos conectado, com paginação e atualização do status. Compras antigas sem sessão não são vinculadas pelo telefone; cadastrar o número não concede acesso retroativo. A recuperação de senha por SMS não está habilitada; oriente o cliente a falar com a loja, sem conceder acesso apenas por informar um número.

As fichas dos produtos exibem destaques, ingredientes e sugestões de uso, com itens relacionados. Preencha os novos campos em Produtos > Editar. A migração 202610090008_product_details.sql adiciona esses campos sem alterar os produtos existentes.

A marca da loja e dos relatórios é Villa Natura. Os links do Instagram foram removidos. Os nomes internos do banco, repositório e endereço de hospedagem continuam compatíveis com a instalação existente.

Ativação sem SMS: o painel do Supabase exige dados de um provedor mesmo com confirmação desligada. O script `scripts/ativar-login-telefone.ps1` usa a API oficial de gestão para configurar apenas `external_phone_enabled=true` e `sms_autoconfirm=true`. Gere um token pessoal da conta dona do projeto com acesso à configuração de autenticação, rode `powershell -ExecutionPolicy Bypass -File scripts/ativar-login-telefone.ps1` no CMD e cole o token na entrada oculta. Ele não é salvo no projeto nem deve ser enviado no chat. O script confirma os dois campos e verifica que a configuração de e-mail não mudou. A ativação por essa via ainda precisa ser conferida no projeto após executar o script. Referência: https://supabase.com/docs/reference/api/v1-update-auth-service-config

A migração 202610090010_villa_natura.sql atualiza os textos de marca do catálogo e dos banners para Villa Natura.

Destaques de categorias (migração 011): em Categorias, marque “Mostrar em Qual é o seu momento?” nos itens desejados. A seleção salva imediatamente, respeita a ordem de exibição e não remove categorias da busca. Em Editar, configure foto, título, frase do topo e descrição. Novas categorias começam fora dos destaques; as três categorias originais permanecem selecionadas na atualização. Se nenhuma for selecionada, a seção não aparece. As permissões de edição continuam restritas aos administradores. A migração 011 já foi aplicada neste projeto.

Em 09/10/2026, o script de ativação retornou confirmação ao responsável e a consulta pública do Supabase confirmou Phone habilitado e novos cadastros permitidos. A validação de uma conta real deve ser feita pelo titular com sua própria senha.

Prévia do produto e ajuste de foto (migração 012): Produtos > Novo/Editar mostra “Assim fica na loja”, com as opções Na vitrine e Produto aberto. Nome, preço, promoção e textos atualizam a prévia sem salvar. Os campos de ingredientes, destaques e uso ficam em Informações adicionais (opcional). Em Ajustar tamanho e posição da foto, escolha preencher ou mostrar inteira, zoom de 100 a 250% e posição. Os ajustes persistem ao salvar e são usados na vitrine, ofertas e produto aberto. Novos envios usam preencher; fotos antigas mantêm o modo inteiro, com o espaçamento desnecessário removido. Não há deformação da imagem. A migração 012 foi aplicada neste projeto.

Ao finalizar com WhatsApp configurado, o botão principal “Finalizar e abrir WhatsApp” salva primeiro o pedido e então abre a conversa na mesma aba, com o resumo e o número do pedido. O cliente precisa tocar em Enviar no WhatsApp. A opção “Finalizar somente pelo site” mantém a confirmação sem redirecionar. Falhas ao salvar preservam a sacola e não abrem o WhatsApp; tentativas repetidas usam a mesma identificação do pedido. Não é um envio automático de mensagem.


Fotos, opções e compartilhamento (migração 013): aplique `supabase/migrations/202610090013_product_options.sql` antes de publicar. O produto mantém foto, peso e preço principais e aceita até 7 fotos adicionais e 19 outros pesos/unidades com preço e promoção próprios. As opções têm IDs estáveis; remover uma opção não altera pedidos anteriores. A sacola separa cada peso e o banco calcula os preços. A prévia de Produto aberto permite trocar fotos e selecionar opções. Produtos ativos possuem link `/produto/ID`, com compartilhamento e cópia na loja e no painel. Produtos ocultos/excluídos retornam 404. A busca do painel considera nome, complemento e categoria.
