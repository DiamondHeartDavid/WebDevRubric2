const container = document.getElementById("cardsContainer");
const filter = document.getElementById("pokemonFilter");

let allPokemons = [];

async function fetchPokemonWithDetails(id) {
  try {
    // Obtener datos básicos del Pokémon
    const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const pokemonData = await pokemonResponse.json();
    
    // Obtener datos de la especie para la generación
    const speciesResponse = await fetch(pokemonData.species.url);
    const speciesData = await speciesResponse.json();
    
    // Obtener ubicaciones de encuentro
    let encounterLocations = [];
    try {
      const encountersResponse = await fetch(pokemonData.location_area_encounters);
      const encountersData = await encountersResponse.json();
      encounterLocations = encountersData
        .map(encounter => encounter.location_area.name
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ') 
        )
        .filter((value, index, self) => self.indexOf(value) === index)
        .slice(0, 3);
    } catch (error) {
      console.error(`Error fetching encounters: ${error}`);
    }

    // Obtener sonido del Pokémon
    const cryUrl = pokemonData.cries?.latest || pokemonData.cries?.legacy || '';

    return {
      ...pokemonData,
      generation: speciesData.generation.name.split('-')[1].toUpperCase(),
      encounterLocations: encounterLocations.length > 0 ? encounterLocations : ['Desconocida'],
      cryUrl: cryUrl
    };
  } catch (error) {
    console.error(`Error fetching Pokémon ${id}:`, error);
    return null;
  }
}

async function fetchPokemons() {
  try {
    const promises = [];
    for (let i = 1; i <= 15; i++) {
      promises.push(fetchPokemonWithDetails(i));
    }
    
    allPokemons = (await Promise.all(promises)).filter(p => p !== null);
    renderCards(allPokemons);
    fillFilter(allPokemons);
  } catch (error) {
    console.error("Error fetching Pokémon data:", error);
  }
}

function renderCards(pokemons) {
  container.innerHTML = "";
  pokemons.forEach(pokemon => {
    const abilities = pokemon.abilities.map(a => 
      a.ability.name.split('-').join(' ')
    ).join(', ');
    
    const types = pokemon.types.map(t => 
      `<span class="type-badge type-${t.type.name}">${t.type.name.toUpperCase()}</span>`
    ).join('');
    
    const encounterHTML = pokemon.encounterLocations
      .map(location => `<span class="location-badge">${location}</span>`)
      .join('');

    container.innerHTML += `
      <div class="card">
        <img src="${pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}" 
             alt="${pokemon.name}" 
             class="pokemon-img">
        <h3>${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h3>
        <div class="types-container">${types}</div>
        <p class="generation">GEN ${pokemon.generation}</p>
        
        <div class="encounter-section">
          <p class="encounter-title">Zonas de encuentro:</p>
          <div class="locations-container">${encounterHTML}</div>
        </div>
        
        <div class="stats">
          ${pokemon.stats.map(stat => `
            <div class="stat-row">
              <span>${stat.stat.name.toUpperCase()}</span>
              <span>${stat.base_stat}</span>
            </div>
          `).join('')}
        </div>
        
        <p class="abilities"><strong>HABILIDADES:</strong> ${abilities}</p>
        
        ${pokemon.cryUrl ? `
          <div class="sound-container">
            <button class="sound-btn" onclick="this.nextElementSibling.play()">
              REPRODUCIR GRITO
              <span class="sound-icon">🔊</span>
            </button>
            <audio src="${pokemon.cryUrl}"></audio>
          </div>
        ` : ''}
      </div>
    `;
  });
}

function fillFilter(pokemons) {
  filter.innerHTML = '<option value="all">Todos los Pokémon</option>';
  pokemons.forEach(pokemon => {
    const option = document.createElement("option");
    option.value = pokemon.name;
    option.textContent = `#${pokemon.id.toString().padStart(3, '0')} ${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}`;
    filter.appendChild(option);
  });
}

filter.addEventListener("change", (e) => {
  const selected = e.target.value;
  if (selected === "all") {
    renderCards(allPokemons);
  } else {
    const filtered = allPokemons.filter(p => p.name === selected);
    renderCards(filtered);
  }
});

document.addEventListener('DOMContentLoaded', fetchPokemons);