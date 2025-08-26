// Каталог с фильтрацией по подпискам
(function() {
    'use strict';

    // State management
    let state = {
        sortBy: 'popularity',
        isFiltersOpen: false,
        searchQuery: '',
        activeFilterPage: 'main',
        selectedGenres: [],
        selectedCategories: [],
        selectedStatuses: []
    };

    // Authentication functionality
    function updateAuthState() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        
        const authSection = document.getElementById('authSection');
        const userSection = document.getElementById('userSection');
        const logoutBtn = document.getElementById('logoutBtn');
        const authRequiredCatalog = document.getElementById('authRequiredCatalog');
        const mangaGrid = document.getElementById('mangaGrid');
        const loadingState = document.getElementById('loadingState');
        
        if (isLoggedIn && currentUser) {
            if (authSection) authSection.style.display = 'none';
            if (userSection) userSection.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'block';
            
            // Show catalog content
            if (authRequiredCatalog) authRequiredCatalog.style.display = 'none';
            if (loadingState) loadingState.style.display = 'none';
            if (mangaGrid) mangaGrid.style.display = 'grid';
            
            const userName = document.getElementById('userName');
            const userEmail = document.getElementById('userEmail');
            if (userName) userName.textContent = currentUser.name || currentUser.username || 'Пользователь';
            if (userEmail) userEmail.textContent = currentUser.email || 'user@example.com';
            
            // Load catalog content
            renderMangaGrid();
        } else {
            if (authSection) authSection.style.display = 'block';
            if (userSection) userSection.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
            
            // Hide catalog content for non-logged users
            if (authRequiredCatalog) authRequiredCatalog.style.display = 'block';
            if (loadingState) loadingState.style.display = 'none';
            if (mangaGrid) mangaGrid.style.display = 'none';
        }
    }

    function login() {
        if (typeof window.showAuthModal === 'function') {
            window.showAuthModal('login');
        } else {
            window.location.href = 'registr.html';
        }
    }

    function logout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            if (window.supabase && window.supabase.auth.signOut) {
                window.supabase.auth.signOut();
            }
            
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
            
            updateAuthState();
            closeMenu();
            
            showNotification('Вы успешно вышли из системы', 'success');
        }
    }

    // Menu functionality
    function toggleMenu() {
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');
        
        if (sideMenu && menuOverlay) {
            sideMenu.classList.toggle('open');
            menuOverlay.classList.toggle('show');
        }
    }

    function closeMenu() {
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');
        
        if (sideMenu && menuOverlay) {
            sideMenu.classList.remove('open');
            menuOverlay.classList.remove('show');
        }
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
        } else {
            alert('Система данных не загружена');
        }
    }

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

    // Render manga card with subscription access check
    function renderMangaCard(manga) {
        const currencySystem = window.CurrencySystem;
        const donationCurrent = manga.current_donations || manga.currentDonations || 0;
        const donationGoal = manga.donation_goal || manga.donationGoal || 10000;
        const donationProgress = (donationCurrent / donationGoal) * 100;
        const statusInfo = getStatusBadge(manga.status);
        const displayRating = manga.rating > 0 ? manga.rating : 'N/A';
        
        // Показываем уровень подписки
        const subscriptionTiers = manga.subscription_tiers || [manga.subscription_tier || 'free'];
        const minTier = subscriptionTiers.includes('free') ? 'free' : subscriptionTiers[0];
        
        const tierNames = {
            'free': '📖',
            'basic': '🎯',
            'premium': '👑',
            'vip': '🌟'
        };
        
        return `
            <div class="title-card" data-id="${manga.id}" onclick="openManga('${manga.id}')">
                <div class="cover-container">
                    <img src="${manga.cover_url || manga.image || 'https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg'}" 
                         alt="${manga.title}" 
                         class="cover-image"
                         onerror="this.src='https://images.pexels.com/photos/1591062/pexels-photo-1591062.jpeg'" />
                    
                    <!-- Badges Container -->
                    <div class="card-badges">
                        <!-- Status Badge (left) -->
                        <div class="status-badge-overlay ${statusInfo.class}">
                            ${statusInfo.text}
                        </div>

                        <!-- Rating Badge (right) -->
                        ${manga.rating > 0 ? `
                            <div class="rating-badge">
                                <svg class="star-icon" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                ${displayRating}
                            </div>
                        ` : ''}
                    </div>

                    <!-- Subscription Badge -->
                    ${minTier !== 'free' ? `
                        <div class="subscription-badge" style="position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.8); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.7rem;">
                            ${tierNames[minTier]} ${minTier.toUpperCase()}
                        </div>
                    ` : ''}

                    ${donationProgress > 0 ? `
                        <div class="donation-progress">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                <span>🚀 ${donationProgress.toFixed(0)}%</span>
                                <span data-amount="${donationCurrent}">${currencySystem ? currencySystem.formatAmount(donationCurrent) : donationCurrent + '₽'}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min(donationProgress, 100)}%"></div>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="card-info">
                    <div class="card-meta">
                        <span>${manga.type} ${manga.year}</span>
                    </div>
                    <h3 class="card-title">${manga.title}</h3>
                    <div class="card-meta">
                        <span>Глав: ${manga.available_episodes || manga.availableEpisodes || 0}/${manga.total_episodes || manga.totalEpisodes || 0}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Filter and search functions
    async function getFilteredManga() {
        if (!window.MangaAPI) {
            return [];
        }

        const filters = {
            search: state.searchQuery,
            genres: state.selectedGenres,
            categories: state.selectedCategories,
            statuses: state.selectedStatuses,
            sortBy: state.sortBy
        };

        let filteredData = window.MangaAPI.filterManga(filters);
        
        // Фильтруем по подписке пользователя
        if (window.SubscriptionAccessControl) {
            filteredData = await window.SubscriptionAccessControl.filterMangaBySubscription(filteredData);
        }

        return filteredData;
    }

    async function renderMangaGrid() {
        const filteredData = await getFilteredManga();
        const grid = document.getElementById('mangaGrid');
        const noResults = document.getElementById('noResults');
        const resultsInfo = document.getElementById('resultsInfo');
        const loadingState = document.getElementById('loadingState');

        if (!grid) return;

        // Check if user is logged in
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (!isLoggedIn) {
            // Show auth required message
            if (loadingState) loadingState.style.display = 'none';
            if (grid) grid.style.display = 'none';
            if (noResults) noResults.style.display = 'none';
            return;
        }

        // Hide loading
        if (loadingState) loadingState.style.display = 'none';
        if (grid) grid.style.display = 'grid';

        if (filteredData.length === 0) {
            grid.innerHTML = '';
            grid.style.display = 'none';
            if (noResults) noResults.style.display = 'block';
            if (resultsInfo) resultsInfo.textContent = 'Результатов: 0';
        } else {
            grid.innerHTML = filteredData.map(manga => renderMangaCard(manga)).join('');
            if (noResults) noResults.style.display = 'none';
            if (resultsInfo) resultsInfo.textContent = `Найдено тайтлов: ${filteredData.length}`;
        }
    }

    // Navigation functions
    async function openManga(id) {
        // Используем систему контроля доступа
        if (window.SubscriptionAccessControl) {
            const hasAccess = await window.SubscriptionAccessControl.checkAndEnforceMangaAccess(id);
            if (!hasAccess) {
                return; // Доступ запрещен
            }
        }
        
        window.location.href = `player.html?id=${id}`;
    }

    // Initialize when data is ready
    function initializeCatalog() {
        console.log('📚 Инициализация каталога...');
        renderMangaGrid();
        console.log('✅ Каталог инициализирован');
    }

    // Wait for data
    function waitForData() {
        if (window.MangaAPI) {
            initializeCatalog();
        } else {
            setTimeout(waitForData, 100);
        }
    }

    // Notification function
    function showNotification(message, type = 'success') {
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = 'notification';
            notification.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 2000;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                max-width: 300px;
                font-weight: 500;
            `;
            document.body.appendChild(notification);
        }
        
        const colors = {
            success: { bg: '#10b981', color: 'white' },
            error: { bg: '#ef4444', color: 'white' },
            warning: { bg: '#f59e0b', color: 'white' },
            info: { bg: '#3b82f6', color: 'white' }
        };
        
        const style = colors[type] || colors.success;
        notification.style.background = style.bg;
        notification.style.color = style.color;
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Event listeners
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📚 Каталог: DOM загружен');
        
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

        // Initialize
        updateAuthState();

        // Wait for data to be ready
        waitForData();

        // Listen for data updates
        window.addEventListener('mangaDataUpdate', renderMangaGrid);
        window.addEventListener('mangaDataReady', initializeCatalog);
    });

    // Export functions globally
    window.toggleMenu = toggleMenu;
    window.closeMenu = closeMenu;
    window.login = login;
    window.logout = logout;
    window.openRandomManga = openRandomManga;
    window.openManga = openManga;
    window.showNotification = showNotification;
    window.updateAuthState = updateAuthState;

    console.log('📦 Каталог загружен');

})();