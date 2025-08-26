// Global state
let isDark = localStorage.getItem('theme') === 'dark';
let currentSlide = 0;
let carouselInterval;

// Получение новостей из Supabase
async function getNewsData() {
    try {
        if (!window.supabase) return [];
        
        const { data, error } = await window.supabase
            .from('news')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(6);

        if (error) throw error;
        
        return data || [];
    } catch (error) {
        console.error('Error loading news:', error);
        return [];
    }
}

// Theme functionality
function updateTheme() {
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    
    // Desktop icons
    const moonIcon = document.querySelector('.moon-icon');
    const sunIcon = document.querySelector('.sun-icon');
    
    // Mobile icons
    const mobileMoonIcon = document.querySelector('.mobile-moon-icon');
    const mobileSunIcon = document.querySelector('.mobile-sun-icon');
    
    if (moonIcon && sunIcon) {
        if (isDark) {
            moonIcon.style.display = 'none';
            sunIcon.style.display = 'block';
        } else {
            moonIcon.style.display = 'block';
            sunIcon.style.display = 'none';
        }
    }
    
    if (mobileMoonIcon && mobileSunIcon) {
        if (isDark) {
            mobileMoonIcon.style.display = 'none';
            mobileSunIcon.style.display = 'block';
        } else {
            mobileMoonIcon.style.display = 'block';
            mobileSunIcon.style.display = 'none';
        }
    }
    
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function toggleTheme() {
    isDark = !isDark;
    updateTheme();
}

// Language functionality
function updateLanguage(lang) {
    localStorage.setItem('language', lang);
    const langSwitch = document.getElementById('langSwitch');
    const mobileLangSwitch = document.getElementById('mobileLangSwitch');
    if (langSwitch) langSwitch.value = lang;
    if (mobileLangSwitch) mobileLangSwitch.value = lang;
}

// Authentication state
function updateAuthState() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    const authSection = document.getElementById('authSection');
    const userSection = document.getElementById('userSection');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (isLoggedIn && currentUser) {
        if (authSection) authSection.style.display = 'none';
        if (userSection) userSection.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'block';
        
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        if (userName) userName.textContent = currentUser.name || currentUser.username || 'Пользователь';
        if (userEmail) userEmail.textContent = currentUser.email || 'user@example.com';
    } else {
        if (authSection) authSection.style.display = 'block';
        if (userSection) userSection.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
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

function login() {
    showAuthModal('login');
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        
        updateAuthState();
        closeMenu();
        
        if (typeof showNotification === 'function') {
            showNotification('Вы успешно вышли из системы', 'success');
        } else {
            alert('Вы успешно вышли из системы');
        }
    }
}

// Subscription page functionality
function openSubscriptionPage() {
    window.location.href = 'subscriptions.html';
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

// Time formatting
function formatTime(date) {
    const now = new Date();
    const time = new Date(date);
    const diff = Math.floor((now - time) / 1000);

    if (diff < 60) return 'только что';
    if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} дн назад`;
    
    return time.toLocaleDateString('ru-RU');
}

// Carousel functionality
async function createCarousel() {
    const carouselContainer = document.getElementById('heroCarousel');
    const indicatorsContainer = document.getElementById('carouselIndicators');
    
    if (!carouselContainer || !indicatorsContainer) {
        console.error('Carousel containers not found');
        return;
    }

    try {
        if (!window.supabase) {
            carouselContainer.innerHTML = '<div class="carousel-slide active" style="background: linear-gradient(135deg, #ff8a50, #ff7043); display: flex; align-items: center; justify-content: center; color: white;"><h2>Добро пожаловать в Light Fox Manga!</h2></div>';
            return;
        }

        const { data: featuredManga, error } = await window.supabase
            .from('manga')
            .select('*')
            .eq('is_active', true)
            .order('rating', { ascending: false })
            .limit(5);

        if (error) throw error;

        if (featuredManga.length === 0) {
            carouselContainer.innerHTML = '<div class="carousel-slide active" style="background: linear-gradient(135deg, #ff8a50, #ff7043); display: flex; align-items: center; justify-content: center; color: white;"><h2>Добро пожаловать в Light Fox Manga!</h2></div>';
            return;
        }

        // Create slides with proper background sizing
        carouselContainer.innerHTML = featuredManga.map((manga, index) => `
            <div class="carousel-slide ${index === 0 ? 'active' : ''}" 
                 style="background-image: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url('${manga.cover_url || 'https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg'}'); background-size: cover; background-position: center;">
                <div class="slide-overlay"></div>
                <div class="slide-content">
                    <h1 class="slide-title">${manga.title}</h1>
                    <p class="slide-description">${manga.description || 'Захватывающая история, которая не оставит вас равнодушными.'}</p>
                    <div class="slide-meta">
                        <span class="slide-badge">${manga.type}</span>
                        <span class="slide-badge">⭐ ${manga.rating || 'N/A'}</span>
                        <span class="slide-badge">Глав: ${manga.available_episodes}/${manga.total_episodes}</span>
                    </div>
                    <div class="slide-actions">
                        <a href="player.html?id=${manga.id}" class="btn btn-primary">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                            Читать
                        </a>
                        <button class="btn btn-secondary" onclick="addToFavorites('${manga.id}')">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                            </svg>
                            В избранное
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Create indicators
        indicatorsContainer.innerHTML = featuredManga.map((_, index) => `
            <div class="indicator ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></div>
        `).join('');

        // Start auto-play
        startCarousel();
    } catch (error) {
        console.error('Create carousel error:', error);
        carouselContainer.innerHTML = '<div class="carousel-slide active" style="background: linear-gradient(135deg, #ff8a50, #ff7043); display: flex; align-items: center; justify-content: center; color: white;"><h2>Добро пожаловать в Light Fox Manga!</h2></div>';
    }
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');

    if (slides.length === 0) return;

    slides[currentSlide].classList.remove('active');
    indicators[currentSlide].classList.remove('active');

    currentSlide = index;

    slides[currentSlide].classList.add('active');
    indicators[currentSlide].classList.add('active');
}

