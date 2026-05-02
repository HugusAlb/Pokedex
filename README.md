# Pokédex

Aplicação web que consome a [PokéAPI](https://pokeapi.co) para listar, buscar e exibir detalhes dos Pokémons.

## Tecnologias

- HTML5
- CSS3
- JavaScript (ES2020+, vanilla)
- [PokéAPI](https://pokeapi.co) — API pública e gratuita, sem autenticação

## Funcionalidades

- **Listagem paginada** — carrega 24 Pokémons por vez com botão "Carregar mais"
- **Busca** — por nome (parcial) ou número; resultado em tempo real com debounce de 400ms
- **Limpar busca** — botão X dentro do campo retorna à listagem normal
- **Últimos vistos** — aba com histórico dos Pokémons clicados ou encontrados na busca (máximo 24, sem duplicatas, mais recente no topo)
- **Modal de detalhes** ao clicar em um card:
  - Sprite oficial (official artwork)
  - Tipos, altura, peso, exp. base e geração
  - Habilidades (com indicação de habilidade oculta)
  - Barras de estatísticas base com cores por faixa de valor
- **Skeleton loading** — animação de shimmer enquanto os dados carregam
- **Cores por tipo** — cada tipo Pokémon tem sua cor oficial no badge e na borda do card

## Estrutura

```
Pokedex/
├── index.html   # Estrutura e marcação
├── style.css    # Estilos, animações e cores por tipo
└── script.js    # Lógica, requisições à API e manipulação de DOM
```

## Como executar

Não requer instalação nem servidor. Basta abrir o arquivo `index.html` no navegador.

```bash
# Opcionalmente, com a extensão Live Server no VS Code:
# clique com botão direito em index.html → "Open with Live Server"
```

> A aplicação consome a PokéAPI diretamente do navegador, então é necessário ter conexão com a internet.

## Preview das seções

| Seção | Descrição |
|---|---|
| Header fixo | Título, campo de busca com botão X e tabs de navegação |
| Aba Pokémons | Grid responsivo com paginação |
| Aba Últimos vistos | Histórico de interações da sessão |
| Modal | Detalhes completos do Pokémon selecionado |

## Disciplina

Programação Web II — IFPE · 2026.1
# Pokedex
