# 🆓 Configuração das APIs Gratuitas

Este projeto foi atualizado para usar **APIs 100% GRATUITAS** para geração de conteúdo com IA!

## 📋 Stack Atualizada

### ✅ APIs Gratuitas Implementadas

| Funcionalidade | API Usada | Custo | Limite |
|---------------|-----------|-------|--------|
| 📝 Geração de Texto | **Groq (Llama 3.3 70B)** | Grátis | 30 req/min, 14,400/dia |
| 🖼️ Geração de Imagens | **Pollinations.ai (Flux)** | Grátis | Ilimitado |
| 🔊 Geração de Áudio | **Edge TTS (Microsoft)** | Grátis | Ilimitado |

---

## 🚀 Como Configurar

### 1️⃣ Configurar Groq API (Geração de Texto)

**Passo 1:** Crie uma conta gratuita em [console.groq.com](https://console.groq.com)

**Passo 2:** Vá em **API Keys** e crie uma nova chave

**Passo 3:** Adicione a chave nas variáveis de ambiente do Supabase:

```bash
# No Supabase Dashboard:
# Settings → Edge Functions → Secrets

GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
```

**OU** localmente no arquivo `.env.local`:

```bash
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
```

### 2️⃣ Pollinations.ai (Geração de Imagens)

✅ **Nenhuma configuração necessária!**

- Sem API key
- Sem cadastro
- Sem limites
- 100% gratuito

### 3️⃣ Edge TTS (Geração de Áudio)

✅ **Nenhuma configuração necessária!**

- Sem API key
- Sem cadastro
- API pública da Microsoft
- Vozes em português brasileiro nativas

---

## 📦 Deploy no Supabase

### Passo 1: Instalar Supabase CLI

```bash
npm install -g supabase
```

### Passo 2: Login no Supabase

```bash
supabase login
```

### Passo 3: Link com seu projeto

```bash
supabase link --project-ref tjlubcabophuxrqyeocp
```

### Passo 4: Deploy das funções

```bash
supabase functions deploy generate-unified-course
supabase functions deploy generate-video-audio
supabase functions deploy generate-unified-scorm
```

### Passo 5: Adicionar a API key do Groq

```bash
supabase secrets set GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
```

---

## 🧪 Testar Localmente

### Instalar dependências

```bash
npm install
```

### Rodar o projeto

```bash
npm run dev
```

### Rodar funções localmente (opcional)

```bash
supabase functions serve
```

---

## 🎯 Benefícios da Migração

| Antes (Lovable + ElevenLabs) | Depois (APIs Gratuitas) |
|-------------------------------|------------------------|
| 💸 Custo por curso: ~$0.50 | ✅ **$0.00** |
| ⏱️ Velocidade: Normal | ⚡ **Muito mais rápido** |
| 🚫 Limites: Apertados | ✅ **Generosos** |
| 🔑 API Keys: 2 pagas | ✅ **1 grátis apenas** |

---

## 📊 Comparação de Qualidade

### Geração de Texto
- **Antes:** Gemini 3 Flash Preview
- **Depois:** Llama 3.3 70B (via Groq)
- **Resultado:** ⭐⭐⭐⭐⭐ Igual ou superior

### Geração de Imagens
- **Antes:** Gemini 2.5 Flash Image
- **Depois:** Flux (via Pollinations)
- **Resultado:** ⭐⭐⭐⭐ Qualidade similar

### Geração de Áudio
- **Antes:** ElevenLabs (pago)
- **Depois:** Edge TTS (Microsoft)
- **Resultado:** ⭐⭐⭐⭐ Vozes naturais em PT-BR

---

## 🛠️ Troubleshooting

### Erro: "AI service not configured"

➡️ **Solução:** Adicione a variável `GROQ_API_KEY` nas secrets do Supabase

```bash
supabase secrets set GROQ_API_KEY=sua_chave_aqui
```

### Erro: "Rate limit exceeded"

➡️ **Solução:** O Groq tem limite de 30 requisições por minuto. Aguarde 1 minuto ou crie outra conta.

### Imagens não estão sendo geradas

➡️ **Solução:** O Pollinations.ai é público e sempre funciona. Verifique sua conexão com internet.

### Áudio sem voz ou com erro

➡️ **Solução:** O Edge TTS tem fallback automático para Google TTS. Se ambos falharem, verifique sua conexão.

---

## 📚 Recursos Úteis

- [Groq Documentation](https://console.groq.com/docs)
- [Pollinations.ai](https://pollinations.ai/)
- [Edge TTS Voices](https://speech.microsoft.com/portal)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## 💡 Dicas de Otimização

1. **Cache de cursos:** Considere salvar cursos gerados para evitar gerar o mesmo conteúdo múltiplas vezes

2. **Paralelização:** As imagens são geradas em paralelo, aproveitando o Pollinations ilimitado

3. **Retry automático:** O Groq tem retry embutido para falhas temporárias

4. **Fallback de áudio:** Se Edge TTS falhar, o sistema usa Google TTS automaticamente

---

## 🎉 Pronto!

Agora você tem um gerador de SCORM **100% gratuito** e sem limites apertados!

**Custo total: $0.00 por curso** 🎊
