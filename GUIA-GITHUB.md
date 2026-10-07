# Atualizar o GitHub

Repositório: https://github.com/ryanzinnbueno/Nativa

Execute cada comando em uma linha separada, dentro da pasta do projeto:

```cmd
git status
git add app lib supabase tests package.json package-lock.json netlify.toml proxy.ts tsconfig.json eslint.config.mjs .gitignore .env.example README.md LEIA-ME.md GUIA-GITHUB.md AGENTS.md CLAUDE.md
git commit -m "Atualiza Nativa"
git push origin main
```

Revise git status antes de enviar. Não inclua .env.local, senhas, node_modules, .next, ZIPs ou o arquivo local chamado git. A .env.example contém apenas instruções e marcadores.

O guia de hospedagem e banco está em README.md.
