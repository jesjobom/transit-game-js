# BACKLOG.md — V2

Backlog técnico reorganizado do **transit-game-js**.

Este arquivo foi limpo para refletir apenas o que **ainda falta fazer** depois do fechamento da versão atual como **V1**.
Tudo que já foi entregue, substituído ou perdeu sentido com a arquitetura nova saiu da lista de trabalho pendente.

---

## Status atual do projeto

### V1 fechada
A versão atual do projeto fica oficialmente fechada como **V1**.

### Baseline validado da V1
- **Versão visível da app:** `Sprint 44`
- **Build tag:** `s44-traffic-ux-tuning`
- **Último estado validado:** `76/76` testes passando

### Sprints de performance já concluídas e publicadas
- **Sprint 32** — instrumentação de performance para tick/render/diagnostics
- **Sprint 33** — cache do mapa/base estática
- **Sprint 34** — layer de veículos com atualização incremental
- **Sprint 35** — throttle de overlays + summaries + replay
- **Sprint 36** — índice de ocupação por tick
- **Sprint 37** — benchmark render-light

### Sprints de simplificação já concluídas e publicadas
- **Sprint 38** — limpeza estrutural da UI principal, remoção de ruído dev e resumo lateral curto por padrão
- **Sprint 39** — painéis colapsáveis para Advanced, Replay, Diagnostics e Benchmark Lab
- **Sprint 40** — visibilidade contextual por modo, replay, comparação e inspeção
- **Sprint 41** — diagnostics/perf detalhada só quando painéis relevantes estão abertos
- **Sprint 42** — replay opcional com política padrão diferente entre benchmark e sandbox
- **Sprint 43** — polish final de UX com painéis auto-contextuais e labels mais claras
- **Sprint 44** — curvas alinhadas, spawn stress ampliado, semáforos configuráveis mais lentos e limpeza final da área abaixo do mapa

### Manutenção recente validada
- correção para invalidar/recalcular `world.report` a cada avanço real de tick, evitando métricas live congeladas
- renderer incremental agora evita reescrever o grid quando só a animação dos veículos mudou e o estado dinâmico das células permaneceu igual
- controles principais agora aparecem primeiro e a lateral padrão foi reduzida para um resumo curto
- a UI agora esconde blocos irrelevantes conforme modo, tipo de mapa, estado de replay, histórico disponível e seleção ativa
- a montagem de diagnostics detalhados e a medição de custo desse bloco agora só acontecem quando Diagnostics ou Benchmark Lab estão realmente em uso
- replay deixou de ser obrigatório: benchmark começa com gravação ligada, sandbox reseta com gravação desligada e a captura pode ser desabilitada explicitamente
- os painéis agora explicam melhor seu propósito e abrem automaticamente em fluxos em que o usuário claramente precisa deles
- a animação de curva agora usa uma trajetória contínua melhor alinhada com os pontos reais de entrada/saída, evitando o micro recuo e o salto no fim da conversão
- benchmark agora aceita spawn rate acima de 1 com múltiplas tentativas por tick, o que permite estressar de verdade mapas maiores
- o resumo redundante abaixo do mapa saiu da viewport principal
- semáforos passaram a usar uma duração padrão mais lenta e a UI ganhou controle direto de duração de fase
- os controles relevantes agora têm tooltips explicando efeito e uso

### O que a V1 já entrega
A V1 já tem base técnica suficiente para deixar de ser um protótipo frágil e virar um simulador inicial consistente.

#### Fundação de engine
- engine central baseada em ticks
- estado global serializável
- RNG determinístico com seed fixa
- benchmark reproduzível com duração e spawn configuráveis
- separação real entre core da simulação e renderização/UI

#### Mundo e mapa
- mapa bootstrap maior e menos simétrico
- semântica explícita de direção nas vias
- suporte base a pista bidirecional com ocupação por faixa/direção
- vias principais do mapa bootstrap já usando múltiplas faixas variáveis por direção
- suporte técnico a mapa customizado em memória

