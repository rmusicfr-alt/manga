        // State
        let episodes = [];
        let episodeIdCounter = 1;
        let editingManga = null;
        let editingDonation = null;
        let isAuthenticated = false;
        let donationProjects = [];
        let donationIdCounter = 1;

        // Load donation projects from localStorage
        function loadDonationProjects() {
            const saved = localStorage.getItem('lightfox_donation_projects');
            if (saved) {
                try {
                    donationProjects = JSON.parse(saved);
                    donationIdCounter = Math.max(...donationProjects.map(p => p.id || 0), 0) + 1;
                } catch (e) {
                    console.error('Error loading donation projects:', e);
                    donationProjects = [];
                }
            }
        }

        // Save donation projects to localStorage
        function saveDonationProjects() {
            try {
                localStorage.setItem('lightfox_donation_projects', JSON.stringify(donationProjects));
            } catch (e) {
                console.error('Error saving donation projects:', e);
            }
        }

        // Status color mapping function
        function getStatusClass(status) {
            const statusMap = {
                'Завершён': 'completed',
                'Завершен': 'completed',
                'Выходит': 'ongoing',
                'Продолжается': 'ongoing',
                'Заморожен': 'paused',
                'Анонс': 'announced',
                'Лицензировано': 'licensed',
                'Лицензия': 'licensed',
                'active': 'active',
                'completed': 'completed',
                'paused': 'paused'
            };
            return statusMap[status] || '';
        }

        // Authentication
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const password = document.getElementById('passwordInput').value;
            
            if (password === 'admin123') {
                isAuthenticated = true;
                document.getElementById('loginScreen').style.display = 'none';
                document.getElementById('adminPanel').style.display = 'block';
                initializeAdmin();
            } else {
                showNotification('Неверный пароль!', 'error');
            }
        });

        // Initialize admin panel
        function initializeAdmin() {
            loadDataSystem().then(() => {
                loadDonationProjects();
                loadDashboard();
                loadMangaList();
                loadDonationProjectsList();
                setupEventListeners();
                console.log('🔥 Админка с управлением донатами загружена!');
            });
        }

        // Setup event listeners
        function setupEventListeners() {
            // Form submission
            document.getElementById('mangaForm').addEventListener('submit', function(e) {
                e.preventDefault();
                saveManga();
            });

            // Donation form submission
            document.getElementById('donationForm').addEventListener('submit', function(e) {
                e.preventDefault();
                saveDonationProject();
            });

            // Genre input
            document.getElementById('genreInput').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag('genre', this.value.trim());
                    this.value = '';
                }
            });

            // Category input
            document.getElementById('categoryInput').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag('category', this.value.trim());
                    this.value = '';
                }
            });

            // Chapters preview update
            document.getElementById('availableChapters').addEventListener('input', updateChaptersPreview);
            document.getElementById('totalChapters').addEventListener('input', updateChaptersPreview);

            // Use default image checkbox
            document.getElementById('useDefaultImage').addEventListener('change', function() {
                if (this.checked) {
                    document.getElementById('donationProjectImage').value = '';
                    document.getElementById('donationImagePreview').innerHTML = '';
                }
            });
        }

        // Section navigation
        function showSection(sectionName) {
            // Update nav buttons
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');

            // Hide all sections
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });

            // Show selected section
            document.getElementById(sectionName + '-section').classList.add('active');

            // Load section data
            if (sectionName === 'dashboard') {
                loadDashboard();
            } else if (sectionName === 'manga-list') {
                loadMangaList();
            } else if (sectionName === 'donations') {
                loadDonationProjectsList();
                loadMangaSelectOptions();
            }
        }

        // Dashboard functions
        function loadDashboard() {
            if (!window.MangaAPI) return;

            const stats = window.MangaAPI.getStats();
            const allManga = window.MangaAPI.getAllManga();
            
            // Add donation stats
            const totalDonationGoal = donationProjects.reduce((sum, project) => sum + (project.goal || 0), 0);
            const totalDonationCurrent = donationProjects.reduce((sum, project) => sum + (project.currentAmount || 0), 0);
            
            document.getElementById('dashboardStats').innerHTML = `
                <div class="stat-card">
                    <div class="stat-number">${stats.totalManga}</div>
                    <div class="stat-label">Всего тайтлов</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.totalEpisodes}</div>
                    <div class="stat-label">Всего серий</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.averageRating.toFixed(1)}</div>
                    <div class="stat-label">Средний рейтинг</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${donationProjects.length}</div>
                    <div class="stat-label">Донат-проектов</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${totalDonationCurrent.toLocaleString()}₽</div>
                    <div class="stat-label">Собрано донатов</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${totalDonationGoal.toLocaleString()}₽</div>
                    <div class="stat-label">Цель донатов</div>
                </div>
            `;
        }

        // Manga list functions
        function loadMangaList() {
            if (!window.MangaAPI) return;

            const allManga = window.MangaAPI.getAllManga();
            const container = document.getElementById('mangaList');

            if (allManga.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                        <h3>Нет тайтлов</h3>
                        <p>Добавьте первый тайтл через форму</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = allManga.map(manga => `
                <div class="manga-item">
                    <div class="manga-item-header">
                        <div class="manga-item-title">${manga.title}</div>
                        <div class="manga-item-meta">
                            ${manga.type} • <span class="status-badge ${getStatusClass(manga.status)}">${manga.status}</span> • Главы: ${manga.availableEpisodes || 0}/${manga.totalEpisodes || 0}
                        </div>
                    </div>
                    <div class="manga-item-actions">
                        <button class="btn btn-primary" onclick="editManga('${manga.id}')">✏️ Редактировать</button>
                        <button class="btn btn-danger" onclick="deleteManga('${manga.id}')">🗑️ Удалить</button>
                    </div>
                </div>
            `).join('');
        }

        // Donation Projects Functions
        function loadMangaSelectOptions() {
            if (!window.MangaAPI) return;

            const allManga = window.MangaAPI.getAllManga();
            const select = document.getElementById('donationMangaSelect');
            
            select.innerHTML = '<option value="">Выберите тайтл</option>';
            allManga.forEach(manga => {
                select.innerHTML += `<option value="${manga.id}">${manga.title}</option>`;
            });
        }

        function showAddDonationForm() {
            document.getElementById('donationFormContainer').style.display = 'block';
            document.getElementById('donationFormTitle').innerHTML = '<span>🎯</span> Создать донат-проект';
            editingDonation = null;
            resetDonationForm();
            loadMangaSelectOptions();
        }

        function hideDonationForm() {
            document.getElementById('donationFormContainer').style.display = 'none';
            editingDonation = null;
            resetDonationForm();
        }

        function resetDonationForm() {
            document.getElementById('donationForm').reset();
            document.getElementById('donationProjectGoal').value = 10000;
            document.getElementById('donationCurrentAmount').value = 0;
            document.getElementById('donationPriority').value = 5;
            document.getElementById('useDefaultImage').checked = true;
            document.getElementById('donationImagePreview').innerHTML = '';
        }

        function saveDonationProject() {
            try {
                const mangaId = document.getElementById('donationMangaSelect').value;
                const projectTitle = document.getElementById('donationProjectTitle').value.trim();
                const goal = parseInt(document.getElementById('donationProjectGoal').value);
                const currentAmount = parseInt(document.getElementById('donationCurrentAmount').value) || 0;
                const status = document.getElementById('donationProjectStatus').value;
                const priority = parseInt(document.getElementById('donationPriority').value) || 5;
                const projectImage = document.getElementById('donationProjectImage').value.trim();
                const useDefaultImage = document.getElementById('useDefaultImage').checked;
                const description = document.getElementById('donationDescription').value.trim();

                if (!mangaId) {
                    throw new Error('Выберите тайтл для проекта');
                }

                if (!goal || goal < 1000) {
                    throw new Error('Цель доната должна быть не менее 1000₽');
                }

                // Get manga data
                const manga = window.MangaAPI.getMangaById(mangaId);
                if (!manga) {
                    throw new Error('Выбранный тайтл не найден');
                }

                const donationData = {
                    id: editingDonation ? editingDonation.id : donationIdCounter++,
                    mangaId: mangaId,
                    title: projectTitle || manga.title,
                    goal: goal,
                    currentAmount: Math.min(currentAmount, goal),
                    status: status,
                    priority: priority,
                    image: useDefaultImage ? null : projectImage,
                    description: description,
                    createdAt: editingDonation ? editingDonation.createdAt : new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                if (editingDonation) {
                    // Update existing project
                    const index = donationProjects.findIndex(p => p.id === editingDonation.id);
                    if (index !== -1) {
                        donationProjects[index] = donationData;
                        showNotification('Донат-проект обновлен!', 'success');
                    }
                } else {
                    // Add new project
                    donationProjects.push(donationData);
                    showNotification('Донат-проект создан!', 'success');
                }

                saveDonationProjects();
                loadDonationProjectsList();
                loadDashboard();
                hideDonationForm();

            } catch (error) {
                console.error('Ошибка сохранения донат-проекта:', error);
                showNotification(error.message, 'error');
            }
        }

        function loadDonationProjectsList() {
            const container = document.getElementById('donationProjectsList');

            if (donationProjects.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--secondary-color);">
                        <h3>💰 Нет донат-проектов</h3>
                        <p>Создайте первый проект для сбора донатов</p>
                        <button class="btn btn-donation" onclick="showAddDonationForm()" style="margin-top: 16px;">
                            ➕ Создать проект
                        </button>
                    </div>
                `;
                return;
            }

            // Sort by priority and status
            const sortedProjects = [...donationProjects].sort((a, b) => {
                if (a.status === 'active' && b.status !== 'active') return -1;
                if (a.status !== 'active' && b.status === 'active') return 1;
                return (b.priority || 5) - (a.priority || 5);
            });

            container.innerHTML = `
                <div class="donation-projects-list">
                    ${sortedProjects.map(project => renderDonationProjectCard(project)).join('')}
                </div>
            `;
        }

        function renderDonationProjectCard(project) {
            if (!window.MangaAPI) return '';

            const manga = window.MangaAPI.getMangaById(project.mangaId);
            if (!manga) return '';

            const progress = Math.min((project.currentAmount / project.goal) * 100, 100);
            const image = project.image || manga.image || `https://via.placeholder.com/50x70/8b5cf6/FFFFFF?text=${encodeURIComponent(project.title.charAt(0))}`;
            
            const statusText = {
                'active': 'Активен',
                'completed': 'Завершен',
                'paused': 'Приостановлен'
            };

            return `
                <div class="donation-project-item">
                    <div class="donation-project-header">
                        <div class="donation-project-info">
                            <img src="${image}" alt="${project.title}" class="donation-project-poster"
                                 onerror="this.src='https://via.placeholder.com/50x70/8b5cf6/FFFFFF?text=${encodeURIComponent(project.title.charAt(0))}'">
                            <div class="donation-project-details">
                                <div class="donation-project-title">${project.title}</div>
                                <div class="donation-project-manga">📚 ${manga.title}</div>
                            </div>
                        </div>
                        
                        <div style="text-align: right;">
                            <span class="status-badge ${getStatusClass(project.status)}">${statusText[project.status]}</span>
                            <div style="font-size: 0.75rem; color: var(--secondary-color); margin-top: 4px;">
                                Приоритет: ${project.priority || 5}
                            </div>
                        </div>
                    </div>

                    <div style="padding: 16px;">
                        <div class="donation-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress}%"></div>
                            </div>
                            <div class="progress-text">
                                <span>${project.currentAmount.toLocaleString()}₽</span>
                                <span>${project.goal.toLocaleString()}₽</span>
                            </div>
                            <div style="text-align: center; font-size: 0.875rem; color: var(--secondary-color); margin-top: 4px;">
                                ${progress.toFixed(1)}% от цели
                            </div>
                        </div>

                        ${project.description ? `
                            <div style="margin-top: 12px; padding: 8px; background: var(--bg-color); border-radius: 6px; font-size: 0.875rem; color: var(--secondary-color);">
                                ${project.description}
                            </div>
                        ` : ''}

                        <div class="quick-update">
                            <input type="number" class="quick-amount-input" id="quickAmount${project.id}" min="0" placeholder="Сумма" value="">
                            <button class="quick-update-btn" onclick="quickUpdateDonation(${project.id})">+ Добавить</button>
                        </div>
                    </div>

                    <div class="donation-project-actions">
                        <button class="btn btn-primary" onclick="editDonationProject(${project.id})">✏️ Редактировать</button>
                        <button class="btn btn-warning" onclick="setDonationAmount(${project.id})">💰 Установить сумму</button>
                        <button class="btn btn-danger" onclick="deleteDonationProject(${project.id})">🗑️ Удалить</button>
                    </div>
                </div>
            `;
        }

        function editDonationProject(id) {
            const project = donationProjects.find(p => p.id === id);
            if (!project) return;

            editingDonation = project;
            showAddDonationForm();
            
            // Fill form with existing data
            document.getElementById('donationMangaSelect').value = project.mangaId;
            document.getElementById('donationProjectTitle').value = project.title;
            document.getElementById('donationProjectGoal').value = project.goal;
            document.getElementById('donationCurrentAmount').value = project.currentAmount;
            document.getElementById('donationProjectStatus').value = project.status;
            document.getElementById('donationPriority').value = project.priority || 5;
            document.getElementById('donationProjectImage').value = project.image || '';
            document.getElementById('useDefaultImage').checked = !project.image;
            document.getElementById('donationDescription').value = project.description || '';
            
            document.getElementById('donationFormTitle').innerHTML = '<span>✏️</span> Редактировать донат-проект';
            
            if (project.image) {
                previewDonationImage(project.image);
            }
        }

        function quickUpdateDonation(id) {
            const project = donationProjects.find(p => p.id === id);
            const amountInput = document.getElementById(`quickAmount${id}`);
            const amount = parseInt(amountInput.value) || 0;

            if (!project) return;

            if (amount < 0) {
                showNotification('Сумма не может быть отрицательной', 'error');
                return;
            }

            project.currentAmount = Math.min(project.currentAmount + amount, project.goal);
            project.updatedAt = new Date().toISOString();

            saveDonationProjects();
            loadDonationProjectsList();
            loadDashboard();

            amountInput.value = '';
            showNotification(`Добавлено ${amount.toLocaleString()}₽`, 'success');
        }

        function setDonationAmount(id) {
            const project = donationProjects.find(p => p.id === id);
            if (!project) return;

            const newAmount = prompt(`Установить текущую сумму для "${project.title}":`, project.currentAmount);
            if (newAmount === null) return;

            const amount = parseInt(newAmount) || 0;
            if (amount < 0) {
                showNotification('Сумма не может быть отрицательной', 'error');
                return;
            }

            project.currentAmount = Math.min(amount, project.goal);
            project.updatedAt = new Date().toISOString();

            saveDonationProjects();
            loadDonationProjectsList();
            loadDashboard();

            showNotification('Сумма обновлена', 'success');
        }

        function deleteDonationProject(id) {
            const project = donationProjects.find(p => p.id === id);
            if (!project) return;

            if (confirm(`Удалить донат-проект "${project.title}"? Это действие нельзя отменить.`)) {
                donationProjects = donationProjects.filter(p => p.id !== id);
                saveDonationProjects();
                loadDonationProjectsList();
                loadDashboard();
                showNotification('Донат-проект удален', 'success');
            }
        }

        function previewDonationImage(url) {
            const preview = document.getElementById('donationImagePreview');
            
            if (!url) {
                preview.innerHTML = '';
                return;
            }

            preview.innerHTML = `
                <img src="${url}" alt="Preview" class="preview-image" 
                     onerror="this.parentElement.innerHTML='<p style=color:var(--danger-color)>Ошибка загрузки изображения</p>'">
            `;
        }

        // Edit manga
        function editManga(id) {
            const manga = window.MangaAPI.getMangaById(id);
            if (!manga) return;

            editingManga = manga;
            showSection('add-manga');
            
            // Fill form with existing data
            document.getElementById('mangaTitle').value = manga.title || '';
            document.getElementById('mangaType').value = manga.type || '';
            document.getElementById('mangaStatus').value = manga.status || '';
            document.getElementById('mangaYear').value = manga.year || '';
            document.getElementById('mangaRating').value = manga.rating || '';
            document.getElementById('donationGoal').value = manga.donationGoal || 10000;
            document.getElementById('mangaImage').value = manga.image || '';
            document.getElementById('mangaDescription').value = manga.description || '';

            // Load chapters count
            document.getElementById('availableChapters').value = manga.availableChapters || 0;
            document.getElementById('totalChapters').value = manga.totalChapters || 0;
            updateChaptersPreview();

            // Load genres
            document.getElementById('genreTags').innerHTML = '';
            if (manga.genres) {
                manga.genres.forEach(genre => addTag('genre', genre));
            }

            // Load categories
            document.getElementById('categoryTags').innerHTML = '';
            if (manga.categories) {
                manga.categories.forEach(category => addTag('category', category));
            }

            // Load episodes
            episodes = [];
            episodeIdCounter = 1;
            if (manga.episodes) {
                Object.keys(manga.episodes).forEach(episodeKey => {
                    const episode = {
                        id: episodeIdCounter++,
                        title: `Серия ${episodeKey}`,
                        url: manga.episodes[episodeKey],
                        chapterFrom: episodeKey,
                        chapterTo: episodeKey,
                        order: episodes.length
                    };
                    episodes.push(episode);
                });
            }

            renderEpisodesList();
            updateEpisodesSummary();
            
            document.getElementById('formTitle').textContent = 'Редактировать тайтл';
            
            // Preview image if exists
            if (manga.image) {
                previewImage(manga.image);
            }
        }

        // Delete manga
        function deleteManga(id) {
            const manga = window.MangaAPI.getMangaById(id);
            if (!manga) return;

            if (confirm(`Удалить тайтл "${manga.title}"? Это действие нельзя отменить.`)) {
                window.MangaAPI.deleteManga(id);
                
                // Also remove related donation projects
                donationProjects = donationProjects.filter(p => p.mangaId !== id);
                saveDonationProjects();
                
                loadMangaList();
                loadDashboard();
                loadDonationProjectsList();
                showNotification('Тайтл и связанные проекты удалены', 'success');
            }
        }

        // Tag management
        function addTag(type, value) {
            if (!value) return;

            const container = document.getElementById(type + 'Tags');
            const existingTags = Array.from(container.querySelectorAll('.tag')).map(tag => 
                tag.textContent.replace('×', '').trim()
            );

            if (existingTags.includes(value)) return;

            const tag = document.createElement('div');
            tag.className = 'tag';
            tag.innerHTML = `
                ${value}
                <button type="button" class="tag-remove" onclick="this.parentElement.remove()">×</button>
            `;
            container.appendChild(tag);
        }

        // === EPISODE MANAGEMENT ===

        // Add new episode
        function addNewEpisode() {
            const newEpisode = {
                id: episodeIdCounter++,
                title: `Серия ${episodes.length + 1}`,
                url: '',
                chapterFrom: episodes.length + 1,
                chapterTo: episodes.length + 1,
                order: episodes.length
            };

            episodes.push(newEpisode);
            renderEpisodesList();
            updateEpisodesSummary();
            showNotification('Новая серия добавлена', 'success');
        }

        // Render episodes list
        function renderEpisodesList() {
            const container = document.getElementById('episodesList');

            if (episodes.length === 0) {
                container.innerHTML = `
                    <div class="episodes-empty">
                        <h4>Нет добавленных серий</h4>
                        <p>Нажмите кнопку "Добавить серию" для создания первой серии</p>
                    </div>
                `;
                return;
            }

            // Sort episodes by order
            const sortedEpisodes = [...episodes].sort((a, b) => a.order - b.order);

            container.innerHTML = sortedEpisodes.map(episode => `
                <div class="episode-item" data-episode-id="${episode.id}">
                    <div class="episode-header">
                        <div class="chapter-range-inputs">
                            <input type="number" 
                                   class="chapter-input" 
                                   value="${episode.chapterFrom}" 
                                   min="1" 
                                   placeholder="От"
                                   title="Глава от"
                                   onchange="updateEpisodeChapterFrom(${episode.id}, this.value)">
                            <span>-</span>
                            <input type="number" 
                                   class="chapter-input" 
                                   value="${episode.chapterTo}" 
                                   min="1" 
                                   placeholder="До"
                                   title="Глава до"
                                   onchange="updateEpisodeChapterTo(${episode.id}, this.value)">
                        </div>
                        
                        <input type="text" 
                               class="episode-title-input" 
                               value="${episode.title}" 
                               placeholder="Название серии"
                               onchange="updateEpisodeTitle(${episode.id}, this.value)">
                        
                        <div class="episode-actions">
                            <span class="episode-status ${episode.url ? 'ready' : 'empty'}">
                                ${episode.url ? '✅ Готова' : '⏳ Пустая'}
                            </span>
                            <button type="button" class="remove-episode-btn" onclick="removeEpisode(${episode.id})">
                                🗑️
                            </button>
                        </div>
                    </div>
                    
                    <input type="url" 
                           class="episode-url-input ${episode.url ? 'filled' : ''}" 
                           value="${episode.url}" 
                           placeholder="Ссылка на видео (YouTube, Google Drive, и т.д.)"
                           onchange="updateEpisodeUrl(${episode.id}, this.value)">
                </div>
            `).join('');
        }

        // Update episode chapter from
        function updateEpisodeChapterFrom(episodeId, newValue) {
            const episode = episodes.find(e => e.id === episodeId);
            if (episode) {
                episode.chapterFrom = parseInt(newValue) || 1;
                updateEpisodeTitle(episodeId, generateEpisodeTitle(episode));
                updateEpisodesSummary();
            }
        }

        // Update episode chapter to
        function updateEpisodeChapterTo(episodeId, newValue) {
            const episode = episodes.find(e => e.id === episodeId);
            if (episode) {
                episode.chapterTo = parseInt(newValue) || episode.chapterFrom;
                updateEpisodeTitle(episodeId, generateEpisodeTitle(episode));
                updateEpisodesSummary();
            }
        }

        // Generate episode title based on chapter range
        function generateEpisodeTitle(episode) {
            if (episode.chapterFrom === episode.chapterTo) {
                return `Глава ${episode.chapterFrom}`;
            } else {
                return `Главы ${episode.chapterFrom}-${episode.chapterTo}`;
            }
        }

        // Update episode title
        function updateEpisodeTitle(episodeId, newTitle) {
            const episode = episodes.find(e => e.id === episodeId);
            if (episode) {
                episode.title = newTitle.trim() || generateEpisodeTitle(episode);
                
                // Update the input field if called programmatically
                const titleInput = document.querySelector(`[data-episode-id="${episodeId}"] .episode-title-input`);
                if (titleInput && titleInput.value !== episode.title) {
                    titleInput.value = episode.title;
                }
                
                updateEpisodesSummary();
            }
        }

        // Update episode URL
        function updateEpisodeUrl(episodeId, newUrl) {
            const episode = episodes.find(e => e.id === episodeId);
            if (episode) {
                episode.url = newUrl.trim();
                
                // Update visual state
                const input = document.querySelector(`[data-episode-id="${episodeId}"] .episode-url-input`);
                if (input) {
                    input.classList.toggle('filled', !!episode.url);
                }
                
                renderEpisodesList();
                updateEpisodesSummary();
            }
        }

        // Remove episode
        function removeEpisode(episodeId) {
            const episodeIndex = episodes.findIndex(e => e.id === episodeId);
            const episode = episodes[episodeIndex];
            
            if (confirm(`Удалить "${episode.title}"?`)) {
                episodes.splice(episodeIndex, 1);
                
                // Update order for remaining episodes
                episodes.forEach((ep, index) => {
                    ep.order = index;
                });
                
                renderEpisodesList();
                updateEpisodesSummary();
                showNotification('Серия удалена', 'warning');
            }
        }

        // Sort episodes
        function sortEpisodes() {
            if (episodes.length === 0) {
                showNotification('Нет серий для сортировки', 'warning');
                return;
            }

            episodes.sort((a, b) => a.chapterFrom - b.chapterFrom);
            episodes.forEach((episode, index) => {
                episode.order = index;
            });

            renderEpisodesList();
            updateEpisodesSummary();
            showNotification('Серии отсортированы', 'success');
        }

        // Update episodes summary
        function updateEpisodesSummary() {
            const total = episodes.length;
            const withUrls = episodes.filter(ep => ep.url && ep.url.trim()).length;
            const ready = withUrls;

            document.getElementById('episodesSummary').innerHTML = `
                <strong>Итого:</strong> ${total} серий, ${withUrls} с видео, ${ready} готовых к публикации
            `;
        }

        // === SAVE MANGA ===

        function saveManga() {
            try {
                // Collect basic data
                const mangaData = {
                    title: document.getElementById('mangaTitle').value.trim(),
                    type: document.getElementById('mangaType').value,
                    status: document.getElementById('mangaStatus').value,
                    year: parseInt(document.getElementById('mangaYear').value) || new Date().getFullYear(),
                    rating: parseFloat(document.getElementById('mangaRating').value) || 8.0,
                    donationGoal: parseInt(document.getElementById('donationGoal').value) || 10000,
                    image: document.getElementById('mangaImage').value.trim() || null,
                    description: document.getElementById('mangaDescription').value.trim() || '',
                    genres: Array.from(document.getElementById('genreTags').querySelectorAll('.tag')).map(tag => 
                        tag.textContent.replace('×', '').trim()
                    ),
                    categories: Array.from(document.getElementById('categoryTags').querySelectorAll('.tag')).map(tag => 
                        tag.textContent.replace('×', '').trim()
                    )
                };

                // Validation
                if (!mangaData.title) {
                    throw new Error('Название тайтла обязательно');
                }

                if (!mangaData.type) {
                    throw new Error('Тип тайтла обязателен');
                }

                if (!mangaData.status) {
                    throw new Error('Статус тайтла обязателен');
                }

                // ИНФОРМАЦИОННАЯ СИСТЕМА: Поля для отображения текста в каталоге и плеере
                const availableChapters = parseInt(document.getElementById('availableChapters').value) || 0;
                const totalChapters = parseInt(document.getElementById('totalChapters').value) || 0;
                
                mangaData.availableChapters = availableChapters;  // ДЛЯ ТЕКСТА в каталоге/плеере
                mangaData.totalChapters = totalChapters;          // ДЛЯ ТЕКСТА в каталоге/плеере

                // ФУНКЦИОНАЛЬНАЯ СИСТЕМА: Серии для кнопок в плеере
                mangaData.episodes = {};
                const readyEpisodes = episodes.filter(ep => ep.url && ep.url.trim());
                readyEpisodes.forEach(episode => {
                    // Create episode key based on chapter range
                    let episodeKey;
                    if (episode.chapterFrom === episode.chapterTo) {
                        episodeKey = episode.chapterFrom.toString();
                    } else {
                        episodeKey = `${episode.chapterFrom}-${episode.chapterTo}`;
                    }
                    mangaData.episodes[episodeKey] = episode.url;
                });

                // ДЛЯ СОВМЕСТИМОСТИ: Количество серий основано на менеджере серий
                mangaData.totalEpisodes = Object.keys(mangaData.episodes).length;
                mangaData.availableEpisodes = Object.keys(mangaData.episodes).length;

                // Save to API
                saveToAPI(mangaData);

            } catch (error) {
                console.error('Ошибка сохранения:', error);
                showNotification(error.message, 'error');
            }
        }

        function saveToAPI(mangaData) {
            try {
                let result;
                if (editingManga) {
                    result = window.MangaAPI.updateManga(editingManga.id, mangaData);
                    showNotification('Тайтл успешно обновлен!', 'success');
                } else {
                    result = window.MangaAPI.addManga(mangaData);
                    showNotification('Тайтл успешно добавлен!', 'success');
                }

                if (result) {
                    console.log('💾 Тайтл сохранен:', result);
                    console.log('📺 Серии сохранены:', episodes.length);
                    
                    // Update dashboard and list
                    loadDashboard();
                    loadMangaList();
                    loadDonationProjectsList();
                    
                    // Reset form after successful save
                    setTimeout(() => {
                        resetForm();
                        showSection('manga-list');
                    }, 1500);
                }

            } catch (error) {
                console.error('Ошибка API:', error);
                showNotification('Ошибка сохранения в базу данных', 'error');
            }
        }

        // === ADDITIONAL FUNCTIONS ===

        function resetForm() {
            document.getElementById('mangaForm').reset();
            document.getElementById('genreTags').innerHTML = '';
            document.getElementById('categoryTags').innerHTML = '';
            document.getElementById('imagePreview').innerHTML = '';
            
            // Reset episodes
            episodes = [];
            episodeIdCounter = 1;
            renderEpisodesList();
            updateEpisodesSummary();
            
            // Reset chapters preview
            updateChaptersPreview();
            
            editingManga = null;
            document.getElementById('formTitle').textContent = 'Добавить новый тайтл';
            
            showNotification('Форма очищена', 'success');
        }

        // Update chapters preview
        function updateChaptersPreview() {
            const available = parseInt(document.getElementById('availableChapters').value) || 0;
            const total = parseInt(document.getElementById('totalChapters').value) || 0;
            
            document.getElementById('chaptersPreview').textContent = `Главы: ${available}/${total}`;
            
            // Add color coding
            const preview = document.getElementById('chaptersPreview');
            preview.style.color = '';
            
            if (available > total && total > 0) {
                preview.style.color = 'var(--danger-color)';
                preview.textContent += ' ⚠️ Доступных больше чем всего!';
            } else if (available === total && total > 0) {
                preview.style.color = 'var(--success-color)';
                preview.textContent += ' ✅ Завершено';
            } else if (available > 0 && total > 0) {
                preview.style.color = 'var(--warning-color)';
                preview.textContent += ' 📖 В процессе';
            }
        }

        function previewManga() {
            const title = document.getElementById('mangaTitle').value.trim();
            if (!title) {
                showNotification('Введите название тайтла для предпросмотра', 'warning');
                return;
            }

            if (episodes.length === 0) {
                showNotification('Добавьте хотя бы одну серию для предпросмотра', 'warning');
                return;
            }

            showNotification('Предпросмотр будет доступен после сохранения тайтла', 'warning');
        }

        function previewImage(url) {
            const preview = document.getElementById('imagePreview');
            
            if (!url) {
                preview.innerHTML = '';
                return;
            }

            preview.innerHTML = `
                <img src="${url}" alt="Preview" class="preview-image" 
                     onerror="this.parentElement.innerHTML='<p style=color:var(--danger-color)>Ошибка загрузки изображения</p>'">
            `;
        }

        function logout() {
            if (confirm('Выйти из админ-панели?')) {
                isAuthenticated = false;
                document.getElementById('loginScreen').style.display = 'flex';
                document.getElementById('adminPanel').style.display = 'none';
                document.getElementById('passwordInput').value = '';
            }
        }

        // Load data system
        function loadDataSystem() {
            return new Promise((resolve, reject) => {
                if (window.MangaAPI) {
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = 'js/data.js';
                script.onload = () => {
                    const checkAPI = () => {
                        if (window.MangaAPI) {
                            resolve();
                        } else {
                            setTimeout(checkAPI, 100);
                        }
                    };
                    checkAPI();
                };
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        // Utility functions
        function showNotification(message, type = 'success') {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.className = `notification show ${type}`;
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 4000);
        }

        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🔥 Админка с управлением донатами загружена!');
        });
