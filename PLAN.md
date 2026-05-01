# PLAN.md

Plano de melhoria de performance do **transit-game-js**.

## Status de execução

- [x] Sprint 32 — instrumentação de performance
- [x] Sprint 33 — cache do mapa/base estática
- [ ] Sprint 34 — layer de veículos com atualização incremental
- [ ] Sprint 35 — throttle de overlays + summaries + replay
- [ ] Sprint 36 — índice de ocupação por tick
- [ ] Sprint 37 — benchmark render-light

Este arquivo substitui o plano antigo.
Agora o projeto já tem engine por ticks, replay, benchmark, geração procedural e suporte inicial a múltiplas faixas. O problema deixou de ser “como sair do protótipo” e passou a ser “como escalar sem a UI ficar pesada nem a simulação perder consistência”.

---

# 1. Objetivo deste plano

Melhorar a performance percebida e a performance real da simulação sem destruir:
- determinismo do benchmark
- clareza da arquitetura atual
- capacidade de debug
- facilidade de continuar evoluindo regras, mapa e UX

Em termos práticos, queremos:
- reduzir sensação de travamento quando a simulação roda
- manter o mapa fluido mesmo com mais veículos e mais interseções
- evitar picos de CPU e GC
- preparar terreno para mapas maiores e comportamento mais rico de faixas
- separar melhor custo de simulação vs custo de renderização

---

# 2. Leitura honesta do problema atual

A app já está muito melhor que no começo, mas a sensação de peso ainda aparece porque vários custos se acumulam.

## 2.1. O renderer ainda faz trabalho demais por frame
Hoje a renderização ainda reconstrói bastante HTML e recalcula muita coisa visual a cada atualização.

Isso pesa porque:
- grid inteiro é reemitido com frequência
- veículos, overlays, luzes e decoração urbana convivem no mesmo fluxo de render
- mapas maiores amplificam custo de DOM e layout

## 2.2. O DOM continua sendo um gargalo provável
Mesmo com código organizado, DOM grande + atualização frequente + estilos detalhados ainda custa caro.

Sinais típicos:
- sensação de atraso enquanto carros se movem
- quedas de FPS quando há muitos veículos/eventos
- stutter pior em mapas mais largos ou com zoom reduzido

## 2.3. A simulação e a renderização ainda disputam o mesmo orçamento de tempo
Mesmo usando `requestAnimationFrame`, tudo ainda acontece no mesmo thread principal.

Então qualquer combinação destas coisas se soma:
- tick da engine
- cálculo de debug/métricas
- geração do HTML
- layout/repaint do browser
- eventos da UI

## 2.4. Há trabalho repetido em hot paths
Toda simulação desse tipo tende a sofrer com pequenas ineficiências repetidas milhares de vezes:
- buscas lineares por veículos
- resolução de ocupação por `.find()` / `.some()`
- leitura repetida de estrutura de mapa
- recomputação de metadados que poderiam ser pré-calculados

## 2.5. Debug e visual rico têm custo real
A app hoje já entrega várias coisas úteis:
- inspector
- replay
- overlays
- histórico
- eventos recentes
- trilha de veículo
- múltiplas faixas

Tudo isso é bom, mas também adiciona custo. Se não houver orçamento explícito para observabilidade, o debug come performance silenciosamente.

---

# 3. Princípios para otimizar sem bagunçar o projeto

## 3.1. Otimizar com medição, não no escuro
Nada de “acho que isso aqui pesa”.
Cada etapa deve ser guiada por medição.

## 3.2. Priorizar gargalos estruturais antes de micro-otimizações
Trocar um loop por outro quase nunca salva um renderer pesado.
Primeiro atacar:
- renderização
- arquitetura de atualização
- estrutura de dados quentes
- separação de responsabilidades

## 3.3. Preservar determinismo do benchmark
Qualquer otimização que mude ordem lógica, resolução de conflito ou uso do RNG precisa ser tratada com muito cuidado.

## 3.4. Melhorar performance sem apagar capacidade de debug
O ideal não é “tirar informação”; é:
- atualizar menos vezes
- agregar melhor
- tornar observabilidade opcional quando necessário

## 3.5. Preferir melhorias incrementais e reversíveis
Nada de reescrever tudo para canvas ou worker no impulso.
Primeiro atacar o que traz ganho forte com risco controlado.

---

# 4. Métricas que precisamos acompanhar

Antes e durante a otimização, a app deveria acompanhar pelo menos estas métricas internas.

