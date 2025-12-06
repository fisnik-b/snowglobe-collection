// Mobile optimizations for Snow Globe Collection

// Initialize mobile features
function initMobile(snowGlobes) {
    setupBottomSheet();
    setupMobileStats(snowGlobes);
    setupTouchGestures();
}

// Setup bottom sheet for mobile stats
function setupBottomSheet() {
    const toggleBtn = document.getElementById('mobile-stats-toggle');
    const bottomSheet = document.getElementById('mobile-bottom-sheet');
    const overlay = document.getElementById('bottom-sheet-overlay');

    if (!toggleBtn || !bottomSheet || !overlay) return;

    // Toggle bottom sheet
    toggleBtn.addEventListener('click', () => {
        toggleBottomSheet(true);
    });

    // Close on overlay click
    overlay.addEventListener('click', () => {
        toggleBottomSheet(false);
    });

    // Swipe down to close
    let startY = 0;
    let currentY = 0;

    bottomSheet.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
    });

    bottomSheet.addEventListener('touchmove', (e) => {
        currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        if (diff > 0 && bottomSheet.scrollTop === 0) {
            e.preventDefault();
            bottomSheet.style.transform = `translateY(${diff}px)`;
        }
    });

    bottomSheet.addEventListener('touchend', () => {
        const diff = currentY - startY;

        if (diff > 100) {
            toggleBottomSheet(false);
        }
        bottomSheet.style.transform = '';
    });
}

// Toggle bottom sheet visibility
function toggleBottomSheet(show) {
    const bottomSheet = document.getElementById('mobile-bottom-sheet');
    const overlay = document.getElementById('bottom-sheet-overlay');

    if (show) {
        bottomSheet.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        bottomSheet.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Setup mobile stats
function setupMobileStats(snowGlobes) {
    if (!snowGlobes || snowGlobes.length === 0) return;

    const stats = calculateStats(snowGlobes);

    // Update mobile stats values
    document.getElementById('mobile-stat-total').textContent = stats.total;
    document.getElementById('mobile-stat-countries').textContent = stats.countries;
    document.getElementById('mobile-stat-continents').textContent = stats.continents;

    // Setup mobile continent stats
    const mobileContainer = document.getElementById('mobile-continent-stats');
    if (mobileContainer) {
        mobileContainer.innerHTML = '';

        Object.entries(stats.byContinents).forEach(([continent, count]) => {
            const continentInfo = CONTINENT_COLORS[continent] || { color: '#0ea5e9' };
            const card = document.createElement('div');
            card.className = `continent-card ${continent.toLowerCase().replace(' ', '-')}`;
            card.style.color = continentInfo.color;
            card.style.background = `${continentInfo.color}1a`;
            card.innerHTML = `
                <div class="continent-card-count">${count}</div>
                <div class="continent-card-name">${continent}</div>
            `;
            card.addEventListener('click', () => {
                filterByContinent(continent, snowGlobes);
                toggleBottomSheet(false);
                document.querySelector('.map-card').scrollIntoView({ behavior: 'smooth' });
            });
            mobileContainer.appendChild(card);
        });
    }
}

// Update mobile stats when filters change
function updateMobileStats(snowGlobes) {
    setupMobileStats(snowGlobes);
}

// Setup touch gestures for better mobile experience
function setupTouchGestures() {
    let touchStartX = 0;
    let touchEndX = 0;

    // Swipe gestures for continent navigation
    const filtersContainer = document.querySelector('.filters');
    if (filtersContainer) {
        filtersContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        filtersContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
    }

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
            const activeButton = filterButtons.find(btn => btn.classList.contains('active'));
            const currentIndex = filterButtons.indexOf(activeButton);

            if (diff > 0 && currentIndex < filterButtons.length - 1) {
                // Swipe left - next continent
                filterButtons[currentIndex + 1].click();
            } else if (diff < 0 && currentIndex > 0) {
                // Swipe right - previous continent
                filterButtons[currentIndex - 1].click();
            }
        }
    }
}

// Optimize map controls for mobile
function optimizeMapForMobile() {
    const isMobile = window.innerWidth <= 768;

    if (isMobile && map) {
        // Disable scroll wheel zoom on mobile
        map.scrollWheelZoom.disable();

        // Add tap to zoom message
        map.on('click', function(e) {
            if (!e.originalEvent.target.closest('.leaflet-popup')) {
                // Enable zoom on tap
                map.scrollWheelZoom.enable();
                setTimeout(() => {
                    map.scrollWheelZoom.disable();
                }, 2000);
            }
        });
    }
}

// Call on resize
window.addEventListener('resize', () => {
    optimizeMapForMobile();
});
