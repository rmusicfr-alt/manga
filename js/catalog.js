// State management
let state = {
    sortBy: 'popularity',
    isFiltersOpen: false,
    searchQuery: '',
    chaptersFrom: '',
    chaptersTo: '',
    activeFilterPage: 'main',
    selectedGenres: [],
    genreSearchQuery: '',
    selectedCategories: [],
    categorySearchQuery: '',
    selectedStatuses: [],
    isDark: localStorage.getItem('theme') === 'dark',
    isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
    currentUser: JSON.parse(localStorage.getItem('currentUser')) || null
};

// Function to get status badge class and text
function getStatusBadge(status) {
    const statusMap = {
        'Заморожен': { class: 'status-frozen', text: 'Заморожен' },
        'Завершён': { class: 'status-completed', text: 'Завершён' },
        'Анонс': { class: 'status-announcement', text: 'Анонс' },
        'Выходит': { class: 'status-ongoing', text: 'Выходит' }
    };
    
    return statusMap[status] || { class: 'status-ongoing', text: status };
}

// Theme functionality
function updateTheme() {
    document.body.setAttribute('data-theme', state.isDark ? 'dark' : 'light');
    
    // Update all theme toggle icons
    const updateIcons = (moonClass, sunClass) => {
        const moonIcons = document.querySelectorAll(moonClass);
        const sunIcons = document.querySelectorAll(sunClass);
        
        moonIcons.forEach(icon => {
            icon.style.display = state.isDark ? 'none' : 'block';
        });
        
        sunIcons.forEach(icon => {
            icon.style.display = state.isDark ? 'block' : 'none';
        });
    };
    
    updateIcons('.moon-icon', '.sun-icon');
    updateIcons('.mobile-moon-icon', '.mobile-sun-icon');
    
    localStorage.setItem('theme', state.isDark ? 'dark' : 'light');
}

function toggleTheme() {
    state.isDark = !state.isDark;
    updateTheme();
}

// Language functionality
function updateLanguage(lang) {
    localStorage.setItem('language', lang);
    
    // Sync both language selectors
    const langSwitch = document.getElementById('langSwitch');
    const mobileLangSwitch = document.getElementById('mobileLangSwitch');
    
    if (langSwitch) langSwitch.value = lang;
    if (mobileLangSwitch) mobileLangSwitch.value = lang;
}

// Authentication functionality
function updateAuthState() {
    const authSection = document.getElementById('authSection');
    const userSection = document.getElementById('userSection');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (state.isLoggedIn && state.currentUser) {
        authSection.style.display = 'none';
        userSection.style.display = 'block';
        logoutBtn.style.display = 'block';
        
        document.getElementById('userName').textContent = state.currentUser.name;
        document.getElementById('userEmail').textContent = state.currentUser.email;
    } else {
        authSection.style.display = 'block';
        userSection.style.display = 'none';
        logoutBtn.style.display = 'none';
    }
}

function login() {
    const name = prompt('Введите ваше имя:') || 'Пользователь';
    const email = prompt('Введите ваш email:') || 'user@example.com';
    
    if (name && email) {
        state.currentUser = { name, email };
        state.isLoggedIn = true;
        
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
        
        updateAuthState();
        closeMenu();
        
        alert(`Добро пожаловать, ${name}!`);
    }
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        state.isLoggedIn = false;
        state.currentUser = null;
        
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        
        updateAuthState();
        closeMenu();
        
        alert('Вы успешно вышли из системы');
    }
}

