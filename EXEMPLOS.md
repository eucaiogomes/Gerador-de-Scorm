# 💡 Exemplos Práticos de Uso

Este documento contém exemplos práticos de como usar o gerador de SCORM com diferentes temas e configurações.

---

## 🎯 Temas Sugeridos para Testar

### Educação Corporativa
1. **Segurança no Trabalho**
   - Curso sobre EPIs e prevenção de acidentes
   - Tempo: ~45 segundos
   - Ideal para: Empresas de construção, indústrias

2. **Atendimento ao Cliente**
   - Técnicas de comunicação e resolução de problemas
   - Tempo: ~50 segundos
   - Ideal para: Empresas de serviços, call centers

3. **Compliance e LGPD**
   - Noções básicas de proteção de dados
   - Tempo: ~60 segundos
   - Ideal para: Empresas de tecnologia, startups

### Educação Técnica
4. **Introdução ao Excel**
   - Fórmulas básicas e formatação
   - Tempo: ~55 segundos
   - Ideal para: Cursos de informática básica

5. **Fundamentos de Marketing Digital**
   - SEO, redes sociais e anúncios online
   - Tempo: ~60 segundos
   - Ideal para: Cursos de marketing

6. **Git e Controle de Versão**
   - Comandos básicos e workflow
   - Tempo: ~50 segundos
   - Ideal para: Cursos de programação

### Educação Geral
7. **Primeiros Socorros**
   - RCP e procedimentos básicos
   - Tempo: ~45 segundos
   - Ideal para: Treinamento obrigatório

8. **Gestão de Tempo**
   - Técnicas de produtividade e organização
   - Tempo: ~50 segundos
   - Ideal para: Desenvolvimento pessoal

9. **Como Fazer Café Especial**
   - Métodos de preparo e tipos de grãos
   - Tempo: ~40 segundos
   - Ideal para: Cursos de gastronomia

---

## 🧪 Casos de Teste

### Teste 1: Curso Básico

**Input:**
```json
{
  "topic": "Como fazer um bolo de chocolate",
  "scormVersion": "1.2",
  "completionStatus": "completed"
}
```

**Output Esperado:**
- 4 slides sobre ingredientes, preparo, forno e decoração
- Vídeo com 5 cenas mostrando o processo
- 5 perguntas sobre a receita
- Tempo total: ~40 segundos

### Teste 2: Curso Corporativo

**Input:**
```json
{
  "topic": "Segurança cibernética para empresas",
  "scormVersion": "2004",
  "completionStatus": "passed-failed"
}
```

**Output Esperado:**
- 4 slides sobre ameaças, prevenção, políticas e boas práticas
- Vídeo resumindo os principais riscos
- 5 perguntas sobre segurança
- Tempo total: ~55 segundos

### Teste 3: Curso Técnico

**Input:**
```json
{
  "topic": "Introdução ao React para iniciantes",
  "scormVersion": "1.2",
  "completionStatus": "passed-failed"
}
```

**Output Esperado:**
- 4 slides sobre componentes, props, state e hooks
- Vídeo com exemplos de código
- 5 perguntas conceituais
- Tempo total: ~60 segundos

---

## 📝 Testando as APIs Individualmente

### 1. Testar Groq API (Geração de Texto)

```bash
curl -X POST https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer gsk_SUA_CHAVE" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.3-70b-versatile",
    "messages": [
      {
        "role": "system",
        "content": "Você responde APENAS com JSON válido."
      },
      {
        "role": "user",
        "content": "Crie um título de curso sobre: Como fazer café"
      }
    ],
    "response_format": { "type": "json_object" }
  }'
```

**Resultado Esperado:** JSON com resposta estruturada

### 2. Testar Pollinations.ai (Geração de Imagens)

```bash
# Método 1: Acessar URL diretamente
https://image.pollinations.ai/prompt/Professional%20educational%20illustration%20of%20coffee%20brewing?width=1024&height=768&model=flux&nologo=true

# Método 2: Via curl
curl "https://image.pollinations.ai/prompt/Educational%20slide%20about%20programming?width=1024&height=768&model=flux" \
  --output test_image.png
```

**Resultado Esperado:** Imagem PNG de alta qualidade

### 3. Testar Edge TTS (Geração de Áudio)

```bash
curl -X POST https://brazilsouth.tts.speech.microsoft.com/cognitiveservices/v1 \
  -H "Content-Type: application/ssml+xml" \
  -H "X-Microsoft-OutputFormat: audio-24khz-48kbitrate-mono-mp3" \
  -d '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="pt-BR">
        <voice name="pt-BR-FranciscaNeural">
          <prosody rate="0.95">
            Este é um teste de narração em português.
          </prosody>
        </voice>
      </speak>' \
  --output test_audio.mp3
```

**Resultado Esperado:** Arquivo MP3 com áudio em português

---

## 🎨 Customizações Possíveis

### Alterar Voz da Narração

No arquivo `generate-video-audio/index.ts`, você pode escolher:

```typescript
const PORTUGUESE_VOICES = {
  female: "pt-BR-FranciscaNeural",   // Feminina (padrão)
  male: "pt-BR-AntonioNeural",       // Masculina
  female2: "pt-BR-ThalitaNeural",    // Feminina alternativa
};
```

