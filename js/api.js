// API клиент для Light Fox Manga
class LightFoxAPI {
    constructor() {
        this.baseURL = (window.location.origin || 'http://localhost:3000') + '/api';
        this.token = localStorage.getItem('auth_token');
        this.refreshPromise = null;
    }

    // Установка токена
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    // Получение заголовков для запросов
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Базовый метод для запросов
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            // Проверяем статус ответа
            if (response.status === 401) {
                // Токен истек или недействителен
                this.setToken(null);
                throw new Error('Сессия истекла. Войдите в систему заново.');
            }
            

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`🚨 API Error (${endpoint}):`, error.message);
            
            // Если ошибка сети, показываем более понятное сообщение
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Ошибка подключения к серверу. Проверьте интернет-соединение.');
            }
            
            throw error;
        }
    }

    // === АУТЕНТИФИКАЦИЯ ===

    async register(userData) {
        // Валидация на клиенте
        if (!userData.username || userData.username.length < 2) {
            throw new Error('Имя пользователя должно содержать минимум 2 символа');
        }
        
        if (!userData.email || !this.isValidEmail(userData.email)) {
            throw new Error('Введите корректный email');
        }
        
        if (!userData.password || userData.password.length < 6) {
            throw new Error('Пароль должен содержать минимум 6 символов');
        }
        
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (response.token) {
            this.setToken(response.token);
        }

        return response;
    }

    async login(credentials) {
        // Валидация на клиенте
        if (!credentials.email || !this.isValidEmail(credentials.email)) {
            throw new Error('Введите корректный email');
        }
        
        if (!credentials.password) {
            throw new Error('Введите пароль');
        }
        
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });

        if (response.token) {
            this.setToken(response.token);
        }

        return response;
    }

    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } finally {
            this.setToken(null);
        }
    }

    async verifyToken() {
        try {
            return await this.request('/auth/verify');
        } catch (error) {
            this.setToken(null);
            throw error;
        }
    }

    // === МАНГА ===

    async getAllManga(filters = {}) {
        const params = new URLSearchParams();
        
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== '') {
                if (Array.isArray(filters[key])) {
                    params.append(key, filters[key].join(','));
                } else {
                    params.append(key, filters[key]);
                }
            }
        });

        const queryString = params.toString();
        const endpoint = `/manga${queryString ? '?' + queryString : ''}`;
        
        const response = await this.request(endpoint);
        return response.manga || [];
    }

    async getMangaById(id) {
        if (!id) {
            throw new Error('ID манги не указан');
        }
        return await this.request(`/manga/${id}`);
    }

    async getGenres() {
        return await this.request('/manga/meta/genres');
    }

    async getCategories() {
        return await this.request('/manga/meta/categories');
    }

    async getStatuses() {
        return await this.request('/manga/meta/statuses');
    }

    async getStats() {
        return await this.request('/manga/meta/stats');
    }

    async getRandomManga() {
        return await this.request('/manga/random');
    }

    // === АДМИНКА ===

    async saveManga(mangaData) {
        // Валидация обязательных полей
        if (!mangaData.title || !mangaData.title.trim()) {
            throw new Error('Название тайтла обязательно');
        }
        
        if (!mangaData.type) {
            throw new Error('Тип тайтла обязателен');
        }
        
        if (!mangaData.status) {
            throw new Error('Статус тайтла обязателен');
        }
        
        return await this.request('/admin/manga', {
            method: 'POST',
            body: JSON.stringify(mangaData)
        });
    }

    async deleteManga(id) {
        if (!id) {
            throw new Error('ID манги не указан');
        }
        
        if (!confirm('Вы уверены, что хотите удалить этот тайтл?')) {
            throw new Error('Удаление отменено');
        }
        
        return await this.request(`/admin/manga/${id}`, {
            method: 'DELETE'
        });
    }

    async getDashboardStats() {
        return await this.request('/admin/dashboard/stats');
    }

    // === ДОНАТ-ПРОЕКТЫ ===

    async getDonationProjects() {
        return await this.request('/donations/projects');
    }

    async saveDonationProject(projectData) {
        // Валидация
        if (!projectData.manga_id) {
            throw new Error('Выберите тайтл для проекта');
        }
        
        if (!projectData.title || !projectData.title.trim()) {
            throw new Error('Название проекта обязательно');
        }
        
        if (!projectData.goal_amount || projectData.goal_amount < 1000) {
            throw new Error('Цель доната должна быть не менее 1000₽');
        }
        
        return await this.request('/admin/donation-projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
    }

    async deleteDonationProject(id) {
        if (!id) {
            throw new Error('ID проекта не указан');
        }
        
        return await this.request(`/admin/donation-projects/${id}`, {
            method: 'DELETE'
        });
    }

    async updateDonationAmount(projectId, amount) {
        if (!projectId) {
            throw new Error('ID проекта не указан');
        }
        
        if (!amount || amount < 0) {
            throw new Error('Сумма должна быть положительной');
        }
        
        return await this.request(`/admin/donation-projects/${projectId}/amount`, {
            method: 'PATCH',
            body: JSON.stringify({ amount })
        });
    }

    // === ДОНАТЫ ===

    async makeDonation(donationData) {
        // Валидация
        if (!donationData.amount || donationData.amount < 10) {
            throw new Error('Минимальная сумма доната: 10₽');
        }
        
        if (donationData.amount > 50000) {
            throw new Error('Максимальная сумма доната: 50,000₽');
        }
        
        if (!donationData.project_id && !donationData.manga_id) {
            throw new Error('Укажите проект или мангу для доната');
        }
        
        return await this.request('/donations/donate', {
            method: 'POST',
            body: JSON.stringify(donationData)
        });
    }

    async getDonationHistory() {
        return await this.request('/donations/history');
    }

    async getDonationStats() {
        return await this.request('/donations/stats');
    }

    // === ПОЛЬЗОВАТЕЛЬСКИЕ СПИСКИ ===

    async getUserLists() {
        return await this.request('/users/lists');
    }

    async addToList(mangaId, listType, currentEpisode = 1) {
        if (!mangaId) {
            throw new Error('ID манги не указан');
        }
        
        if (!['favorites', 'watching', 'wantToWatch', 'completed'].includes(listType)) {
            throw new Error('Неверный тип списка');
        }
        
        return await this.request('/users/lists', {
            method: 'POST',
            body: JSON.stringify({
                manga_id: mangaId,
                list_type: listType,
                current_episode: currentEpisode
            })
        });
    }

    async removeFromList(mangaId, listType) {
        if (!mangaId || !listType) {
            throw new Error('Не указаны обязательные параметры');
        }
        
        return await this.request(`/users/lists/${mangaId}/${listType}`, {
            method: 'DELETE'
        });
    }

    async updateProgress(mangaId, episodeNumber, progressSeconds = 0, completed = false) {
        if (!mangaId || !episodeNumber) {
            throw new Error('Не указаны обязательные параметры');
        }
        
        return await this.request('/users/progress', {
            method: 'POST',
            body: JSON.stringify({
                manga_id: mangaId,
                episode_number: episodeNumber,
                progress_seconds: progressSeconds,
                completed
            })
        });
    }

    async getProgress(mangaId) {
        if (!mangaId) {
            throw new Error('ID манги не указан');
        }
        
        return await this.request(`/users/progress/${mangaId}`);
    }

    async getUserProfile() {
        return await this.request('/users/profile');
    }

    async updateProfile(profileData) {
        return await this.request('/users/profile', {
            method: 'PATCH',
            body: JSON.stringify(profileData)
        });
    }

    // === УТИЛИТЫ ===

    // Проверка аутентификации
    isAuthenticated() {
        return !!this.token;
    }

    // Валидация email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Очистка HTML для безопасности
    sanitizeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }
    // Фильтрация манги (клиентская сторона для совместимости)
    filterManga(manga, filters = {}) {
        let result = [...manga];

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            result = result.filter(item => 
                item.title && item.title.toLowerCase().includes(searchTerm)
            );
        }

        if (filters.genres && filters.genres.length > 0) {
            result = result.filter(item => 
                item.genres && filters.genres.some(genre => 
                    item.genres.includes(genre)
                )
            );
        }

        if (filters.categories && filters.categories.length > 0) {
            result = result.filter(item => 
                item.categories && filters.categories.some(category => 
                    item.categories.includes(category)
                )
            );
        }

        if (filters.statuses && filters.statuses.length > 0) {
            result = result.filter(item => 
                item.status && filters.statuses.includes(item.status)
            );
        }

        // Сортировка
        if (filters.sortBy) {
            switch (filters.sortBy) {
                case 'alphabet':
                    result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                    break;
                case 'rating':
                    result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                    break;
                case 'updated':
                    result.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
                    break;
                case 'popularity':
                default:
                    result.sort((a, b) => {
                        const aPopularity = (a.current_donations || 0) + (a.rating || 0) * 1000;
                        const bPopularity = (b.current_donations || 0) + (b.rating || 0) * 1000;
                        return bPopularity - aPopularity;
                    });
                    break;
            }
        }

        return result;
    }
}

