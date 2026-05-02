# PLAN.md

Plano de simplificação de UX e redução de overhead do **transit-game-js**.

## Status de execução
- [x] Sprint 38 — UI Cleanup
- [x] Sprint 39 — Collapsible Panels
- [x] Sprint 40 — Contextual Visibility
- [x] Sprint 41 — Diagnostics Gating
- [x] Sprint 42 — Optional Replay
- [ ] Sprint 43 — UX Polish

As sprints de performance anteriores já foram concluídas.
Agora o foco passa a ser **limpar a experiência**, separar melhor o que é fluxo principal versus laboratório/debug, e **parar de pagar custo de coleta/renderização quando a informação nem está visível**.

---

# 1. Objetivo deste plano

Deixar o simulador mais claro, mais leve e com menos cara de painel interno de engenharia.

Em termos práticos, queremos:
- reduzir excesso visual de controles e informação
- destacar o fluxo principal de uso
- esconder ferramentas avançadas atrás de seções próprias
- tornar a UI mais contextual
- reduzir trabalho de coleta/renderização quando painéis estiverem fechados
- preservar capacidade de benchmark, replay e diagnóstico sem mantê-los sempre expostos

---

# 2. Leitura honesta do problema atual

Hoje a UI mistura ao mesmo tempo:
- controles principais de simulação
- configuração avançada de mapa
- regras experimentais
- benchmark lab
- replay
- diagnósticos internos
- informações técnicas de engine/renderer

O resultado é uma tela útil para desenvolvimento, mas pesada para uso normal.

Os principais problemas são:
- muitos controles ficam visíveis mesmo quando não se aplicam ao modo atual
- benchmark/replay/diagnóstico competem com controles principais
- a barra lateral mostra informação demais o tempo todo
- há elementos claramente internos/dev ainda expostos na UI
- parte da coleta continua acontecendo mesmo quando o usuário não está vendo aquela informação

---

# 3. Princípios para a simplificação

## 3.1. Fluxo principal primeiro
A UI padrão deve priorizar:
- escolher cenário
- executar/pausar/resetar
- ajustar velocidade
- observar o mapa
- ver um resumo curto do estado atual

## 3.2. Laboratório atrás de camadas
Replay, benchmark detalhado, diagnósticos e tuning avançado continuam existindo, mas devem ficar atrás de botões, painéis ou seções colapsáveis.

## 3.3. UI contextual
Controles e painéis devem aparecer só quando fizerem sentido para:
- modo atual
- tipo de mapa atual
- estado atual da execução
- existência de dados suficientes

## 3.4. Não coletar o que não está sendo usado
Sempre que possível:
- não montar summaries escondidos
- não medir métricas de perf quando o painel correspondente estiver fechado
- não manter coleta granular se overlay/inspector/replay estiverem desligados

## 3.5. Preservar a base experimental
A simplificação não deve matar:
- benchmark reproduzível
- replay quando explicitamente habilitado
- inspeção detalhada quando desejada
- comparações A/B
- diagnósticos úteis para evolução futura

---

# 4. Categorização da UI

## 4.1. Deve ficar visível por padrão

### Controles principais
- scenario preset
- play / pause
- reset
- speed
- simulation mode (se continuar simples o bastante)

### Informação principal
- viewport da simulação
- resumo curto contendo apenas:
  - tick
  - status
  - active vehicles
  - score ou throughput
  - regras ativas

### Interações compactas aceitáveis no modo padrão
- overlay como controle compacto
- inspector contextual somente quando houver célula/veículo selecionado

---

## 4.2. Deve ir para “Advanced”

### Configuração avançada de mapa
- map generator
- procedural width
- procedural height
- road density
- signal rate
- import scenario JSON

### Regras avançadas
- freeRightOnRed
- fourWayStop
- doNotBlockIntersection

### Benchmark avançado
- benchmark duration
- spawn rate

---

## 4.3. Deve ir para “Replay”
- replay toggle
- play replay
- replay frame slider