#### Simulação e tráfego
- spawn determinístico em benchmark
- decisões básicas de rota em interseções
- semáforos com fases e bloqueio por direção
- motivos explícitos de bloqueio (`red-light`, `lane-occupied`, `invalid-direction`, etc.)

#### Métricas e diagnósticos
- métricas ao vivo
- score inicial
- resumo de benchmark
- histórico persistido de benchmarks
- comparação A/B básica de benchmarks
- fairness entre fluxos/direções no benchmark
- overlays básicos no grid para congestionamento/fluxo/pressão de deadlock
- inspeção de célula/cruzamento por clique
- replay com timeline e play/pause
- resumo de fases de semáforo
- eventos recentes da simulação

#### UX e visual
- play / pause / reset
- avanço manual de `+1 Tick`
- controle de velocidade por slider
- animação contínua baseada em `requestAnimationFrame`
- curvas melhores que o slide diagonal antigo, agora com alinhamento melhor no início/fim da conversão
- posicionamento visual por faixa/direção melhorado
- semáforos visualmente mais legíveis
- badge de versão para ajudar contra cache velho
- mapa/cidade visualmente mais polidos

---

## Critério de limpeza deste backlog

Um item só continua aqui se estiver realmente pendente.

### Foi considerado **concluído** quando há evidência no estado atual do projeto, por exemplo:
- código implementado
- UI existente
- testes cobrindo o comportamento
- commit recente deixando a entrega clara

### Foi considerado **pendente** quando:
- existe só estrutura/base, mas não a feature completa
- existe campo/configuração, mas sem comportamento real exposto
- existe comportamento parcial, mas não a capacidade prometida
- não há evidência suficiente no código/UI/testes atuais

---

## Prioridades da V2

### P0 — mais importante
Coisas que aumentam comparabilidade, controle experimental e capacidade de evolução sem bagunçar a base.

### P1 — importante
Coisas que melhoram a fidelidade da simulação e a leitura dos resultados.

### P2 — depois da base de V2 estar estável
Coisas de profundidade, laboratório avançado e polimento de produto.

---

# BACKLOG V2

## P0 — Controle experimental, comparabilidade e cenários

### 1. Regras configuráveis de verdade na UI
**Prioridade:** P0

**Melhoria**
Implementar e expor na interface regras opcionais que hoje só existem como ideia ou como estrutura incompleta.

**Inclui**
- [x] painel de regras ativas
- [x] toggle para `freeRightOnRed`
- [x] toggle para `fourWayStop`
- [x] toggle para `doNotBlockIntersection`
- [x] regras adicionais realmente aplicadas pela engine, não só salvas em config

**Por que importa**
Hoje a app já tem sementes, benchmark e score, mas ainda não tem um bom jeito de comparar conjuntos de regras. Sem isso, o simulador ainda é mais “demo técnica” do que “laboratório de trânsito”.

**Status após Sprint 21**
Concluído no estado atual: a UI já expõe os toggles, o resumo mostra o modo/regras ativas e a engine agora aplica `freeRightOnRed`, `fourWayStop` e `doNotBlockIntersection`, com testes cobrindo os três comportamentos.

---

### 2. Separar claramente modo Benchmark e modo Sandbox
**Prioridade:** P0

**Melhoria**
Criar dois modos de uso explícitos:
- **Benchmark:** execução padronizada, reproduzível e comparável
- **Sandbox:** exploração manual, sem compromisso com comparabilidade estrita

**Inclui**
- [x] seletor de modo na UI
- [x] parâmetros visíveis do benchmark
- [x] comportamento de reset coerente por modo
- [x] resumo final mais claro quando uma execução de benchmark termina

**Por que importa**
Hoje o projeto já roda benchmark internamente, mas a experiência de uso ainda mistura bastante “simulação para ver” com “simulação para medir”. Separar isso melhora muito a clareza do produto.