## 4.1. Métricas de simulação
- `avg_ms_per_tick`
- `p95_ms_per_tick`
- `max_ms_per_tick`
- veículos ativos por tick
- movimentos resolvidos por tick
- bloqueios por tick

## 4.2. Métricas de renderização
- `avg_ms_per_render`
- `p95_ms_per_render`
- número de renders por segundo
- tamanho do HTML renderizado ou quantidade de nós relevantes
- tempo médio de reconstrução do grid

## 4.3. Métricas de fluidez percebida
- frames longos `> 16.7ms`
- frames muito longos `> 33ms`
- frequência de dropped frames
- tempo entre ticks visuais

## 4.4. Métricas de custo de observabilidade
- custo de gerar overlays
- custo de gerar summaries textuais
- custo de atualizar replay
- custo de persistir benchmark history

## 4.5. Métricas de correção
Toda melhoria de performance deve ser validada contra:
- mesmos resultados para mesma seed/config
- mesmos testes de engine
- ausência de regressão visual grave

---

# 5. Grandes frentes de melhoria

---

## 5.1. Frente A — Instrumentação real de performance

### O que fazer
Adicionar um pequeno subsistema interno para medir:
- tempo do tick
- tempo do render
- tempo do replay render
- tempo de summaries/diagnostics
- contagem de nós/veículos/células renderizadas

### Por que importa
Sem isso, qualquer discussão de performance vira palpite com roupa técnica.

### Como implementar
- usar `performance.now()` nos pontos críticos
- guardar janelas móveis simples, ex.: últimos 60 ou 120 samples
- opcionalmente expor painel debug/perf na UI
- registrar métricas separadas para `benchmark`, `sandbox` e `replay`

### Benefício esperado
- localizar gargalo dominante de verdade
- comparar antes/depois de cada otimização
- evitar “otimizações” que não movem o ponteiro

### Prioridade
**P0**

---

## 5.2. Frente B — Reduzir custo de renderização do mundo

### O que fazer
Parar de tratar cada atualização como se o mundo inteiro precisasse ser re-renderizado do zero.

### Problema atual
A parte estática do mapa quase não muda, mas o custo de reconstruí-la pode voltar várias vezes.

### Melhorias sugeridas

#### B1. Separar visual estático de visual dinâmico
Particionar em camadas:
- camada estática do mapa/base
- camada dinâmica de veículos
- camada de overlays
- camada de seleção/debug

#### B2. Cache do grid estático
Renderizar uma vez e reaproveitar enquanto não mudar:
- mapa
- zoom
- modo de overlay estrutural que afete a base

#### B3. Atualizar só a camada de veículos por tick
Veículos são o que mais muda. O mapa não deveria pagar o preço disso toda hora.

#### B4. Atualizar overlays em frequência menor
Exemplo:
- veículos: todo frame/tick visual
- overlays e summaries: a cada 2, 3 ou 4 ticks

#### B5. Tornar decoração urbana opcional ou cacheada
Prédios, parques, praças e água são bonitos, mas são custo visual puro.
Idealmente:
- ou ficam na camada estática
- ou podem ser simplificados em modo performance

### Benefício esperado
Grande chance de ser o maior ganho perceptível no curto prazo.

### Prioridade
**P0**

---

## 5.3. Frente C — Otimizar atualização de veículos

### O que fazer
Tratar a camada de veículos como estrutura altamente dinâmica e barata de atualizar.

### Melhorias sugeridas

#### C1. Evitar recriar markup completo dos veículos
Em vez de regenerar tudo, manter elementos e atualizar só:
- posição
- rotação
- classe de estado
- seleção

#### C2. Reaproveitar nós DOM de veículos
Criar/remover só quando entra/sai carro.
Movimento normal deveria ser só atualização de estilo/transform.

#### C3. Consolidar estilos dinâmicos
Hoje muita informação vai inline. Dá para melhorar com:
- CSS vars mínimas
- menos texto de style churn por frame
- atualizações pontuais

#### C4. Reduzir custo de trilhas e highlights
Trilha visual pode ser recalculada só quando o veículo selecionado muda ou avança, não a cada reconstrução global.

### Benefício esperado
Melhora clara na sensação de fluidez quando muitos carros se mexem ao mesmo tempo.

### Prioridade
**P0**

---

## 5.4. Frente D — Melhorar estrutura de dados quente da engine

### O que fazer
Reduzir buscas lineares e trabalho repetido no núcleo da simulação.

### Gargalos prováveis
- localizar ocupação por faixa usando busca em lista de veículos
- consultas frequentes de interseção/road metadata
- resolução de bloqueio baseada em scans repetidos

