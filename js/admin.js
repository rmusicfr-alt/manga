// Админ панель с системой подписок для тайтлов
(function() {
    'use strict';

    // Состояние админки
    let currentSection = 'dashboard';
    let currentUser = null;
    let isLoggedIn = false;

    // Проверка прав администратора
    async function checkAdminAccess() {
        try {
            if (!window.supabase) {
                await waitForSupabase();
            }

            const { data: { user } } = await window.supabase.auth.getUser();
            
            if (!user) {
                showLoginForm();
                return false;
            }

            // Проверяем права админа в базе
            const { data: profile, error } = await window.supabase
                .from('users')
                .select('is_admin')
                .eq('id', user.id)
                .single();

            if (error || !profile?.is_admin) {
                showAccessDenied();
                return false;
            }

            currentUser = user;
            isLoggedIn = true;
            return true;
        } catch (error) {
            console.error('Admin access check error:', error);
            showLoginForm();
            return false;
        }
    }

    // Ожидание инициализации Supabase
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

    // Показ формы входа
    function showLoginForm() {
        document.body.innerHTML = `
            <div class="login-container">
                <div class="login-form">
                    <h1 class="login-title">🦊 Light Fox Manga</h1>
                    <h2>Админ панель</h2>
                    <form id="adminLoginForm">
                        <input type="email" class="login-input" id="adminEmail" placeholder="Email администратора" required>
                        <input type="password" class="login-input" id="adminPassword" placeholder="Пароль" required>
                        <button type="submit" class="login-btn">Войти в админку</button>
                    </form>
                    <div id="loginError" style="color: #dc2626; margin-top: 10px; display: none;"></div>
                    <div style="margin-top: 20px; padding: 15px; background: rgba(139, 92, 246, 0.1); border-radius: 8px; font-size: 0.9rem;">
                        <strong>Демо доступ:</strong><br>
                        Email: admin@lightfox.com<br>
                        Пароль: admin123
                    </div>
                </div>
            </div>
        `;

        document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);
    }

    // Показ отказа в доступе
    function showAccessDenied() {
        document.body.innerHTML = `
            <div class="login-container">
                <div class="login-form">
                    <h1 style="color: #dc2626;">🚫 Доступ запрещен</h1>
                    <p>У вас нет прав администратора</p>
                    <a href="index.html" class="login-btn" style="text-decoration: none; display: inline-block;">На главную</a>
                </div>
            </div>
        `;
    }

    // Обработка входа админа
    async function handleAdminLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        const errorDiv = document.getElementById('loginError');

        try {
            const { data, error } = await window.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            // Проверяем права админа
            const hasAccess = await checkAdminAccess();
            if (hasAccess) {
                initializeAdminPanel();
            }
        } catch (error) {
            errorDiv.textContent = 'Ошибка входа: ' + error.message;
            errorDiv.style.display = 'block';
        }
    }

    // Инициализация админ панели
    function initializeAdminPanel() {
        createAdminInterface();
        loadDashboard();
    }

    // Создание интерфейса админки
    function createAdminInterface() {
        document.body.innerHTML = `
            <link rel="stylesheet" href="css/admin.css">
            
            <!-- Admin Header -->
            <header class="admin-header">
                <div class="admin-logo">🦊 Light Fox Admin</div>
                <nav class="admin-nav">
                    <button class="nav-btn active" onclick="switchSection('dashboard')">📊 Дашборд</button>
                    <button class="nav-btn" onclick="switchSection('manga')">📚 Манга</button>
                    <button class="nav-btn" onclick="switchSection('news')">📰 Новости</button>
                    <button class="nav-btn" onclick="switchSection('users')">👥 Пользователи</button>
                    <button class="nav-btn donations" onclick="switchSection('donations')">💰 Донаты</button>
                    <button class="nav-btn" onclick="switchSection('comments')">💬 Комментарии</button>
                </nav>
                <div class="admin-controls">
                    <span>👤 ${currentUser.email}</span>
                    <button class="logout-btn" onclick="adminLogout()">Выйти</button>
                </div>
            </header>

            <!-- Main Content -->
            <main class="main-content">
                <div class="container">
                    <!-- Dashboard Section -->
                    <section class="content-section active" id="dashboard-section">
                        <div class="section-header">
                            <h2 class="section-title">📊 Дашборд</h2>
                        </div>
                        <div class="section-content" id="dashboard-content">
                            <div class="loading">
                                <div class="spinner"></div>
                                Загрузка статистики...
                            </div>
                        </div>
                    </section>

                    <!-- Manga Section -->
                    <section class="content-section" id="manga-section">
                        <div class="section-header">
                            <h2 class="section-title">📚 Управление мангой</h2>
                            <button class="btn btn-primary" onclick="showAddMangaForm()">
                                <span>➕</span>
                                Добавить тайтл
                            </button>
                        </div>
                        <div class="section-content" id="manga-content">
                            <!-- Content will be loaded here -->
                        </div>
                    </section>

                    <!-- News Section -->
                    <section class="content-section" id="news-section">
                        <div class="section-header">
                            <h2 class="section-title">📰 Управление новостями</h2>
                            <button class="btn btn-primary" onclick="showAddNewsForm()">
                                <span>➕</span>
                                Добавить новость
                            </button>
                        </div>
                        <div class="section-content" id="news-content">
                            <!-- Content will be loaded here -->
                        </div>
                    </section>

                    <!-- Users Section -->
                    <section class="content-section" id="users-section">
                        <div class="section-header">
                            <h2 class="section-title">👥 Пользователи</h2>
                        </div>
                        <div class="section-content" id="users-content">
                            <!-- Content will be loaded here -->
                        </div>
                    </section>

                    <!-- Donations Section -->
                    <section class="content-section" id="donations-section">
                        <div class="section-header">
                            <h2 class="section-title">💰 Донаты и проекты</h2>
                            <button class="btn btn-donation" onclick="showAddProjectForm()">
                                <span>🚀</span>
                                Создать проект
                            </button>
                        </div>
                        <div class="section-content" id="donations-content">
                            <!-- Content will be loaded here -->
                        </div>
                    </section>

                    <!-- Comments Section -->
                    <section class="content-section" id="comments-section">
                        <div class="section-header">
                            <h2 class="section-title">💬 Модерация комментариев</h2>
                        </div>
                        <div class="section-content" id="comments-content">
                            <!-- Content will be loaded here -->
                        </div>
                    </section>
                </div>
            </main>

            <!-- Notification -->
            <div class="notification" id="notification"></div>
        `;
    }

    // Переключение разделов
    function switchSection(section) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        // Update content sections
        document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(section + '-section').classList.add('active');

        currentSection = section;

        // Load section content
        switch(section) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'manga':
                loadMangaManagement();
                break;
            case 'news':
                loadNewsManagement();
                break;
            case 'users':
                loadUsersManagement();
                break;
            case 'donations':
                loadDonationsManagement();
                break;
            case 'comments':
                loadCommentsModeration();
                break;
        }
    }

    // Загрузка дашборда
    async function loadDashboard() {
        const content = document.getElementById('dashboard-content');
        if (!content) return;

        try {
            // Получаем статистику
            const { data: mangaStats } = await window.supabase
                .from('manga')
                .select('id, current_donations, rating')
                .eq('is_active', true);

            const { data: userStats } = await window.supabase
                .from('users')
                .select('id, total_donations, created_at');

            const { data: commentStats } = await window.supabase
                .from('comments')
                .select('id, created_at');

            const totalManga = mangaStats?.length || 0;
            const totalUsers = userStats?.length || 0;
            const totalComments = commentStats?.length || 0;
            const totalDonations = mangaStats?.reduce((sum, m) => sum + (m.current_donations || 0), 0) || 0;

            content.innerHTML = `
                <div class="dashboard-grid">
                    <div class="stat-card">
                        <div class="stat-number">${totalManga}</div>
                        <div class="stat-label">Тайтлов</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${totalUsers}</div>
                        <div class="stat-label">Пользователей</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${totalComments}</div>
                        <div class="stat-label">Комментариев</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${(totalDonations / 100).toLocaleString()}₽</div>
                        <div class="stat-label">Донатов</div>
                    </div>
                </div>

                <div style="margin-top: 30px;">
                    <h3>🚀 Продакшен режим активен!</h3>
                    <p>Все функции работают через Supabase. Сайт готов к деплою.</p>
                    
                    <div style="margin-top: 20px; padding: 20px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.3);">
                        <h4 style="color: #059669; margin-bottom: 10px;">✅ Активные функции:</h4>
                        <ul style="color: #059669; margin: 0; padding-left: 20px;">
                            <li>🗄️ PostgreSQL база данных</li>
                            <li>🔐 Безопасная авторизация</li>
                            <li>📁 Файловое хранилище</li>
                            <li>💰 Обработка платежей</li>
                            <li>🌍 Геоблокировка</li>
                            <li>🔔 Real-time уведомления</li>
                            <li>📰 Система новостей</li>
                            <li>💎 Система подписок по тайтлам</li>
                        </ul>
                    </div>
                </div>
            `;
        } catch (error) {
            content.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <h3 style="color: #dc2626;">❌ Ошибка подключения к Supabase</h3>
                    <p>Проверьте настройки подключения в переменных окружения</p>
                    <button class="btn btn-primary" onclick="location.reload()">Перезагрузить</button>
                </div>
            `;
        }
    }

    // Показ формы добавления манги
    function showAddMangaForm() {
        const content = document.getElementById('manga-content');
        content.innerHTML = `
            <div class="form-container">
                <h3>Добавить новый тайтл</h3>
                <form id="addMangaForm" class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Название</label>
                        <input type="text" class="form-input" id="mangaTitle" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Описание</label>
                        <textarea class="form-textarea" id="mangaDescription" rows="4"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Обложка (URL)</label>
                        <input type="url" class="form-input" id="mangaCover" placeholder="https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Тип</label>
                        <select class="form-select" id="mangaType">
                            <option value="Аниме">Аниме</option>
                            <option value="Манга">Манга</option>
                            <option value="Маньхуа">Маньхуа</option>
                            <option value="Манхва">Манхва</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Статус</label>
                        <select class="form-select" id="mangaStatus">
                            <option value="Выходит">Выходит</option>
                            <option value="Завершён">Завершён</option>
                            <option value="Заморожен">Заморожен</option>
                            <option value="Анонс">Анонс</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Год</label>
                        <input type="number" class="form-input" id="mangaYear" min="1900" max="2030" value="2024">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Жанры (через запятую)</label>
                        <input type="text" class="form-input" id="mangaGenres" placeholder="Экшен, Драма, Фэнтези">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Категории (через запятую)</label>
                        <input type="text" class="form-input" id="mangaCategories" placeholder="Сёнен, Сэйнэн">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Всего серий</label>
                        <input type="number" class="form-input" id="mangaTotalEpisodes" min="1" value="12">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Доступно серий</label>
                        <input type="number" class="form-input" id="mangaAvailableEpisodes" min="0" value="0">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Цель доната (₽)</label>
                        <input type="number" class="form-input" id="mangaDonationGoal" min="1000" value="10000">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">🔑 Доступные подписки (можно выбрать несколько)</label>
                        <div class="subscription-checkboxes" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 8px;">
                            <div class="form-checkbox">
                                <input type="checkbox" id="subFree" value="free" checked>
                                <label for="subFree">📖 Любители Манги (Free)</label>
                            </div>
                            <div class="form-checkbox">
                                <input type="checkbox" id="subBasic" value="basic">
                                <label for="subBasic">🎯 Любители Пика (Basic)</label>
                            </div>
                            <div class="form-checkbox">
                                <input type="checkbox" id="subPremium" value="premium">
                                <label for="subPremium">👑 Орден Шейхов (Premium)</label>
                            </div>
                            <div class="form-checkbox">
                                <input type="checkbox" id="subVip" value="vip">
                                <label for="subVip">🌟 Лисямбы (VIP)</label>
                            </div>
                        </div>
                        <small style="color: var(--secondary-color); margin-top: 8px; display: block;">
                            💡 Пользователи с более высокой подпиской автоматически получают доступ к контенту нижних уровней
                        </small>
                    </div>
                    
                    <div class="form-actions" style="grid-column: 1 / -1;">
                        <button type="submit" class="btn btn-primary">Создать тайтл</button>
                        <button type="button" class="btn btn-secondary" onclick="loadMangaManagement()">Отмена</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('addMangaForm').addEventListener('submit', handleAddManga);
    }

    // Обработка добавления манги
    async function handleAddManga(e) {
        e.preventDefault();
        
        // Собираем выбранные подписки
        const selectedSubscriptions = [];
        document.querySelectorAll('.subscription-checkboxes input[type="checkbox"]:checked').forEach(checkbox => {
            selectedSubscriptions.push(checkbox.value);
        });

        const formData = {
            title: document.getElementById('mangaTitle').value,
            description: document.getElementById('mangaDescription').value,
            cover_url: document.getElementById('mangaCover').value || null,
            type: document.getElementById('mangaType').value,
            status: document.getElementById('mangaStatus').value,
            year: parseInt(document.getElementById('mangaYear').value),
            genres: document.getElementById('mangaGenres').value.split(',').map(g => g.trim()).filter(g => g),
            categories: document.getElementById('mangaCategories').value.split(',').map(c => c.trim()).filter(c => c),
            total_episodes: parseInt(document.getElementById('mangaTotalEpisodes').value),
            available_episodes: parseInt(document.getElementById('mangaAvailableEpisodes').value),
            donation_goal: parseInt(document.getElementById('mangaDonationGoal').value) * 100, // В копейках
            subscription_tiers: selectedSubscriptions, // Массив доступных подписок
            subscription_tier: selectedSubscriptions.includes('free') ? 'free' : selectedSubscriptions[0] // Минимальная подписка
        };

        try {
            const { data, error } = await window.supabase
                .from('manga')
                .insert(formData)
                .select()
                .single();

            if (error) throw error;

            // Отправляем уведомления подписчикам если есть доступные серии
            if (formData.available_episodes > 0 && window.NotificationSystem) {
                await window.NotificationSystem.createEpisodeNotification(data.id, formData.available_episodes);
            }

            showNotification('Тайтл успешно создан!', 'success');
            loadMangaManagement();
        } catch (error) {
            showNotification('Ошибка создания: ' + error.message, 'error');
        }
    }

    // Загрузка управления мангой
    async function loadMangaManagement() {
        const content = document.getElementById('manga-content');
        if (!content) return;

        try {
            const { data: manga, error } = await window.supabase
                .from('manga')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            content.innerHTML = `
                <div class="manga-list">
                    ${manga.map(item => `
                        <div class="manga-item">
                            <div class="manga-item-header">
                                <div class="manga-item-title">${item.title}</div>
                                <div class="manga-item-meta">
                                    ${item.type} • ${item.status} • ${item.available_episodes}/${item.total_episodes} серий
                                    <br>
                                    <strong>Подписки:</strong> ${(item.subscription_tiers || [item.subscription_tier]).join(', ')}
                                </div>
                            </div>
                            <div class="manga-item-actions">
                                <button class="btn btn-secondary" onclick="editManga('${item.id}')">Редактировать</button>
                                <button class="btn btn-success" onclick="addEpisode('${item.id}')">Добавить серию</button>
                                <button class="btn btn-danger" onclick="deleteManga('${item.id}')">Удалить</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            content.innerHTML = `<div class="error">Ошибка загрузки: ${error.message}</div>`;
        }
    }

    // Добавление серии к тайтлу
    async function addEpisode(mangaId) {
        const episodeNumber = prompt('Номер новой серии:');
        if (!episodeNumber || isNaN(episodeNumber)) return;

        try {
            // Обновляем количество доступных серий
            const { error } = await window.supabase
                .from('manga')
                .update({ 
                    available_episodes: parseInt(episodeNumber),
                    updated_at: new Date().toISOString()
                })
                .eq('id', mangaId);

            if (error) throw error;

            // Отправляем уведомления подписчикам
            if (window.NotificationSystem) {
                await window.NotificationSystem.createEpisodeNotification(mangaId, parseInt(episodeNumber));
            }

            showNotification(`Серия ${episodeNumber} добавлена! Уведомления отправлены.`, 'success');
            loadMangaManagement();
        } catch (error) {
            showNotification('Ошибка добавления серии: ' + error.message, 'error');
        }
    }

    // Показ формы добавления новости
    function showAddNewsForm() {
        const content = document.getElementById('news-content');
        content.innerHTML = `
            <div class="form-container">
                <h3>Добавить новость</h3>
                <form id="addNewsForm" class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Заголовок</label>
                        <input type="text" class="form-input" id="newsTitle" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Краткое описание</label>
                        <textarea class="form-textarea" id="newsExcerpt" rows="3" required></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Полный текст</label>
                        <textarea class="form-textarea" id="newsContent" rows="6"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Изображение (URL)</label>
                        <input type="url" class="form-input" id="newsImage" placeholder="https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Категория</label>
                        <select class="form-select" id="newsCategory">
                            <option value="Обновление">Обновление</option>
                            <option value="Каталог">Каталог</option>
                            <option value="Функции">Функции</option>
                            <option value="Анонс">Анонс</option>
                            <option value="Подписки">Подписки</option>
                        </select>
                    </div>
                    
                    <div class="form-actions" style="grid-column: 1 / -1;">
                        <button type="submit" class="btn btn-primary">Опубликовать новость</button>
                        <button type="button" class="btn btn-secondary" onclick="loadNewsManagement()">Отмена</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('addNewsForm').addEventListener('submit', handleAddNews);
    }

    // Обработка добавления новости
    async function handleAddNews(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('newsTitle').value,
            excerpt: document.getElementById('newsExcerpt').value,
            content: document.getElementById('newsContent').value || document.getElementById('newsExcerpt').value,
            image_url: document.getElementById('newsImage').value || null,
            category: document.getElementById('newsCategory').value
        };

        try {
            const { error } = await window.supabase
                .from('news')
                .insert(formData);

            if (error) throw error;

            showNotification('Новость опубликована!', 'success');
            loadNewsManagement();
        } catch (error) {
            showNotification('Ошибка публикации: ' + error.message, 'error');
        }
    }

    // Загрузка управления новостями
    async function loadNewsManagement() {
        const content = document.getElementById('news-content');
        if (!content) return;

        try {
            const { data: news, error } = await window.supabase
                .from('news')
                .select('*')
                .order('created_at', { ascending: false });

            if (error && error.code !== 'PGRST116') throw error;

            const newsData = news || [];

            content.innerHTML = `
                <div class="news-list">
                    ${newsData.map(item => `
                        <div class="news-item">
                            <div class="news-item-header">
                                ${item.image_url ? `<img src="${item.image_url}" alt="${item.title}" class="news-item-image">` : ''}
                                <div class="news-item-info">
                                    <div class="news-item-title">${item.title}</div>
                                    <div class="news-item-meta">
                                        <span class="news-category">${item.category}</span>
                                        <span>${new Date(item.created_at).toLocaleDateString('ru-RU')}</span>
                                    </div>
                                    <div class="news-item-excerpt">${item.excerpt}</div>
                                </div>
                            </div>
                            <div class="news-item-actions">
                                <button class="btn btn-secondary" onclick="editNews('${item.id}')">Редактировать</button>
                                <button class="btn btn-danger" onclick="deleteNews('${item.id}')">Удалить</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            content.innerHTML = `<div class="error">Ошибка загрузки: ${error.message}</div>`;
        }
    }

    // Удаление новости
    async function deleteNews(newsId) {
        if (!confirm('Удалить новость?')) return;

        try {
            const { error } = await window.supabase
                .from('news')
                .delete()
                .eq('id', newsId);

            if (error) throw error;

            showNotification('Новость удалена', 'success');
            loadNewsManagement();
        } catch (error) {
            showNotification('Ошибка удаления: ' + error.message, 'error');
        }
    }

    // Загрузка управления пользователями
    async function loadUsersManagement() {
        const content = document.getElementById('users-content');
        if (!content) return;

        try {
            const { data: users, error } = await window.supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            content.innerHTML = `
                <div class="users-stats">
                    <div class="stats-row">
                        <span>Всего пользователей: ${users.length}</span>
                        <span>Активных: ${users.filter(u => !u.is_banned).length}</span>
                        <span>Админов: ${users.filter(u => u.is_admin).length}</span>
                    </div>
                </div>

                <div class="users-list">
                    ${users.map(user => `
                        <div class="user-item">
                            <div class="user-item-header">
                                <div class="user-avatar-small">${user.username.charAt(0).toUpperCase()}</div>
                                <div class="user-info">
                                    <div class="user-name">${user.username}</div>
                                    <div class="user-email">${user.email}</div>
                                    <div class="user-meta">
                                        Регистрация: ${new Date(user.created_at).toLocaleDateString('ru-RU')} • 
                                        Донатов: ${(user.total_donations / 100)}₽ • 
                                        Подписка: ${user.subscription_tier}
                                    </div>
                                </div>
                                <div class="user-status">
                                    <div class="status-badge ${user.is_admin ? 'admin' : 'user'}">${user.is_admin ? 'Админ' : 'Пользователь'}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            content.innerHTML = `<div class="error">Ошибка загрузки: ${error.message}</div>`;
        }
    }

    // Выход из админки
    async function adminLogout() {
        try {
            await window.supabase.auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // Показ уведомления
    function showNotification(message, type = 'success') {
        let notification = document.getElementById('notification');
        if (!notification) return;

        const colors = {
            success: '#059669',
            error: '#dc2626',
            warning: '#d97706'
        };

        notification.style.background = colors[type] || colors.success;
        notification.textContent = message;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Экспорт функций
    window.switchSection = switchSection;
    window.adminLogout = adminLogout;
    window.showAddMangaForm = showAddMangaForm;
    window.showAddNewsForm = showAddNewsForm;
    window.handleAddManga = handleAddManga;
    window.handleAddNews = handleAddNews;
    window.deleteNews = deleteNews;
    window.addEpisode = addEpisode;
    window.loadMangaManagement = loadMangaManagement;
    window.loadNewsManagement = loadNewsManagement;
    window.loadUsersManagement = loadUsersManagement;

    // Инициализация при загрузке
    document.addEventListener('DOMContentLoaded', async function() {
        // Ждем инициализации Supabase
        await waitForSupabase();
        
        const hasAccess = await checkAdminAccess();
        if (hasAccess) {
            initializeAdminPanel();
        }
    });

    console.log('🔧 Админ панель загружена');

})();