function nextSlide() {
    const totalSlides = document.querySelectorAll('.carousel-slide').length;
    if (totalSlides === 0) return;
    
    const nextIndex = (currentSlide + 1) % totalSlides;
    goToSlide(nextIndex);
}

function startCarousel() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
    }
    carouselInterval = setInterval(nextSlide, 5000);
}

function stopCarousel() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
    }
}

// Add to favorites function
async function addToFavorites(mangaId) {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        showAuthModal('login');
        return;
    }
    
    try {
        if (window.supabase) {
            const { data: { user } } = await window.supabase.auth.getUser();
            
            if (!user) {
                showAuthModal('login');
                return;
            }

            const { error } = await window.supabase
                .from('user_lists')
                .upsert({
                    user_id: user.id,
                    manga_id: mangaId,
                    list_type: 'favorites'
                });

            if (error) throw error;

            if (typeof window.showNotification === 'function') {
                window.showNotification('Добавлено в избранное!', 'success');
            }
        }
    } catch (error) {
        console.error('Add to favorites error:', error);
        if (typeof window.showNotification === 'function') {
            window.showNotification('Ошибка добавления в избранное', 'error');
        }
    }
}

// Render manga card
function renderMangaCard(manga, showBadge = '') {
    const timeAgo = manga.updatedAt ? formatTime(manga.updatedAt) : formatTime(new Date());
    const displayRating = manga.rating > 0 ? manga.rating : 'N/A';
    const currencySystem = window.CurrencySystem;
    
    return `
        <div class="manga-card" onclick="window.location.href='player.html?id=${manga.id}'">
            <div class="card-image-container">
                <img src="${manga.image || 'https://via.placeholder.com/300x400/FF6B35/FFFFFF?text=' + encodeURIComponent(manga.title.charAt(0))}" 
                     alt="${manga.title}" 
                     class="card-image"
                     onerror="this.src='https://via.placeholder.com/300x400/FF6B35/FFFFFF?text=' + encodeURIComponent('${manga.title.charAt(0)}')">
                <div class="card-badges">
                    ${manga.rating > 0 ? `<span class="badge rating">⭐ ${displayRating}</span>` : ''}
                    ${showBadge === 'new' ? '<span class="badge new">НОВОЕ</span>' : ''}
                    ${showBadge === 'hot' ? '<span class="badge hot">ХИТ</span>' : ''}
                    ${showBadge === 'updated' ? '<span class="badge updated">UPD</span>' : ''}
                </div>
            </div>
            <div class="card-info">
                <h3 class="card-title">${manga.title}</h3>
                <div class="card-meta">
                    <span class="card-chapters">${manga.availableEpisodes || 0}/${manga.totalEpisodes || 0}</span>
                    <span class="card-type">${manga.type}</span>
                </div>
                ${currencySystem ? `
                    <div class="card-donation">
                        <span data-amount="${manga.currentDonations || 0}">${currencySystem.formatAmount(manga.currentDonations || 0)}</span>
                        /
                        <span data-amount="${manga.donationGoal || 10000}">${currencySystem.formatAmount(manga.donationGoal || 10000)}</span>
                    </div>
                ` : ''}
                <div class="card-time">${timeAgo}</div>
            </div>
        </div>
    `;
}

