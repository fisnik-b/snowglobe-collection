// Statistics logic for Snow Globe Collection

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Calculate total distance between all locations
function calculateTotalDistance(snowGlobes) {
    if (snowGlobes.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 0; i < snowGlobes.length - 1; i++) {
        const lat1 = parseFloat(snowGlobes[i].latitude);
        const lon1 = parseFloat(snowGlobes[i].longitude);
        const lat2 = parseFloat(snowGlobes[i + 1].latitude);
        const lon2 = parseFloat(snowGlobes[i + 1].longitude);
        totalDistance += calculateDistance(lat1, lon1, lat2, lon2);
    }

    return Math.round(totalDistance);
}

// Format large numbers
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

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

    // Basic stats
    document.getElementById('stat-total').textContent = snowGlobes.length;
    document.getElementById('stat-countries').textContent = totalCountries;

    document.getElementById('nav-total').textContent = snowGlobes.length;
    document.getElementById('nav-countries').textContent = totalCountries;
    document.getElementById('nav-continents').textContent = totalContinents;

    // Dominant Continent
    const continentCounts = {};
    snowGlobes.forEach(sg => {
        const continent = sg.continent;
        continentCounts[continent] = (continentCounts[continent] || 0) + 1;
    });

    const dominantContinent = Object.entries(continentCounts)
        .sort((a, b) => b[1] - a[1])[0];

    if (dominantContinent) {
        const [continent, count] = dominantContinent;
        const percentage = ((count / snowGlobes.length) * 100).toFixed(0);
        document.getElementById('stat-dominant-continent').textContent = continent;
        document.getElementById('stat-dominant-percentage').textContent = `${percentage}% of collection`;
    }

    // Top 3 Countries
    const countryCounts = {};
    snowGlobes.forEach(sg => {
        countryCounts[sg.country] = (countryCounts[sg.country] || 0) + 1;
    });

    const topCountries = Object.entries(countryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    const topCountriesList = document.getElementById('top-countries-list');
    topCountriesList.innerHTML = '';

    const maxCount = topCountries[0] ? topCountries[0][1] : 1;

    topCountries.forEach(([country, count], index) => {
        const flag = COUNTRY_FLAGS[country] || '🌍';
        const percentage = (count / maxCount) * 100;
        const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';

        const item = document.createElement('div');
        item.className = 'top-country-item';
        item.innerHTML = `
            <span class="top-country-rank">${rankEmoji}</span>
            <span class="top-country-flag">${flag}</span>
            <div class="top-country-info">
                <div class="top-country-name">${country}</div>
                <div class="top-country-progress">
                    <div class="top-country-progress-bar" style="width: ${percentage}%"></div>
                </div>
            </div>
            <span class="top-country-count">${count}</span>
        `;
        topCountriesList.appendChild(item);
    });

    // Latest Addition (assuming the last entry is the most recent)
    if (snowGlobes.length > 0) {
        const latest = snowGlobes[snowGlobes.length - 1];
        document.getElementById('stat-latest').textContent = latest.city || latest.country;
        document.getElementById('stat-latest-country').textContent = latest.country;
    }

    // Total Distance
    const totalDistance = calculateTotalDistance(snowGlobes);
    document.getElementById('stat-distance').textContent = formatNumber(totalDistance) + ' km';
}

