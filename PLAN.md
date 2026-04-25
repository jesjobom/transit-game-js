# PLAN.md

Plano técnico inicial para evoluir o **transit-game-js** de protótipo visual para simulador reproduzível e comparável.

## 1. Objetivo do plano

Levar o projeto do estado atual:
- lógica acoplada ao DOM
- loops independentes por carro com `setTimeout`
- mapa hardcoded
- comportamento difícil de reproduzir
- movimento visual “piscando”

para um estado em que ele tenha:
- engine central de simulação por ticks
- estado serializável
- seed fixa e benchmark reproduzível
- regras configuráveis por flags
- renderização separada da lógica
- base pronta para movimento suave e métricas consistentes

---

## 2. Diagnóstico do estado atual

## Problemas principais

### 2.1. Loop por carro
Hoje cada carro mantém o próprio loop assíncrono. Isso complica:
- previsibilidade
- depuração
- benchmark reproduzível
- coleta de métricas coerente
- evolução para movimento suave

### 2.2. Mistura de engine e UI
A simulação depende fortemente da renderização e do estado global da página.
Isso torna difícil:
- testar regras isoladamente
- trocar a visualização
- pausar/reiniciar de forma limpa
- rodar modo benchmark sem UI

### 2.3. Estado implícito e pouco serializável
Boa parte do estado está distribuída entre objetos vivos e timers.
Isso dificulta:
- replay
- reset fiel
- comparação A/B
- persistência de cenários

### 2.4. Randomicidade sem controle formal
Existem decisões aleatórias, mas sem seed controlada.
Isso impede comparação séria entre configurações.

### 2.5. Renderização baseada em reconstrução frequente do DOM
Isso é aceitável no protótipo, mas fica ruim para:
- suavidade visual
- escalabilidade
- separação entre estado lógico e estado visual

---

## 3. Estratégia geral

A recomendação é **refatorar incrementalmente**, não reescrever tudo de uma vez.

Princípio:
1. estabilizar a engine
2. introduzir benchmark e métricas
3. só então investir forte em visual, suavidade e regras novas

---

## 4. Arquitetura alvo

## 4.1. Camadas principais

### A. Core Simulation Engine
Responsável por:
- avançar o tempo em ticks
- processar veículos
- processar regras de trânsito
- processar semáforos
- gerar eventos e métricas

### B. World State
Representação serializável de:
- mapa
- cruzamentos
- pistas/segmentos
- veículos
- semáforos
- configuração ativa
- seed e estado do RNG
- tempo atual da simulação

### C. Rules Layer
Conjunto de regras habilitáveis/desabilitáveis, por exemplo:
- free right on red
- 4-way stop
- no block intersection
- yellow handling
- priority road

### D. Renderer
Responsável só por desenhar/interpolar o estado atual.
Não deve decidir comportamento de trânsito.

### E. UI / Controls
Responsável por:
- botões
- sliders
- flags de regras
- presets
- iniciar benchmark
- mostrar métricas e score

### F. Benchmark / Analytics
Responsável por:
- rodar cenário com seed fixa
- coletar métricas
- consolidar score
- exportar relatório resumido

---

## 5. Modelo técnico sugerido

## 5.1. Tick fixo da simulação
Sugestão inicial:
- tick lógico fixo, por exemplo `10` ou `20` passos por segundo
- renderização independente, usando `requestAnimationFrame`

### Vantagens
- previsibilidade
- mesma simulação para a mesma seed/config
- métricas consistentes
- base perfeita para interpolação visual

## 5.2. Random com seed fixa
Adicionar um RNG controlado por seed.

### Necessário para
- comparar duas regras com justiça
- replay
- benchmark em lote
- depuração reproduzível

## 5.3. Estado serializável
Definir um objeto central de estado, por exemplo:

```js
{
  tick: 1234,
  rngState: ...,
  config: {...},
  map: {...},
  lights: [...],
  vehicles: [...],
  metrics: {...}
}
```

Não precisa ser exatamente esse formato, mas a ideia é essa.

## 5.4. Eventos da simulação
A engine deve emitir eventos simples, como:
- vehicleSpawned
- vehicleMoved
- vehicleStopped
- vehicleExited
- collision
- deadlockDetected
- lightChanged

Isso ajuda em:
- métricas
- replay
- debug visual

---

## 6. Estrutura de diretórios sugerida

Sem exagerar na modernização, uma estrutura incremental já ajuda.

```text
transit-game-js/
  BACKLOG.md
  PLAN.md
  transit.html
  css/
  js/
    app/
      main.js
      ui/
      render/
      benchmark/
    core/
      engine.js
      world.js
      rules/
      metrics/
      rng.js
    data/
      maps/
      presets/
```

Não precisa migrar tudo de uma vez. Pode criar essa estrutura aos poucos.

---

## 7. Estratégia de testes

