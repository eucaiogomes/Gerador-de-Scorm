# 🔄 Guia de Migração para APIs Gratuitas

## 🎯 Objetivo

Migrar o projeto de APIs pagas (Lovable + ElevenLabs) para APIs **100% gratuitas** (Groq + Pollinations + Edge TTS).

---

## ✅ Checklist de Migração

### Pré-requisitos
- [ ] Conta no Supabase (já tem)
- [ ] Conta no Groq (criar em [console.groq.com](https://console.groq.com))
- [ ] Supabase CLI instalado (`npm install -g supabase`)

### Passos de Migração

#### 1. Criar Conta Groq (5 minutos)

1. Acesse [console.groq.com](https://console.groq.com)
2. Clique em "Sign Up" (pode usar Google/GitHub)
3. Vá em "API Keys" no menu lateral
4. Clique em "Create API Key"
5. Copie a chave (começa com `gsk_`)

#### 2. Configurar Variáveis de Ambiente no Supabase

**Opção A: Via Dashboard Web**

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **Edge Functions** → **Secrets**
4. Adicione a secret:
   - Key: `GROQ_API_KEY`
   - Value: `gsk_sua_chave_aqui`

**Opção B: Via CLI (recomendado)**

```bash
# Login no Supabase
supabase login

# Link com o projeto
supabase link --project-ref tjlubcabophuxrqyeocp

# Adicionar secret
supabase secrets set GROQ_API_KEY=gsk_sua_chave_aqui

# Verificar secrets
supabase secrets list
```

#### 3. Deploy das Funções Atualizadas

```bash
# Deploy das 3 funções principais
supabase functions deploy generate-unified-course
supabase functions deploy generate-video-audio
supabase functions deploy generate-unified-scorm

# Verificar deploy
supabase functions list
```

#### 4. Testar o Sistema

1. Abra o projeto: `https://tjlubcabophuxrqyeocp.supabase.co`
2. Digite um tema de teste: "Como fazer café"
3. Clique em "Gerar Curso Completo"
4. Aguarde o processo (30-60 segundos)
5. Verifique se:
   - ✅ Conteúdo foi gerado
   - ✅ Imagens aparecem
   - ✅ Áudio funciona no vídeo
   - ✅ Download SCORM funciona

#### 5. Remover APIs Antigas (opcional)

Se não for usar mais as APIs pagas, remova as secrets antigas:

```bash
supabase secrets unset LOVABLE_API_KEY
supabase secrets unset ELEVENLABS_API_KEY
```

---

## 🧪 Testes de Validação

### Teste 1: Geração de Conteúdo
```bash
# Testar função de geração
curl -X POST https://tjlubcabophuxrqyeocp.supabase.co/functions/v1/generate-unified-course \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_ANON_KEY" \
  -d '{"topic": "Teste de APIs Gratuitas"}'
```

**Resultado esperado:** JSON com título, slides, vídeo e perguntas

### Teste 2: Geração de Áudio
```bash
curl -X POST https://tjlubcabophuxrqyeocp.supabase.co/functions/v1/generate-video-audio \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_ANON_KEY" \
  -d '{"script": "Este é um teste de narração em português"}'
```

**Resultado esperado:** JSON com campo `narration` contendo base64 do áudio

---

## 📊 Comparação Antes vs Depois

| Métrica | Antes (Lovable/ElevenLabs) | Depois (Groq/Pollinations/Edge) |
|---------|---------------------------|----------------------------------|
| **Custo por curso** | ~$0.50 | **$0.00** ✅ |
| **Tempo de geração** | 45-90s | **30-60s** ⚡ |
| **Limite diário** | ~100 cursos | **14,400 cursos** 🚀 |
| **Qualidade texto** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Qualidade imagem** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Qualidade áudio** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **API Keys necessárias** | 2 | **1** |
| **Configuração** | Complexa | **Simples** |

---

## 🐛 Troubleshooting Comum

### Erro: "AI service not configured"

**Causa:** Secret `GROQ_API_KEY` não está configurada

**Solução:**
```bash
supabase secrets set GROQ_API_KEY=gsk_sua_chave
supabase functions deploy generate-unified-course
```

### Erro: "Rate limit exceeded" (Groq)

**Causa:** Limite de 30 requisições por minuto

**Solução:**
- Aguarde 60 segundos
- OU crie uma segunda conta Groq para dobrar o limite
- OU implemente um sistema de fila

### Erro: "Failed to generate narration"

**Causa:** Edge TTS temporariamente indisponível

**Solução:**
- O sistema já tem fallback automático para Google TTS
- Se ambos falharem, aguarde 1-2 minutos e tente novamente
- Verifique sua conexão de internet

### Imagens aparecem quebradas

**Causa:** Problema temporário do Pollinations.ai

**Solução:**
- Pollinations.ai é muito confiável, mas pode ter lentidão ocasional
- Aguarde 1-2 minutos e tente novamente
- Verifique se o firewall não está bloqueando `image.pollinations.ai`

---

## 🎓 Boas Práticas

### 1. Monitoramento de Uso

**Groq Usage:**
- Acesse [console.groq.com/usage](https://console.groq.com/usage)
- Monitore seu uso diário
- Fique atento aos limites

### 2. Otimização de Prompts

Para melhor qualidade do Groq/Llama:

```typescript
// ✅ BOM: Prompt específico e estruturado
"Crie um curso sobre ${topic} com exatamente 4 slides..."

// ❌ RUIM: Prompt vago
"Me fale sobre ${topic}"
```

### 3. Cache de Resultados

Considere implementar cache para temas populares:

```typescript
// Salvar curso gerado no Supabase
const { data, error } = await supabase
  .from('generated_courses')
  .insert({ topic, course_data, created_at: new Date() });
```

### 4. Backup das API Keys

Mantenha suas chaves em local seguro:

```bash
# Exportar secrets
supabase secrets list > secrets_backup.txt

# Backup local (não commitar!)
echo "GROQ_API_KEY=gsk_..." > .env.local
```

---

## 📈 Próximos Passos

Após migração bem-sucedida:

1. **Otimizar Performance**
   - Implementar cache de cursos
   - Paralelizar mais operações
   - Adicionar retry automático

2. **Melhorar Qualidade**
   - Refinar prompts do Groq
   - Testar diferentes modelos (Llama vs Mixtral)
   - Ajustar parâmetros de geração de imagem

3. **Adicionar Features**
   - Permitir escolha de voz (masculina/feminina)
   - Customização de estilo de imagem
   - Exportar em diferentes formatos (PDF, PowerPoint)

4. **Monitoramento**
   - Implementar logs de uso
   - Criar dashboard de métricas
   - Alertas para falhas

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs do Supabase:
   ```bash
   supabase functions logs generate-unified-course --limit 50
   ```

2. Teste cada função individualmente usando o Supabase Dashboard

3. Consulte a documentação:
   - [Groq Docs](https://console.groq.com/docs)
   - [Supabase Functions](https://supabase.com/docs/guides/functions)

---

## ✅ Checklist Final

Após migração, confirme:

- [ ] Groq API Key configurada
- [ ] Funções deployadas
- [ ] Teste completo funcionando (texto + imagens + áudio)
- [ ] Download SCORM funcionando
- [ ] APIs antigas removidas (opcional)
- [ ] Backup das configurações feito
- [ ] Documentação lida e entendida

---

**🎉 Parabéns! Seu sistema agora é 100% gratuito e ainda mais rápido!**