Replay não deve disputar espaço com o fluxo principal.

---

## 4.4. Deve ir para “Diagnostics”
- status App / Renderer / Engine
- live metrics completas
- traffic lights summary
- recent events
- cell inspector detalhado

Essa área é útil, mas é claramente modo ferramenta.

---

## 4.5. Deve ir para “Benchmark Lab”
- benchmark history
- compare A / compare B
- benchmark compare

Essa área pertence mais a laboratório/avaliação do que ao uso padrão.

---

## 4.6. Deve sair da tela principal
- lista com paths internos (`legacy/`, `js/core/`, `js/app/render/`)

Isso é ruído para usuário e documentação de dev disfarçada de UI.

---

# 5. Regras de exibição condicional

## 5.1. Por modo de simulação

### Sandbox
Esconder:
- benchmark duration
- spawn rate
- benchmark compare detalhado por padrão

### Benchmark
Mostrar:
- duration
- spawn rate
- score/throughput com mais destaque
- histórico/comparação dentro do Benchmark Lab

---

## 5.2. Por modo de mapa

### Fixed map
Esconder:
- procedural width
- procedural height
- density
- signal rate

### Procedural map
Mostrar esses controles dentro de Advanced.

---

## 5.3. Por estado de replay

### Replay desligado
Esconder:
- play replay
- replay frame slider

### Replay ligado
Mostrar controles específicos do replay.

---

## 5.4. Por disponibilidade de dados

### Sem snapshots suficientes
Esconder ou desabilitar:
- compare A / compare B
- benchmark compare

### Sem seleção ativa
Esconder ou colapsar:
- cell inspector

### Overlay desligado
Não mostrar detalhes relacionados a overlay.

---

# 6. Coleta e trabalho que podem ser reduzidos

## 6.1. Performance tracker
Hoje mede sempre:
- tick
- render
- diagnostics

### Direção
Coletar isso apenas quando:
- Diagnostics estiver aberto, ou
- Benchmark Lab/perf mode precisar desses dados

### Observação
É um overhead pequeno, mas contínuo.

---

## 6.2. Summaries diagnósticos
Hoje a app ainda monta:
- live metrics
- light summary
- recent events
- cell inspection lines

### Direção
Se o painel Diagnostics estiver fechado:
- não montar live metrics detalhadas
- não montar light summary
- não montar recent events
- não montar inspection detalhada

---

## 6.3. Overlay snapshot
A situação já está razoável porque o snapshot só é relevante quando overlay está ativo.

### Direção
Manter esse comportamento e evitar qualquer expansão desnecessária fora do modo overlay.

---

## 6.4. Replay capture
Hoje replay é gravado automaticamente.

### Direção
Adicionar opção explícita para replay, por exemplo:
- `Record replay`

Ou então:
- benchmark grava replay por padrão
- sandbox grava replay só quando habilitado

### Benefício
Redução de custo de memória e parte do custo de serialização.

### Tradeoff
Sem gravação prévia, não existe replay retroativo.

---

## 6.5. Cell-level metrics
Hoje `cellStatsByKey` alimenta overlay e inspector.

### Direção
Avaliar coleta condicional quando:
- overlay estiver desligado, e
- inspector detalhado estiver fechado

### Cuidado
Não misturar isso com métricas que o benchmark realmente precisa para score/relatório.

---

# 7. O que não deve ser desligado facilmente

## 7.1. Eventos do mundo
`world.events` também alimenta comportamento visual e animação.
Desligar isso quebraria mais do que só diagnóstico.

## 7.2. Índice de ocupação por tick
Isso faz parte da lógica quente da engine, não de observabilidade.

## 7.3. Report/score de benchmark
Isso continua sendo parte do produto e da comparabilidade.

---

# 8. Proposta de experiência final

## 8.1. Modo padrão
Exibir:
- scenario
- mode
- speed
- play / pause
- reset
- overlay compacto
- viewport
- resumo curto
- inspector contextual apenas quando houver seleção

