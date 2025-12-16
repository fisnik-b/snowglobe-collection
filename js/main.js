// Main initialization logic for Snow Globe Collection

let snowGlobes = [];

// Setup filters
function setupFilters(snowGlobes) {
    const continents = [...new Set(snowGlobes.map(sg => sg.continent))].filter(c => c);
    const filtersContainer = document.querySelector('.filters');

    // Count snow globes per continent
    const continentCounts = {};
    let totalCount = snowGlobes.length;
    snowGlobes.forEach(sg => {
        const continent = sg.continent;
        continentCounts[continent] = (continentCounts[continent] || 0) + 1;
    });

    // Update "All Continents" button
    const allBtn = document.querySelector('[data-continent="all"]');
    if (allBtn) {
        allBtn.dataset.count = totalCount;
        allBtn.textContent = 'All';
        allBtn.style.color = '#0ea5e9';
        allBtn.addEventListener('click', () => filterByContinent('all', snowGlobes));
    }

    continents.sort().forEach(continent => {
        const count = continentCounts[continent] || 0;
        const continentInfo = CONTINENT_COLORS[continent] || { color: '#0ea5e9', class: '' };

        const btn = document.createElement('button');
        btn.className = `filter-btn ${continentInfo.class}`;
        btn.textContent = continent;
        btn.dataset.continent = continent;
        btn.dataset.count = count;
        btn.style.color = continentInfo.color;
        btn.addEventListener('click', () => filterByContinent(continent, snowGlobes));
        filtersContainer.appendChild(btn);
    });
}

// Fetch and parse data from Google Sheets
async function loadSnowGlobes() {
    try {
        const response = await fetch(SHEET_URL);
        if (!response.ok) {
            throw new Error('Unable to fetch data.');
        }

        const csvText = await response.text();

        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                snowGlobes = results.data.filter(row =>
                    row.latitude && row.longitude &&
                    !isNaN(parseFloat(row.latitude)) &&
                    !isNaN(parseFloat(row.longitude))
                );

                if (snowGlobes.length === 0) {
                    alert('No valid location data found.');
                    return;
                }

                setupFilters(snowGlobes);
                setupContinentCards(snowGlobes);
                displayMarkers(snowGlobes);
                updateAllStats(snowGlobes);
                initSearch(snowGlobes);
                initMobile(snowGlobes);
                initGridView(snowGlobes);
                initMobileViewToggle();
                optimizeMapForMobile();
            },
            error: function(error) {
                alert('Error loading collection: ' + error.message);
            }
        });
    } catch (error) {
        alert(error.message);
    }
}

// Load data when page is ready
loadSnowGlobes();
