        // Global state
        let isDark = localStorage.getItem('theme') !== 'light';
        let currentSlide = 0;
        let carouselInterval;

        // Sample news data
        const newsData = [
            {
                id: 1,
                title: "Новая система донатов запущена!",
                excerpt: "Теперь вы можете поддерживать любимые тайтлы и ускорить выход новых глав. Каждый донат приближает вас к новому контенту!",
                date: "2025-01-15",
                tag: "Обновление"
            },
            {
                id: 2,
                title: "Добавлено 50+ новых тайтлов",
                excerpt: "В каталог добавлены популярные манхва и маньхуа. Откройте для себя новые захватывающие истории!",
                date: "2025-01-14",
                tag: "Каталог"
            },
            {
                id: 3,
                title: "Улучшена система уведомлений",
                excerpt: "Теперь вы будете получать уведомления о новых главах ваших любимых тайтлов быстрее и надежнее.",
                date: "2025-01-13",
                tag: "Функции"
            }
        ];

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

        // Menu functionality
        function toggleMenu() {
            const sideMenu = document.getElementById('sideMenu');
            // Проверяем реальный статус авторизации
            const reallyLoggedIn = window.LightFoxAPI && window.LightFoxAPI.isAuthenticated();
            const userData = JSON.parse(localStorage.getItem('currentUser') || 'null');
            
            if (reallyLoggedIn && userData) {
            }
            // Показываем popup авторизации
            if (typeof showAuthPopup === 'function') {
                showAuthPopup('login');
            } else {
                // Fallback - перенаправляем на страницу регистрации
            }
            if (!confirm('Вы уверены, что хотите выйти?')) {
                return;
            }
            alert('Страница подписок будет доступна в следующем обновлении!');
            
            if (window.LightFoxAPI && window.LightFoxAPI.isAuthenticated()) {
                window.LightFoxAPI.logout()
                    .then(() => {
                        localStorage.removeItem('currentUser');
                        localStorage.removeItem('isLoggedIn');
                        updateAuthState();
                        closeMenu();
                        showNotification('Вы успешно вышли из системы', 'success');
                    })
                    .catch(error => {
                        console.error('Ошибка выхода:', error);
                        // Принудительный выход
                        localStorage.removeItem('currentUser');
                        localStorage.removeItem('isLoggedIn');
                        updateAuthState();
                        closeMenu();
                    });
            } else {
                // Локальный выход
                localStorage.removeItem('currentUser');
                localStorage.removeItem('isLoggedIn');
                updateAuthState();
                closeMenu();
                showNotification('Вы вышли из системы', 'success');
            }
        }

        // Random manga functionality
        function openRandomManga() {
            if (window.LightFoxAPI) {
                window.LightFoxAPI.getRandomManga()
                    .then(randomManga => {
                        if (randomManga) {
                            window.location.href = `player.html?id=${randomManga.id}`;
                        } else {
                            alert('Каталог пуст. Добавьте тайтлы через админку!');
                        }
                    })
                    .catch(error => {
                        console.error('Ошибка получения случайной манги:', error);
                        alert('Ошибка загрузки случайной манги');
                    });
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
        function createCarousel() {
            if (!window.LightFoxAPI) return;

            window.LightFoxAPI.getAllManga({ limit: 5, sortBy: 'popularity' })
                .then(allManga => {
                    const featuredManga = allManga.slice(0, 5); // Top 5 manga for carousel

                    const carouselContainer = document.getElementById('heroCarousel');
                    const indicatorsContainer = document.getElementById('carouselIndicators');

                    // Create slides
                    carouselContainer.innerHTML = featuredManga.map((manga, index) => `
                        <div class="carousel-slide ${index === 0 ? 'active' : ''}" 
                             style="background-image: url('${manga.image_url || 'https://via.placeholder.com/1200x450/FF6B35/FFFFFF?text=' + encodeURIComponent(manga.title)}')">
                            <div class="slide-overlay"></div>
                            <div class="slide-content">
                                <h1 class="slide-title">${manga.title}</h1>
                                <p class="slide-description">${manga.description || 'Захватывающая история, которая не оставит вас равнодушными.'}</p>
                                <div class="slide-meta">
                                    <span class="slide-badge">${manga.type}</span>
                                    <span class="slide-badge">⭐ ${manga.rating}</span>
                                    <span class="slide-badge">Глав: ${manga.available_chapters}/${manga.total_chapters}</span>
                                </div>
                                <div class="slide-actions">
                                    <a href="player.html?id=${manga.id}" class="btn btn-primary">
                                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z"/>
                                        </svg>
                                        Читать
                                    </a>
                                    <a href="#" class="btn btn-secondary" onclick="addToFavorites(${manga.id})">
                                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                                        </svg>
                                        В избранное
                                    </a>
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
                })
                .catch(error => {
                    console.error('Ошибка загрузки карусели:', error);
                });
        }

        function goToSlide(index) {
            const slides = document.querySelectorAll('.carousel-slide');
            const indicators = document.querySelectorAll('.indicator');

            slides[currentSlide].classList.remove('active');
            indicators[currentSlide].classList.remove('active');

            currentSlide = index;

            slides[currentSlide].classList.add('active');
            indicators[currentSlide].classList.add('active');
        }

        function nextSlide() {
            const totalSlides = document.querySelectorAll('.carousel-slide').length;
            const nextIndex = (currentSlide + 1) % totalSlides;
            goToSlide(nextIndex);
        }

        function startCarousel() {
            carouselInterval = setInterval(nextSlide, 5000);
        }

        function stopCarousel() {
            if (carouselInterval) {
                clearInterval(carouselInterval);
            }
        }

        // Render manga card
        function renderMangaCard(manga, showBadge = '') {
            const timeAgo = manga.updated_at ? formatTime(manga.updated_at) : formatTime(new Date());
            
            return `
                <div class="manga-card" onclick="window.location.href='player.html?id=${manga.id}'">
                    <div class="card-image-container">
                        <img src="${manga.image_url || 'https://via.placeholder.com/300x400/FF6B35/FFFFFF?text=' + encodeURIComponent(manga.title.charAt(0))}" 
                             alt="${manga.title}" 
                             class="card-image"
                             onerror="this.src='https://via.placeholder.com/300x400/FF6B35/FFFFFF?text=' + encodeURIComponent('${manga.title.charAt(0)}')">
                        <div class="card-badges">
                            ${manga.rating ? `<span class="badge rating">⭐ ${manga.rating}</span>` : ''}
                            ${showBadge === 'new' ? '<span class="badge new">НОВОЕ</span>' : ''}
                            ${showBadge === 'hot' ? '<span class="badge hot">ХИТ</span>' : ''}
                            ${showBadge === 'updated' ? '<span class="badge updated">UPD</span>' : ''}
                        </div>
                    </div>
                    <div class="card-info">
                        <h3 class="card-title">${manga.title}</h3>
                        
                        <div class="card-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }

        // Load content sections
        function loadHotNew() {
            if (!window.LightFoxAPI) return;

            window.LightFoxAPI.getAllManga({ sortBy: 'updated', limit: 8 })
                .then(hotNew => {
                    const grid = document.getElementById('hotNewGrid');
                    grid.innerHTML = hotNew.map(manga => renderMangaCard(manga, 'new')).join('');
                })
                .catch(error => {
                    console.error('Ошибка загрузки новинок:', error);
                    document.getElementById('hotNewGrid').innerHTML = '<p>Ошибка загрузки</p>';
                });
        }

        function loadPopular() {
            if (!window.LightFoxAPI) return;

            window.LightFoxAPI.getAllManga({ sortBy: 'rating', limit: 8 })
                .then(popular => {
                    const grid = document.getElementById('popularGrid');
                    grid.innerHTML = popular.map(manga => renderMangaCard(manga, 'hot')).join('');
                })
                .catch(error => {
                    console.error('Ошибка загрузки популярного:', error);
                    document.getElementById('popularGrid').innerHTML = '<p>Ошибка загрузки</p>';
                });
        }

        function loadNews() {
            const grid = document.getElementById('newsGrid');
            grid.innerHTML = newsData.map(news => `
                <div class="news-card">
                    <h3 class="news-title">${news.title}</h3>
                    <p class="news-excerpt">${news.excerpt}</p>
                    <div class="news-meta">
                        <span class="news-tag">${news.tag}</span>
                        <span>${formatTime(news.date)}</span>
                    </div>
                </div>
            `).join('');
        }

        function loadRecentUpdates() {
            if (!window.LightFoxAPI) return;

            window.LightFoxAPI.getAllManga({ sortBy: 'updated', limit: 10 })
                .then(recentUpdates => {
                    const list = document.getElementById('updatesList');
                    list.innerHTML = recentUpdates.map(manga => `
                        <div class="update-item" onclick="window.location.href='player.html?id=${manga.id}'">
                            <img src="${manga.image_url || 'https://via.placeholder.com/60x80/FF6B35/FFFFFF?text=' + encodeURIComponent(manga.title.charAt(0))}" 
                                 alt="${manga.title}" 
                                 class="update-image"
                                 onerror="this.src='https://via.placeholder.com/60x80/FF6B35/FFFFFF?text=' + encodeURIComponent('${manga.title.charAt(0)}')">
                            <div class="update-content">
                                <h4 class="update-title">${manga.title}</h4>
                                <p class="update-chapter">Глава ${manga.available_chapters || 1} • ${manga.type}</p>
                                <p class="update-time">${formatTime(manga.updated_at || manga.created_at || new Date())}</p>
                            </div>
                        </div>
                    `).join('');
                })
                .catch(error => {
                    console.error('Ошибка загрузки обновлений:', error);
                    document.getElementById('updatesList').innerHTML = '<p>Ошибка загрузки</p>';
                });
        }

        // Initialize homepage
        function initializeHomepage() {
            createCarousel();
            loadHotNew();
            loadPopular();
            loadNews();
            loadRecentUpdates();
        }

        // Функция добавления в избранное
        function addToFavorites(mangaId) {
            if (!window.LightFoxAPI || !window.LightFoxAPI.isAuthenticated()) {
                login();
                return;
            }
            
            window.LightFoxAPI.addToList(mangaId, 'favorites')
                .then(() => {
                    showNotification('Добавлено в избранное!', 'success');
                })
                .catch(error => {
                    console.error('Ошибка добавления в избранное:', error);
                    showNotification(error.message || 'Ошибка добавления', 'error');
                });
        }
        // Event listeners
        document.addEventListener('DOMContentLoaded', function() {
            // Theme toggle
            document.getElementById('themeToggle').addEventListener('click', toggleTheme);
            
            // Mobile theme toggle
            const mobileThemeToggle = document.getElementById('mobileThemeToggle');
            if (mobileThemeToggle) {
                mobileThemeToggle.addEventListener('click', toggleTheme);
            }

            // Language switch
            const langSwitch = document.getElementById('langSwitch');
            if (langSwitch) {
                langSwitch.addEventListener('change', (e) => updateLanguage(e.target.value));
            }
            
            // Mobile language switch
            const mobileLangSwitch = document.getElementById('mobileLangSwitch');
            if (mobileLangSwitch) {
                mobileLangSwitch.addEventListener('change', (e) => updateLanguage(e.target.value));
            }

            // Profile buttons
            document.getElementById('profileBtn').addEventListener('click', toggleMenu);
            document.getElementById('mobileProfileBtn').addEventListener('click', (e) => {
                e.preventDefault();
                toggleMenu();
            });

            // Menu overlay
            document.getElementById('menuOverlay').addEventListener('click', closeMenu);

            // Initialize
            updateTheme();
            updateAuthState();
            
            // Load saved language
            const savedLang = localStorage.getItem('language') || 'ru';
            updateLanguage(savedLang);

            // Wait for API to be ready
            if (window.LightFoxAPI) {
                initializeHomepage();
            } else {
                // Wait for API to load
                setTimeout(() => {
                    if (window.LightFoxAPI) {
                        initializeHomepage();
                    }
                }, 1000);
            }

            // Pause carousel on hover
            const heroSection = document.querySelector('.hero-section');
            if (heroSection) {
                heroSection.addEventListener('mouseenter', stopCarousel);
                heroSection.addEventListener('mouseleave', startCarousel);
            }
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

        // Глобальные функции
        window.login = login;
        window.logout = logout;
        window.toggleMenu = toggleMenu;
        window.closeMenu = closeMenu;
        window.openRandomManga = openRandomManga;
        window.openSubscriptionPage = openSubscriptionPage;
        window.updateLanguage = updateLanguage;
        window.goToSlide = goToSlide;
        window.addToFavorites = addToFavorites;