// Создаем глобальный экземпляр API
window.LightFoxAPI = new LightFoxAPI();

// Обратная совместимость с существующим кодом
window.MangaAPI = {
    getAllManga: async () => {
        try {
            return await window.LightFoxAPI.getAllManga(filters);
        } catch (error) {
            console.error('Ошибка получения манги:', error);
            // Возвращаем пустой массив вместо падения
            return [];
        }
    },

    getMangaById: async (id) => {
        try {
            return await window.LightFoxAPI.getMangaById(id);
        } catch (error) {
            console.error('Ошибка получения манги по ID:', error);
            return null;
        }
    },

    getGenres: async () => {
        try {
            return await window.LightFoxAPI.getGenres();
        } catch (error) {
            console.error('Ошибка получения жанров:', error);
            return [];
        }
    },

    getCategories: async () => {
        try {
            return await window.LightFoxAPI.getCategories();
        } catch (error) {
            console.error('Ошибка получения категорий:', error);
            return [];
        }
    },

    getStatuses: async () => {
        try {
            return await window.LightFoxAPI.getStatuses();
        } catch (error) {
            console.error('Ошибка получения статусов:', error);
            return [];
        }
    },

    getStats: async () => {
        try {
            return await window.LightFoxAPI.getStats();
        } catch (error) {
            console.error('Ошибка получения статистики:', error);
            return { totalManga: 0, totalEpisodes: 0, averageRating: 0, totalDonations: 0 };
        }
    },

    filterManga: (manga, filters) => {
        // Для совместимости с существующим кодом
        return window.LightFoxAPI.filterManga(manga, filters);
    },

    addManga: async (mangaData) => {
        try {
            return await window.LightFoxAPI.saveManga(mangaData);
        } catch (error) {
            console.error('Ошибка добавления манги:', error);
            throw error;
        }
    },

    updateManga: async (id, updates) => {
        try {
            return await window.LightFoxAPI.saveManga({ id, ...updates });
        } catch (error) {
            console.error('Ошибка обновления манги:', error);
            throw error;
        }
    },

    deleteManga: async (id) => {
        try {
            return await window.LightFoxAPI.deleteManga(id);
        } catch (error) {
            console.error('Ошибка удаления манги:', error);
            throw error;
        }
    }
};