**Status após Sprint 21**
Concluído no estado atual: a interface permite alternar entre Benchmark e Sandbox, ajustar duração/spawn do benchmark e resetar cada modo de forma coerente.

---

### 3. Salvar histórico e comparação A/B de benchmarks
**Prioridade:** P0

**Melhoria**
Permitir guardar resultados de execuções e comparar duas configurações lado a lado.

**Inclui**
- [x] salvar snapshots de benchmark
- [x] comparação A/B entre duas execuções
- [x] exibição das diferenças principais de score e métricas
- [x] identificação clara da seed, mapSeed e regras usadas em cada execução

**Por que importa**
Sem histórico, cada benchmark morre na tela. Isso limita bastante o valor experimental do simulador.

**Status após Sprint 25**
Concluído no estado atual: benchmarks finalizados agora ficam persistidos em histórico local, a UI lista execuções recentes com cenário/score/seed/mapSeed e a app permite comparação A/B básica com deltas de score, throughput, filas, viagens completas e deadlocks.

---

### 4. Sistema de cenários e presets
**Prioridade:** P0

**Melhoria**
Transformar o mapa/configuração atuais em um sistema de cenários reutilizáveis.

**Inclui**
- [x] presets nomeados de cenário
- [x] presets de configuração de tráfego
- [x] presets combinando mapa + semáforos + benchmark + regras
- [x] pequenos cenários de validação/tutorial
- [x] cenários de gargalo, fluxo leve e horário de pico

**Por que importa**
Sem cenários reutilizáveis, fica difícil repetir testes úteis e demonstrar o simulador de forma organizada.

**Status após Sprint 22**
Concluído no estado atual: a UI agora expõe presets nomeados, inclusive cenários pequenos de validação/tutorial e um cenário de gargalo, cada um combinando mapa, luzes, benchmark e regras-base.

---

### 5. Carregar mapas externos e formalizar entrada de cenários
**Prioridade:** P0

**Melhoria**
Permitir que mapas e cenários deixem de ser definidos só no código-fonte.

**Inclui**
- [x] carregar mapa a partir de arquivo/dado externo
- [x] formato documentado de mapa/cenário
- [x] importar mapa personalizado
- [x] validar mapa/cenário carregado antes de rodar

**Por que importa**
Essa é a ponte entre “app com mapa hardcoded” e “simulador de verdade”. Também prepara terreno para presets, editor e benchmarks mais variados.

**Status após Sprint 23**
Concluído no estado atual: a app já importa cenários em JSON por arquivo, valida a estrutura antes de aplicar e o repositório agora documenta o formato com exemplo real.

---

### 6. Geração procedural de mapas realmente implementada
**Prioridade:** P0

**Melhoria**
Implementar geração procedural de mapas com parâmetros controláveis e resultado reproduzível por seed.

**Inclui**
- [x] gerar mapa procedural a partir de `mapSeed`
- [x] parâmetros como densidade, tamanho, quantidade de cruzamentos e semáforos
- [x] reproduzir exatamente o mesmo mapa com mesma `mapSeed`
- [x] permitir benchmark sobre mapa procedural reproduzível

**Por que importa**
A arquitetura já foi pensada para isso. Falta virar capacidade real.

**Status após Sprint 29**
Concluído no estado atual: a app agora alterna entre mapa fixo e gerador procedural, aceita parâmetros de largura, altura, densidade e taxa de semáforos, reproduz exatamente o layout pela `mapSeed` e mantém benchmark compatível com esse modo.

---

## P1 — Qualidade da simulação e leitura dos resultados

### 7. Detectar deadlocks de verdade
**Prioridade:** P1

**Melhoria**
Criar detecção explícita de travamentos da malha, em vez de só manter o contador disponível no modelo.

**Inclui**
- [x] definição objetiva do que conta como deadlock
- [x] incremento real da métrica de deadlock
- [x] distinção entre fila normal e travamento estrutural
- [x] impacto claro no score/relatório

