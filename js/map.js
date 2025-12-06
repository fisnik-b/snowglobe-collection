// Map logic for Snow Globe Collection

// Initialize map with light theme
const map = L.map('map', {
    zoomControl: true,
    scrollWheelZoom: true
}).setView([30, 0], 2);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors © CARTO',
    maxZoom: 19
}).addTo(map);

let markers = [];
let currentContinent = 'all';

// Create custom marker for continent with country flag
function createMarkerIcon(continent, country) {
    const continentInfo = CONTINENT_COLORS[continent] || { color: '#0ea5e9' };
    const flag = COUNTRY_FLAGS[country] || '🌍';
    return L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="
                background: ${continentInfo.color};
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
            ">${flag}</div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
}

// Create popup content
function createPopupContent(snowGlobe) {
    const continentInfo = CONTINENT_COLORS[snowGlobe.continent] || {};
    return `
        <div class="popup-content">
            <div class="popup-header">
                <span class="popup-icon">❄️</span>
                <h3>${snowGlobe.city || 'Unknown'}</h3>
            </div>
            <p><strong>Country</strong> ${snowGlobe.country || 'Unknown'}</p>
            <p><strong>Continent</strong> <span style="color: ${continentInfo.color}; font-weight: 700;">${snowGlobe.continent || 'Unknown'}</span></p>
            ${snowGlobe.photo ? `<img src="${snowGlobe.photo}" class="popup-image" alt="${snowGlobe.city}">` : '<div class="popup-image">📸 Photo coming soon</div>'}
        </div>
    `;
}

// Display markers on map
function displayMarkers(snowGlobes) {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    const filtered = currentContinent === 'all'
        ? snowGlobes
        : snowGlobes.filter(sg => sg.continent === currentContinent);

    filtered.forEach(sg => {
        const lat = parseFloat(sg.latitude);
        const lng = parseFloat(sg.longitude);

        const marker = L.marker([lat, lng], {
            icon: createMarkerIcon(sg.continent, sg.country)
        })
        .bindPopup(createPopupContent(sg))
        .addTo(map);

        markers.push(marker);
    });

    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Filter by continent
function filterByContinent(continent, snowGlobes) {
    currentContinent = continent;

    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.continent === continent) {
            btn.classList.add('active');
        }
    });

    // Update continent cards
    document.querySelectorAll('.continent-card').forEach(card => {
        card.classList.remove('active');
        if (card.dataset.continent === continent) {
            card.classList.add('active');
        }
    });

    displayMarkers(snowGlobes);
    updateCountryList(snowGlobes);

    // Update grid view if it exists
    if (typeof updateGridView === 'function') {
        updateGridView(snowGlobes);
    }
}