// Menu functionality
function toggleMenu() {
    const sideMenu = document.getElementById('sideMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    
    sideMenu.classList.toggle('open');
    menuOverlay.classList.toggle('show');
}

function closeMenu() {
    const sideMenu = document.getElementById('sideMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    
    sideMenu.classList.remove('open');
    menuOverlay.classList.remove('show');
}

// Random manga functionality
function openRandomManga() {
    if (window.MangaAPI) {
        const allManga = window.MangaAPI.getAllManga();
        if (allManga.length > 0) {
            const randomManga = allManga[Math.floor(Math.random() * allManga.length)];
            window.location.href = `player.html?id=${randomManga.id}`;
        } else {
            alert('Каталог пуст. Добавьте тайтлы через админку!');
        }
    }
}

// Render manga card with color status badges
function renderMangaCard(manga) {
    const donationProgress = ((manga.currentDonations || 0) / (manga.donationGoal || 10000)) * 100;
    const statusInfo = getStatusBadge(manga.status);
    
    return `
        <div class="title-card" data-id="${manga.id}" onclick="openManga(${manga.id})">
            <div class="cover-container">
                <img src="${manga.image || 'https://via.placeholder.com/300x450/FF6B35/FFFFFF?text=' + encodeURIComponent(manga.title)}" 
                     alt="${manga.title}" 
                     class="cover-image"
                     onerror="this.src='https://via.placeholder.com/300x450/FF6B35/FFFFFF?text=' + encodeURIComponent('${manga.title}')" />
                
                <!-- Badges Container -->
                <div class="card-badges">
                    <!-- Status Badge (left) -->
                    <div class="status-badge-overlay ${statusInfo.class}">
                        ${statusInfo.text}
                    </div>

                    <!-- Rating Badge (right) -->
                    <div class="rating-badge">
                        <svg class="star-icon" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        ${manga.rating}
                    </div>
                </div>

                <div class="donation-progress">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                        <span>🚀 ${donationProgress.toFixed(0)}%</span>
                        <span>${(manga.currentDonations || 0).toLocaleString()}₽</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(donationProgress, 100)}%"></div>
                    </div>
                </div>
            </div>
            
            <div class="card-info">
                <div class="card-meta">
                    <span>${manga.type} ${manga.year}</span>
                </div>
                <h3 class="card-title">${manga.title}</h3>
                <div class="card-meta">
                        <span>Глав: ${manga.availableChapters || 0}/${manga.totalChapters || 0}</span>
                </div>
                <div class="card-genres">
                    ${manga.genres ? manga.genres.slice(0, 3).map(genre => 
                        `<span class="genre-tag">${genre}</span>`
                    ).join('') : ''}
                </div>
            </div>
        </div>
    `;
}

// Filter and search functions
function getFilteredManga() {
    if (!window.MangaAPI) {
        return [];
    }

    const filters = {
        search: state.searchQuery,
        genres: state.selectedGenres,
        categories: state.selectedCategories,
        statuses: state.selectedStatuses,
        chaptersFrom: state.chaptersFrom,
        chaptersTo: state.chaptersTo,
        sortBy: state.sortBy
    };

    return window.MangaAPI.filterManga(filters);
}

function renderMangaGrid() {
    const filteredData = getFilteredManga();
    const grid = document.getElementById('mangaGrid');
    const noResults = document.getElementById('noResults');
    const resultsInfo = document.getElementById('resultsInfo');
    const loadingState = document.getElementById('loadingState');

    // Hide loading
    loadingState.style.display = 'none';
    grid.style.display = 'grid';

    if (filteredData.length === 0) {
        grid.innerHTML = '';
        grid.style.display = 'none';
        noResults.style.display = 'block';
        resultsInfo.textContent = 'Результатов: 0';
    } else {
        grid.innerHTML = filteredData.map(manga => renderMangaCard(manga)).join('');
        noResults.style.display = 'none';
        resultsInfo.textContent = `Найдено тайтлов: ${filteredData.length}`;
    }
}

// Navigation functions
function openManga(id) {
    window.location.href = `player.html?id=${id}`;
}

// Filter sidebar functions
function renderMainFilters() {
    const genres = window.MangaAPI ? window.MangaAPI.getGenres() : [];
    const categories = window.MangaAPI ? window.MangaAPI.getCategories() : [];
    const statuses = window.MangaAPI ? window.MangaAPI.getStatuses() : [];

    return `
        <div class="filter-categories">
            <button class="filter-category-button" onclick="setActiveFilterPage('genres')">
                <span>Жанры ${state.selectedGenres.length > 0 ? `<span class="filter-count">${state.selectedGenres.length}</span>` : ''}</span>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
            </button>

            <button class="filter-category-button" onclick="setActiveFilterPage('categories')">
                <span>Категории ${state.selectedCategories.length > 0 ? `<span class="filter-count">${state.selectedCategories.length}</span>` : ''}</span>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
            </button>

            <button class="filter-category-button" onclick="setActiveFilterPage('status')">
                <span>Статус ${state.selectedStatuses.length > 0 ? `<span class="filter-count">${state.selectedStatuses.length}</span>` : ''}</span>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
            </button>
        </div>
    `;
}

function renderFilterPage(type, items, selected, searchQuery = '') {
    const filteredItems = items.filter(item => 
        item.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const titles = {
        genres: 'Жанры',
        categories: 'Категории', 
        status: 'Статус'
    };
    const title = titles[type];

    return `
        <div style="display: flex; flex-direction: column; height: 100%;">
            <div class="filter-page-header">
                <button class="back-button" onclick="setActiveFilterPage('main')">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                    ${title}
                </button>
                <button class="back-button" onclick="clearFilter('${type}')">Сбросить</button>
            </div>

            ${type !== 'status' ? `
            <div class="search-input-container">
                <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <input type="text" placeholder="Поиск..." value="${searchQuery}" 
                       class="search-input" onkeyup="updateFilterSearch('${type}', this.value)" />
            </div>
            ` : ''}

            <div class="filter-list">
                ${filteredItems.map(item => `
                    <button class="filter-item" onclick="toggleFilter('${type}', '${item}')">
                        <span class="checkbox">
                            <div class="checkbox-input ${selected.includes(item) ? 'checked' : ''}">
                                ${selected.includes(item) ? `
                                    <svg class="checkmark" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                    </svg>
                                ` : ''}
                            </div>
                        </span>
                        ${item}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

function renderFiltersContent() {
    const content = document.getElementById('filtersContent');
    
    if (!window.MangaAPI) {
        content.innerHTML = '<div class="loading"><div class="spinner"></div>Загрузка фильтров...</div>';
        return;
    }

    if (state.activeFilterPage === 'main') {
        content.innerHTML = renderMainFilters();
    } else if (state.activeFilterPage === 'genres') {
        content.innerHTML = renderFilterPage('genres', window.MangaAPI.getGenres(), state.selectedGenres, state.genreSearchQuery);
    } else if (state.activeFilterPage === 'categories') {
        content.innerHTML = renderFilterPage('categories', window.MangaAPI.getCategories(), state.selectedCategories, state.categorySearchQuery);
    } else if (state.activeFilterPage === 'status') {
        content.innerHTML = renderFilterPage('status', window.MangaAPI.getStatuses(), state.selectedStatuses);
    }
}

// Filter management functions
function setActiveFilterPage(page) {
    state.activeFilterPage = page;
    if (page === 'main') {
        state.genreSearchQuery = '';
        state.categorySearchQuery = '';
    }
    renderFiltersContent();
}

function updateFilterSearch(type, value) {
    if (type === 'genres') {
        state.genreSearchQuery = value;
    } else if (type === 'categories') {
        state.categorySearchQuery = value;
    }
    renderFiltersContent();
}

function toggleFilter(type, item) {
    if (type === 'genres') {
        if (state.selectedGenres.includes(item)) {
            state.selectedGenres = state.selectedGenres.filter(g => g !== item);
        } else {
            state.selectedGenres.push(item);
        }
    } else if (type === 'categories') {
        if (state.selectedCategories.includes(item)) {
            state.selectedCategories = state.selectedCategories.filter(c => c !== item);
        } else {
            state.selectedCategories.push(item);
        }
    } else if (type === 'status') {
        if (state.selectedStatuses.includes(item)) {
            state.selectedStatuses = state.selectedStatuses.filter(s => s !== item);
        } else {
            state.selectedStatuses.push(item);
        }
    }
    renderFiltersContent();
    renderMangaGrid();
}

function clearFilter(type) {
    if (type === 'genres') {
        state.selectedGenres = [];
    } else if (type === 'categories') {
        state.selectedCategories = [];
    } else if (type === 'status') {
        state.selectedStatuses = [];
    }
    renderFiltersContent();
    renderMangaGrid();
}

function clearAllFilters() {
    state.selectedGenres = [];
    state.selectedCategories = [];
    state.selectedStatuses = [];
    state.searchQuery = '';
    state.chaptersFrom = '';
    state.chaptersTo = '';
    
    document.getElementById('centralSearchInput').value = '';
    renderFiltersContent();
    renderMangaGrid();
    closeFilters();
}

// UI functions
function openFilters() {
    state.isFiltersOpen = true;
    state.activeFilterPage = 'main';
    document.body.style.overflow = 'hidden';
    document.getElementById('filtersBackdrop').classList.add('show');
    document.getElementById('filtersSidebar').classList.add('show');
    renderFiltersContent();
}

function closeFilters() {
    state.isFiltersOpen = false;
    state.activeFilterPage = 'main';
    state.genreSearchQuery = '';
    state.categorySearchQuery = '';
    document.body.style.overflow = '';
    document.getElementById('filtersBackdrop').classList.remove('show');
    document.getElementById('filtersSidebar').classList.remove('show');
}

// Initialize when data is ready
function initializeCatalog() {
    renderMangaGrid();
    renderFiltersContent();
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Theme toggles
    const themeToggle = document.getElementById('themeToggle');
    const mobileThemeToggle = document.getElementById('mobileThemeToggle');
    
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    if (mobileThemeToggle) mobileThemeToggle.addEventListener('click', toggleTheme);

    // Language switches
    const langSwitch = document.getElementById('langSwitch');
    const mobileLangSwitch = document.getElementById('mobileLangSwitch');
    
    if (langSwitch) {
        langSwitch.addEventListener('change', (e) => updateLanguage(e.target.value));
    }
    if (mobileLangSwitch) {
        mobileLangSwitch.addEventListener('change', (e) => updateLanguage(e.target.value));
    }

    // Profile buttons
    const profileBtn = document.getElementById('profileBtn');
    const mobileProfileBtn = document.getElementById('mobileProfileBtn');
    
    if (profileBtn) profileBtn.addEventListener('click', toggleMenu);
    if (mobileProfileBtn) {
        mobileProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleMenu();
        });
    }

    // Menu overlay
    const menuOverlay = document.getElementById('menuOverlay');
    if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);

    // Search input
    const centralSearchInput = document.getElementById('centralSearchInput');
    if (centralSearchInput) {
        centralSearchInput.addEventListener('input', function(e) {
            state.searchQuery = e.target.value;
            renderMangaGrid();
        });
    }

    // Sort dropdown
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function(e) {
            state.sortBy = e.target.value;
            renderMangaGrid();
        });
    }

    // Filters button
    const filtersButton = document.getElementById('filtersButton');
    if (filtersButton) filtersButton.addEventListener('click', openFilters);

    // Close filters
    const closeSidebar = document.getElementById('closeSidebar');
    const filtersBackdrop = document.getElementById('filtersBackdrop');
    
    if (closeSidebar) closeSidebar.addEventListener('click', closeFilters);
    if (filtersBackdrop) filtersBackdrop.addEventListener('click', closeFilters);

    // Initialize theme and auth
    updateTheme();
    updateAuthState();
    
    // Load saved language
    const savedLang = localStorage.getItem('language') || 'ru';
    updateLanguage(savedLang);

    // Wait for data to be ready
    if (window.MangaAPI) {
        initializeCatalog();
    } else {
        window.addEventListener('mangaDataReady', initializeCatalog);
    }

    // Listen for data updates
    window.addEventListener('mangaDataUpdate', renderMangaGrid);
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeFilters();
        closeMenu();
    }
});

console.log('📦 Каталог с цветными статус-бейджами загружен!');