// Load content sections
async function loadHotNew() {
    const grid = document.getElementById('hotNewGrid');
    if (!grid) return;

    try {
        if (!window.supabase) {
            grid.innerHTML = '<div class="loading">Подключение к серверу...</div>';
            return;
        }

        const { data: allManga, error } = await window.supabase
            .from('manga')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(4);

        if (error) throw error;

        if (allManga.length === 0) {
            grid.innerHTML = '<div class="loading">Нет данных для отображения</div>';
            return;
        }

        grid.innerHTML = allManga.map(manga => renderMangaCard(manga, 'new')).join('');
    } catch (error) {
        console.error('Load hot new error:', error);
        grid.innerHTML = '<div class="loading">Ошибка загрузки</div>';
    }
}

async function loadPopular() {
    const grid = document.getElementById('popularGrid');
    if (!grid) return;

    try {
        if (!window.supabase) {
            grid.innerHTML = '<div class="loading">Подключение к серверу...</div>';
            return;
        }

        const { data: allManga, error } = await window.supabase
            .from('manga')
            .select('*')
            .eq('is_active', true)
            .order('rating', { ascending: false })
            .limit(4);

        if (error) throw error;

        if (allManga.length === 0) {
            grid.innerHTML = '<div class="loading">Нет данных для отображения</div>';
            return;
        }

        grid.innerHTML = allManga.map(manga => renderMangaCard(manga, 'hot')).join('');
    } catch (error) {
        console.error('Load popular error:', error);
        grid.innerHTML = '<div class="loading">Ошибка загрузки</div>';
    }
}