A nova arquitetura deve nascer com testes desde cedo, não como etapa cosmética para depois.

## 7.1. Objetivo dos testes

Os testes devem permitir validar a evolução do simulador sem depender de inspeção manual constante na UI.

Eles devem cobrir principalmente:
- corretude da engine
- previsibilidade com seed fixa
- comportamento das regras de trânsito
- coleta de métricas
- benchmark reproduzível
- prevenção de regressões em cenários já estabilizados

## 7.2. Pirâmide de testes recomendada

### A. Testes unitários
Cobrem partes pequenas e isoladas, por exemplo:
- RNG com seed
- transição de estado dos semáforos
- regras de trânsito isoladas
- detecção de colisão
- detecção de deadlock
- cálculo de score
- coleta de métricas
- spawn de veículos

### B. Testes de integração
Cobrem pequenos cenários completos, por exemplo:
- mapa pequeno com poucos veículos
- execução de N ticks
- validação do estado final
- validação das métricas geradas
- comparação de comportamento com diferentes flags de regras

### C. Testes de regressão de benchmark
Cobrem cenários fixos com seed fixa, por exemplo:
- mesmo mapa
- mesma seed
- mesma duração
- mesmas regras
- comparação de métricas e score esperados

Esses testes são especialmente importantes para detectar quando uma feature nova piora throughput, segurança ou fluidez sem querer.

## 7.3. O que deve ser testado primeiro

Prioridade inicial:
1. RNG com seed
2. engine central de ticks
3. semáforos
4. movimentação básica de veículos
5. colisões e bloqueios
6. métricas mínimas
7. benchmark reproduzível
8. flags de regras opcionais

## 7.4. O que não precisa ser prioridade de teste no início

Não precisa gastar muita energia logo no começo com:
- testes visuais sofisticados
- animação suave
- detalhes de layout
- polimento cosmético

Esses pontos podem ser validados com inspeção manual e testes leves depois.

## 8. Fases técnicas recomendadas

## Fase 1 — Estabilização da engine

### Meta
Tirar a lógica do modelo atual de timers por carro.

### Entregas
- engine central por tick
- atualização de semáforos por tick
- atualização de veículos por tick
- estado serializável mínimo
- RNG com seed
- reset limpo da simulação
- base de testes automatizados
- primeiros testes unitários para RNG, semáforos e engine

### Critério de sucesso
- a simulação roda sem loops independentes por carro
- mesma seed + mesma config = mesmo resultado lógico

---

## Fase 2 — Benchmark reproduzível

### Meta
Criar base de comparação objetiva entre configurações.

### Entregas
- modo benchmark separado do modo sandbox
- duração fixa de execução
- spawn controlado/configurável
- métricas mínimas
- score inicial
- relatório resumido
- testes de integração para cenários pequenos
- primeiro benchmark de regressão com seed fixa

### Métricas mínimas sugeridas
- throughput
- tempo médio de travessia
- tempo médio parado
- colisões
- deadlocks

### Critério de sucesso
- duas execuções com a mesma seed e config produzem os mesmos números

---

## Fase 3 — Flags e regras opcionais

### Meta
Transformar regras de trânsito em opções formais, não gambiarras espalhadas.

### Entregas
- registry/configuração de regras
- flags na UI
- presets salvos de regras
- primeiras regras opcionais implementadas

### Primeiras regras sugeridas
- free right on red
- four-way stop
- do not block intersection
- yellow handling
- right of way for occupied intersection

### Critério de sucesso
- trocar regras sem alterar a engine base
- benchmark consegue registrar quais regras estavam ativas

---

## Fase 4 — Renderização e movimento suave

### Meta
Melhorar muito a percepção visual sem afetar a consistência da engine.

### Entregas
- render loop separado
- interpolação entre estados lógicos
- animação suave de deslocamento
- melhor posicionamento visual nas vias
- UI revisada
- painel de métricas em tempo real

### Critério de sucesso
- lógica continua determinística
- visual deixa de “piscar”

---

## Fase 5 — Ferramentas de análise e cenários

### Meta
Dar poder real de exploração e comparação.

### Entregas
- replay
- heatmap
- mapas externos
- comparação A/B
- histórico de benchmark

---

## 8. Score inicial sugerido

Não começar complexo demais.

### Proposta inicial
Usar três indicadores principais:
- eficiência
- segurança
- fluidez

### Exemplo simples
- Eficiência: carros concluídos por unidade de tempo
- Segurança: penalidade por colisões
- Fluidez: penalidade por tempo parado e deadlocks

### Fórmula inicial possível

```text
scoreTotal =
  throughput * 100
  - collisions * 500
  - deadlocks * 1000
  - avgStoppedTime * K
```

Isso pode mudar depois. O mais importante é começar simples e interpretável.

---

## 9. Decisões de design recomendadas

