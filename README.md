````md
# DAC Dashboard - Frontend

Frontend desenvolvido em Angular para o projeto DAC, com foco na visualização e análise dos dados educacionais da rede pública de ensino de Mato Grosso do Sul.

O sistema consome uma API ASP.NET Core, exibe filtros analíticos, gráficos, cards de resumo e uma base tabular para apoiar a interpretação dos dados históricos de educação.

---

# Objetivo do Projeto

Este frontend tem como objetivo transformar os dados educacionais importados pelo backend em uma interface visual e interativa.

A aplicação permite:

- Filtrar dados por intervalo de anos;
- Filtrar dados por município;
- Filtrar escolas de acordo com o município selecionado;
- Visualizar indicadores educacionais em gráficos;
- Acompanhar totais consolidados em cards;
- Consultar a base analítica em formato de tabela;
- Apoiar a análise da evolução educacional no estado de Mato Grosso do Sul.

---

# Tecnologias Utilizadas

- Angular
- TypeScript
- SCSS
- Chart.js
- Angular Signals
- API ASP.NET Core como fonte de dados

---

# Estrutura Geral

```txt
src/
└── app/
    ├── core/
    │   ├── config/
    │   │   └── api.config.ts
    │   │
    │   ├── models/
    │   │   ├── escola.model.ts
    │   │   ├── municipio.model.ts
    │   │   └── indicador-educacional.model.ts
    │   │
    │   └── services/
    │       └── dashboard.service.ts
    │
    ├── features/
    │   └── dashboard/
    │       ├── dashboard.component.ts
    │       ├── dashboard.component.html
    │       └── dashboard.component.scss
    │
    ├── app.config.ts
    ├── app.routes.ts
    └── app.ts
````

---

# Como o Frontend Funciona

O frontend funciona como uma camada visual para os dados processados pelo backend.

Fluxo geral:

```txt
SQL Server
   ↓
Backend ASP.NET Core
   ↓
API REST
   ↓