**Por que importa**
Sem isso, o benchmark ainda pode parecer saudável mesmo quando a rede entrou num estado ruim.

**Status após Sprint 24**
Concluído no estado atual: a engine detecta travamento após múltiplos ticks totalmente bloqueados, registra eventos de deadlock e projeta isso no score/relatório.

---

### 8. Completar o conjunto mínimo de métricas de fluxo
**Prioridade:** P1

**Melhoria**
Fechar as métricas mais importantes para analisar eficiência e fluidez com mais confiança.

**Inclui**
- [x] tempo médio parado
- [x] velocidade média efetiva
- [x] throughput por cruzamento
- [x] tamanho médio de fila
- [x] ocupação média das vias
- [x] variância do tempo de viagem
- [x] fairness entre direções/fluxos

**Por que importa**
Hoje já existe uma base boa, mas ainda faltam métricas que ajudam a distinguir “parece rápido” de “está realmente eficiente”.

**Status após Sprint 26**
Concluído no estado atual: o benchmark agora acompanha fairness entre fluxos de origem por direção, expõe score de fairness no relatório/UI, detalha taxas por direção e penaliza cenários que favorecem demais um fluxo enquanto deixam outro morrer na fila.

---

### 9. Ferramentas visuais de análise e debug no grid
**Prioridade:** P1

**Melhoria**
Levar os diagnósticos além da sidebar textual e mostrar informação útil diretamente no mapa.

**Inclui**
- [x] heatmap de congestionamento
- [x] fluxo médio por via
- [x] destacar pontos de deadlock
- [x] inspeção de célula/cruzamento
- [x] estado interno de veículo selecionado
- [x] intenção atual do veículo (seguir, virar, parar, aguardar)
- [x] trilha curta/histórico visual de movimento

**Por que importa**
Hoje os diagnósticos ajudam, mas ainda exigem leitura indireta. Overlay visual acelera muito depuração e entendimento do comportamento emergente.

**Status após Sprint 30**
Concluído no estado atual: a app agora mostra overlays no grid para congestionamento, fluxo e pressão de deadlock, inspector por clique com métricas da célula e inspeção de veículo selecionado com intenção atual e trilha curta de movimento.

---

### 10. Replay real da simulação
**Prioridade:** P1

**Melhoria**
Adicionar replay navegável, separado da animação ao vivo.

**Inclui**
- [x] gravar sequência suficiente de estados/eventos
- [x] timeline navegável
- [x] play/pause do replay
- [x] voltar/avançar em pontos da execução já concluída

**Por que importa**
A animação contínua atual melhorou muito a leitura, mas replay é outra coisa: ele serve para análise, comparação e depuração.

**Status após Sprint 28**
Concluído no estado atual: a simulação agora grava frames serializáveis, expõe um modo replay separado do loop ao vivo, permite scrub por timeline e reproduz os frames capturados com play/pause para análise posterior.

---

### 11. Melhorar o modelo de movimento, topologia viária e comportamento de faixa
**Prioridade:** P1

**Melhoria**
Aprofundar a credibilidade do movimento e da modelagem das vias sem sacrificar o determinismo lógico.

**Inclui**
- [ ] suporte explícito a múltiplas faixas por sentido
- [ ] coexistência clara de ruas de mão dupla e mão única no mesmo mapa
- [ ] perfil de aceleração/desaceleração mais rico
- [ ] curvas ainda mais geométricas e centradas por faixa
- [ ] distância mínima de segurança entre carros
- [ ] mudança de faixa
- [ ] faixa exclusiva de conversão
- [ ] limite de velocidade por trecho

**Por que importa**
A V1 já deixou de parecer travada, mas ainda há bastante espaço entre “animação boa” e “modelo de tráfego convincente”. Além disso, o salto de complexidade do mapa depende de a estrutura viária suportar bem combinações mais realistas.

