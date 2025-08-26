// Плеер с системой уведомлений и контролем доступа
(function() {
    'use strict';

    // State
    let currentManga = null;
    let currentEpisode = 1;

    // Authentication functionality
    function updateAuthState() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        
        const authSection = document.getElementById('authSection');
        const userSection = document.getElementById('userSection');
        const logoutBtn = document.getElementById('logoutBtn');
        const authRequired = document.getElementById('authRequired');
        const commentsContent = document.getElementById('commentsContent');
        
        if (isLoggedIn && currentUser) {
            if (authSection) authSection.style.display = 'none';
            if (userSection) userSection.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'block';
            
            if (authRequired) authRequired.style.display = 'none';
            if (commentsContent) commentsContent.style.display = 'block';
            
            const userName = document.getElementById('userName');
            const userEmail = document.getElementById('userEmail');
            if (userName) userName.textContent = currentUser.name || currentUser.username || 'Пользователь';
            if (userEmail) userEmail.textContent = currentUser.email || 'user@example.com';
            
            // Update comment form
            const commentUserName = document.getElementById('commentUserName');
            const commentUserAvatar = document.getElementById('commentUserAvatar');
            if (commentUserName) commentUserName.textContent = currentUser.name || 'Пользователь';
            if (commentUserAvatar) commentUserAvatar.textContent = (currentUser.name || 'П').charAt(0).toUpperCase();
            
            loadComments();
        } else {
            if (authSection) authSection.style.display = 'block';
            if (userSection) userSection.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
            
            if (authRequired) authRequired.style.display = 'block';
            if (commentsContent) commentsContent.style.display = 'none';
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
    async function initializePlayer() {
        console.log('🎬 Инициализация плеера...');
        
        const mangaId = getMangaIdFromURL();
        
        if (!mangaId) {
            showError('ID тайтла не указан в URL');
            return;
        }

        // Проверяем доступ к тайтлу
        if (window.SubscriptionAccessControl) {
            const hasAccess = await window.SubscriptionAccessControl.checkAndEnforceMangaAccess(mangaId);
            if (!hasAccess) {
                return; // Доступ запрещен
            }
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
        console.log('✅ Плеер инициализирован для:', currentManga.title);
    }

    // Load manga data
    function loadMangaData() {
        // Hide loading, show content
        const loadingState = document.getElementById('loadingState');
        const playerContent = document.getElementById('playerContent');
        
        if (loadingState) loadingState.style.display = 'none';
        if (playerContent) playerContent.style.display = 'block';

        // Update headers
        const title = currentManga.title;
        const mobileHeaderTitle = document.getElementById('mobileHeaderTitle');
        
        if (mobileHeaderTitle) mobileHeaderTitle.textContent = title;

        // Update manga info
        const mangaPoster = document.getElementById('mangaPoster');
        const mangaStatus = document.getElementById('mangaStatus');
        const episodeCount = document.getElementById('episodeCount');
        const mangaType = document.getElementById('mangaType');
        const mangaYear = document.getElementById('mangaYear');
        const mangaRating = document.getElementById('mangaRating');
        
        if (mangaPoster) {
            mangaPoster.src = currentManga.cover_url || currentManga.image || 'https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg';
            mangaPoster.onerror = function() {
                this.src = 'https://images.pexels.com/photos/1591062/pexels-photo-1591062.jpeg';
            };
        }
        if (mangaStatus) mangaStatus.textContent = currentManga.status || 'Неизвестно';
        if (episodeCount) episodeCount.textContent = `${currentManga.available_episodes || currentManga.availableEpisodes || 0}/${currentManga.total_episodes || currentManga.totalEpisodes || 0}`;
        if (mangaType) mangaType.textContent = currentManga.type || 'Манга';
        if (mangaYear) mangaYear.textContent = currentManga.year || 'Неизвестно';
        
        // Update rating
        if (mangaRating) {
            const rating = currentManga.rating || 0;
            mangaRating.innerHTML = `⭐ ${rating > 0 ? rating : 'N/A'}`;
        }

        // Update genres
        if (currentManga.genres && currentManga.genres.length > 0) {
            const genresContainer = document.getElementById('genresContainer');
            if (genresContainer) {
                genresContainer.innerHTML = currentManga.genres.map(genre => 
                    `<span class="genre-tag">${genre}</span>`
                ).join('');
            }
        }

        // Update description
        if (currentManga.description) {
            const descriptionContainer = document.getElementById('descriptionContainer');
            const mangaDescription = document.getElementById('mangaDescription');
            if (descriptionContainer && mangaDescription) {
                descriptionContainer.style.display = 'block';
                mangaDescription.textContent = currentManga.description;
            }
        }

        // Update player title and info
        const mangaTitle = document.getElementById('mangaTitle');
        if (mangaTitle) mangaTitle.textContent = title;

        // Update donation info
        updateDonationInfo();

        // Generate episode buttons
        generateEpisodeButtons();

        // Update episode info
        updateEpisodeInfo();

        // Update notification button
        updateNotificationButton();
    }

    // Generate episode buttons
    function generateEpisodeButtons() {
        const grid = document.getElementById('episodeGrid');
        if (!grid || !currentManga) return;
        
        const episodes = [];
        const totalEpisodes = currentManga.total_episodes || currentManga.totalEpisodes || 0;
        const availableEpisodes = currentManga.available_episodes || currentManga.availableEpisodes || 0;

        for (let i = 1; i <= totalEpisodes; i++) {
            const isAvailable = i <= availableEpisodes;
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
        if (!info || !currentManga) return;
        
        const availableEpisodes = currentManga.available_episodes || currentManga.availableEpisodes || 0;
        const totalEpisodes = currentManga.total_episodes || currentManga.totalEpisodes || 0;
        const isAvailable = currentEpisode <= availableEpisodes;
        
        if (isAvailable) {
            info.innerHTML = `Серия ${currentEpisode} из ${totalEpisodes}`;
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
        
        if (!player || !placeholder || !currentManga) return;
        
        const availableEpisodes = currentManga.available_episodes || currentManga.availableEpisodes || 0;
        const isAvailable = episode <= availableEpisodes;
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
            if (title) title.textContent = `Серия ${episode} недоступна`;
            if (text) {
                const goal = currentManga.donation_goal || currentManga.donationGoal || 10000;
                text.innerHTML = `Поддержите проект, чтобы ускорить выход новых серий!<br><strong>Цель: ${goal.toLocaleString()}₽</strong>`;
            }
        } else {
            // Video not found
            player.style.display = 'none';
            placeholder.style.display = 'flex';
            if (title) title.textContent = `Серия ${episode}`;
            if (text) text.textContent = 'Видео пока не загружено';
        }
    }

    // Notification button functionality
    function updateNotificationButton() {
        const notificationBtn = document.getElementById('notificationBtn');
        if (!notificationBtn || !currentManga) return;

        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (!isLoggedIn) {
            notificationBtn.style.display = 'none';
            return;
        }

        notificationBtn.style.display = 'block';
        
        const isSubscribed = window.NotificationSystem ? 
            window.NotificationSystem.isSubscribedToManga(currentManga.id) : false;

        if (isSubscribed) {
            notificationBtn.innerHTML = `
                <i>🔕</i>
                Отписаться
            `;
            notificationBtn.classList.remove('primary');
            notificationBtn.onclick = () => unsubscribeFromNotifications();
        } else {
            notificationBtn.innerHTML = `
                <i>🔔</i>
                Уведомления
            `;
            notificationBtn.classList.add('primary');
            notificationBtn.onclick = () => subscribeToNotifications();
        }
    }

    async function subscribeToNotifications() {
        if (!window.NotificationSystem || !currentManga) return;

        try {
            await window.NotificationSystem.subscribeToManga(currentManga.id);
            showNotification('Под��иска на уведомления активирована! Тайтл добавлен в избранное.', 'success');
            updateNotificationButton();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    async function unsubscribeFromNotifications() {
        if (!window.NotificationSystem || !currentManga) return;

        if (confirm('Отписаться от уведомлений о новых сериях этого тайтла?')) {
            try {
                await window.NotificationSystem.unsubscribeFromManga(currentManga.id);
                showNotification('Подписка на уведомления отключена', 'success');
                updateNotificationButton();
            } catch (error) {
                showNotification('Ошибка отписки', 'error');
            }
        }
    }

    // Update donation info
    function updateDonationInfo() {
        if (!currentManga) return;
        
        const current = currentManga.current_donations || currentManga.currentDonations || 0;
        const goal = currentManga.donation_goal || currentManga.donationGoal || 10000;
        const percentage = (current / goal) * 100;
        const currencySystem = window.CurrencySystem;

        const currentDonationsEl = document.getElementById('currentDonations');
        const donationGoalEl = document.getElementById('donationGoal');
        const progressBarFill = document.getElementById('progressBarFill');
        const progressPercentage = document.getElementById('progressPercentage');
        const donateBtn = document.getElementById('donateBtn');

        if (currentDonationsEl) {
            currentDonationsEl.textContent = currencySystem ? currencySystem.formatAmount(current) : current.toLocaleString() + '₽';
            currentDonationsEl.setAttribute('data-amount', current);
        }
        if (donationGoalEl) {
            donationGoalEl.textContent = currencySystem ? currencySystem.formatAmount(goal) : goal.toLocaleString() + '₽';
            donationGoalEl.setAttribute('data-amount', goal);
        }
        if (progressBarFill) progressBarFill.style.width = `${Math.min(percentage, 100)}%`;
        if (progressPercentage) progressPercentage.textContent = `${percentage.toFixed(1)}%`;

        // Update donate button
        if (donateBtn) {
            if (percentage >= 100) {
                donateBtn.textContent = '✅ Цель достигнута!';
                donateBtn.disabled = true;
            } else {
                donateBtn.textContent = '💝 Поддержать проект';
                donateBtn.disabled = false;
            }
        }
    }

    // User actions
    async function addToFavorites() {
        await addToUserList('favorites', 'Избранное');
    }

    async function addToWatching() {
        await addToUserList('watching', 'Смотрю');
    }

    async function addToWantToWatch() {
        await addToUserList('want_to_watch', 'Хочу посмотреть');
    }

    async function addToCompleted() {
        await addToUserList('completed', 'Досмотрел');
    }

    async function addToUserList(listName, listTitle) {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (!isLoggedIn) {
            showNotification('Войдите в аккаунт для добавления в списки', 'error');
            return;
        }
        
        if (!currentManga) {
            showNotification('Ошибка: тайтл не загружен', 'error');
            return;
        }
        
        try {
            if (window.supabase) {
                const { data: { user } } = await window.supabase.auth.getUser();
                
                if (!user) {
                    showNotification('Войдите в аккаунт', 'error');
                    return;
                }

                const { error } = await window.supabase
                    .from('user_lists')
                    .upsert({
                        user_id: user.id,
                        manga_id: currentManga.id,
                        list_type: listName,
                        current_episode: currentEpisode
                    });

                if (error) throw error;
            } else {
                // Fallback к localStorage
                const mangaForStorage = {
                    id: Date.now(),
                    mangaId: currentManga.id,
                    title: currentManga.title,
                    image: currentManga.cover_url || currentManga.image,
                    currentEpisode: currentEpisode,
                    totalEpisodes: currentManga.total_episodes || currentManga.totalEpisodes,
                    availableEpisodes: currentManga.available_episodes || currentManga.availableEpisodes,
                    status: currentManga.status,
                    rating: currentManga.rating,
                    type: currentManga.type,
                    addedAt: new Date().toISOString()
                };

                const currentList = JSON.parse(localStorage.getItem(listName) || '[]');
                
                // Remove if already exists
                const filtered = currentList.filter(item => item.mangaId !== currentManga.id);
                
                // Add new entry
                filtered.push(mangaForStorage);
                
                localStorage.setItem(listName, JSON.stringify(filtered));
            }
            
            showNotification(`Добавлено в "${listTitle}"`, 'success');
            
        } catch (error) {
            console.error('Add to list error:', error);
            showNotification('Ошибка добавления в список', 'error');
        }
    }

    // Comments functionality
    function loadComments() {
        if (!currentManga) return;
        
        const commentsList = document.getElementById('commentsList');
        if (!commentsList) return;
        
        const comments = JSON.parse(localStorage.getItem(`comments_${currentManga.id}`) || '[]');
        
        if (comments.length === 0) {
            commentsList.innerHTML = `
                <div class="no-comments" style="text-align: center; padding: 40px; color: var(--secondary-color);">
                    <span style="font-size: 2rem; opacity: 0.5;">💬</span>
                    <p>Пока нет комментариев. Будьте первым!</p>
                </div>
            `;
            return;
        }
        
        commentsList.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <div class="comment-author">
                        <div class="comment-author-avatar">${comment.authorName.charAt(0).toUpperCase()}</div>
                        <span class="comment-author-name">${comment.authorName}</span>
                    </div>
                    <span class="comment-time">${window.formatTime ? window.formatTime(comment.createdAt) : 'недавно'}</span>
                </div>
                <div class="comment-text">${comment.text}</div>
                <div class="comment-actions-row">
                    <button class="comment-action" onclick="likeComment('${comment.id}')">
                        <span>👍</span>
                        <span>${comment.likes || 0}</span>
                    </button>
                </div>
            </div>
        `).join('');
    }

    function addComment() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        
        if (!isLoggedIn || !currentUser) {
            showNotification('Войдите в аккаунт для комментирования', 'error');
            return;
        }
        
        const commentInput = document.getElementById('commentInput');
        if (!commentInput || !currentManga) return;
        
        const text = commentInput.value.trim();
        
        if (!text) {
            showNotification('Введите текст комментария', 'error');
            return;
        }
        
        const comment = {
            id: Date.now().toString(),
            mangaId: currentManga.id,
            authorId: currentUser.id,
            authorName: currentUser.name || currentUser.username || 'Пользователь',
            text: text,
            episode: currentEpisode,
            createdAt: new Date().toISOString(),
            likes: 0
        };
        
        const comments = JSON.parse(localStorage.getItem(`comments_${currentManga.id}`) || '[]');
        comments.unshift(comment);
        localStorage.setItem(`comments_${currentManga.id}`, JSON.stringify(comments));
        
        commentInput.value = '';
        loadComments();
        showNotification('Комментарий добавлен!', 'success');
    }

    function likeComment(commentId) {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (!isLoggedIn) {
            showNotification('Войдите для оценки комментариев', 'error');
            return;
        }
        
        if (!currentManga) return;
        
        const comments = JSON.parse(localStorage.getItem(`comments_${currentManga.id}`) || '[]');
        const comment = comments.find(c => c.id === commentId);
        
        if (comment) {
            comment.likes = (comment.likes || 0) + 1;
            localStorage.setItem(`comments_${currentManga.id}`, JSON.stringify(comments));
            loadComments();
            showNotification('👍 Лайк добавлен!', 'success');
        }
    }

    // Utility functions
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

    function showError(message) {
        const loadingState = document.getElementById('loadingState');
        const errorState = document.getElementById('errorState');
        
        if (loadingState) loadingState.style.display = 'none';
        if (errorState) {
            errorState.style.display = 'flex';
            const errorText = errorState.querySelector('p');
            if (errorText) errorText.textContent = message;
        }
    }

    // Wait for data
    function waitForData() {
        if (window.MangaAPI) {
            initializePlayer();
        } else {
            setTimeout(waitForData, 100);
        }
    }

    // Event listeners
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🎬 Плеер: DOM загружен');
        
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
        
        // Initialize
        updateAuthState();

        // Wait for data to be ready
        waitForData();
        
        // Listen for data ready event
        window.addEventListener('mangaDataReady', initializePlayer);
    });

    // Export functions globally
    window.toggleMenu = toggleMenu;
    window.closeMenu = closeMenu;
    window.login = login;
    window.logout = logout;
    window.openRandomManga = openRandomManga;
    window.selectEpisode = selectEpisode;
    window.addToFavorites = addToFavorites;
    window.addToWatching = addToWatching;
    window.addToWantToWatch = addToWantToWatch;
    window.addToCompleted = addToCompleted;
    window.addComment = addComment;
    window.likeComment = likeComment;
    window.subscribeToNotifications = subscribeToNotifications;
    window.unsubscribeFromNotifications = unsubscribeFromNotifications;
    window.showNotification = showNotification;
    window.updateAuthState = updateAuthState;

    console.log('🎬 Плеер загружен');

})();