Dashboard Angular
```

A API fornece dados sobre:

* municípios;
* escolas;
* indicadores educacionais;
* totais consolidados;
* dados para gráficos.

O Angular consome esses dados e monta a tela de análise.

---

# URL da API

A configuração da API fica em:

```txt
src/app/core/config/api.config.ts
```

Exemplo:

```ts
export const API_CONFIG = {
  baseUrl: 'https://localhost:7063'
};
```

Caso a porta do backend seja diferente, altere esse arquivo.

---

# Principais Funcionalidades

## Filtros Analíticos

O dashboard possui filtros para refinar os dados exibidos.

Filtros principais:

* Ano inicial;
* Ano final;
* Município;
* Escola.

O filtro de escola depende do município selecionado.

Exemplo:

```txt
Município: Bataguassu
Escolas exibidas: apenas escolas de Bataguassu
```

Se nenhum município for selecionado, todas as escolas disponíveis são exibidas.

---

# Intervalo de Anos

O sistema permite selecionar um período de análise.

Exemplo:

```txt
Ano inicial: 2018
Ano final: 2020
```

Nesse caso, o dashboard exibe apenas dados entre 2018 e 2020.

Esse intervalo afeta:

* tabela;
* cards;
* gráficos;
* indicadores percentuais.

---

# Cards de Resumo

Os cards exibem totais consolidados conforme os filtros aplicados.

Exemplos de informações exibidas:

* Total de matrículas;
* Total de escolas;
* Total de municípios;
* Média de aprovação;
* Média de abandono;
* Aprovados;
* Reprovados.

Os cards são recalculados sempre que os filtros mudam.

---

# Gráficos

O dashboard utiliza Chart.js para renderizar gráficos analíticos.

Entre os gráficos disponíveis estão:

* Evolução histórica;
* Ranking de municípios;
* Distribuição de matrículas;
* Percentual de aprovação;
* Percentual de reprovação;
* Taxa de abandono;
* Total de aprovados;
* Total de reprovados.

---

# Indicadores Percentuais

Os gráficos percentuais são calculados a partir dos dados filtrados.

A lógica correta utilizada é:

```txt
Percentual de aprovação = soma(aprovados) / soma(matrícula inicial) * 100
```

```txt
Percentual de reprovação = soma(reprovados) / soma(matrícula inicial) * 100
```

```txt
Taxa de abandono = soma(abandono) / soma(matrícula inicial) * 100
```

Ou seja, os percentuais não são calculados linha por linha. Primeiro os dados são agrupados por ano, e depois o percentual é calculado com os totais daquele ano.

---

# Tratamento do Ano de 2026

O ano de 2026 possui uma particularidade importante.

Como o ano ainda está em andamento, os dados de:

* aprovados;
* reprovados;
* abandono;

podem aparecer zerados na base original.

Isso não significa que os indicadores reais sejam zero, mas sim que os dados finais ainda não foram computados.

Por isso, o frontend deve representar 2026 como um ano com dados em apuração, evitando interpretar a ausência de dados finais como queda real de desempenho.

---

# Base Analítica

A base analítica é uma tabela com os registros educacionais detalhados.

Ela exibe informações como:

* escola;
* município;
* ano;
* matrícula inicial;
* aprovados;
* reprovados;
* abandono;
* taxa de aprovação;
* taxa de abandono.

A tabela respeita os filtros selecionados.

---

# Dashboard Service

O arquivo:

```txt
src/app/core/services/dashboard.service.ts
```

é responsável por centralizar a comunicação com a API.

Ele possui métodos para:

* buscar municípios;
* buscar escolas;
* buscar indicadores educacionais;
* montar parâmetros de filtro;
* formatar números;
* formatar percentuais;
* calcular taxas;
* adaptar retornos da API para o formato usado pelo frontend.

---

# Models

Os models ficam em:

```txt
src/app/core/models/
```

Principais models:

```txt
municipio.model.ts
escola.model.ts
indicador-educacional.model.ts
```

Eles representam os dados utilizados pela aplicação.

---

# Como Executar o Projeto

## 1. Instalar dependências

```bash
npm install
```

## 2. Rodar o servidor de desenvolvimento

```bash
ng serve
```

ou:

```bash
npm start
```

## 3. Acessar no navegador

```txt
http://localhost:4200
```

---

# Dependências Importantes

Caso o projeto seja instalado do zero, garanta que o Chart.js esteja instalado:

```bash
npm install chart.js
```

---

# Configuração do Chart.js

O Chart.js precisa registrar manualmente os elementos utilizados.

No `main.ts`, deve existir uma configuração semelhante a:

```ts
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  LineController,
  BarController,
  DoughnutController
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  LineController,
  BarController,
  DoughnutController
);
```

Sem esse registro, podem ocorrer erros como:

```txt
"line" is not a registered controller
```

ou:

```txt
"linear" is not a registered scale
```

---

# Integração com Backend

Antes de rodar o frontend, certifique-se de que o backend esteja em execução.

URL esperada:

```txt
https://localhost:7063
```

Endpoints consumidos:

```txt
GET /api/municipios
GET /api/escolas
GET /api/indicadores
GET /api/dashboard/cards
GET /api/dashboard/resumo
GET /api/dashboard/grafico-evolucao
GET /api/dashboard/grafico-ranking
GET /api/dashboard/grafico-distribuicao
```

---

# Problemas Comuns

## A tela não carrega dados

Verifique se o backend está rodando:

```txt
https://localhost:7063/scalar/v1
```

Verifique também se o arquivo `api.config.ts` aponta para a porta correta.

---

## Erro de CORS

Se o navegador bloquear a chamada para a API, verifique se o backend permite requisições de:

```txt
http://localhost:4200
```

---

## Gráficos não aparecem

Confirme se:

* o Chart.js está instalado;
* os controllers foram registrados no `main.ts`;
* o canvas existe no HTML;
* a instância anterior do gráfico é destruída antes de criar outra.

---

## Select de escola não filtra corretamente

O filtro de escola depende do município.

A comparação entre IDs deve considerar que alguns valores podem vir como string no HTML e number da API.

Exemplo:

```ts
String(escola.municipioId) === String(municipioId)
```

---

## Dados com acento incorreto

Esse problema não deve ser tratado no frontend.

A correção deve ser feita no backend, durante a leitura/importação dos arquivos CSV, e no banco utilizando campos `NVARCHAR`.

---

# Scripts Disponíveis

## Rodar projeto

```bash
ng serve
```

## Build

```bash
ng build
```

## Testes

```bash
ng test
```

---

# Build de Produção

Para gerar os arquivos finais:

```bash
ng build
```

Os arquivos serão gerados em:

```txt
dist/
```

---

# Status do Projeto

Funcionalidades implementadas:

* Dashboard visual;
* Filtros por intervalo de ano;
* Filtro por município;
* Filtro de escola dependente do município;
* Cards dinâmicos;
* Gráficos com Chart.js;
* Indicadores percentuais;
* Tabela analítica;
* Integração com API ASP.NET Core;
* Tratamento visual para dados de 2026 em andamento.

---

# Contexto Acadêmico

Este frontend faz parte do projeto DAC, desenvolvido com foco no ODS 4: Educação de Qualidade.

A proposta é analisar dados históricos da educação pública em Mato Grosso do Sul, facilitando a visualização de tendências, comparações e indicadores educacionais.

```
```