### 9.1. Evitar reescrita total agora
O projeto ainda está num estágio em que reescrever tudo seria tentador e meio burro.
Melhor refatorar em camadas.

### 9.2. Manter benchmark acima de polimento avançado
Se ficar bonito mas continuar irreproduzível, vira demo simpática e só.

### 9.3. Regras novas devem ser configuráveis e mensuráveis
Toda regra adicionada deve responder:
- pode ser ligada/desligada?
- entra no benchmark?
- altera métricas de forma rastreável?

### 9.4. Visual não deve carregar lógica escondida
Sem “decisões” embutidas no renderer.

---

## 10. Ferramental de testes sugerido

## 10.1. Abordagem recomendada

A recomendação prática é usar **JavaScript no Node.js**, com foco em testes da camada `core`, sem depender de browser para validar a lógica da simulação.

Isso permite:
- execução rápida
- testes determinísticos
- integração simples com o projeto atual
- menor acoplamento com DOM e renderer

## 10.2. Sugestão de stack

### Opção recomendada
- linguagem: **JavaScript**
- runner/assertions: **Vitest**

Motivos:
- leve
- rápido
- simples de configurar
- bom para unitários e integração leve
- funciona bem em projetos JS pequenos sem exagero de boilerplate

### Alternativa viável
- Node.js com `node:test` + `assert`

Essa alternativa reduz dependências, mas normalmente fica um pouco menos confortável para crescer, organizar suites e evoluir relatórios.

Minha recomendação é começar com **Vitest**, a menos que você queira radicalizar no minimalismo.

## 10.3. Como os testes seriam organizados

Estrutura possível:

```text
transit-game-js/
  js/
    core/
    app/
    ui/
  test/
    unit/
      rng.test.js
      traffic-light.test.js
      rules.test.js
      metrics.test.js
    integration/
      basic-flow.test.js
      collision-handling.test.js
      benchmark-determinism.test.js
```

## 10.4. Como os testes funcionariam tecnicamente

### Testes unitários
Chamariam funções puras ou objetos da camada `core` diretamente.

Exemplos:
- instanciar RNG com seed fixa e validar sequência
- avançar um semáforo por N ticks e validar estados
- aplicar uma regra de trânsito a um cenário mínimo
- validar cálculo de score dado um conjunto de métricas

### Testes de integração
Montariam um `WorldState` pequeno, aplicariam uma configuração e rodariam a engine por um número fixo de ticks.

Exemplos:
- mapa 3x3 com um cruzamento
- seed fixa
- 100 ticks
- verificar quantos carros concluíram
- verificar se houve colisão
- verificar se houve deadlock

### Testes de regressão
Rodariam benchmarks pequenos e confeririam o resultado esperado.

Exemplo:
- cenário `default-small`
- seed `12345`
- duração `1000 ticks`
- throughput esperado dentro de uma faixa
- zero colisões
- zero deadlocks

## 10.5. Como seriam executados

Exemplo com Vitest:

```bash
npm test
```

ou:

```bash
npx vitest run
```

E durante desenvolvimento:

```bash
npx vitest
```

para modo watch interativo.

## 10.6. Quando os testes rodam

Fluxo recomendado:
- durante desenvolvimento local, em modo watch
- antes de fechar uma feature importante
- antes de marcar uma regra nova como estável
- antes de comparar resultados de benchmark entre versões

## 10.7. O que a UI não precisa fazer para os testes funcionarem

A UI não precisa estar carregada.

Esse é justamente o benefício da arquitetura proposta: os testes devem validar a lógica principal sem abrir `transit.html` nem depender de clique manual.

## 11. Primeira sequência prática de implementação

Ordem sugerida de trabalho real:

1. Criar módulo de RNG com seed
2. Criar estrutura de estado global da simulação
3. Criar engine central de ticks
4. Migrar semáforos para tick central
5. Migrar atualização de carros para tick central
6. Remover loops assíncronos individuais dos carros
7. Criar coletor mínimo de métricas
8. Criar modo benchmark com duração fixa
9. Criar sistema de flags de regras
10. Separar renderer da engine
11. Implementar interpolação visual
12. Melhorar UI

---

## 12. Riscos principais

- Tentar melhorar visual antes de estabilizar a engine
- Tentar adicionar muitas regras antes de haver benchmark bom
- Acoplar benchmark ao renderer
- Fazer score sofisticado demais cedo demais
- Ceder à tentação de reescrever todo o frontend sem necessidade

---

## 13. Critério de sucesso do projeto reestruturado

O projeto estará numa base boa quando:
- a simulação for reproduzível com seed fixa
- regras puderem ser ligadas/desligadas sem bagunça
- benchmark gerar números confiáveis
- a renderização for suave, mas subordinada à engine
- novas melhorias puderem ser adicionadas sem implodir o código
