# BACKLOG.md

Backlog de melhorias do projeto **transit-game-js**, organizado para funcionar como board simples e também como guia de prioridade.

## Como usar

- `[ ]` tarefa pendente
- `[~]` tarefa em andamento
- `[x]` tarefa concluída
- Horizonte sugerido:
  - `MVP` = necessário para a primeira versão realmente boa e comparável
  - `V2` = expansão importante depois da base estabilizada
  - `FUTURE` = bom de ter, mas não deve atrasar a evolução principal

---

## Prioridade macro

### MVP
Foco: transformar o protótipo em uma simulação reproduzível, comparável e visualmente melhor, sem reescrever tudo.

1. Corrigir bugs estruturais do protótipo atual
2. Separar engine de simulação da renderização
3. Substituir loops por carro por um tick central
4. Introduzir seed fixa e modo de benchmark
5. Definir métricas mínimas e score inicial
6. Criar sistema de flags de regras opcionais
7. Implementar movimento suave
8. Melhorar UI e feedback visual básico

### V2
Foco: enriquecer regras, análise e cenários, mantendo comparabilidade.

1. Expandir regras de trânsito configuráveis
2. Melhorar métricas, relatórios e comparação A/B
3. Adicionar presets de mapa/configuração
4. Adicionar overlays, heatmap e replay
5. Melhorar variedade de comportamentos e cenários

### FUTURE
Foco: profundidade, polimento forte e recursos “laboratório premium”.

1. Editor visual de mapas
2. Batch benchmark com múltiplas seeds
3. Semáforos adaptativos
4. Pedestres, veículos especiais, clima e eventos
5. Comparação lado a lado e recursos mais “gameficados” 

---

## 1. MVP — Fundação técnica

### Objetivo
Criar uma base que permita evoluir regras, visual e benchmark sem quebrar tudo a cada mudança.

- [x] Separar claramente a engine de simulação da renderização visual
- [x] Substituir loops independentes por carro por uma engine central baseada em ticks
- [x] Definir um estado global serializável da simulação
- [ ] Permitir reset/reexecução com a mesma configuração e mesma seed
- [x] Remover dependências diretas da lógica de negócio com o DOM
- [x] Definir um formato base para configuração da simulação
- [x] Definir um formato base para mapas/cenários
- [x] Definir contrato para geração procedural de mapas baseada em seed
- [x] Padronizar a organização dos arquivos do projeto

---

## 2. MVP — Bugs estruturais do protótipo atual

### Objetivo
Eliminar problemas do modelo atual antes de empilhar melhorias em cima dele.

- [ ] Corrigir casos em que carros ficam presos ao avaliar conversão livre à direita
- [ ] Eliminar recursão problemática na escolha de direção em cenários sem saída
- [ ] Revisar lógica de colisão em cruzamentos complexos
- [ ] Revisar geração inicial de direção nos pontos de entrada
- [ ] Revisar spawn de carros para evitar padrões ruins ou enviesados
- [ ] Revisar representação de múltiplos carros na mesma célula
- [~] Revisar semântica de pistas opostas e paralelas
- [ ] Definir comportamento claro para deadlocks e travamentos

---

## 3. MVP — Benchmark, métricas e score

### Objetivo
Permitir comparação objetiva entre diferentes conjuntos de regras/configurações.

- [~] Definir um modo de teste padronizado
- [x] Introduzir seed fixa para cenários reproduzíveis
- [x] Permitir configurar duração fixa da simulação para benchmark
- [x] Permitir configurar taxa de spawn de veículos no benchmark
- [~] Definir conjunto mínimo de métricas coletadas por execução
- [ ] Detectar deadlocks e travamentos da malha
- [ ] Medir carros concluídos por unidade de tempo
- [ ] Medir tempo médio de travessia
- [ ] Medir tempo médio parado
- [ ] Medir velocidade média efetiva
- [x] Medir colisões
- [x] Definir um score inicial simples de eficiência + penalidades
- [~] Separar resultado em dimensões mínimas: eficiência, segurança e fluidez
- [~] Gerar relatório resumido por execução

---

## 4. MVP — Base de testes automatizados

### Objetivo
Garantir evolução segura da nova engine sem depender de validação manual constante na UI.

- [x] Escolher e configurar o runner de testes em Node.js
- [x] Criar estrutura inicial de testes (`unit`, `integration`, `regression`)
- [x] Criar primeiros testes unitários para RNG com seed
- [x] Criar primeiros testes unitários para semáforos
- [ ] Criar primeiros testes unitários para regras de trânsito isoladas
- [x] Criar primeiros testes unitários para métricas e score
- [x] Criar primeiros testes unitários para renderização base do mapa/veículos
- [x] Criar primeiros testes unitários para resumo/estado da UI
- [x] Criar primeiros testes de integração para cenários pequenos
- [x] Criar primeiro teste de regressão de benchmark com seed fixa
- [x] Garantir que mesma seed + mesma config produz o mesmo resultado lógico
- [~] Definir fluxo padrão para rodar testes antes de fechar features importantes

