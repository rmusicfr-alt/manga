
        // State
        let isDark = localStorage.getItem('theme') === 'dark';
        let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        let currentSection = null;
        let userLists = {
            favorites: [],
            watching: [],
            wantToWatch: [],

            completed: []
        };

        // === БЕЗОПАСНАЯ ЗАГРУЗКА ДАННЫХ ===
        function loadDataSystemSafely() {
            return new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = 'js/data.js';
                
                let isResolved = false;
                const timeout = setTimeout(() => {
                    if (!isResolved) {
                        console.warn('⏰ Таймаут загрузки data.js, создаю fallback');
                        createMockMangaAPI();
                        isResolved = true;
                        resolve(false);
                    }
                }, 3000);

                script.onload = () => {
                    if (!isResolved) {
                        clearTimeout(timeout);
                        console.log('✅ data.js загружен успешно');
                        
                        setTimeout(() => {
                            if (window.MangaAPI && typeof window.MangaAPI.getAllManga === 'function') {
                                console.log('🎯 MangaAPI готов к использованию');
                                isResolved = true;
                                resolve(true);
                            } else {
                                console.warn('⚠️ MangaAPI не готов, создаю fallback');
                                createMockMangaAPI();
                                isResolved = true;
                                resolve(false);
                            }
                        }, 100);
                    }
                };

                script.onerror = () => {
                    if (!isResolved) {
                        clearTimeout(timeout);
                        console.warn('❌ Ошибка загрузки data.js, создаю fallback');
                        createMockMangaAPI();
                        isResolved = true;
                        resolve(false);
                    }
                };

                document.head.appendChild(script);
            });
        }

        // === СОЗДАНИЕ СОВМЕСТИМОГО MOCK API ===
        function createMockMangaAPI() {
            console.log('🔧 Создание совместимого Mock API...');
            
            const mockData = [
                {
                    id: '1',
                    title: 'Атака титанов',
                    type: 'Аниме',
                    status: 'Завершён',
                    year: 2013,
                    rating: 9.0,
                    genres: ['Экшен', 'Драма', 'Фэнтези', 'Военное'],
                    categories: ['Сёнен'],
                    availableEpisodes: 87,
                    totalEpisodes: 87,
                    currentDonations: 7500,
                    donationGoal: 10000,
                    image: 'https://via.placeholder.com/300x450/FF6B35/FFFFFF?text=АТ',
                    description: 'Человечество живёт в городах, окружённых огромными стенами, защищающими от титанов.',
                    episodes: {
                        1: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                        2: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
                    }
                },
                {
                    id: '2',
                    title: 'Наруто',
                    type: 'Аниме',
                    status: 'Завершён',
                    year: 2002,
                    rating: 8.7,
                    genres: ['Экшен', 'Приключения', 'Боевые искусства'],
                    categories: ['Сёнен'],
                    availableEpisodes: 720,
                    totalEpisodes: 720,
                    currentDonations: 12000,
                    donationGoal: 15000,
                    image: 'https://via.placeholder.com/300x450/4A90E2/FFFFFF?text=Н',
                    description: 'История молодого ниндзя Наруто Узумаки.',
                    episodes: {
                        1: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
                    }
                }
            ];

            window.MangaAPI = {
                getAllManga: () => [...mockData],
                getMangaById: (id) => mockData.find(manga => manga.id === String(id)),
                addManga: (manga) => {
                    const newManga = {
                        id: String(Date.now()),
                        currentDonations: 0,
                        donationGoal: 10000,
                        episodes: {},
                        ...manga
                    };
                    mockData.push(newManga);
                    return newManga;
                },
                updateManga: (id, updates) => {
                    const index = mockData.findIndex(manga => manga.id === String(id));
                    if (index !== -1) {
                        mockData[index] = { ...mockData[index], ...updates };
                        try {
                            localStorage.setItem('lightfox_manga_data', JSON.stringify(mockData));
                        } catch (e) {
                            console.warn('Не удалось сохранить данные:', e);
                        }
                        return mockData[index];
                    }
                    return null;
                },
                deleteManga: (id) => {
                    const index = mockData.findIndex(manga => manga.id === String(id));
                    if (index !== -1) {
                        return mockData.splice(index, 1)[0];
                    }
                    return null;
                },
                getStats: () => ({
                    totalManga: mockData.length,
                    totalEpisodes: mockData.reduce((sum, manga) => sum + (manga.availableEpisodes || 0), 0),
                    averageRating: mockData.reduce((sum, manga) => sum + (manga.rating || 0), 0) / mockData.length,
                    totalDonations: mockData.reduce((sum, manga) => sum + (manga.currentDonations || 0), 0)
                }),
                isReady: true,
                _isMock: true
            };

            console.log('✅ Mock MangaAPI создан и готов к использованию');
            
            setTimeout(() => {
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('mangaDataReady', {
                        detail: { api: window.MangaAPI }
                    }));
                }
            }, 100);
        }

        // Theme functionality
        function updateTheme() {
            document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
            
            const updateIcons = (moonClass, sunClass) => {
                const moonIcons = document.querySelectorAll(moonClass);
                const sunIcons = document.querySelectorAll(sunClass);
                
                moonIcons.forEach(icon => {
                    icon.style.display = isDark ? 'none' : 'block';
                });
                
                sunIcons.forEach(icon => {
                    icon.style.display = isDark ? 'block' : 'none';
                });
            };
            
            updateIcons('.moon-icon', '.sun-icon');
            updateIcons('.mobile-moon-icon', '.mobile-sun-icon');
            
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

        // Authentication functionality
        function updateAuthState() {
            const authSection = document.getElementById('authSection');
            const userSection = document.getElementById('userSection');
            const logoutBtn = document.getElementById('logoutBtn');
            
            if (isLoggedIn && currentUser) {
                authSection.style.display = 'none';
                userSection.style.display = 'block';
                logoutBtn.style.display = 'block';
                
                document.getElementById('userName').textContent = currentUser.name;
                document.getElementById('userEmail').textContent = currentUser.email;
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
                currentUser = { name, email };
                isLoggedIn = true;
                
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                updateAuthState();
                closeMenu();
                
                showNotification(`Добро пожаловать, ${name}!`, 'success');
            }
        }

        function logout() {
            if (confirm('Вы уверены, что хотите выйти?')) {
                isLoggedIn = false;
                currentUser = null;
                
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
                    showNotification('Каталог пуст', 'error');
                }
            } else {
                showNotification('Система данных не загружена', 'error');
            }
        }

        // === УЛУЧШЕННАЯ ИНИЦИАЛИЗАЦИЯ КАБИНЕТА ===
        async function initializeCabinet() {
            console.log('🚀 Инициализация личного кабинета...');
            
            try {
                const dataLoaded = await loadDataSystemSafely();
                
                if (!window.MangaAPI) {
                    console.error('❌ MangaAPI недоступен даже после fallback');
                    showNotification('Критическая ошибка системы данных', 'error');
                    return;
                }

                console.log(`✅ Система данных готова (${window.MangaAPI._isMock ? 'Mock' : 'Real'} API)`);
                
                const testManga = window.MangaAPI.getAllManga();
                console.log(`📚 Доступно ${testManga.length} тайтлов`);

                loadUserLists();
                updateCounts();
                loadDonationProjects();
                
                console.log('✅ Личный кабинет полностью инициализирован');
                
            } catch (error) {
                console.error('❌ Критическая ошибка инициализации:', error);
                showNotification('Ошибка загрузки системы', 'error');
            }
        }

        // Load user lists from localStorage
        function loadUserLists() {
            Object.keys(userLists).forEach(listName => {
                const saved = localStorage.getItem(listName);
                if (saved) {
                    try {
                        userLists[listName] = JSON.parse(saved);
                    } catch (e) {
                        console.error(`Error loading ${listName}:`, e);
                        userLists[listName] = [];
                    }
                }
            });
        }

        // Update section counts
        function updateCounts() {
            Object.keys(userLists).forEach(listName => {
                const countElement = document.getElementById(listName + 'Count');
                if (countElement) {
                    countElement.textContent = userLists[listName].length;
                }
            });
        }

        // === ИСПРАВЛЕННАЯ ЗАГРУЗКА ПРОЕКТОВ ДОНАТОВ ===
        function loadDonationProjects() {
            console.log('🚀 Запуск loadDonationProjects...');
            
            const container = document.getElementById('donationProjectsContainer');
            if (!container) {
                console.error('❌ Контейнер donationProjectsContainer не найден');
                return;
            }

            if (!window.MangaAPI) {
                console.warn('⚠️ MangaAPI недоступен, показываем загрузку...');
                container.innerHTML = `
                    <div class="loading">
                        <div class="spinner"></div>
                        Система данных загружается...
                    </div>
                `;
                return;
            }

            try {
                // ЧИТАЕМ ДОНАТ-ПРОЕКТЫ ИЗ АДМИНКИ
                const donationProjects = JSON.parse(localStorage.getItem('lightfox_donation_projects') || '[]');
                console.log(`💰 Найдено ${donationProjects.length} донат-проектов из админки`);

                if (donationProjects.length === 0) {
                    // Fallback: используем старую систему из MangaAPI
                    return loadDonationProjectsFromAPI();
                }

                // Фильтруем только активные проекты с прогрессом < 100%
                const activeProjects = donationProjects.filter(project => {
                    if (project.status !== 'active') return false;
                    
                    const progress = (project.currentAmount / project.goal) * 100;
                    const needsDonation = progress < 100;
                    
                    if (needsDonation) {
                        console.log(`💰 Активный проект "${project.title}": ${project.currentAmount}/${project.goal} (${progress.toFixed(1)}%)`);
                    }
                    
                    return needsDonation;
                }).slice(0, 6); // Максимум 6 проектов

                console.log(`✅ Отобрано ${activeProjects.length} активных проектов для отображения`);

                if (activeProjects.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-icon">🎉</div>
                            <div class="empty-title">Все цели достигнуты!</div>
                            <div class="empty-text">Спасибо за поддержку проектов</div>
                        </div>
                    `;
                    return;
                }

                // Генерируем HTML для проектов
                const projectsHTML = activeProjects.map(project => {
                    console.log(`🎨 Создаю карточку для проекта "${project.title}"`);
                    return renderDonationProjectCard(project);
                }).join('');

                container.innerHTML = `
                    <div class="donation-projects">
                        ${projectsHTML}
                    </div>
                `;

                console.log('✅ Донат-проекты из админки загружены успешно');

            } catch (error) {
                console.error('❌ Критическая ошибка в loadDonationProjects:', error);
                // Fallback на старую систему
                loadDonationProjectsFromAPI();
            }
        }

        // Fallback функция для совместимости со старой системой
        function loadDonationProjectsFromAPI() {
            console.log('🔄 Использую fallback: загрузка через MangaAPI');
            
            const container = document.getElementById('donationProjectsContainer');
            const allManga = window.MangaAPI.getAllManga();

            if (!allManga || allManga.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📚</div>
                        <div class="empty-title">Пока нет проектов</div>
                        <div class="empty-text">Тайтлы для поддержки появятся здесь</div>
                        <a href="catalog.html" class="empty-action">
                            <span>🔍</span>
                            Открыть каталог
                        </a>
                    </div>
                `;
                return;
            }

            // Фильтруем манга с неполными донатами
            const activeProjects = allManga.filter(manga => {
                const current = manga.currentDonations || 0;
                const goal = manga.donationGoal || 10000;
                const progress = (current / goal) * 100;
                return progress < 100;
            }).slice(0, 6);

            if (activeProjects.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🎉</div>
                        <div class="empty-title">Все цели достигнуты!</div>
                        <div class="empty-text">Спасибо за поддержку проектов</div>
                    </div>
                `;
                return;
            }

            const projectsHTML = activeProjects.map(manga => renderDonationCard(manga)).join('');
            container.innerHTML = `
                <div class="donation-projects">
                    ${projectsHTML}
                </div>
            `;
        }

        // Рендер карточки донат-проекта (из админки)
        function renderDonationProjectCard(project) {
            if (!project) {
                console.error('❌ Попытка рендера пустого проекта');
                return '';
            }

            // Получаем данные манги для дополнительной информации
            const manga = window.MangaAPI ? window.MangaAPI.getMangaById(project.mangaId) : null;
            
            const progress = Math.min((project.currentAmount / project.goal) * 100, 100);
            const title = project.title || 'Неизвестный проект';
            const mangaTitle = manga ? manga.title : 'Неизвестная манга';
            const type = manga ? manga.type : 'Проект';
            const year = manga ? manga.year : '';
            
            // Приоритет изображений: проект > манга > placeholder
            const image = project.image || 
                         (manga ? manga.image : null) || 
                         `https://via.placeholder.com/60x80/8b5cf6/FFFFFF?text=${encodeURIComponent(title.charAt(0))}`;

            return `
                <div class="donation-card">
                    <div class="donation-header">
                        <img src="${image}" 
                             alt="${title}" 
                             class="donation-poster"
                             onerror="this.src='https://via.placeholder.com/60x80/8b5cf6/FFFFFF?text=${encodeURIComponent(title.charAt(0))}'">
                        <div class="donation-info">
                            <h3>${title}</h3>
                            <div class="donation-meta">${type}${year ? ` • ${year}` : ''}</div>
                            ${project.description ? `<div style="font-size: 0.75rem; color: var(--secondary-color); margin-top: 4px;">${project.description}</div>` : ''}
                        </div>
                    </div>
                    
                    <div class="donation-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-text">
                            <span>${project.currentAmount.toLocaleString()}₽</span>
                            <span>${project.goal.toLocaleString()}₽</span>
                        </div>
                    </div>

                    <div class="donation-input-group">
                        <input type="number" class="donation-input" 
                               placeholder="Сумма" min="10" max="50000" 
                               id="donationAmountProject${project.id}">
                        <button class="donate-btn" onclick="makeDonationToProject(${project.id})">💝 Донат</button>
                    </div>

                    <div class="donation-quick-buttons">
                        <button class="quick-donate-btn" onclick="quickDonateToProject(${project.id}, 100)">100₽</button>
                        <button class="quick-donate-btn" onclick="quickDonateToProject(${project.id}, 500)">500₽</button>
                        <button class="quick-donate-btn" onclick="quickDonateToProject(${project.id}, 1000)">1K₽</button>
                    </div>
                </div>
            `;
        }

        // Рендер карточки манги (старая система)
        function renderDonationCard(manga) {
            if (!manga) return '';

            const current = manga.currentDonations || 0;
            const goal = manga.donationGoal || 10000;
            const progress = Math.min((current / goal) * 100, 100);
            const title = manga.title || 'Неизвестный тайтл';
            const type = manga.type || 'Манга';
            const year = manga.year || 'N/A';
            const image = manga.image || `https://via.placeholder.com/60x80/FF6B35/FFFFFF?text=${encodeURIComponent(title.charAt(0))}`;

            return `
                <div class="donation-card">
                    <div class="donation-header">
                        <img src="${image}" 
                             alt="${title}" 
                             class="donation-poster"
                             onerror="this.src='https://via.placeholder.com/60x80/FF6B35/FFFFFF?text=${encodeURIComponent(title.charAt(0))}'">
                        <div class="donation-info">
                            <h3>${title}</h3>
                            <div class="donation-meta">${type} • ${year}</div>
                        </div>
                    </div>
                    
                    <div class="donation-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <div class="progress-text">
                            <span>${current.toLocaleString()}₽</span>
                            <span>${goal.toLocaleString()}₽</span>
                        </div>
                    </div>

                    <div class="donation-input-group">
                        <input type="number" class="donation-input" 
                               placeholder="Сумма" min="10" max="50000" 
                               id="donationAmount${manga.id}">
                        <button class="donate-btn" onclick="makeDonation('${manga.id}')">💝 Донат</button>
                    </div>

                    <div class="donation-quick-buttons">
                        <button class="quick-donate-btn" onclick="quickDonate('${manga.id}', 100)">100₽</button>
                        <button class="quick-donate-btn" onclick="quickDonate('${manga.id}', 500)">500₽</button>
                        <button class="quick-donate-btn" onclick="quickDonate('${manga.id}', 1000)">1K₽</button>
                    </div>
                </div>
            `;
        }

        // Функции для донатов в проекты (новая система)
        function quickDonateToProject(projectId, amount) {
            const input = document.getElementById(`donationAmountProject${projectId}`);
            if (input) {
                input.value = amount;
                makeDonationToProject(projectId);
            }
        }

        function makeDonationToProject(projectId) {
            const amountInput = document.getElementById(`donationAmountProject${projectId}`);
            const amount = parseInt(amountInput.value) || 0;

            if (amount < 10) {
                showNotification('Минимальная сумма: 10₽', 'error');
                return;
            }

            if (amount > 50000) {
                showNotification('Максимальная сумма: 50,000₽', 'error');
                return;
            }

            try {
                // Загружаем донат-проекты
                const donationProjects = JSON.parse(localStorage.getItem('lightfox_donation_projects') || '[]');
                const projectIndex = donationProjects.findIndex(p => p.id === projectId);
                
                if (projectIndex === -1) {
                    showNotification('Проект не найден', 'error');
                    return;
                }

                const project = donationProjects[projectIndex];
                
                // Обновляем сумму
                const newTotal = Math.min(project.currentAmount + amount, project.goal);
                donationProjects[projectIndex].currentAmount = newTotal;
                donationProjects[projectIndex].updatedAt = new Date().toISOString();
                
                // Сохраняем обновленные проекты
                localStorage.setItem('lightfox_donation_projects', JSON.stringify(donationProjects));
                
                // Сохраняем историю донатов
                const donationHistory = JSON.parse(localStorage.getItem('donationHistory') || '[]');
                donationHistory.push({
                    projectId: projectId,
                    projectTitle: project.title,
                    mangaId: project.mangaId,
                    amount: amount,
                    timestamp: new Date().toISOString()
                });
                localStorage.setItem('donationHistory', JSON.stringify(donationHistory));

                // Очищаем поле ввода
                amountInput.value = '';

                // Перезагружаем проекты
                loadDonationProjects();

                showNotification(`Спасибо! Добавлено ${amount.toLocaleString()}₽ в "${project.title}"`, 'success');
                
                // Уведомляем о обновлении
                window.dispatchEvent(new CustomEvent('donationUpdate', {
                    detail: { projectId, newAmount: newTotal }
                }));

            } catch (error) {
                console.error('❌ Ошибка при донате в проект:', error);
                showNotification('Ошибка обработки доната', 'error');
            }
        }

        // Функции для донатов в манга (старая система)
        function quickDonate(mangaId, amount) {
            const input = document.getElementById(`donationAmount${mangaId}`);
            if (input) {
                input.value = amount;
                makeDonation(mangaId);
            }
        }

        function makeDonation(mangaId) {
            const amountInput = document.getElementById(`donationAmount${mangaId}`);
            const amount = parseInt(amountInput.value) || 0;

            if (amount < 10) {
                showNotification('Минимальная сумма: 10₽', 'error');
                return;
            }

            if (amount > 50000) {
                showNotification('Максимальная сумма: 50,000₽', 'error');
                return;
            }

            if (window.MangaAPI) {
                const manga = window.MangaAPI.getMangaById(mangaId);
                if (manga) {
                    const newTotal = Math.min((manga.currentDonations || 0) + amount, manga.donationGoal || 10000);
                    
                    const updated = window.MangaAPI.updateManga(mangaId, {
                        currentDonations: newTotal
                    });

                    if (updated) {
                        const donationHistory = JSON.parse(localStorage.getItem('donationHistory') || '[]');
                        donationHistory.push({
                            mangaId: mangaId,
                            mangaTitle: manga.title,
                            amount: amount,
                            timestamp: new Date().toISOString()
                        });
                        localStorage.setItem('donationHistory', JSON.stringify(donationHistory));

                        amountInput.value = '';
                        loadDonationProjects();

                        showNotification(`Спасибо! Добавлено ${amount.toLocaleString()}₽`, 'success');
                        
                        window.dispatchEvent(new CustomEvent('mangaDataUpdate', {
                            detail: { mangaId, newDonations: newTotal }
                        }));
                    } else {
                        showNotification('Ошибка обновления', 'error');
                    }
                } else {
                    showNotification('Тайтл не найден', 'error');
                }
            } else {
                showNotification('API недоступен', 'error');
            }
        }

        // Section navigation
        function openSection(sectionName) {
            currentSection = sectionName;
            
            document.getElementById('dashboard-view').style.display = 'none';
            document.getElementById('section-detail').classList.add('active');
            
            const titles = {
                favorites: 'Избранное',
                watching: 'Смотрю',
                wantToWatch: 'Хочу посмотреть',
                completed: 'Досмотрел'
            };
            document.getElementById('sectionTitle').textContent = titles[sectionName] || sectionName;
            
            loadSectionContent(sectionName);
        }

        function backToDashboard() {
            document.getElementById('dashboard-view').style.display = 'block';
            document.getElementById('section-detail').classList.remove('active');
            currentSection = null;
        }

        // Load section content
        function loadSectionContent(sectionName) {
            const container = document.getElementById('sectionContent');
            const items = userLists[sectionName] || [];

            if (items.length === 0) {
                const emptyStates = {
                    favorites: {
                        icon: '❤️',
                        title: 'Нет избранных тайтлов',
                        text: 'Добавляйте тайтлы в избранное из каталога или плеера'
                    },
                    watching: {
                        icon: '▶️',
                        title: 'Не читаете тайтлы',
                        text: 'Начните читать тайтлы и они появятся здесь'
                    },
                    wantToWatch: {
                        icon: '📚',
                        title: 'Список пуст',
                        text: 'Добавляйте интересные тайтлы в планы'
                    },
                    completed: {
                        icon: '✅',
                        title: 'Нет завершенных',
                        text: 'Прочитанные тайтлы будут отображаться здесь'
                    }
                };

                const state = emptyStates[sectionName];
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">${state.icon}</div>
                        <div class="empty-title">${state.title}</div>
                        <div class="empty-text">${state.text}</div>
                        <a href="catalog.html" class="empty-action">
                            <span>🔍</span>
                            Открыть каталог
                        </a>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div class="manga-grid">
                    ${items.map(item => renderMangaCard(item)).join('')}
                </div>
            `;
        }

        // Render manga card for lists
        function renderMangaCard(item) {
            let manga = item;
            if (window.MangaAPI && item.mangaId) {
                const apiData = window.MangaAPI.getMangaById(item.mangaId);
                if (apiData) {
                    manga = { ...item, ...apiData };
                }
            }

            return `
                <div class="manga-card" onclick="openManga(${manga.mangaId || manga.id})">
                    <div class="manga-poster-container">
                        <img src="${manga.image || 'https://via.placeholder.com/180x240/FF6B35/FFFFFF?text=' + encodeURIComponent((manga.title || '').charAt(0))}" 
                             alt="${manga.title}" class="manga-poster">
                        ${manga.currentEpisode ? `<div class="manga-badge">Серия ${manga.currentEpisode}</div>` : ''}
                    </div>
                    
                    <div class="manga-info">
                        <div class="manga-title">${manga.title}</div>
                        <div class="manga-meta">
                            ${manga.type || 'Манга'} • ⭐ ${manga.rating || 'N/A'}
                        </div>
                        
                        <div class="manga-actions">
                            <button class="action-btn primary" onclick="event.stopPropagation(); openManga(${manga.mangaId || manga.id})">
                                Читать
                            </button>
                            <button class="action-btn" onclick="event.stopPropagation(); removeFromList('${currentSection}', ${item.id || item.mangaId})">
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        // User actions
        function openManga(mangaId) {
            if (mangaId && mangaId !== 'undefined') {
                window.location.href = `player.html?id=${mangaId}`;
            } else {
                showNotification('Тайтл не найден', 'error');
            }
        }

        function removeFromList(listName, itemId) {
            const list = userLists[listName];
            const index = list.findIndex(item => (item.id || item.mangaId) === itemId);
            
            if (index !== -1) {
                list.splice(index, 1);
                localStorage.setItem(listName, JSON.stringify(list));
                updateCounts();
                
                if (currentSection === listName) {
                    loadSectionContent(listName);
                }
                
                showNotification('Удалено из списка', 'success');
            }
        }

        // Utility functions
        function showNotification(message, type = 'success') {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.className = `notification show ${type}`;
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }

        // === ИНИЦИАЛИЗАЦИЯ И ОБРАБОТЧИКИ СОБЫТИЙ ===
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🎯 DOM загружен, начинаем инициализацию...');
            
            // Theme toggles
            document.getElementById('themeToggle').addEventListener('click', toggleTheme);
            document.getElementById('mobileThemeToggle').addEventListener('click', toggleTheme);

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

            // Запускаем инициализацию кабинета
            initializeCabinet();

            // Listen for storage updates from other pages
            window.addEventListener('storage', function(e) {
                if (['favorites', 'watching', 'wantToWatch', 'completed'].includes(e.key)) {
                    loadUserLists();
                    updateCounts();
                    if (currentSection) {
                        loadSectionContent(currentSection);
                    }
                }
            });
        });

        // Listen for data ready event
        window.addEventListener('mangaDataReady', function(e) {
            console.log('📡 Получено событие mangaDataReady');
            loadDonationProjects();
        });

        window.addEventListener('mangaDataUpdate', function(e) {
            console.log('📡 Получено событие mangaDataUpdate');
            loadDonationProjects();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeMenu();
            }
        });

        // Экспорт функций для onclick
        window.openSection = openSection;
        window.backToDashboard = backToDashboard;
        window.openManga = openManga;
        window.removeFromList = removeFromList;
        window.makeDonation = makeDonation;
        window.quickDonate = quickDonate;
        window.makeDonationToProject = makeDonationToProject;
        window.quickDonateToProject = quickDonateToProject;
        window.openRandomManga = openRandomManga;
        window.login = login;
        window.logout = logout;
        window.closeMenu = closeMenu;

        console.log('🎉 Исправленный личный кабинет с поддержкой донат-проектов готов!');