**Status após Sprint 31**
Parcialmente concluído no estado atual: o mapa bootstrap e o modelo base agora suportam quantidade variável de faixas por direção em vias específicas, incluindo transição entre trechos com contagem diferente de faixas e remapeamento/merge implícito de veículos no avanço. Ainda ficam pendentes mudança de faixa deliberada, faixas exclusivas, limites por trecho, headway mais rico e mistura mais sofisticada de topologias.

---

### 12. Evoluir as regras de tráfego, controles de interseção e roteamento
**Prioridade:** P1

**Melhoria**
Expandir as decisões da engine para lidar com casos mais ricos que a malha atual.

**Inclui**
- [ ] prioridade para quem já está no cruzamento
- [ ] avanço no amarelo configurável
- [ ] prioridade de via principal / rua preferencial
- [ ] placas de pare (`stop`) por aproximação ou cruzamento
- [ ] semáforos de 3 lados / interseções em T
- [ ] proibição de conversão à esquerda por trecho
- [ ] retorno (`U-turn`) quando permitido pela geometria/regra
- [ ] rotatórias
- [ ] heurística de roteamento melhor que a escolha local básica

**Por que importa**
Esse é o passo natural depois de estabilizar a base: menos comportamento “arcade”, mais comportamento de trânsito propriamente dito.

**Verificação de pendência**
A engine atual faz escolha básica ponderada em interseções e respeita direção/semáforo, mas ainda não mostra esse conjunto mais rico de regras e controles de interseção.

---

## P2 — Expansão de laboratório e profundidade de produto

### 13. Batch benchmark com múltiplas seeds
**Prioridade:** P2

**Melhoria**
Rodar o mesmo experimento em várias seeds para reduzir conclusões frágeis baseadas em um caso só.

**Inclui**
- [ ] lote de execuções automáticas
- [ ] média, desvio e melhor/pior caso
- [ ] agregação por preset/configuração

**Por que importa**
Uma única seed é ótima para depuração e comparação justa, mas é limitada para conclusões mais sérias.

**Verificação de pendência**
Hoje o benchmark é unitário por execução.

---

### 14. Editor visual de mapas
**Prioridade:** P2

**Melhoria**
Criar ferramenta para montar e ajustar mapas sem editar código manualmente.

**Inclui**
- [ ] criar/editar ruas e cruzamentos
- [ ] configurar spawn points
- [ ] configurar semáforos
- [ ] salvar/exportar o resultado

**Por que importa**
Depois que mapas externos existirem, um editor visual vira o caminho mais útil para escalar cenários.

**Verificação de pendência**
Não existe editor no estado atual.

---

### 15. Importação/exportação de mapas e configurações
**Prioridade:** P2

**Melhoria**
Permitir que cenários e experimentos possam ser compartilhados e reaproveitados.

**Inclui**
- [ ] exportar mapa
- [ ] exportar configuração de experimento
- [ ] importar mapa/configuração
- [ ] formato estável para troca entre execuções

**Por que importa**
Isso transforma o projeto em ferramenta reutilizável, não só em demo local.

**Verificação de pendência**
Não há fluxo de import/export na V1.

---

### 16. Comparações visuais lado a lado
**Prioridade:** P2

**Melhoria**
Mostrar duas execuções ou dois presets em paralelo.

**Inclui**
- [ ] comparação lado a lado de cenários
- [ ] comparação lado a lado de presets
- [ ] diferenças visuais e métricas sincronizadas

**Por que importa**
Ajuda muito quando a meta deixa de ser “rodar” e passa a ser “entender qual opção é melhor”.

**Verificação de pendência**
Não existe UI de comparação paralela.

---

### 17. Agentes e eventos mais ricos no mundo
**Prioridade:** P2

**Melhoria**
Adicionar entidades e perturbações que deixem a simulação mais diversa.

**Inclui**
- [ ] pedestres
- [ ] faixas de pedestre
- [ ] veículos especiais com prioridade
- [ ] acidentes aleatórios
- [ ] obstruções temporárias / veículo quebrado
- [ ] clima ou condições externas afetando fluxo