---

## 5. MVP — Regras configuráveis na UI

### Objetivo
Permitir ativar/desativar regras opcionais e comparar o impacto delas com benchmark reproduzível.

- [ ] Criar sistema de flags/opções de regras na interface
- [ ] Permitir salvar e restaurar combinações de regras
- [ ] Adicionar opção “conversão livre à direita no vermelho”
- [ ] Adicionar opção “PARE de quatro vias”
- [ ] Adicionar regra de preferência para quem já está no cruzamento
- [ ] Adicionar bloqueio de cruzamento (“não entra se não puder sair”)
- [ ] Adicionar opção de avanço no amarelo habilitado/desabilitado
- [ ] Adicionar prioridade de via principal
- [ ] Adicionar distância mínima de segurança entre carros

---

## 6. MVP — Movimento, visual e UX básicos

### Objetivo
Melhorar bastante a percepção de qualidade sem tentar resolver todo o polimento de uma vez.

- [ ] Implementar movimento suave entre células com interpolação visual
- [~] Separar tick lógico da taxa de atualização visual
- [ ] Implementar aceleração e desaceleração mais graduais
- [~] Melhorar posicionamento visual por faixa/direção
- [x] Introduzir sentido explícito nas vias do mapa bootstrap para evitar tráfego frontal em segmentos de célula única
- [ ] Melhorar espaçamento entre veículos em fila
- [~] Redesenhar a interface geral da aplicação
- [x] Renderizar o mapa em tela, mesmo em visual cru
- [x] Renderizar veículos em posições reais do grid
- [x] Fazer o mapa base ficar grande o suficiente para exibir conversões e rotas variadas
- [~] Melhorar o estilo visual do grid/ruas/cruzamentos
- [~] Melhorar a aparência visual dos semáforos
- [ ] Melhorar o visual dos carros com sprites/ícones mais profissionais
- [ ] Criar painel lateral ou superior com métricas em tempo real
- [ ] Exibir claramente quais regras opcionais estão ativas
- [~] Melhorar layout dos controles/configurações
- [x] Exibir informação de versão na UI para ajudar a detectar cache antigo
- [x] Permitir play/pause e reset básicos da simulação na UI
- [x] Fazer veículos tomarem decisões básicas em interseções

---

## 7. V2 — Regras de trânsito expandidas

### Objetivo
Aumentar o poder experimental da simulação depois que a base estiver estável.

- [ ] Adicionar limite de velocidade por trecho
- [ ] Adicionar proibição de conversão à esquerda em vias selecionadas
- [ ] Adicionar faixa exclusiva de conversão
- [~] Adicionar suporte a mão única / mão dupla (base de mão única/direção explícita já aplicada no mapa bootstrap; falta generalizar e suportar mão dupla real)
- [ ] Adicionar rotatórias
- [ ] Adicionar faixas de pedestre
- [ ] Adicionar pedestres simulados
- [ ] Adicionar acidentes aleatórios
- [ ] Adicionar obstruções temporárias / veículos quebrados
- [ ] Adicionar veículos especiais com prioridade
- [ ] Adicionar semáforos adaptativos baseados no fluxo
- [~] Evoluir heurística de roteamento dos veículos além da escolha básica em interseções

---

## 8. V2 — Métricas e análise avançadas

### Objetivo
Aprofundar a leitura dos resultados e dar mais poder de comparação.

- [ ] Medir tamanho médio de filas
- [ ] Medir ocupação média das vias
- [ ] Medir throughput por cruzamento
- [ ] Medir quase-colisões
- [ ] Medir variância do tempo de viagem
- [ ] Medir fairness entre direções/fluxos
- [ ] Salvar histórico de benchmarks
- [ ] Permitir comparação A/B entre duas configurações
- [ ] Criar modo “benchmark” claramente separado do modo “sandbox”
- [ ] Criar sistema de presets nomeados de configuração
- [ ] Gerar gráficos automáticos de comparação

---

## 9. V2 — Ferramentas visuais de análise

### Objetivo
Facilitar entendimento do comportamento emergente e depuração dos resultados.