### Melhorias sugeridas

#### D1. Índice de ocupação por tick
Montar uma estrutura temporária por tick, por exemplo:
- `occupancyByLaneKey`
- `occupancyByIntersectionKey`

Em vez de chamar `.find()` em todos os veículos a cada tentativa.

#### D2. Índice de veículos por posição
Útil para inspector, overlay e colisões locais.

#### D3. Pré-cálculo de transições válidas
Especialmente agora com múltiplas faixas e narrowing.
Para cada célula/direção/faixa, deixar pronto:
- próximo trecho
- lane remap padrão
- possibilidade de merge
- opções de saída em interseção

#### D4. Evitar recomputar geometria de render em hot path lógico
Parte de ângulo, curva e offset deve ficar fora da engine quando possível.

### Benefício esperado
Melhora throughput do tick e reduz crescimento ruim com mais veículos.

### Prioridade
**P0**

---

## 5.5. Frente E — Separar frequência de simulação e frequência de UI

### O que fazer
Continuar desacoplando o que é lógico do que é visual.

### Melhorias sugeridas

#### E1. Tick lógico fixo e orçamento explícito
A engine roda em cadência fixa.
Se o render atrasar, não deve levar o sistema para um espiral ruim.

#### E2. Bounded catch-up
Se acumulou atraso:
- processar no máximo N ticks por frame visual
- depois renderizar

#### E3. Amostrar UI com menor frequência
Exemplo:
- world tick: 10/20 TPS
- render: RAF
- diagnostics textuais: 4-5 vezes por segundo
- benchmark history: só quando termina execução

### Benefício esperado
Reduz peso percebido sem perder fidelidade lógica.

### Prioridade
**P0**

---

## 5.6. Frente F — Introduzir modo “performance-aware” para observabilidade

### O que fazer
Transformar debug pesado em algo com custo controlável.

### Melhorias sugeridas

#### F1. Replay com sampling configurável
Não precisa guardar frame completo em toda situação.
Possíveis modos:
- completo
- a cada N ticks
- só benchmark final
- desligado

#### F2. Eventos recentes limitados por orçamento
Em vez de empilhar tudo, manter buffer circular pequeno e barato.

#### F3. Overlays com refresh desacoplado
Congestionamento/flow/deadlock não precisam ser recalculados todo frame visual.

#### F4. Inspector sob demanda
Só calcular detalhes profundos do veículo/célula quando houver seleção ativa.

### Benefício esperado
Boa redução de custo com quase nenhum impacto negativo na UX normal.

### Prioridade
**P1**

---

## 5.7. Frente G — Worker para a simulação

### O que fazer
Mover a engine para um **Web Worker**.

### Por que isso pode valer muito
Hoje a UI e a engine compartilham o mesmo thread.
Quando o tick pesa, a interface sofre junto.
Worker separa melhor:
- simulação e benchmark de um lado
- render, controles e DOM do outro

### Como fazer sem se sabotar

#### G1. Começar com snapshot simples
Sem tentar deltas ultra-inteligentes de cara.
Primeiro fazer funcionar com segurança.

#### G2. Preservar determinismo
Mensagens entre main thread e worker precisam ser controladas para não afetar ordem lógica.

#### G3. Mandar dados compactos
Depois do primeiro passo funcional, reduzir payload de snapshot:
- só veículos ativos
- só métricas necessárias para UI ao vivo
- replay opcional ou reduzido

### Risco
É uma mudança estrutural maior.
Não é a primeira coisa que eu faria.

### Benefício esperado
Ganho forte de responsividade, principalmente em mapas mais pesados.

### Prioridade
**P1**, quase **P2** se os ganhos anteriores já resolverem boa parte do problema

---

## 5.8. Frente H — Canvas para renderização

### O que fazer
Trocar parte ou toda a renderização do mundo de DOM para Canvas.

### Quando faz sentido
Se depois de:
- cache de camadas
- atualização incremental
- otimização de veículos
- desacoplamento de frequências

...o DOM ainda for o gargalo dominante.

### Estratégia recomendada
Não migrar tudo de uma vez.

#### H1. Canvas só para o layer dinâmico de veículos
Provavelmente o melhor primeiro experimento.

#### H2. Manter UI, painéis e controles em DOM
Não precisa radicalizar.

#### H3. Só depois avaliar mover grid/base também

### Benefício esperado
Pode ser enorme, mas o custo de complexidade também sobe.

