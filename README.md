# 🎓 Gerador de SCORM com IA - 100% GRATUITO

## 🆓 Projeto Atualizado para APIs Gratuitas!

Este é um gerador de pacotes SCORM completo que utiliza **APIs 100% GRATUITAS** para criar cursos interativos de alta qualidade.

### ⚡ Stack de IA Gratuita

- 📝 **Texto:** Groq (Llama 3.3 70B) - 14,400 cursos/dia grátis
- 🖼️ **Imagens:** Pollinations.ai (Flux) - Ilimitado e gratuito
- 🔊 **Áudio:** Edge TTS (Microsoft) - Ilimitado e gratuito

**Custo total por curso: $0.00** 🎉

---

## 🚀 Quick Start

### 1. Clone o repositório

```bash
git clone <YOUR_GIT_URL>
cd geradordescorm-main
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure a API Groq

1. Crie conta gratuita em [console.groq.com](https://console.groq.com)
2. Copie sua API key
3. Configure no Supabase:

```bash
supabase secrets set GROQ_API_KEY=gsk_sua_chave_aqui
```

### 4. Deploy das funções

```bash
supabase functions deploy generate-unified-course
supabase functions deploy generate-video-audio  
supabase functions deploy generate-unified-scorm
```

### 5. Rode o projeto

```bash
npm run dev
```

**Pronto!** Acesse http://localhost:5173

---

## 📚 Documentação Completa

- 📖 [README APIs Gratuitas](./README_APIS_GRATUITAS.md) - Guia completo das APIs
- 🔄 [Guia de Migração](./GUIA_MIGRACAO.md) - Como migrar de APIs pagas
- 🛠️ [Configuração Detalhada](#configuração-detalhada) - Abaixo

---

## ✨ Funcionalidades

### O que o gerador cria:

- ✅ **4 Slides de Conteúdo** - Teórico e progressivo
- ✅ **Vídeo de 1 Minuto** - Com 5 cenas ilustradas e narração
- ✅ **Quiz com 5 Perguntas** - Teste de compreensão
- ✅ **Pacote SCORM Completo** - Pronto para LMS

### Compatibilidade SCORM:

- ✅ SCORM 1.2
- ✅ SCORM 2004
- ✅ Moodle, SCORM Cloud, SAP SuccessFactors, etc.

---

## 🎯 Como Usar

1. Digite o tema do curso (ex: "Como fazer um bolo de chocolate")
2. Escolha versão SCORM e tipo de conclusão
3. Clique em "Gerar Curso Completo"
4. Aguarde 30-60 segundos
5. Visualize o preview
6. Baixe o pacote SCORM (.zip)
7. Importe no seu LMS favorito

---

## 🏗️ Arquitetura

### Frontend
- **React 18** + TypeScript
- **Vite** para build
- **shadcn/ui** para componentes
- **Tailwind CSS** para styling

### Backend
- **Supabase Edge Functions** (Deno)
- **APIs de IA Gratuitas:**
  - Groq API (texto)
  - Pollinations.ai (imagens)
  - Edge TTS (áudio)

### Fluxo de Geração

```
1. Usuário digita tema
   ↓
2. Groq gera estrutura (texto JSON)
   ↓
3. Pollinations gera imagens (paralelo)
   ↓
4. Edge TTS gera narração
   ↓
5. Preview do curso
   ↓
6. Gerar pacote SCORM
   ↓
7. Download .zip
```

---

## ⚙️ Configuração Detalhada

### Variáveis de Ambiente

Crie `.env` na raiz:

```bash
# Supabase (obrigatório)
VITE_SUPABASE_PROJECT_ID="tjlubcabophuxrqyeocp"
VITE_SUPABASE_PUBLISHABLE_KEY="sua_key_aqui"
VITE_SUPABASE_URL="https://tjlubcabophuxrqyeocp.supabase.co"

# Groq API (obrigatório) - 100% GRATUITO
GROQ_API_KEY="gsk_sua_chave_aqui"
```

### Secrets do Supabase

Configure via CLI ou Dashboard:

```bash
# Via CLI (recomendado)
supabase secrets set GROQ_API_KEY=gsk_...

# Via Dashboard
# Settings → Edge Functions → Secrets
```

---

## 📦 Deploy

### Deploy no Vercel/Netlify (Frontend)

```bash
npm run build
# Upload pasta dist/
```

### Deploy no Supabase (Backend)

```bash
supabase functions deploy --project-ref tjlubcabophuxrqyeocp
```

---

## 🧪 Testes

```bash
# Rodar testes
npm test

# Testes em modo watch
npm run test:watch
```

---

## 📊 Performance

### Tempo de Geração

- Estrutura do curso: ~5 segundos (Groq)
- Imagens (9 total): ~20-30 segundos (Pollinations)
- Áudio: ~5-10 segundos (Edge TTS)
- **Total: 30-60 segundos por curso**

### Limites Gratuitos

| API | Limite | Custo |
|-----|--------|-------|
| Groq | 14,400 req/dia | $0.00 |
| Pollinations | Ilimitado | $0.00 |
| Edge TTS | Ilimitado | $0.00 |

---

## 🐛 Troubleshooting

### Erro: "AI service not configured"
➡️ Configure `GROQ_API_KEY` nas secrets do Supabase

### Erro: "Rate limit exceeded"
➡️ Groq tem limite de 30 req/min. Aguarde 60 segundos.

### Imagens não aparecem
➡️ Verifique conexão com `image.pollinations.ai`

### Áudio não funciona
➡️ O sistema tem fallback automático. Aguarde e tente novamente.

**Mais detalhes:** Veja [GUIA_MIGRACAO.md](./GUIA_MIGRACAO.md#-troubleshooting-comum)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! 

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT.

---

## 🙏 Agradecimentos

- [Groq](https://groq.com) - IA ultrarrápida e gratuita
- [Pollinations.ai](https://pollinations.ai) - Geração ilimitada de imagens
- [Microsoft Edge TTS](https://azure.microsoft.com/en-us/products/ai-services/text-to-speech) - TTS de qualidade
- [Supabase](https://supabase.com) - Backend as a Service
- [shadcn/ui](https://ui.shadcn.com) - Componentes UI

---

## 📞 Suporte

- 📖 [Documentação Completa](./README_APIS_GRATUITAS.md)
- 🔄 [Guia de Migração](./GUIA_MIGRACAO.md)
- 💬 Issues do GitHub
- 📧 Email: [seu email]

---

**Feito com ❤️ usando APIs 100% gratuitas** 🎉

---

## 📝 Original Lovable Project Info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

### How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share → Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
"# scorm-para-lector" 
#   G e r a d o r - d e - S c o r m  
 