**Por que importa**
Isso aumenta o realismo e a variedade, mas seria desperdício fazer antes da base experimental estar mais madura.

**Verificação de pendência**
Não há evidência dessas entidades/eventos no modelo atual.

---

### 18. Semáforos adaptativos e perfis comportamentais
**Prioridade:** P2

**Melhoria**
Levar o simulador para cenários mais estratégicos e menos estáticos.

**Inclui**
- [ ] semáforos adaptativos baseados em fluxo
- [ ] perfis de motorista
- [ ] comportamento por tipo de veículo
- [ ] tempo de reação

**Por que importa**
Isso abre espaço para experimentação mais interessante, mas depende das camadas anteriores estarem sólidas.

**Verificação de pendência**
Os semáforos atuais operam em fases fixas, e os veículos ainda não têm perfis comportamentais distintos.

---

## Roadmap sugerido da V2

### Fase A — transformar em laboratório utilizável
1. Regras configuráveis na UI
2. Separar benchmark e sandbox
3. Histórico de benchmarks + comparação A/B
4. Presets e cenários nomeados

### Fase B — abrir o simulador para mais mapas
5. Entrada formal de mapas/cenários
6. Geração procedural por seed
7. Cenários pequenos, gargalos e horários de pico

### Fase C — melhorar análise
8. Deadlock detection real
9. Métricas de fluxo mais completas
10. Overlays visuais e inspeção no grid
11. Replay navegável

### Fase D — subir o realismo
12. Movimento/faixa/topologia viária mais ricos
13. Regras de trânsito e controles de interseção mais sofisticados
14. Roteamento melhor

### Fase E — virar ferramenta mais completa
15. Batch benchmarks
16. Editor visual
17. Import/export
18. Comparação lado a lado
19. Entidades/eventos ricos
20. Semáforos adaptativos e perfis

---

## Épicos sugeridos para expansão do mapa e das regras viárias

Esses épicos refinam principalmente os itens **11** e **12** do backlog.
A ideia é evitar misturar topologia, regra de prioridade e comportamento avançado tudo de uma vez.

### Épico 1 — Topologia viária e geometria-base
**Objetivo**
Dar ao modelo de mapa capacidade real para representar ruas mais próximas do mundo real, antes de sofisticar demais as regras.

**Inclui**
- [ ] múltiplas faixas por sentido
- [ ] ruas de mão única e mão dupla convivendo no mesmo cenário
- [ ] faixas com papel explícito quando necessário (reta, conversão, compartilhada)
- [ ] retorno (`U-turn`) modelado na geometria base quando permitido
- [ ] validação estrutural para evitar mapas inconsistentes

**Dependências**
- base atual de direção por via
- evolução do formato de mapa/cenário

**Risco principal**
Se isso ficar mal modelado, todo o resto vira remendo.

**Sugestão de entrega incremental**
- Sprint 1: múltiplas faixas por sentido + mistura clara de mão única/mão dupla
- Sprint 2: faixas especiais e suporte inicial a retorno

---

### Épico 2 — Regras locais de prioridade em cruzamentos
**Objetivo**
Introduzir regras de interseção simples, mas fundamentais, antes de partir para estruturas mais especiais.

**Inclui**
- [ ] placa de pare por aproximação
- [ ] rua preferencial / via principal
- [ ] prioridade para quem já entrou no cruzamento
- [ ] regra explícita de cessão de passagem quando aplicável
- [ ] eventos/motivos de bloqueio explicando a prioridade aplicada

**Dependências**
- Épico 1 suficientemente estável
- engine com resolução determinística de conflitos

**Risco principal**
Criar regras ambíguas ou invisíveis, difíceis de depurar.

**Sugestão de entrega incremental**
- Sprint 3: `stop` + via preferencial
- Sprint 4: refinamento de prioridade e instrumentação de debug

---

### Épico 3 — Controles de interseção especiais
**Objetivo**
Suportar cruzamentos que exigem modelagem própria, em vez de tratar tudo como cruzamento padrão com exceções.