### Prioridade
**P2**

---

## 5.9. Frente I — Organização de memória e GC

### O que fazer
Reduzir alocação transitória em caminhos críticos.

### Melhorias sugeridas
- evitar criar arrays/objetos temporários em loops quentes
- reutilizar buffers temporários
- reduzir `structuredClone` fora de momentos realmente necessários
- reaproveitar estruturas de snapshot quando possível
- evitar concatenações e strings enormes por frame

### Onde isso pega forte
- replay
- render de listas textuais
- resolução de ocupação
- histórico de eventos

### Benefício esperado
Menos spikes e menos pausas intermitentes.

### Prioridade
**P1**

---

## 5.10. Frente J — Modo benchmark mais barato que sandbox

### O que fazer
Benchmark deve privilegiar throughput e determinismo, não beleza.

### Melhorias sugeridas
- renderizar menos durante benchmark
- desligar ou simplificar overlays
- reduzir frequência de summaries ao vivo
- permitir benchmark headless dentro do browser
- opcionalmente processar N ticks por frame em benchmark

### Benefício esperado
Benchmark mais rápido e mais estável, sem comprometer a experiência sandbox.

### Prioridade
**P1**

---

# 6. Sequência recomendada de execução

## Fase 1 — Medir e separar custos
1. adicionar métricas internas de tick/render
2. medir cenários leves, médios e pesados
3. identificar se o gargalo dominante é engine, DOM ou ambos

## Fase 2 — Ganhos grandes de curto prazo
4. cache da camada estática do mapa
5. atualização incremental de veículos
6. reduzir frequência de overlays/summaries
7. limitar custo de replay/eventos

## Fase 3 — Ganhos estruturais na engine
8. criar índice de ocupação por tick
9. criar lookup rápido por faixa/interseção
10. pré-calcular transições de mapa e de faixa
11. revisar hot loops da engine

## Fase 4 — Modos e orçamento de execução
12. benchmark render-light/headless
13. orçamento explícito de observabilidade
14. presets de qualidade/performance

## Fase 5 — Mudanças maiores se ainda necessário
15. mover engine para Worker
16. avaliar Canvas para camada de veículos
17. avaliar Canvas total se DOM continuar sendo o gargalo

---

# 7. Propostas concretas de backlog técnico

## P0 — fazer primeiro
- painel/perf counters internos
- cache de mapa estático
- layer de veículos incremental
- throttle de overlays e diagnostics
- índice de ocupação por tick
- lookup rápido por faixa/interseção
- benchmark com render simplificado

## P1 — fazer depois da base P0
- sampling configurável de replay
- buffer circular barato para eventos
- redução de alocação em hot paths
- pré-cálculo de conectividade/transição de faixas
- modo performance / modo visual rico
- worker para engine

## P2 — só se ainda precisar
- canvas para veículos
- canvas para grid completo
- protocolo compacto de snapshots/deltas
- otimizações mais agressivas de memória

---

# 8. Riscos e cuidados

## 8.1. Risco de otimizar o lugar errado
Mitigação:
- medir antes
- repetir benchmark fixo depois

## 8.2. Risco de quebrar determinismo
Mitigação:
- testes de seed fixa
- testes de regressão de benchmark
- cuidado extra com worker e batching

## 8.3. Risco de destruir debug/UX
Mitigação:
- fazer downgrade controlado, não remoção cega
- observabilidade configurável

## 8.4. Risco de complexidade demais cedo
Mitigação:
- atacar primeiro as melhorias reversíveis
- deixar worker/canvas para quando o ganho justificar

---

# 9. Critérios de sucesso

O trabalho de performance será considerado bom quando:
- a simulação ficar perceptivelmente mais leve em sandbox
- mapas maiores não derem sensação de UI sufocada
- benchmark rodar com mais estabilidade
- o custo de render cair de forma mensurável
- o custo do tick cair de forma mensurável
- a suíte continuar verde
- benchmark continuar reproduzível com mesma seed/config

---

# 10. Minha recomendação prática

Se eu fosse executar isso já no próximo ciclo, eu faria nesta ordem:

1. **instrumentação de performance**
2. **cache do mapa/base estática**
3. **layer de veículos com atualização incremental**
4. **throttle de overlays + summaries + replay**
5. **índice de ocupação por tick**
6. **benchmark render-light**
7. **worker**
8. **canvas**, só se ainda precisar

Minha aposta honesta: só os itens **1 a 6** já devem melhorar bastante. Worker e Canvas provavelmente são o segundo round, não o primeiro.