**Para usar voz masculina:**
```typescript
// No frontend, ao chamar a função:
await supabase.functions.invoke("generate-video-audio", {
  body: { script: fullScript, voice: "male" }
});
```

### Alterar Estilo das Imagens

No arquivo `generate-unified-course/index.ts`, modifique os prompts:

```typescript
// Para estilo cartoon/ilustrativo
const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
  `Cartoon illustration: ${slide.imagePrompt}. Colorful, friendly, educational style.`
)}...`;

// Para estilo fotográfico
const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
  `Professional photograph: ${slide.imagePrompt}. High quality, realistic, detailed.`
)}...`;

// Para estilo minimalista
const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
  `Minimalist flat design: ${slide.imagePrompt}. Simple, clean, modern.`
)}...`;
```

### Alterar Número de Slides/Perguntas

No prompt do Groq (arquivo `generate-unified-course/index.ts`):

```typescript
const structurePrompt = `
O curso DEVE ter:
1. 6 slides de conteúdo teórico  // Era 4
2. 7 cenas para um vídeo resumo  // Era 5
3. 10 perguntas de quiz          // Era 5
...
`;
```

---

## 📊 Monitoramento e Logs

### Verificar Logs das Funções

```bash
# Ver logs em tempo real
supabase functions logs generate-unified-course --tail

# Ver últimos 50 logs
supabase functions logs generate-unified-course --limit 50

# Ver logs com filtro
supabase functions logs generate-unified-course --filter "error"
```

### Monitorar Uso do Groq

1. Acesse [console.groq.com/usage](https://console.groq.com/usage)
2. Veja gráficos de:
   - Requisições por dia
   - Tokens usados
   - Latência média
   - Erros

### Testar Performance

```javascript
// Adicionar no código para medir tempo
console.time("Geração Total");

// ... código de geração ...

console.timeEnd("Geração Total");
// Output: Geração Total: 45123ms
```

---

## 🔧 Debugging

### Habilitar Logs Detalhados

No arquivo `generate-unified-course/index.ts`:

```typescript
// Adicionar logs detalhados
console.log("=== INÍCIO GERAÇÃO ===");
console.log("Topic:", topic);
console.log("Timestamp:", new Date().toISOString());

// Depois de gerar estrutura
console.log("=== ESTRUTURA GERADA ===");
console.log("Title:", course.title);
console.log("Slides:", course.slides.length);
console.log("Scenes:", course.video.scenes.length);
console.log("Questions:", course.questions.length);

// Depois de gerar imagens
console.log("=== IMAGENS GERADAS ===");
console.log("Slides com imagem:", course.slides.filter(s => s.imageBase64).length);
console.log("Scenes com imagem:", course.video.scenes.filter(s => s.imageBase64).length);
```

### Testar Localmente com Supabase CLI

```bash
# Iniciar funções localmente
supabase start
supabase functions serve

# Em outro terminal, testar
curl -X POST http://localhost:54321/functions/v1/generate-unified-course \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"topic": "Teste local"}'
```

---

## 💰 Calculadora de Economia

### Antes (APIs Pagas)

| Componente | API | Custo por Curso |
|-----------|-----|-----------------|
| Texto | Lovable/Gemini | $0.10 |
| Imagens (9x) | Gemini Image | $0.27 |
| Áudio | ElevenLabs | $0.13 |
| **TOTAL** | | **$0.50** |

**Para 1000 cursos:** $500.00

### Depois (APIs Gratuitas)

| Componente | API | Custo por Curso |
|-----------|-----|-----------------|
| Texto | Groq (Llama 3.3) | $0.00 |
| Imagens (9x) | Pollinations | $0.00 |
| Áudio | Edge TTS | $0.00 |
| **TOTAL** | | **$0.00** |

**Para 1000 cursos:** $0.00

**Economia:** $500.00 (100% de economia!) 🎉

---

## 🚀 Dicas de Performance

### 1. Geração Paralela de Imagens

O código já faz isso, mas você pode aumentar:

```typescript
// Gerar todas as imagens ao mesmo tempo
const allImagePromises = [
  ...slideImagePromises,
  ...videoImagePromises
];
const allImages = await Promise.all(allImagePromises);
```

### 2. Cache de Cursos Populares

```typescript
// Verificar se curso já foi gerado
const { data: cached } = await supabase
  .from('courses_cache')
  .select('*')
  .eq('topic', topic.toLowerCase().trim())
  .single();

if (cached) {
  return cached.course_data;
}
```

### 3. Compressão de Imagens

```typescript
// Usar parâmetro quality no Pollinations
const imageUrl = `...&quality=85`; // Reduz tamanho sem perder qualidade
```

---

## ✅ Checklist de Qualidade

Antes de usar em produção, verifique:

- [ ] Groq API key configurada e funcionando
- [ ] Todos os temas de teste geram cursos completos
- [ ] Imagens são geradas para todos os slides
- [ ] Áudio é gerado corretamente em português
- [ ] Download SCORM funciona e zip não está corrompido
- [ ] SCORM importa corretamente no LMS alvo (Moodle, etc)
- [ ] Tracking SCORM funciona (completed/passed-failed)
- [ ] Logs estão configurados para debugging
- [ ] Performance está dentro do esperado (< 60s)

---

**Bom uso e bons cursos!** 🎓✨
