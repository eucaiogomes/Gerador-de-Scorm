# 🚀 Guia Completo de Deploy

Este guia cobre todas as formas de fazer deploy do seu gerador de SCORM.

---

## 📋 Pré-requisitos

- [ ] Node.js 18+ instalado
- [ ] npm ou yarn instalado
- [ ] Conta no Supabase (gratuita)
- [ ] Conta no Groq (gratuita)
- [ ] Git instalado

---

## 🎯 Opções de Deploy

### 1️⃣ Deploy Completo (Frontend + Backend)
### 2️⃣ Deploy apenas Frontend (Vercel/Netlify)
### 3️⃣ Deploy apenas Backend (Supabase Functions)
### 4️⃣ Deploy Local para Desenvolvimento

---

## 1️⃣ Deploy Completo (Recomendado)

### Passo 1: Preparar o Projeto

```bash
# Clone o repositório
git clone <seu-repositorio>
cd geradordescorm-main

# Instale dependências
npm install

# Teste localmente
npm run dev
```

### Passo 2: Configurar Groq API

1. Acesse [console.groq.com](https://console.groq.com)
2. Crie uma conta gratuita
3. Vá em "API Keys" → "Create API Key"
4. Copie a chave (começa com `gsk_`)

### Passo 3: Deploy das Funções Supabase

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link com seu projeto
supabase link --project-ref tjlubcabophuxrqyeocp

# Configurar secret
supabase secrets set GROQ_API_KEY=gsk_sua_chave_aqui

# Deploy todas as funções
supabase functions deploy generate-unified-course
supabase functions deploy generate-video-audio
supabase functions deploy generate-unified-scorm

# Verificar deploy
supabase functions list
```

### Passo 4: Deploy do Frontend (Vercel)

**Via Vercel CLI:**

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy em produção
vercel --prod
```

**Via Vercel Dashboard:**

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Import Project"
3. Conecte seu repositório GitHub
4. Configure variáveis de ambiente:
   ```
   VITE_SUPABASE_URL=https://tjlubcabophuxrqyeocp.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sua_key_aqui
   ```
5. Clique em "Deploy"

### Passo 5: Testar Produção

1. Acesse a URL do Vercel
2. Digite um tema de teste
3. Gere um curso completo
4. Baixe o SCORM
5. Importe em um LMS para testar

✅ **Deploy completo!**

---

## 2️⃣ Deploy Frontend (Vercel)

### Método A: Vercel CLI

```bash
# Build do projeto
npm run build

# Deploy
npx vercel

# Configurar variáveis de ambiente
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY

# Deploy em produção
vercel --prod
```

### Método B: Via GitHub

1. Push seu código para GitHub
2. Acesse [vercel.com/new](https://vercel.com/new)
3. Importe o repositório
4. Configure:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Adicione variáveis de ambiente
6. Deploy

### Variáveis de Ambiente Necessárias

```bash
VITE_SUPABASE_URL=https://tjlubcabophuxrqyeocp.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=tjlubcabophuxrqyeocp
```

---

## 3️⃣ Deploy Frontend (Netlify)

### Método A: Netlify CLI

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Inicializar
netlify init

# Deploy
netlify deploy --prod
```

### Método B: Via Dashboard

1. Acesse [app.netlify.com](https://app.netlify.com)
2. Clique em "Add new site" → "Import an existing project"
3. Conecte seu GitHub
4. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Adicione variáveis de ambiente:
   ```
   VITE_SUPABASE_URL=https://tjlubcabophuxrqyeocp.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sua_key
   ```
6. Deploy

### Arquivo netlify.toml (opcional)

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

---

## 4️⃣ Deploy Backend (Supabase Functions)

### Deploy Individual de Funções

```bash
# Deploy apenas a função de geração de curso
supabase functions deploy generate-unified-course

# Deploy com logs
supabase functions deploy generate-unified-course --debug

# Deploy e seguir logs
supabase functions deploy generate-unified-course && \
supabase functions logs generate-unified-course --tail
```

### Deploy Todas as Funções

```bash
# Script para deploy de todas
#!/bin/bash
functions=(
  "generate-unified-course"
  "generate-video-audio"
  "generate-unified-scorm"
)

for func in "${functions[@]}"; do
  echo "Deploying $func..."
  supabase functions deploy "$func"
done

echo "✅ Todas as funções deployadas!"
```

### Configurar Secrets

```bash
# Adicionar secret
supabase secrets set GROQ_API_KEY=gsk_...

# Listar secrets
supabase secrets list

# Remover secret
supabase secrets unset OLD_KEY
```

### Testar Funções

```bash
# Invocar função local
supabase functions serve

# Em outro terminal
curl -X POST http://localhost:54321/functions/v1/generate-unified-course \
  -H "Content-Type: application/json" \
  -d '{"topic": "Teste"}'
```

---

## 5️⃣ Deploy Local (Desenvolvimento)

### Setup Completo Local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar .env
cp .env.example .env
# Editar .env com suas keys

# 3. Iniciar Supabase local
supabase start

# 4. Servir funções localmente
supabase functions serve &

# 5. Iniciar frontend
npm run dev
```

### Docker Compose (opcional)

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "5173:5173"
    environment:
      - VITE_SUPABASE_URL=http://localhost:54321
    volumes:
      - .:/app
    command: npm run dev

  supabase:
    image: supabase/postgres
    ports:
      - "54321:54321"
    environment:
      - POSTGRES_PASSWORD=postgres
```

Executar:
```bash
docker-compose up
```

---

## 🔧 Configurações Avançadas

### Custom Domain (Vercel)

```bash
# Adicionar domínio
vercel domains add seudominio.com

# Configurar DNS
# Adicione record CNAME apontando para: cname.vercel-dns.com
```

### Custom Domain (Netlify)

1. Site settings → Domain management
2. Add custom domain
3. Configure DNS:
   - Type: CNAME
   - Name: www
   - Value: [seu-site].netlify.app

### SSL/HTTPS

✅ **Automático** em Vercel e Netlify (Let's Encrypt)

### CI/CD Automático

**GitHub Actions** (`.github/workflows/deploy.yml`):

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_KEY }}
      
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## 📊 Monitoramento

### Logs do Supabase

```bash
# Ver logs em tempo real
supabase functions logs generate-unified-course --tail

# Ver últimos 100 logs
supabase functions logs generate-unified-course --limit 100

# Filtrar erros
supabase functions logs generate-unified-course | grep ERROR
```

### Vercel Analytics

1. Dashboard do Vercel
2. Analytics tab
3. Monitore:
   - Page views
   - Performance
   - Errors

### Sentry (opcional)

```bash
npm install @sentry/react

# src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
});
```

---

## 🐛 Troubleshooting Deploy

### Erro: "Build failed"

**Solução:**
```bash
# Limpar cache
rm -rf node_modules package-lock.json
npm install