**Inclui**
- [ ] semáforo de 3 lados para interseções em T
- [ ] rotatórias com regras próprias de entrada, circulação e saída
- [ ] fases/configuração específicas por tipo de interseção
- [ ] representação visual coerente desses controles no mapa

**Dependências**
- Épico 2 funcional
- formato de cenário capaz de descrever tipos de interseção

**Risco principal**
Querer reutilizar uma abstração genérica demais e acabar quebrando casos especiais.

**Sugestão de entrega incremental**
- Sprint 5: semáforo de 3 lados / T-junctions
- Sprint 6: rotatórias

---

### Épico 4 — Comportamento avançado de faixa e decisão
**Objetivo**
Fazer os veículos usarem a malha enriquecida de forma convincente, não só compatível no papel.

**Inclui**
- [ ] escolha de faixa com base na intenção de trajeto
- [ ] mudança de faixa
- [ ] preparação para conversão antes do cruzamento
- [ ] respeito a proibições/restrições por faixa ou trecho
- [ ] uso de retorno e rotatória no roteamento

**Dependências**
- Épicos 1 a 3 em estado utilizável
- melhoria da heurística de roteamento

**Risco principal**
Adicionar opções de mapa sem inteligência suficiente para os veículos aproveitarem isso.

**Sugestão de entrega incremental**
- Sprint 7: escolha/preparação de faixa
- Sprint 8: mudança de faixa + integração com roteamento

---

## Sequência sugerida de sprints para esse pacote

### Sprint 1 — Fundamentos de topologia viária
- múltiplas faixas por sentido
- formalização melhor de mão única vs mão dupla
- ajustes mínimos de render e validação

### Sprint 2 — Faixas especiais e retorno
- faixas exclusivas/compartilhadas
- retorno (`U-turn`) permitido por geometria/regra
- pequenos cenários de teste focados nisso

### Sprint 3 — Cruzamentos com prioridade simples
- placa de pare
- rua preferencial
- prioridade para quem já está no cruzamento

### Sprint 4 — Debug e consistência de prioridade
- motivos explícitos de bloqueio/prioridade
- cenários de validação para conflitos de passagem
- ajustes finos da resolução determinística

### Sprint 5 — Interseções em T com semáforo de 3 lados
- modelo de interseção em T
- fases do semáforo compatíveis
- representação visual mínima confiável

### Sprint 6 — Rotatórias
- entrada/espera/circulação/saída
- prioridade na rotatória
- benchmark/cenários específicos para rotatória

### Sprint 7 — Escolha de faixa por intenção
- veículo se posicionando para seguir/virar/retornar
- integração inicial com roteamento local

### Sprint 8 — Mudança de faixa e roteamento mais inteligente
- lane change
- decisão melhor em mapas mais complexos
- consolidação dos cenários ricos

---

## Princípios para não bagunçar a V2

- Não misturar feature visual grande com mudança estrutural grande no mesmo passo.
- Não chamar algo de benchmark sério sem guardar seed, mapSeed, regras e configuração.
- Não adicionar muito realismo novo antes de fechar deadlock detection e métricas melhores.
- Não criar editor/polimento de produto antes de existir um formato de cenário decente.
- Quando houver dúvida entre “mais bonito” e “mais comparável”, priorizar comparabilidade primeiro.

---

## Fora do backlog por já estarem resolvidos na V1

Esses temas não devem voltar como pendência genérica, porque já foram entregues em nível útil:
- engine central por tick
- separação entre core e renderização
- seed fixa e determinismo básico
- estado serializável
- testes automatizados ativos
- score inicial
- painel de métricas ao vivo
- renderização de mapa e veículos
- controle de play/pause/reset/+1 tick
- controle de velocidade
- movimento contínuo inicial
- curvas melhores que o protótipo antigo
- vias com direção explícita
- ocupação por faixa em via bidirecional
- versão visível na UI
- diagnósticos básicos e motivos de bloqueio