async function loadNews() {
    const grid = document.getElementById('newsGrid');
    if (!grid) return;
    
    try {
        const newsData = await getNewsData();
        
        grid.innerHTML = newsData.map(news => `
            <div class="news-card">
                <h3 class="news-title">${news.title}</h3>
                <p class="news-excerpt">${news.excerpt}</p>
                <div class="news-meta">
                    <span class="news-tag">${news.category}</span>
                    <span>${formatTime(news.created_at)}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Load news error:', error);
        grid.innerHTML = '<div class="loading">Ошибка загрузки новостей</div>';
    }
}

async function loadRecentUpdates() {
    const list = document.getElementById('updatesList');
    if (!list) return;

    try {
        if (!window.supabase) {
            list.innerHTML = '<div class="loading">Подключение к серверу...</div>';
            return;
        }

        const { data: allManga, error } = await window.supabase
            .from('manga')
            .select('*')
            .eq('is_active', true)
            .gt('available_episodes', 0)
            .order('updated_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        if (allManga.length === 0) {
            list.innerHTML = '<div class="loading">Нет обновлений</div>';
            return;
        }

        list.innerHTML = allManga.map(manga => `
            <div class="update-item" onclick="window.location.href='player.html?id=${manga.id}'">
                <img src="${manga.cover_url || 'https://via.placeholder.com/60x80/FF6B35/FFFFFF?text=' + encodeURIComponent(manga.title.charAt(0))}" 
                     alt="${manga.title}" 
                     class="update-image"
                     onerror="this.src='https://via.placeholder.com/60x80/FF6B35/FFFFFF?text=' + encodeURIComponent('${manga.title.charAt(0)}')">
                <div class="update-content">
                    <h4 class="update-title">${manga.title}</h4>
                    <p class="update-chapter">Глава ${manga.available_episodes || 1} • ${manga.type}</p>
                    <p class="update-time">${formatTime(manga.updated_at)}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Load recent updates error:', error);
        list.innerHTML = '<div class="loading">Ошибка загрузки</div>';
    }
}

// Initialize homepage
async function initializeHomepage() {
    console.log('🏠 Инициализация главной страницы...');
    
    // Ждем Supabase
    if (!window.supabase) {
        await waitForSupabase();
    }
    
    // Load all sections
    await Promise.all([
        createCarousel(),
        loadHotNew(),
        loadPopular(),
        loadNews(),
        loadRecentUpdates()
    ]);
    
    console.log('✅ Главная страница инициализирована');
}

// Wait for Supabase to be ready
function waitForSupabase() {
    return new Promise((resolve) => {
        if (window.supabase) {
            resolve();
            return;
        }
        
        const checkSupabase = () => {
            if (window.supabase) {
                resolve();
            } else {
                setTimeout(checkSupabase, 100);
            }
        };
        
        checkSupabase();
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM загружен, настраиваем обработчики...');
    
    // Theme toggles
    const themeToggle = document.getElementById('themeToggle');
    const mobileThemeToggle = document.getElementById('mobileThemeToggle');
    
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    if (mobileThemeToggle) {
        mobileThemeToggle.addEventListener('click', toggleTheme);
    }

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
    
    if (profileBtn) {
        profileBtn.addEventListener('click', toggleMenu);
    }
    if (mobileProfileBtn) {
        mobileProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleMenu();
        });
    }

    // Menu overlay
    const menuOverlay = document.getElementById('menuOverlay');
    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMenu);
    }

    // Initialize theme and auth
    updateTheme();
    updateAuthState();
    
    // Ждем загрузки языковой системы
    setTimeout(() => {
        if (window.LanguageSystem) {
            window.LanguageSystem.translatePage();
        }
    }, 100);

    // Start loading data
    initializeHomepage();

    // Pause carousel on hover
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        heroSection.addEventListener('mouseenter', stopCarousel);
        heroSection.addEventListener('mouseleave', startCarousel);
    }
});

// Listen for Supabase ready event
window.addEventListener('supabaseReady', function(e) {
    console.log('📡 Supabase готов, загружаем данные');
    initializeHomepage();
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeMenu();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    stopCarousel();
});

// Export functions globally
window.toggleTheme = toggleTheme;
window.updateTheme = updateTheme;
window.updateLanguage = updateLanguage;
window.toggleMenu = toggleMenu;
window.closeMenu = closeMenu;
window.login = login;
window.logout = logout;
window.openSubscriptionPage = openSubscriptionPage;
window.openRandomManga = openRandomManga;
window.addToFavorites = addToFavorites;
window.goToSlide = goToSlide;

console.log('🦊 Главная страница Light Fox Manga загружена');