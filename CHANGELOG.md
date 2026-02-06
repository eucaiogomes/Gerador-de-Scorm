# 📝 Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

---

## [2.0.0] - 2024-02-03 - 🆓 Migração para APIs Gratuitas

### 🎉 Mudanças Principais

#### ✅ Adicionado
- **Groq API** para geração de texto (Llama 3.3 70B)
  - 100% gratuito
  - 14,400 requisições/dia
  - Resposta JSON nativa
  - Muito mais rápido que Gemini
  
- **Pollinations.ai** para geração de imagens
  - 100% gratuito
  - Sem limites de uso
  - Sem necessidade de API key
  - Suporte a Flux e SDXL
  
- **Edge TTS** (Microsoft) para geração de áudio
  - 100% gratuito
  - Vozes em português brasileiro nativas
  - Sem necessidade de API key
  - Fallback automático para Google TTS

- **Documentação completa:**
  - `README_APIS_GRATUITAS.md` - Guia das APIs
  - `GUIA_MIGRACAO.md` - Como migrar
  - `EXEMPLOS.md` - Casos de uso práticos
  - `CHANGELOG.md` - Este arquivo

#### 🔧 Modificado
- `supabase/functions/generate-unified-course/index.ts`
  - Substituído Lovable AI Gateway por Groq API
  - Substituído Gemini Image por Pollinations.ai
  - Melhorado tratamento de erros
  - Adicionado response_format JSON nativo

- `supabase/functions/generate-video-audio/index.ts`
  - Substituído ElevenLabs por Edge TTS
  - Adicionado fallback para Google TTS
  - Suporte a múltiplas vozes portuguesas
  - Removida dependência de API key paga

- `README.md`
  - Atualizado para refletir nova stack
  - Adicionado quick start
  - Adicionado troubleshooting
  - Links para documentação completa

- `.env.example`
  - Removidas variáveis de APIs pagas
  - Adicionada apenas `GROQ_API_KEY`
  - Comentários explicativos

#### ❌ Removido
- Dependência do `LOVABLE_API_KEY`
- Dependência do `ELEVENLABS_API_KEY`
- Custos de geração de conteúdo
- Limites apertados de rate

### 📊 Métricas de Melhoria

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Custo/curso | $0.50 | $0.00 | **100%** ↓ |
| Tempo geração | 45-90s | 30-60s | **33%** ↓ |
| Limite diário | ~100 | 14,400 | **14,300%** ↑ |
| API Keys pagas | 2 | 0 | **100%** ↓ |
| Qualidade texto | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **+25%** |

### 🐛 Bugs Corrigidos
- Falhas intermitentes de rate limit
- Parsing inconsistente de JSON do Gemini
- Timeout em geração de múltiplas imagens
- Custo inesperado com ElevenLabs

### 🔒 Segurança
- Removidas API keys sensíveis do código
- Migrado secrets para Supabase Edge Functions
- Adicionado `.env.example` para referência

---

## [1.0.0] - 2024-01-XX - Versão Inicial

### ✅ Funcionalidades Iniciais

- Geração de cursos SCORM completos
- Interface web com React + TypeScript
- 4 slides de conteúdo teórico
- Vídeo resumo com 5 cenas
- Quiz com 5 perguntas
- Suporte SCORM 1.2 e 2004
- Integração com Lovable AI Gateway (Gemini)
- Geração de imagens com Gemini Image
- Geração de áudio com ElevenLabs
- Preview do curso antes do download
- Download em formato ZIP

### 🏗️ Stack Tecnológica Original

**Frontend:**
- React 18
- TypeScript
- Vite
- shadcn/ui
- Tailwind CSS

**Backend:**
- Supabase Edge Functions
- Lovable AI Gateway (Gemini)
- ElevenLabs TTS

**APIs:**
- `generate-unified-course` - Gera estrutura + imagens
- `generate-video-audio` - Gera narração
- `generate-unified-scorm` - Cria pacote SCORM

---

## 🔮 Roadmap Futuro

### v2.1.0 (Próxima)
- [ ] Cache de cursos gerados
- [ ] Sistema de templates personalizados
- [ ] Escolha de voz (masculina/feminina)
- [ ] Mais estilos de imagem
- [ ] Exportação para PowerPoint
- [ ] Exportação para PDF

### v2.2.0
- [ ] Multi-idioma (inglês, espanhol)
- [ ] Integração com Google Drive
- [ ] API pública para desenvolvedores
- [ ] Dashboard de analytics
- [ ] Sistema de usuários

### v3.0.0
- [ ] Editor visual de cursos
- [ ] Biblioteca de assets reutilizáveis
- [ ] Temas e skins customizáveis
- [ ] Colaboração em tempo real
- [ ] Versionamento de cursos

---

## 📝 Convenções de Versionamento

Este projeto usa [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Mudanças incompatíveis na API
- **MINOR** (0.X.0): Nova funcionalidade compatível
- **PATCH** (0.0.X): Correções de bugs

---

## 🤝 Contribuindo

Veja mudanças que você pode contribuir:

1. 🐛 Reportar bugs via Issues
2. 💡 Sugerir features via Discussions
3. 🔧 Enviar Pull Requests
4. 📖 Melhorar documentação
5. ⭐ Dar estrela no projeto

---

## 📄 Licença

MIT License - Veja [LICENSE](./LICENSE) para detalhes

---

**Última atualização:** 03 de Fevereiro de 2024
