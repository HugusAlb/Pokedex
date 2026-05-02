const BASE_URL = 'https://pokeapi.co/api/v2';
const PAGE_SIZE = 24;

const grid = document.getElementById('pokemon-grid');
const recentGrid = document.getElementById('recent-grid');
const recentEmpty = document.getElementById('recent-empty');
const loadMoreBtn = document.getElementById('load-more');
const searchInput = document.getElementById('search');
const clearSearchBtn = document.getElementById('clear-search');
const searchWrapper = document.getElementById('search-wrapper');
const modal = document.getElementById('modal');
const closeModalBtn = document.getElementById('close-modal');
const modalBody = document.getElementById('modal-body');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = {
  pokemons: document.getElementById('tab-pokemons'),
  recent: document.getElementById('tab-recent'),
};

let offset = 0;
let isLoading = false;
let searchTimeout = null;
let allPokemonNames = [];
let recentlySeen = [];
let activeTab = 'pokemons';

// ── Tabs ──────────────────────────────────────────────────────
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    if (tab === activeTab) return;
    activeTab = tab;

    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    Object.entries(tabPanels).forEach(([key, panel]) =>
      panel.classList.toggle('hidden', key !== tab)
    );

    if (tab === 'recent') {
      searchWrapper.classList.add('hidden');
      renderRecentTab();
    } else {
      searchWrapper.classList.remove('hidden');
    }
  });
});

// ── Recently seen ─────────────────────────────────────────────
function addToRecent(pokemon) {
  recentlySeen = [pokemon, ...recentlySeen.filter(p => p.id !== pokemon.id)].slice(0, 24);
  if (activeTab === 'recent') renderRecentTab();
}

function renderRecentTab() {
  recentGrid.innerHTML = '';
  if (!recentlySeen.length) {
    recentEmpty.classList.remove('hidden');
    return;
  }
  recentEmpty.classList.add('hidden');
  recentlySeen.forEach(p => recentGrid.appendChild(buildCard(p)));
}

// ── Stat helpers ──────────────────────────────────────────────
function statColor(value) {
  if (value >= 100) return '#4caf50';
  if (value >= 60)  return '#8bc34a';
  if (value >= 40)  return '#ffc107';
  return '#f44336';
}

const statLabels = {
  hp:               'HP',
  attack:           'Ataque',
  defense:          'Defesa',
  'special-attack': 'Sp. Atk',
  'special-defense':'Sp. Def',
  speed:            'Velocidade',
};

// ── Fetch helpers ─────────────────────────────────────────────
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchPokemon(nameOrId) {
  return fetchJSON(`${BASE_URL}/pokemon/${nameOrId}`);
}

// ── Card builder ──────────────────────────────────────────────
function buildCard(pokemon) {
  const card = document.createElement('div');
  card.className = 'pokemon-card';
  card.dataset.id = pokemon.id;

  const primaryType = pokemon.types[0].type.name;
  card.style.setProperty('--type-color', getTypeColor(primaryType));

  const sprite =
    pokemon.sprites.other['official-artwork'].front_default ||
    pokemon.sprites.front_default;

  card.innerHTML = `
    <p class="pokemon-id">#${String(pokemon.id).padStart(4, '0')}</p>
    <img src="${sprite}" alt="${pokemon.name}" loading="lazy" />
    <p class="pokemon-name">${pokemon.name}</p>
    <div class="types">
      ${pokemon.types.map(t => `<span class="type-badge ${t.type.name}">${t.type.name}</span>`).join('')}
    </div>
  `;

  card.addEventListener('click', () => openModal(pokemon));
  return card;
}

function buildSkeleton() {
  const el = document.createElement('div');
  el.className = 'skeleton';
  return el;
}

// ── Load list ─────────────────────────────────────────────────
async function loadPokemons() {
  if (isLoading) return;
  isLoading = true;
  loadMoreBtn.disabled = true;

  const skeletons = Array.from({ length: PAGE_SIZE }, buildSkeleton);
  skeletons.forEach(s => grid.appendChild(s));

  try {
    const list = await fetchJSON(`${BASE_URL}/pokemon?limit=${PAGE_SIZE}&offset=${offset}`);
    const pokemons = await Promise.all(list.results.map(p => fetchPokemon(p.name)));

    skeletons.forEach(s => s.remove());
    pokemons.forEach(p => grid.appendChild(buildCard(p)));

    offset += PAGE_SIZE;
    if (!list.next) loadMoreBtn.style.display = 'none';
  } catch (err) {
    skeletons.forEach(s => s.remove());
    console.error(err);
  }

  isLoading = false;
  loadMoreBtn.disabled = false;
}

// ── Search ────────────────────────────────────────────────────
async function loadAllNames() {
  if (allPokemonNames.length) return;
  const data = await fetchJSON(`${BASE_URL}/pokemon?limit=10000`);
  allPokemonNames = data.results;
}