- [ ] Criar heatmap de congestionamento
- [ ] Exibir fluxo médio por via
- [ ] Criar modo replay de simulação
- [ ] Mostrar estado interno de veículos selecionados
- [ ] Mostrar intenção atual do carro (seguir, virar, parar, aguardar)
- [ ] Mostrar estado atual dos semáforos e próxima transição
- [ ] Permitir inspecionar células e cruzamentos pela UI
- [ ] Destacar pontos de deadlock visualmente
- [ ] Exibir trilhas/histórico curto de deslocamento dos veículos
- [ ] Criar modo debug com overlays visuais

---

## 10. V2 — Mapas e cenários

### Objetivo
Dar mais variedade ao simulador e criar cenários úteis de comparação.

- [ ] Permitir carregar mapas a partir de arquivo em vez de hardcode
- [~] Evoluir o mapa bootstrap fixo para cobrir cenários mais interessantes antes dos mapas externos
- [ ] Implementar geração procedural de mapas baseada em seed
- [ ] Definir parâmetros controláveis da geração procedural (densidade, tamanho, cruzamentos, semáforos, etc.)
- [ ] Garantir que mesma seed gere exatamente o mesmo mapa
- [ ] Permitir gerar novo mapa randômico a partir de nova seed
- [ ] Permitir benchmark com mapa procedural reproduzível
- [ ] Criar presets de cenários prontos
- [ ] Criar mapas pequenos de validação/tutoriais
- [ ] Criar mapas maiores e mais realistas
- [ ] Criar cenários com gargalos específicos
- [ ] Criar cenários de horário de pico vs tráfego leve
- [ ] Criar cenários com obras/interdições
- [ ] Criar cenários climáticos que afetem comportamento

---

## 11. FUTURE — Comportamento mais rico

### Objetivo
Adicionar profundidade e variedade sem contaminar o MVP com complexidade prematura.

- [ ] Introduzir tempo de reação para os veículos
- [ ] Criar perfis de motorista (agressivo, conservador, equilibrado)
- [ ] Diferenciar comportamento por tipo de veículo
- [ ] Implementar curvas mais suaves em conversões
- [ ] Simular mudança de faixa
- [ ] Simular ultrapassagem onde aplicável

---

## 12. FUTURE — Ferramentas avançadas e produto

### Objetivo
Levar o projeto para um modo mais completo de laboratório e exploração.

- [ ] Criar modo batch para rodar várias seeds e calcular médias/desvios
- [ ] Criar editor visual de mapas
- [ ] Permitir importar/exportar mapas personalizados
- [ ] Criar timeline navegável para análise de eventos
- [ ] Criar visualização lado a lado para comparação de cenários
- [ ] Criar comparação lado a lado entre presets
- [ ] Criar modo “laboratório” para experimentar regras manualmente
- [ ] Criar ranking local de melhores configurações por mapa
- [ ] Permitir exportar/importar configurações de experimento
- [ ] Criar objetivos/desafios opcionais para dar aspecto de jogo
- [ ] Adicionar tema claro/escuro
- [ ] Criar legenda visual para tipos de rua, regras e sinais
- [ ] Criar animações visuais de explosão/acidente mais elaboradas

---

## 13. Roadmap sugerido

### Fase 1 — Tirar do modo “protótipo frágil”
- [ ] Corrigir bugs estruturais mais perigosos
- [ ] Separar engine e renderização
- [ ] Implementar tick central da simulação
- [ ] Definir estado serializável

### Fase 2 — Tornar comparável
- [ ] Introduzir seed fixa
- [ ] Criar benchmark padronizado
- [ ] Definir métricas mínimas
- [ ] Definir score inicial
- [ ] Criar base de testes automatizados
- [ ] Criar flags de regras opcionais

### Fase 3 — Tornar agradável de usar
- [ ] Implementar movimento suave
- [ ] Melhorar UI e visual geral
- [ ] Criar painel de métricas
- [ ] Melhorar controles e feedback visual

### Fase 4 — Expandir poder experimental
- [ ] Adicionar mais regras de trânsito
- [ ] Adicionar heatmap, replay e debug visual
- [ ] Adicionar mapas e cenários mais ricos
- [ ] Adicionar geração procedural de mapas por seed
- [ ] Adicionar comparação A/B

### Fase 5 — Laboratório mais completo
- [ ] Batch benchmark
- [ ] Editor de mapas
- [ ] Semáforos adaptativos
- [ ] Recursos avançados de análise e comparação

---

## 14. Princípios de priorização

- Não tentar resolver polimento avançado antes de estabilizar a engine.
- Não adicionar regras novas sem garantir comparabilidade com seed fixa.
- Não deixar visual bonito mascarar métricas ruins ou bugs estruturais.
- Preferir melhorias que aumentem reprodutibilidade e capacidade de análise.
- Geração procedural de mapas deve ser determinística quando a seed for fixa.
- Evitar reescrever o stack inteiro cedo demais só para parecer moderno.