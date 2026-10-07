# Nativa — primeiro MVP

Loja com catálogo demonstrativo, sacola, checkout de teste, CRM de pedidos e clientes, notas de atendimento, exportação CSV e configuração de WhatsApp.

## Cards de categorias

Três cards sem preços: Castanhas e sabores, Chás e infusões, Grãos e cereais. As imagens originais foram geradas com a ferramenta integrada de imagens. No celular, os cards permitem deslizar; tocar em um deles filtra o catálogo.

## Rodar localmente

Requer Node.js 22.13+.

1. Execute `npm ci` na pasta do projeto.
2. Execute `npm run build`.
3. Aplique o esquema local uma única vez: `node --import ./scripts/sites-env.mjs node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_fat_zarek.sql`.
4. Execute `npm run dev -- --port 5186`.
5. Abra `http://127.0.0.1:5186/signin-with-chatgpt?return_to=/` para entrar com a identidade fictícia de desenvolvimento.

## Testar

Adicione produtos, abra a sacola, preencha os dados fictícios e finalize pelo site. Vá em Área da Nativa para consultar o pedido, mudar o status e adicionar notas ao cliente. Em Configurações, salve o número real da empresa com 55 + DDD + número para habilitar o WhatsApp. A mensagem só é enviada quando você a envia no WhatsApp.

## Escopo desta versão

Produtos, textos, fotos, pesos, ingredientes e preços são ilustrativos. Não há cobrança, estoque real nem cálculo de frete. A implantação Sites foi criada como privada; o CRM e os registros estão separados pela identidade autenticada. Para atender compradores reais, é necessário configurar catálogo, estoque, frete e pagamento, além de separar a gestão administrativa da loja pública.

O banco D1 é o armazenamento dos pedidos, clientes e configurações. A sacola usa armazenamento de sessão apenas como rascunho temporário. Nenhum dado de cartão é coletado.

As fotografias de catálogo de terceiros servem como exemplos do MVP. Substitua pelas imagens próprias da empresa antes do lançamento comercial. Os cards de categoria usam imagens geradas. A foto de seleção de Marco Verch tem atribuição no rodapé.
