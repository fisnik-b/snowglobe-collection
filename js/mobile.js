// Mobile optimizations for Snow Globe Collection

// Initialize mobile features
function initMobile(snowGlobes) {
    setupBottomSheet();
    setupMobileStats(snowGlobes);
    setupTouchGestures();
    setupBottomNavigation();
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

// Setup bottom navigation bar
function setupBottomNavigation() {
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    const statsSection = document.querySelector('.stats-dashboard');
    const continentSection = document.querySelector('.continent-stats');
    const filtersSection = document.querySelector('.filters');
    const viewControls = document.querySelector('.view-controls');
    const mapView = document.getElementById('map-view');
    const gridView = document.getElementById('grid-view');
    const heroSection = document.querySelector('.hero');

    if (!bottomNavItems.length) return;

    // Function to switch views
    function switchView(view) {
        // Update active state on bottom nav
        bottomNavItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.view === view) {
                item.classList.add('active');
            }
        });

        // Only apply view switching logic on mobile
        if (window.innerWidth > 768) return;

        // Hide/show sections based on view
        switch(view) {
            case 'map':
                // Show map, hide stats and grid
                if (statsSection) statsSection.style.display = 'none';
                if (continentSection) continentSection.style.display = 'none';
                if (mapView) mapView.style.display = 'block';
                if (gridView) gridView.style.display = 'none';
                if (filtersSection) filtersSection.style.display = 'flex';
                if (viewControls) viewControls.style.display = 'none';
                if (heroSection) heroSection.style.display = 'block';
                break;

            case 'stats':
                // Show stats, hide map and grid
                if (statsSection) statsSection.style.display = 'grid';
                if (continentSection) continentSection.style.display = 'block';
                if (mapView) mapView.style.display = 'none';
                if (gridView) gridView.style.display = 'none';
                if (filtersSection) filtersSection.style.display = 'none';
                if (viewControls) viewControls.style.display = 'none';
                if (heroSection) heroSection.style.display = 'none';
                // Scroll to stats
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;

            case 'grid':
                // Show grid, hide stats and map
                if (statsSection) statsSection.style.display = 'none';
                if (continentSection) continentSection.style.display = 'none';
                if (mapView) mapView.style.display = 'none';
                if (gridView) gridView.style.display = 'block';
                if (filtersSection) filtersSection.style.display = 'flex';
                if (viewControls) viewControls.style.display = 'none';
                if (heroSection) heroSection.style.display = 'block';
                break;
        }
    }

    // Add click listeners to bottom nav items
    bottomNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            switchView(view);

            // Add haptic feedback if available
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        });
    });

    // Initialize with map view
    if (window.innerWidth <= 768) {
        switchView('map');
    }

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth > 768) {
                // Reset to desktop view
                if (statsSection) statsSection.style.display = '';
                if (continentSection) continentSection.style.display = '';
                if (mapView) mapView.style.display = '';
                if (gridView) gridView.style.display = '';
                if (filtersSection) filtersSection.style.display = '';
                if (viewControls) viewControls.style.display = '';
                if (heroSection) heroSection.style.display = '';
            } else {
                // Re-apply mobile view
                const activeItem = document.querySelector('.bottom-nav-item.active');
                if (activeItem) {
                    switchView(activeItem.dataset.view);
                }
            }
        }, 250);
    });

    // Hide bottom nav on scroll down, show on scroll up
    let lastScrollTop = 0;
    let scrollTimeout;
    const bottomNav = document.querySelector('.bottom-nav');

    window.addEventListener('scroll', () => {
        if (window.innerWidth > 768) return;

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            if (scrollTop > lastScrollTop && scrollTop > 100) {
                // Scrolling down
                bottomNav.classList.add('hidden');
            } else {
                // Scrolling up
                bottomNav.classList.remove('hidden');
            }

            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        }, 100);
    }, { passive: true });
}

// Call on resize
window.addEventListener('resize', () => {
    optimizeMapForMobile();
});
