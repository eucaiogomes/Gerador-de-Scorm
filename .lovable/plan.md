

# SCORM Quiz Generator - Plano de Implementação

## Visão Geral
SaaS web simples onde usuários preenchem um formulário com perguntas de quiz e recebem um pacote SCORM (.zip) pronto para upload em qualquer LMS. Uso anônimo, sem login, totalmente gratuito.

---

## Fase 1: Interface do Formulário

### Página Principal
- **Cabeçalho**: Título do curso (campo de texto)
- **Configurações SCORM**:
  - Seleção: SCORM 1.2 ou SCORM 2004
  - Seleção: Status final (completed / passed-failed)
- **Lista de Perguntas** (dinâmica):
  - Botão "Adicionar Pergunta"
  - Para cada pergunta:
    - Texto da pergunta
    - Lista de alternativas (mínimo 2, máximo 6)
    - Seleção da alternativa correta
    - Botão "Remover Pergunta"
- **Botão "Gerar SCORM"** → dispara geração do ZIP

---

## Fase 2: Backend (Edge Function)

### Endpoint de Geração
Recebe JSON com configuração do curso e retorna arquivo ZIP.

### Arquivos Gerados no ZIP
1. **imsmanifest.xml** - Manifesto SCORM com metadados e estrutura
2. **index.html** - Página do quiz com estrutura HTML
3. **script.js** - Lógica do quiz + comunicação SCORM

### Templates SCORM (Robustez Crítica)
- **Busca da API SCORM**: Função robusta que percorre `window.parent` até encontrar a API
- **Inicialização**: `LMSInitialize()` (1.2) ou `Initialize()` (2004)
- **Commit antes de Finish**: Sempre executar commit antes de finalizar
- **Proteção contra múltiplas finalizações**: Flag para evitar chamar Finish duas vezes
- **Tratamento de erros**: Logs para debug se API não encontrada

---

## Fase 3: Comportamento do Quiz

### Fluxo do Usuário no Quiz Gerado
1. Exibe uma pergunta por vez (estilo slide)
2. Usuário seleciona uma alternativa
3. **Se correta**: Botão "Avançar" aparece
4. **Se incorreta**: Feedback visual + usuário tenta novamente
5. Na última pergunta correta: Finaliza e envia status ao LMS

### Comunicação SCORM
- **SCORM 1.2**: Define `cmi.core.lesson_status` como "completed" ou "passed"/"failed"
- **SCORM 2004**: Define `cmi.completion_status` + `cmi.success_status`

---

## Fase 4: Geração do ZIP

### Processo Técnico
1. Renderizar templates com dados do formulário
2. Gerar os 3 arquivos (manifest, HTML, JS)
3. Compactar em ZIP **sem pasta pai** (arquivos na raiz)
4. Retornar para download direto no navegador

---

## Interface Visual

### Layout Simples e Funcional
- Formulário centralizado em card
- Cores neutras e profissionais
- Feedback de validação inline (campos obrigatórios)
- Loading spinner durante geração
- Download automático do ZIP ao finalizar

---

## Arquitetura Técnica

| Camada | Tecnologia |
|--------|------------|
| Frontend | React + TypeScript + Tailwind |
| Backend | Supabase Edge Function (Deno) |
| Geração ZIP | JSZip (biblioteca JavaScript) |
| Deploy | Lovable Cloud |

---

## Validações

### Formulário
- Título obrigatório
- Mínimo 1 pergunta
- Cada pergunta: mínimo 2 alternativas
- Alternativa correta obrigatória

### SCORM
- Manifesto válido conforme especificação
- Identificadores únicos e válidos
- Encoding UTF-8 correto

---

## Resultado Final
- Formulário web intuitivo
- ZIP SCORM válido e testado
- Compatível com Moodle, SCORM Cloud, SAP SuccessFactors e outros LMS
- Código limpo, comentado e preparado para expansão

