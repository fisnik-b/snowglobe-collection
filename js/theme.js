// Theme management for Snow Globe Collection

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get theme toggle button and icon
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector('.theme-icon');

    // Check if elements exist
    if (!themeToggle || !themeIcon) {
        console.error('Theme toggle elements not found');
        return;
    }

    // Check for saved theme preference or default to 'light' mode
    const currentTheme = localStorage.getItem('theme') || 'light';

    // Apply saved theme on page load
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeIcon.textContent = '🌙';
    }

    // Toggle theme when button is clicked
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');

        // Update icon based on current theme
        if (document.body.classList.contains('dark-mode')) {
            themeIcon.textContent = '🌙';
            localStorage.setItem('theme', 'dark');
        } else {
            themeIcon.textContent = '☀️';
            localStorage.setItem('theme', 'light');
        }
    });
});
