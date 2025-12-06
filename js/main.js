// Main initialization logic for Snow Globe Collection

let snowGlobes = [];

// Setup filters
function setupFilters(snowGlobes) {
    const continents = [...new Set(snowGlobes.map(sg => sg.continent))].filter(c => c);
    const filtersContainer = document.querySelector('.filters');

    continents.sort().forEach(continent => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = continent;
        btn.dataset.continent = continent;
        btn.addEventListener('click', () => filterByContinent(continent, snowGlobes));
        filtersContainer.appendChild(btn);
    });

    document.querySelector('[data-continent="all"]').addEventListener('click', () => filterByContinent('all', snowGlobes));
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
