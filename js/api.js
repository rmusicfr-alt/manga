// API клиент для Light Fox Manga
class LightFoxAPI {
    constructor() {
        this.baseURL = window.location.origin + '/api';
        this.token = localStorage.getItem('auth_token');
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
            'Content-Type': 'application/json'
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

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    // === АУТЕНТИФИКАЦИЯ ===

    async register(userData) {
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
        return await this.request('/admin/manga', {
            method: 'POST',
            body: JSON.stringify(mangaData)
        });
    }

    async deleteManga(id) {
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
        return await this.request('/admin/donation-projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
    }

    async deleteDonationProject(id) {
        return await this.request(`/admin/donation-projects/${id}`, {
            method: 'DELETE'
        });
    }

    async updateDonationAmount(projectId, amount) {
        return await this.request(`/admin/donation-projects/${projectId}/amount`, {
            method: 'PATCH',
            body: JSON.stringify({ amount })
        });
    }

    // === ДОНАТЫ ===

    async makeDonation(donationData) {
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
        return await this.request(`/users/lists/${mangaId}/${listType}`, {
            method: 'DELETE'
        });
    }

    async updateProgress(mangaId, episodeNumber, progressSeconds = 0, completed = false) {
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

    // Фильтрация манги (клиентская сторона для совместимости)
    filterManga(manga, filters = {}) {
        let result = [...manga];

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            result = result.filter(item => 
                item.title.toLowerCase().includes(searchTerm)
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
                    result.sort((a, b) => a.title.localeCompare(b.title));
                    break;
                case 'rating':
                    result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                    break;
                case 'updated':
                    result.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
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
            return await window.LightFoxAPI.getAllManga();
        } catch (error) {
            console.error('Ошибка получения манги:', error);
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

    filterManga: (filters) => {
        // Эта функция теперь работает на сервере через getAllManga с параметрами
        console.warn('filterManga deprecated, используйте getAllManga с фильтрами');
        return [];
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
            return null;
        }
    },

    login: async (email, password, deviceInfo, rememberMe = false) => {
        return await window.LightFoxAPI.login({
            email,
            password,
            rememberMe
        });
    },

    register: async (userData, deviceInfo) => {
        return await window.LightFoxAPI.register(userData);
    },

    logout: async () => {
        await window.LightFoxAPI.logout();
    }
};

console.log('🌐 Light Fox Manga API клиент загружен');