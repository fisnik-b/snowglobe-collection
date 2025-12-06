// Search functionality for Snow Globe Collection

let searchTimeout;

// Initialize search
function initSearch(snowGlobes) {
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search');
    const searchResults = document.getElementById('search-results');

    if (!searchInput) return;

    // Handle input
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        // Show/hide clear button
        clearBtn.style.display = query ? 'flex' : 'none';

        // Debounce search
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(query, snowGlobes, searchResults);
        }, 300);
    });

    // Clear search
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        searchResults.style.display = 'none';
        searchInput.focus();
    });

    // Close results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchResults.style.display = 'none';
        }
    });

    // Focus on search with Ctrl/Cmd + K
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
        // Close with Escape
        if (e.key === 'Escape') {
            searchResults.style.display = 'none';
            searchInput.blur();
        }
    });
}

// Perform search
function performSearch(query, snowGlobes, resultsContainer) {
    if (!query) {
        resultsContainer.style.display = 'none';
        return;
    }

    const lowerQuery = query.toLowerCase();
    const results = [];
    const seen = new Set();

    // Search through snow globes
    snowGlobes.forEach(sg => {
        const city = (sg.city || '').toLowerCase();
        const country = (sg.country || '').toLowerCase();
        const continent = (sg.continent || '').toLowerCase();

        // Match city
        if (city.includes(lowerQuery) && !seen.has(city)) {
            results.push({
                type: 'city',
                title: sg.city,
                subtitle: `${sg.country}, ${sg.continent}`,
                icon: '🏙️',
                data: sg
            });
            seen.add(city);
        }

        // Match country
        if (country.includes(lowerQuery) && !seen.has(country)) {
            const countryCount = snowGlobes.filter(s => s.country === sg.country).length;
            results.push({
                type: 'country',
                title: sg.country,
                subtitle: `${countryCount} snow globe${countryCount > 1 ? 's' : ''} · ${sg.continent}`,
                icon: COUNTRY_FLAGS[sg.country] || '🌍',
                data: sg
            });
            seen.add(country);
        }

        // Match continent
        if (continent.includes(lowerQuery) && !seen.has(continent)) {
            const continentCount = snowGlobes.filter(s => s.continent === sg.continent).length;
            results.push({
                type: 'continent',
                title: sg.continent,
                subtitle: `${continentCount} snow globes`,
                icon: '🌏',
                data: sg
            });
            seen.add(continent);
        }
    });

    displaySearchResults(results, resultsContainer);
}

// Display search results
function displaySearchResults(results, container) {
    if (results.length === 0) {
        container.innerHTML = '<div class="search-no-results">No results found</div>';
        container.style.display = 'block';
        return;
    }

    // Limit to 8 results
    const limitedResults = results.slice(0, 8);

    container.innerHTML = limitedResults.map(result => `
        <div class="search-result-item" data-type="${result.type}" data-value="${result.title}">
            <span class="search-result-icon">${result.icon}</span>
            <div class="search-result-text">
                <div class="search-result-title">${result.title}</div>
                <div class="search-result-subtitle">${result.subtitle}</div>
            </div>
        </div>
    `).join('');

    container.style.display = 'block';

    // Add click handlers
    container.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => handleSearchResultClick(item, results));
    });
}

// Handle search result click
function handleSearchResultClick(item, results) {
    const type = item.dataset.type;
    const value = item.dataset.value;
    const result = results.find(r => r.title === value && r.type === type);

    if (!result) return;

    // Hide search results
    document.getElementById('search-results').style.display = 'none';

    if (type === 'continent') {
        // Filter by continent
        filterByContinent(result.data.continent, snowGlobes);
        // Scroll to filters
        document.querySelector('.filters').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (type === 'country') {
        // Filter by continent and highlight country
        filterByContinent(result.data.continent, snowGlobes);
        // Find and open marker for this country
        const marker = markers.find(m => {
            const popupContent = m.getPopup().getContent();
            return popupContent.includes(result.data.country);
        });
        if (marker) {
            map.setView(marker.getLatLng(), 8);
            setTimeout(() => marker.openPopup(), 500);
        }
    } else if (type === 'city') {
        // Find and open marker for this city
        const marker = markers.find(m => {
            const popupContent = m.getPopup().getContent();
            return popupContent.includes(result.data.city);
        });
        if (marker) {
            map.setView(marker.getLatLng(), 12);
            setTimeout(() => marker.openPopup(), 500);
        }
    }
}
