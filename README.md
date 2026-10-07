# Nativa — código do MVP

Esta entrega inclui a loja, os banners de grãos/castanhas/chás, os cards de categorias, o carrinho, o checkout de teste e o CRM. Código correspondente à última versão publicada, com ícones de carrinho nos botões de adicionar produtos.

## Subir no GitHub

1. Extraia o ZIP.
2. Crie um repositório privado no GitHub chamado `nativa-bem-viver`.
3. Envie o conteúdo da pasta `nativa` para a raiz do repositório, incluindo arquivos que começam com ponto, como `.gitignore`, `.npmrc` e a pasta `.openai`.
4. Não envie o ZIP inteiro como um único arquivo se quiser conectar o repositório à hospedagem.

Se preferir Git no computador, execute dentro da pasta `nativa`:

```bash
git init
git add .
git commit -m "Primeiro MVP da Nativa"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/nativa-bem-viver.git
git push -u origin main
```

Substitua `SEU-USUARIO` pelo seu usuário ou organização do GitHub.

## Estado atual e migração

O projeto atual usa Vinext, hospedagem Sites/Cloudflare e banco D1. O login administrativo usa a autenticação do Sites. Ainda NÃO está adaptado para funcionar em produção com Supabase e Netlify. Subir o código no GitHub não conclui essa migração.

Próximas adaptações: executar com Next.js padrão, substituir o banco D1 por Supabase, configurar login administrativo e regras de acesso, revisar a loja pública e configurar a publicação na Netlify.

Projeto Supabase escolhido: `ztgmikmwpkhozrrfmuju`, na organização Nativa. Nenhuma chave ou senha do Supabase está incluída nesta entrega.

## Desenvolvimento

Veja `LEIA-ME.md` para as instruções de execução e teste do MVP atual. Requer Node.js 22.13 ou superior. Os arquivos de dependências, dados locais, histórico Git e resultados de compilação foram excluídos do ZIP.

O catálogo e os pedidos desta versão são demonstrativos. O checkout registra pedidos; não processa pagamentos.