async function handleSearch(query) {
  query = query.trim().toLowerCase();

  if (!query) {
    resetToList();
    return;
  }

  grid.innerHTML = '';
  loadMoreBtn.style.display = 'none';

  const skeleton = buildSkeleton();
  grid.appendChild(skeleton);

  try {
    const pokemon = await fetchPokemon(query);
    skeleton.remove();
    grid.appendChild(buildCard(pokemon));
    addToRecent(pokemon);
    return;
  } catch {
    skeleton.remove();
  }

  await loadAllNames();
  const matches = allPokemonNames.filter(p => p.name.includes(query)).slice(0, 40);

  if (!matches.length) {
    grid.innerHTML = '<p style="color:#888;text-align:center;grid-column:1/-1">Nenhum Pokémon encontrado.</p>';
    return;
  }

  const skeletons = matches.map(() => {
    const s = buildSkeleton();
    grid.appendChild(s);
    return s;
  });

  const results = await Promise.allSettled(matches.map(p => fetchPokemon(p.name)));
  skeletons.forEach(s => s.remove());
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      grid.appendChild(buildCard(result.value));
      addToRecent(result.value);
    }
  });
}

async function resetToList() {
  grid.innerHTML = '';
  offset = 0;
  loadMoreBtn.style.display = '';
  loadMoreBtn.disabled = false;
  await loadPokemons();
}

// ── Clear search button ───────────────────────────────────────
clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  clearSearchBtn.classList.add('hidden');
  resetToList();
});

searchInput.addEventListener('input', () => {
  clearSearchBtn.classList.toggle('hidden', !searchInput.value);
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => handleSearch(searchInput.value), 400);
});

// ── Modal ─────────────────────────────────────────────────────
function openModal(pokemon) {
  addToRecent(pokemon);

  const sprite =
    pokemon.sprites.other['official-artwork'].front_default ||
    pokemon.sprites.front_default;

  const abilities = pokemon.abilities
    .map(a => `<span class="ability-badge">${a.ability.name}${a.is_hidden ? ' <em>(oculta)</em>' : ''}</span>`)
    .join('');

  const stats = pokemon.stats.map(s => {
    const label = statLabels[s.stat.name] || s.stat.name;
    const pct = Math.min((s.base_stat / 255) * 100, 100);
    return `
      <div class="stat-row">
        <span class="stat-name">${label}</span>
        <div class="stat-bar-bg">
          <div class="stat-bar" style="width:${pct}%;background:${statColor(s.base_stat)}"></div>
        </div>
        <span class="stat-value">${s.base_stat}</span>
      </div>`;
  }).join('');

  modalBody.innerHTML = `
    <div class="modal-header">
      <img src="${sprite}" alt="${pokemon.name}" />
      <h2>${pokemon.name}</h2>
      <p class="modal-id">#${String(pokemon.id).padStart(4, '0')}</p>
      <div class="types" style="justify-content:center;margin-top:6px">
        ${pokemon.types.map(t => `<span class="type-badge ${t.type.name}">${t.type.name}</span>`).join('')}
      </div>
    </div>

    <div class="modal-section">
      <h3>Informações</h3>
      <div class="info-grid">
        <div class="info-item">
          <span>Altura</span>
          <span>${(pokemon.height / 10).toFixed(1)} m</span>
        </div>
        <div class="info-item">
          <span>Peso</span>
          <span>${(pokemon.weight / 10).toFixed(1)} kg</span>
        </div>
        <div class="info-item">
          <span>Exp. base</span>
          <span>${pokemon.base_experience ?? '—'}</span>
        </div>
        <div class="info-item">
          <span>Geração</span>
          <span>${getGeneration(pokemon.id)}</span>
        </div>
      </div>
    </div>

    <div class="modal-section">
      <h3>Habilidades</h3>
      <div class="ability-list">${abilities}</div>
    </div>

    <div class="modal-section">
      <h3>Estatísticas base</h3>
      ${stats}
    </div>
  `;

  modal.classList.remove('hidden');
}

closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.classList.add('hidden'); });

// ── Helpers ───────────────────────────────────────────────────
function getGeneration(id) {
  if (id <= 151)  return 'I (Kanto)';
  if (id <= 251)  return 'II (Johto)';
  if (id <= 386)  return 'III (Hoenn)';
  if (id <= 493)  return 'IV (Sinnoh)';
  if (id <= 649)  return 'V (Unova)';
  if (id <= 721)  return 'VI (Kalos)';
  if (id <= 809)  return 'VII (Alola)';
  if (id <= 905)  return 'VIII (Galar)';
  return 'IX (Paldea)';
}

function getTypeColor(type) {
  const colors = {
    fire: '#F08030', water: '#6890F0', grass: '#78C850', electric: '#F8D030',
    ice: '#98D8D8', fighting: '#C03028', poison: '#A040A0', ground: '#E0C068',
    flying: '#A890F0', psychic: '#F85888', bug: '#A8B820', rock: '#B8A038',
    ghost: '#705898', dragon: '#7038F8', dark: '#705848', steel: '#B8B8D0',
    fairy: '#EE99AC', normal: '#A8A878',
  };
  return colors[type] || '#888';
}

// ── Init ──────────────────────────────────────────────────────
loadMoreBtn.addEventListener('click', loadPokemons);
loadPokemons();
