// Statistics logic for Snow Globe Collection

// Calculate statistics
function calculateStats(snowGlobes) {
    const byContinents = {};
    snowGlobes.forEach(sg => {
        const continent = sg.continent;
        byContinents[continent] = (byContinents[continent] || 0) + 1;
    });

    return {
        total: snowGlobes.length,
        countries: new Set(snowGlobes.map(sg => sg.country)).size,
        continents: new Set(snowGlobes.map(sg => sg.continent)).size,
        byContinents: byContinents
    };
}

// Setup continent cards
function setupContinentCards(snowGlobes) {
    const continentCounts = {};
    snowGlobes.forEach(sg => {
        const continent = sg.continent;
        continentCounts[continent] = (continentCounts[continent] || 0) + 1;
    });

    const container = document.getElementById('continent-stats');
    container.innerHTML = '';

    Object.keys(CONTINENT_COLORS).forEach(continent => {
        const count = continentCounts[continent] || 0;
        if (count > 0) {
            const card = document.createElement('div');
            card.className = `continent-card glass ${CONTINENT_COLORS[continent].class}`;
            card.dataset.continent = continent;
            card.style.color = CONTINENT_COLORS[continent].color;
            card.innerHTML = `
                <div class="continent-card-count">${count}</div>
                <div class="continent-card-name">${continent}</div>
            `;
            card.addEventListener('click', () => filterByContinent(continent, snowGlobes));
            container.appendChild(card);
        }
    });
}

// Update all statistics
function updateAllStats(snowGlobes) {
    const totalCountries = new Set(snowGlobes.map(sg => sg.country)).size;
    const totalContinents = new Set(snowGlobes.map(sg => sg.continent)).size;

    document.getElementById('stat-total').textContent = snowGlobes.length;
    document.getElementById('stat-countries').textContent = totalCountries;

    document.getElementById('nav-total').textContent = snowGlobes.length;
    document.getElementById('nav-countries').textContent = totalCountries;
    document.getElementById('nav-continents').textContent = totalContinents;
}

// Update country list
function updateCountryList(snowGlobes) {
    const filtered = currentContinent === 'all'
        ? snowGlobes
        : snowGlobes.filter(sg => sg.continent === currentContinent);

    const countryCounts = {};
    filtered.forEach(sg => {
        countryCounts[sg.country] = (countryCounts[sg.country] || 0) + 1;
    });

    // Filter to only show countries with more than 2 snow globes
    const filteredCountries = Object.entries(countryCounts).filter(([country, count]) => count > 2);

    const container = document.getElementById('country-list');
    const listContainer = document.getElementById('country-list-container');
    const countElement = document.getElementById('country-list-count');

    const totalCountries = filteredCountries.length;

    if (totalCountries > 0) {
        listContainer.style.display = 'block';
        countElement.textContent = `${totalCountries} ${totalCountries === 1 ? 'country' : 'countries'} with 3+ snow globes`;
        container.innerHTML = '';

        filteredCountries
            .sort((a, b) => b[1] - a[1])
            .forEach(([country, count]) => {
                const flag = COUNTRY_FLAGS[country] || '🌍';
                const item = document.createElement('div');
                item.className = 'country-item';
                item.innerHTML = `
                    <span class="country-name">${flag} ${country}</span>
                    <span class="country-count">${count}</span>
                `;
                container.appendChild(item);
            });
    } else {
        listContainer.style.display = 'none';
    }
}
