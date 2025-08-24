
        // Подключаем систему данных
        const script = document.createElement('script');
        script.src = 'js/data.js';
        document.head.appendChild(script);

    

        // State
        let currentManga = null;
        let currentEpisode = 1;
        let isDark = localStorage.getItem('theme') === 'dark';
        let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

        // Theme functionality
        function updateTheme() {
            document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
            
            // Update all theme toggle icons
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

        // Get manga ID from URL
        function getMangaIdFromURL() {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get('id');
        }

        // Initialize player
        function initializePlayer() {
            const mangaId = getMangaIdFromURL();
            
            if (!mangaId) {
                showError('ID тайтла не указан в URL');
                return;
            }

            if (!window.MangaAPI) {
                showError('Система данных не загружена');
                return;
            }

            currentManga = window.MangaAPI.getMangaById(mangaId);
            
            if (!currentManga) {
                showError(`Тайтл с ID ${mangaId} не найден`);
                return;
            }

            loadMangaData();
        }

        // Load manga data
        function loadMangaData() {
            // Hide loading, show content
            document.getElementById('loadingState').style.display = 'none';
            document.getElementById('playerContent').style.display = 'block';

            // Update headers
            const title = currentManga.title;
            const headerTitle = document.getElementById('headerTitle');
            const mobileHeaderTitle = document.getElementById('mobileHeaderTitle');
            
            if (headerTitle) headerTitle.textContent = title;
            if (mobileHeaderTitle) mobileHeaderTitle.textContent = title;

            document.getElementById('mangaPoster').src = currentManga.image || 'https://via.placeholder.com/300x400/FF6B35/FFFFFF?text=' + encodeURIComponent(title);
            document.getElementById('mangaStatus').textContent = currentManga.status || 'Неизвестно';
            document.getElementById('episodeCount').textContent = `${currentManga.availableEpisodes}/${currentManga.totalEpisodes}`;
            document.getElementById('mangaType').textContent = currentManga.type || 'Манга';
            document.getElementById('mangaYear').textContent = currentManga.year || 'Неизвестно';
            document.getElementById('mangaRating').querySelector('span:last-child').textContent = currentManga.rating || 'N/A';

            // Update genres
            if (currentManga.genres && currentManga.genres.length > 0) {
                const genresContainer = document.getElementById('genresContainer');
                genresContainer.innerHTML = currentManga.genres.map(genre => 
                    `<span class="genre-tag">${genre}</span>`
                ).join('');
            }

            // Update description
            if (currentManga.description) {
                document.getElementById('descriptionContainer').style.display = 'block';
                document.getElementById('mangaDescription').textContent = currentManga.description;
            }

            // Update donation info
            updateDonationInfo();

            // Generate episode buttons
            generateEpisodeButtons();

            // Update episode info
            updateEpisodeInfo();
        }

        // Generate episode buttons
        function generateEpisodeButtons() {
            const grid = document.getElementById('episodeGrid');
            const episodes = [];

            for (let i = 1; i <= currentManga.totalEpisodes; i++) {
                const isAvailable = i <= currentManga.availableEpisodes;
                const isCurrent = i === currentEpisode;
                
                episodes.push(`
                    <button class="episode-button ${isCurrent ? 'current' : ''} ${!isAvailable ? 'unavailable' : ''}"
                            onclick="selectEpisode(${i})" data-episode="${i}">
                        ${i}
                    </button>
                `);
            }

            grid.innerHTML = episodes.join('');
        }

        // Select episode
        function selectEpisode(episode) {
            currentEpisode = episode;

            // Update current episode styling
            document.querySelectorAll('.episode-button').forEach(btn => {
                btn.classList.remove('current');
                if (parseInt(btn.dataset.episode) === episode) {
                    btn.classList.add('current');
                }
            });

            // Update episode info
            updateEpisodeInfo();

            // Load video if available
            loadVideo(episode);
        }

        // Update episode info
        function updateEpisodeInfo() {
            const info = document.getElementById('episodeInfo');
            const isAvailable = currentEpisode <= currentManga.availableEpisodes;
            
            if (isAvailable) {
                info.innerHTML = `Серия ${currentEpisode} из ${currentManga.totalEpisodes}`;
                info.classList.remove('episode-unavailable');
            } else {
                info.innerHTML = `<span class="episode-unavailable">Серия ${currentEpisode} недоступна</span>`;
                info.classList.add('episode-unavailable');
            }
        }

        // Load video
        function loadVideo(episode) {
            const player = document.getElementById('videoPlayer');
            const placeholder = document.getElementById('videoPlaceholder');
            const title = document.getElementById('placeholderTitle');
            const text = document.getElementById('placeholderText');
            const isAvailable = episode <= currentManga.availableEpisodes;
            const videoUrl = currentManga.episodes && currentManga.episodes[episode];

            if (isAvailable && videoUrl) {
                // Load video
                player.src = videoUrl;
                player.style.display = 'block';
                placeholder.style.display = 'none';
            } else if (!isAvailable) {
                // Show unavailable message
                player.style.display = 'none';
                placeholder.style.display = 'flex';
                title.textContent = `Серия ${episode} недоступна`;
                text.innerHTML = `Поддержите проект, чтобы ускорить выход новых серий!<br><strong>Цель: ${(currentManga.donationGoal || 10000).toLocaleString()}₽</strong>`;
            } else {
                // Video not found
                player.style.display = 'none';
                placeholder.style.display = 'flex';
                title.textContent = `Серия ${episode}`;
                text.textContent = 'Видео пока не загружено';
            }
        }

        // Update donation info
        function updateDonationInfo() {
            const current = currentManga.currentDonations || 0;
            const goal = currentManga.donationGoal || 10000;
            const percentage = (current / goal) * 100;

            document.getElementById('currentDonations').textContent = current.toLocaleString();
            document.getElementById('donationGoal').textContent = goal.toLocaleString();
            document.getElementById('progressBarFill').style.width = `${Math.min(percentage, 100)}%`;
            document.getElementById('progressPercentage').textContent = `${percentage.toFixed(1)}%`;

            // Update donate button
            const donateBtn = document.getElementById('donateBtn');
            if (percentage >= 100) {
                donateBtn.textContent = '✅ Цель достигнута!';
                donateBtn.disabled = true;
            }
        }

        // Donation functions
        function setDonationAmount(amount) {
            document.getElementById('donationAmount').value = amount;
        }

        function makeDonation() {
            const amount = parseInt(document.getElementById('donationAmount').value) || 0;
            
            if (amount < 10) {
                showNotification('Минимальная сумма доната: 10₽', 'error');
                return;
            }

            if (amount > 50000) {
                showNotification('Максимальная сумма доната: 50,000₽', 'error');
                return;
            }

            // Update donation amount
            const newTotal = Math.min((currentManga.currentDonations || 0) + amount, currentManga.donationGoal || 10000);
            
            // Update manga data
            if (window.MangaAPI) {
                window.MangaAPI.updateManga(currentManga.id, {
                    currentDonations: newTotal
                });
                currentManga.currentDonations = newTotal;
            }

            // Update UI
            updateDonationInfo();

            // Clear input
            document.getElementById('donationAmount').value = '';

            // Show notification
            showNotification(`Спасибо за поддержку! Добавлено ${amount.toLocaleString()}₽`, 'success');

            // Save to user's donation history
            const donationHistory = JSON.parse(localStorage.getItem('donationHistory') || '[]');
            donationHistory.push({
                mangaId: currentManga.id,
                mangaTitle: currentManga.title,
                amount: amount,
                episode: currentEpisode,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('donationHistory', JSON.stringify(donationHistory));
        }

        // User actions
        function addToFavorites() {
            addToUserList('favorites', 'Избранное');
        }

        function addToWatching() {
            addToUserList('watching', 'Смотрю');
        }

        function addToWantToWatch() {
            addToUserList('wantToWatch', 'Хочу посмотреть');
        }

        function addToCompleted() {
            addToUserList('completed', 'Досмотрел');
        }

        function addToUserList(listName, listTitle) {
            const mangaForStorage = {
                id: Date.now(),
                mangaId: currentManga.id,
                title: currentManga.title,
                image: currentManga.image,
                currentEpisode: currentEpisode,
                totalEpisodes: currentManga.totalEpisodes,
                availableEpisodes: currentManga.availableEpisodes,
                status: currentManga.status,
                rating: currentManga.rating,
                addedAt: new Date().toISOString()
            };

            const currentList = JSON.parse(localStorage.getItem(listName) || '[]');
            
            // Remove if already exists
            const filtered = currentList.filter(item => item.mangaId !== currentManga.id);
            
            // Add new entry
            filtered.push(mangaForStorage);
            
            localStorage.setItem(listName, JSON.stringify(filtered));
            
            showNotification(`Добавлено в "${listTitle}"`, 'success');
        }

        function markCurrentEpisode() {
            const watchingProgress = JSON.parse(localStorage.getItem('watchingProgress') || '{}');
            watchingProgress[currentManga.id] = {
                mangaTitle: currentManga.title,
                currentEpisode: currentEpisode,
                totalEpisodes: currentManga.totalEpisodes,
                lastWatched: new Date().toISOString()
            };
            localStorage.setItem('watchingProgress', JSON.stringify(watchingProgress));
            
            showNotification(`Отмечено: остановился на серии ${currentEpisode}`, 'success');
        }

        function openInCabinet() {
            // Add to watching list first
            addToWatching();
            
            // Redirect to cabinet
            setTimeout(() => {
                window.location.href = 'cabinet.html';
            }, 1000);
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

        function showError(message) {
            document.getElementById('loadingState').style.display = 'none';
            document.getElementById('errorState').style.display = 'flex';
            
            const errorContainer = document.getElementById('errorState');
            errorContainer.querySelector('p').textContent = message;
        }

        // Event listeners
        document.addEventListener('DOMContentLoaded', function() {
            // Theme toggles
            document.getElementById('themeToggle').addEventListener('click', toggleTheme);
            document.getElementById('mobileThemeToggle').addEventListener('click', toggleTheme);
            document.getElementById('mobileSideThemeToggle').addEventListener('click', toggleTheme);

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

            // If data is already loaded, initialize immediately
            if (window.MangaAPI) {
                initializePlayer();
            }
        });

        // Listen for data ready event
        window.addEventListener('mangaDataReady', initializePlayer);

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeMenu();
            }
            
            if (!currentManga) return;

            switch(e.key) {
                case 'ArrowLeft':
                    if (currentEpisode > 1) {
                        selectEpisode(currentEpisode - 1);
                    }
                    break;
                case 'ArrowRight':
                    if (currentEpisode < currentManga.totalEpisodes) {
                        selectEpisode(currentEpisode + 1);
                    }
                    break;
                case 'Home':
                    selectEpisode(1);
                    break;
                case 'End':
                    selectEpisode(currentManga.availableEpisodes);
                    break;
            }
        });
