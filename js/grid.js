// Grid view functionality for Snow Globe Collection

let currentView = 'map';
let gridSnowGlobes = [];

// Initialize grid view
function initGridView(snowGlobes) {
    console.log('initGridView called with', snowGlobes ? snowGlobes.length : 0, 'snow globes');
    gridSnowGlobes = snowGlobes;
    setupViewToggle();
    renderGrid(snowGlobes);
    setupMobileViewToggle();
    console.log('initGridView completed');
}

// Setup view toggle buttons
function setupViewToggle() {
    console.log('setupViewToggle called');
    const viewButtons = document.querySelectorAll('.view-control-btn');
    console.log('Found view buttons:', viewButtons.length);

    viewButtons.forEach(btn => {
        console.log('Adding click listener to button:', btn.dataset.view);
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            console.log('View button clicked:', view);
            switchView(view);
        });
    });
}

// Switch between map and grid view
function switchView(view) {
    console.log('switchView called with:', view);
    currentView = view;

    // Update buttons
    const buttons = document.querySelectorAll('.view-control-btn');
    console.log('Updating buttons, found:', buttons.length);
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Update views
    const sections = document.querySelectorAll('.view-section');
    console.log('Updating sections, found:', sections.length);
    sections.forEach(section => {
        section.classList.remove('active');
    });

    const targetView = document.getElementById(`${view}-view`);
    console.log('Target view element:', targetView);
    if (targetView) {
        targetView.classList.add('active');
        console.log('Activated view:', view);
    } else {
        console.error('Target view not found for:', view);
    }

    // Update navbar toggle icon for mobile
    const navToggle = document.getElementById('view-toggle');
    if (navToggle) {
        navToggle.style.display = 'flex';
        const icon = navToggle.querySelector('.view-icon');
        icon.textContent = view === 'map' ? '📸' : '🗺️';
        navToggle.classList.toggle('active', view === 'grid');
    }

    // Re-render grid if switching to grid view
    if (view === 'grid') {
        console.log('Rendering grid view');
        renderGrid(gridSnowGlobes);
    }

    // Fix map rendering issue
    if (view === 'map' && typeof map !== 'undefined') {
        console.log('Invalidating map size');
        setTimeout(() => map.invalidateSize(), 100);
    }
}

// Render grid view
function renderGrid(snowGlobes) {
    const container = document.getElementById('grid-container');
    if (!container) return;

    const filtered = currentContinent === 'all'
        ? snowGlobes
        : snowGlobes.filter(sg => sg.continent === currentContinent);

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="grid-empty">
                <div class="grid-empty-icon">❄️</div>
                <div>No snow globes found</div>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(sg => {
        const continentInfo = CONTINENT_COLORS[sg.continent] || { color: '#0ea5e9' };
        const flag = COUNTRY_FLAGS[sg.country] || '🌍';

        return `
            <div class="grid-item" data-lat="${sg.latitude}" data-lng="${sg.longitude}">
                <div class="grid-item-image">
                    ${sg.photo ?
                        `<img src="${sg.photo}" alt="${sg.city}" loading="lazy">` :
                        `<div class="grid-item-placeholder">
                            <span class="grid-item-placeholder-icon">❄️</span>
                            <span>Photo coming soon</span>
                        </div>`
                    }
                </div>
                <div class="grid-item-content">
                    <div class="grid-item-header">
                        <div class="grid-item-title">
                            <div class="grid-item-city">${sg.city || 'Unknown'}</div>
                            <div class="grid-item-country">${sg.country || 'Unknown'}</div>
                        </div>
                        <div class="grid-item-flag">${flag}</div>
                    </div>
                    <div class="grid-item-continent" style="color: ${continentInfo.color}; background: ${continentInfo.color}1a;">
                        🌏 ${sg.continent || 'Unknown'}
                    </div>
                    <div class="grid-item-coordinates">
                        📍 ${parseFloat(sg.latitude).toFixed(4)}, ${parseFloat(sg.longitude).toFixed(4)}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers to grid items
    container.querySelectorAll('.grid-item').forEach((item, index) => {
        item.addEventListener('click', () => {
            const lat = parseFloat(item.dataset.lat);
            const lng = parseFloat(item.dataset.lng);

            // Switch to map view and zoom to location
            switchView('map');
            setTimeout(() => {
                if (typeof map !== 'undefined') {
                    map.setView([lat, lng], 12);
                    // Find and open the corresponding marker
                    if (typeof markers !== 'undefined') {
                        const marker = markers.find(m => {
                            const markerPos = m.getLatLng();
                            return Math.abs(markerPos.lat - lat) < 0.0001 && Math.abs(markerPos.lng - lng) < 0.0001;
                        });
                        if (marker) {
                            marker.openPopup();
                        }
                    }
                }
            }, 500);
        });
    });
}

// Update grid when continent filter changes
function updateGridView(snowGlobes) {
    if (snowGlobes) {
        gridSnowGlobes = snowGlobes;
    }
    if (currentView === 'grid') {
        renderGrid(gridSnowGlobes);
    }
}

// Mobile view toggle
function setupMobileViewToggle() {
    const navToggle = document.getElementById('view-toggle');
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            const newView = currentView === 'map' ? 'grid' : 'map';
            switchView(newView);
        });
    }
}