## 8.2. Modo laboratório
Agrupar em painéis/botões:
- Advanced
- Replay
- Diagnostics
- Benchmark Lab

A grande mudança é separar claramente:
- uso normal
- exploração avançada
- análise técnica

---

# 9. Plano de execução por sprint

## Sprint 38 — limpeza estrutural da UI principal

**Status:** concluído

### Entrega
- [x] remover a lista de paths internos da tela
- [x] reorganizar a área principal para destacar só fluxo principal
- [x] reduzir o resumo lateral para versão curta/default
- [x] manter apenas os controles essenciais visíveis por padrão

### Inclui
- [x] cenário
- [x] modo
- [x] velocidade
- [x] play/pause/reset
- [x] overlay compacto
- [x] resumo curto do estado

### Resultado esperado
A tela deixa de parecer painel de debug e passa a parecer simulador utilizável.

---

## Sprint 39 — painéis colapsáveis para Advanced / Replay / Diagnostics / Benchmark Lab

**Status:** concluído

### Entrega
- [x] criar seções escondidas/colapsáveis
- [x] mover controles e blocos informacionais para os painéis corretos

### Distribuição esperada
- [x] Advanced: procedural/import/regras/benchmark tuning
- [x] Replay: replay toggle + play + slider
- [x] Diagnostics: status técnico + métricas + luzes + eventos + inspector detalhado
- [x] Benchmark Lab: histórico + comparação

### Resultado esperado
Capacidade avançada preservada, ruído visual bem menor.

---

## Sprint 40 — exibição contextual por modo e estado

**Status:** concluído

### Entrega
- [x] esconder controles de benchmark em sandbox
- [x] esconder controles procedurais fora de mapMode procedural
- [x] esconder replay controls quando replay estiver desligado
- [x] esconder compare quando não houver snapshots suficientes
- [x] esconder inspector quando não houver seleção

### Resultado esperado
A UI para de mostrar controles irrelevantes no contexto errado.

---

## Sprint 41 — gating de diagnóstico e performance tracker

**Status:** concluído

### Entrega
- [x] só medir perf detalhada quando Diagnostics ou Benchmark Lab exigirem
- [x] parar de montar summaries diagnósticos quando a seção estiver fechada
- [x] manter apenas resumo curto sempre ativo

### Inclui
- [x] gating de `performanceTracker.measure(...)`
- [x] gating de `buildLiveMetrics(...)`
- [x] gating de `buildLightPhaseSummary(...)`
- [x] gating de `buildRecentEventSummary(...)`
- [x] gating de inspection detalhada

### Resultado esperado
Menos trabalho por frame/tick quando a UI está em modo normal.

---

## Sprint 42 — replay opcional e redução de custo de observabilidade granular

**Status:** concluído

### Entrega
- [x] tornar replay capture configurável
- [ ] avaliar coleta condicional de métricas por célula quando overlay/inspector estiverem desligados

### Inclui
- [x] opção explícita de replay
- [x] benchmark vs sandbox com políticas diferentes de replay
- [ ] coleta granular dependente de necessidade real

### Resultado esperado
Menos uso de memória e menos serialização desnecessária.

---

## Sprint 43 — polimento final de UX e validação

### Entrega
- revisar nomenclatura dos painéis
- ajustar hierarquia visual
- revisar defaults
- garantir que benchmark lab e diagnostics ainda sejam úteis
- revisar testes de UI/comportamento

### Resultado esperado
Experiência final mais limpa, previsível e com menos atrito.

---

# 10. Critérios de aceite gerais

Cada sprint deve:
- adicionar ou ajustar testes
- rodar a suíte completa
- atualizar `PLAN.md`
- atualizar `BACKLOG.md`
- fazer commit e push

A simplificação só é considerada boa se:
- a tela inicial ficar claramente mais limpa
- os recursos avançados continuarem acessíveis
- o comportamento contextual ficar coerente
- o custo de observabilidade cair quando painéis estiverem fechados
- benchmark e replay continuarem utilizáveis quando explicitamente habilitados