// Система аутентификации для совместимости
window.AuthSystem = {
    isAuthenticated: () => window.LightFoxAPI.isAuthenticated(),
    
    getCurrentUser: async () => {
        try {
            if (!window.LightFoxAPI.isAuthenticated()) return null;
            const response = await window.LightFoxAPI.verifyToken();
            return response.user;
        } catch (error) {
            console.warn('Ошибка получения текущего пользователя:', error.message);
            return null;
        }
    },

    login: async (email, password, deviceInfo, rememberMe = false) => {
        const response = await window.LightFoxAPI.login({
            email,
            password,
            rememberMe
        });
        
        // Сохраняем информацию о пользователе для совместимости
        if (response.user) {
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            localStorage.setItem('isLoggedIn', 'true');
        }
        
        return response;
    },

    register: async (userData, deviceInfo) => {
        const response = await window.LightFoxAPI.register(userData);
        
        // Сохраняем информацию о пользователе для совместимости
        if (response.user) {
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            localStorage.setItem('isLoggedIn', 'true');
        }
        
        return response;
    },

    logout: async () => {
        await window.LightFoxAPI.logout();
        
        // Очищаем локальные данные
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
    }
};

// Автоматическая проверка токена при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    if (window.LightFoxAPI.isAuthenticated()) {
        try {
            await window.LightFoxAPI.verifyToken();
        } catch (error) {
            console.warn('Токен недействителен, очищаем сессию');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('isLoggedIn');
        }
    }
});
console.log('🌐 Light Fox Manga API клиент загружен');