# Testar build local
npm run build

# Ver erros detalhados
npm run build --verbose
```

### Erro: "Function not found"

**Solução:**
```bash
# Verificar deploy
supabase functions list

# Re-deploy
supabase functions deploy generate-unified-course --debug
```

### Erro: "Environment variable not found"

**Solução:**
```bash
# Verificar variáveis
vercel env ls

# Adicionar variável
vercel env add VITE_SUPABASE_URL

# Re-deploy
vercel --prod
```

### Erro: "GROQ_API_KEY not configured"

**Solução:**
```bash
# Configurar secret no Supabase
supabase secrets set GROQ_API_KEY=gsk_...

# Verificar
supabase secrets list

# Re-deploy função
supabase functions deploy generate-unified-course
```

---

## 🚀 Otimizações de Produção

### 1. Habilitar Gzip

**Vercel:** Automático ✅

**Netlify:** Adicionar em `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Encoding = "gzip"
```

### 2. Cache de Assets

```typescript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    }
  }
}
```

### 3. Lazy Loading

```typescript
// src/App.tsx
const UnifiedCourseGenerator = lazy(() => 
  import('./components/UnifiedCourseGenerator')
);
```

### 4. CDN

Vercel e Netlify já usam CDN global automaticamente ✅

---

## ✅ Checklist Pré-Deploy

- [ ] Teste local funcionando
- [ ] Variáveis de ambiente configuradas
- [ ] Groq API key válida
- [ ] Build sem erros
- [ ] Testes passando
- [ ] Logs limpos de erros
- [ ] README atualizado
- [ ] CHANGELOG atualizado
- [ ] Git commit e push

---

## 📞 Suporte

- 📧 Suporte Vercel: [vercel.com/support](https://vercel.com/support)
- 📧 Suporte Netlify: [netlify.com/support](https://netlify.com/support)
- 📧 Suporte Supabase: [supabase.com/support](https://supabase.com/support)
- 💬 Discord Supabase: [discord.supabase.com](https://discord.supabase.com)

---

**Deploy bem-sucedido!** 🎉
