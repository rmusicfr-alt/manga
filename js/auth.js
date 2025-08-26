// Система авторизации для Light Fox Manga
(function() {
    'use strict';

    // Ключи для хранения данных
    const STORAGE_KEYS = {
        users: 'lightfox_users',
        sessions: 'lightfox_sessions',
        currentSession: 'lightfox_current_session'
    };

    class AuthSystem {
        constructor() {
            this.users = this.loadUsers();
            this.sessions = this.loadSessions();
            this.currentSession = this.loadCurrentSession();
            this.initializeDemoUser();
        }

        // Загрузка пользователей
        loadUsers() {
            try {
                return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
            } catch (e) {
                return [];
            }
        }

        // Сохранение пользователей
        saveUsers() {
            localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(this.users));
            
            // Уведомляем админку об обновлении
            window.dispatchEvent(new CustomEvent('usersUpdated', {
                detail: { users: this.users }
            }));
        }

        // Загрузка сессий
        loadSessions() {
            try {
                return JSON.parse(localStorage.getItem(STORAGE_KEYS.sessions) || '[]');
            } catch (e) {
                return [];
            }
        }

        // Сохранение сессий
        saveSessions() {
            localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(this.sessions));
        }

        // Загрузка текущей сессии
        loadCurrentSession() {
            try {
                return JSON.parse(localStorage.getItem(STORAGE_KEYS.currentSession) || 'null');
            } catch (e) {
                return null;
            }
        }

        // Сохранение текущей сессии
        saveCurrentSession() {
            localStorage.setItem(STORAGE_KEYS.currentSession, JSON.stringify(this.currentSession));
        }

        // Проверка авторизации
        isAuthenticated() {
            if (!this.currentSession) return false;
            
            const user = this.users.find(u => u.id === this.currentSession.userId);
            if (!user) {
                this.logout();
                return false;
            }
            
            const device = user.devices.find(d => d.id === this.currentSession.deviceId);
            if (!device) {
                this.logout();
                return false;
            }
            
            return true;
        }

        // Получение текущего пользователя
        getCurrentUser() {
            if (!this.isAuthenticated()) return null;
            return this.users.find(u => u.id === this.currentSession.userId);
        }

        // Генерация уникального ID устройства
        generateDeviceId() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('Device fingerprint', 2, 2);
            
            const fingerprint = [
                navigator.userAgent,
                navigator.language,
                screen.width + 'x' + screen.height,
                new Date().getTimezoneOffset(),
                canvas.toDataURL ? canvas.toDataURL() : ''
            ].join('|');
            
            return 'device_' + btoa(fingerprint).replace(/[^a-zA-Z0-9]/g, '').substr(0, 16);
        }

        // Получение информации об устройстве
        getDeviceInfo() {
            const userAgent = navigator.userAgent;
            let deviceType = 'Desktop';
            let browser = 'Unknown';
            
            // Определение типа устройства
            if (/Mobi|Android/i.test(userAgent)) {
                deviceType = 'Mobile';
            } else if (/Tablet|iPad/i.test(userAgent)) {
                deviceType = 'Tablet';
            }
            
            // Определение браузера
            if (userAgent.indexOf('Chrome') > -1) {
                browser = 'Chrome';
            } else if (userAgent.indexOf('Firefox') > -1) {
                browser = 'Firefox';
            } else if (userAgent.indexOf('Safari') > -1) {
                browser = 'Safari';
            } else if (userAgent.indexOf('Edge') > -1) {
                browser = 'Edge';
            }
            
            return {
                id: this.generateDeviceId(),
                type: deviceType,
                browser: browser,
                userAgent: userAgent,
                platform: navigator.platform,
                language: navigator.language,
                screen: `${screen.width}x${screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
        }

        // Регистрация пользователя
        async register(userData, deviceInfo, rememberMe = false) {
            // Проверяем, что email не занят
            if (this.users.find(u => u.email === userData.email)) {
                throw new Error('Пользователь с таким email уже существует');
            }

            const currentDeviceInfo = deviceInfo || this.getDeviceInfo();

            // Создаем нового пользователя
            const newUser = {
                id: this.generateUserId(),
                username: userData.username,
                email: userData.email,
                password: btoa(userData.password), // Простое кодирование для демо
                registeredAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                devices: [{
                    ...currentDeviceInfo,
                    registrationDevice: true,
                    addedAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                }],
                subscription: null,
                settings: {
                    theme: 'light',
                    language: 'ru',
                    notifications: true,
                    emailNotifications: false
                },
                profile: {
                    avatar: null,
                    bio: '',
                    displayName: userData.username
                },
                stats: {
                    totalWatched: 0,
                    totalRatings: 0,
                    totalComments: 0,
                    totalDonations: 0,
                    loginCount: 1
                },
                lists: {
                    favorites: [],
                    watching: [],
                    wantToWatch: [],
                    completed: []
                },
                donationHistory: [],
                isActive: true
            };

            // Сохраняем пользователя
            this.users.push(newUser);
            this.saveUsers();

            // Создаем сессию
            this.createSession(newUser, currentDeviceInfo.id, rememberMe);

            // Обновляем совместимость со старой системой
            this.updateLegacyStorage(newUser);

            return newUser;
        }

        // Вход в систему
        async login(email, password, deviceInfo, rememberMe = false) {
            const user = this.users.find(u => u.email === email && u.password === btoa(password));
            if (!user) {
                throw new Error('Неверный email или пароль');
            }

            if (!user.isActive) {
                throw new Error('Аккаунт заблокирован. Обратитесь в поддержку.');
            }

            const currentDeviceInfo = deviceInfo || this.getDeviceInfo();
            const existingDevice = user.devices.find(d => d.id === currentDeviceInfo.id);
            
            // Проверяем лимит устройств (максимум 3)
            if (!existingDevice && user.devices.length >= 3) {
                throw new Error('Достигнут лимит устройств (максимум 3). Отвяжите одно из устройств в настройках или обратитесь в поддержку.');
            }

            // Добавляем новое устройство или обновляем существующее
            if (!existingDevice) {
                user.devices.push({
                    ...currentDeviceInfo,
                    addedAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                });
            } else {
                existingDevice.lastLogin = new Date().toISOString();
            }

            // Обновляем статистику пользователя
            user.lastLogin = new Date().toISOString();
            user.stats.loginCount = (user.stats.loginCount || 0) + 1;
            
            this.saveUsers();
            this.createSession(user, currentDeviceInfo.id, rememberMe);

            // Обновляем совместимость со старой системой
            this.updateLegacyStorage(user);

            return user;
        }

        // Создание сессии
        createSession(user, deviceId, rememberMe = false) {
            this.currentSession = {
                userId: user.id,
                deviceId: deviceId,
                loginTime: new Date().toISOString(),
                rememberMe: rememberMe,
                expiresAt: rememberMe ? 
                    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : // 30 дней
                    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 1 день
            };
            
            this.saveCurrentSession();
            
            // Добавляем в список активных сессий
            this.sessions.push({
                ...this.currentSession,
                id: Date.now().toString()
            });
            this.saveSessions();
        }

        // Выход из системы
        logout() {
            if (this.currentSession) {
                // Удаляем из активных сессий
                this.sessions = this.sessions.filter(s => 
                    !(s.userId === this.currentSession.userId && s.deviceId === this.currentSession.deviceId)
                );
                this.saveSessions();
            }
            
            this.currentSession = null;
            localStorage.removeItem(STORAGE_KEYS.currentSession);
            
            // Очищаем совместимость со старой системой
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
        }

        // Обновление совместимости со старой системой
        updateLegacyStorage(user) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('currentUser', JSON.stringify({
                id: user.id,
                name: user.username,
                username: user.username,
                email: user.email
            }));
        }

        // Получение всех пользователей (для админки)
        getAllUsers() {
            return this.users.map(user => ({
                ...user,
                password: undefined, // Не показываем пароли в админке
                devicesCount: user.devices.length,
                lastDevice: user.devices[user.devices.length - 1]
            }));
        }

        // Блокировка/разблокировка пользователя
        toggleUserStatus(userId) {
            const user = this.users.find(u => u.id === userId);
            if (user) {
                user.isActive = !user.isActive;
                this.saveUsers();
                
                // Если заблокировали текущего пользователя
                if (!user.isActive && this.currentSession?.userId === userId) {
                    this.logout();
                }
                
                return user;
            }
            return null;
        }

        // Отвязка устройства
        removeUserDevice(userId, deviceId) {
            const user = this.users.find(u => u.id === userId);
            if (user) {
                user.devices = user.devices.filter(d => d.id !== deviceId);
                this.saveUsers();
                
                // Если отвязали текущее устройство
                if (this.currentSession?.userId === userId && this.currentSession?.deviceId === deviceId) {
                    this.logout();
                }
                
                return user;
            }
            return null;
        }

        // Генерация ID пользователя
        generateUserId() {
            return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        // Инициализация демо-пользователя
        initializeDemoUser() {
            if (this.users.length === 0) {
                const demoUser = {
                    id: 'demo_user_123',
                    username: 'DemoUser',
                    email: 'demo@example.com',
                    password: btoa('123456'),
                    registeredAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                    devices: [{
                        id: 'demo_device_123',
                        type: 'Desktop',
                        browser: 'Chrome',
                        platform: 'Win32',
                        language: 'ru',
                        screen: '1920x1080',
                        timezone: 'Europe/Moscow',
                        registrationDevice: true,
                        addedAt: new Date().toISOString(),
                        lastLogin: new Date().toISOString()
                    }],
                    subscription: null,
                    settings: {
                        theme: 'light',
                        language: 'ru',
                        notifications: true,
                        emailNotifications: false
                    },
                    profile: {
                        avatar: null,
                        bio: 'Демо-пользователь для тестирования',
                        displayName: 'DemoUser'
                    },
                    stats: {
                        totalWatched: 5,
                        totalRatings: 3,
                        totalComments: 2,
                        totalDonations: 1500,
                        loginCount: 10
                    },
                    lists: {
                        favorites: [],
                        watching: [],
                        wantToWatch: [],
                        completed: []
                    },
                    donationHistory: [
                        {
                            mangaId: '1',
                            mangaTitle: 'Атака титанов',
                            amount: 500,
                            timestamp: new Date(Date.now() - 86400000).toISOString()
                        },
                        {
                            mangaId: '2',
                            mangaTitle: 'Наруто',
                            amount: 1000,
                            timestamp: new Date(Date.now() - 172800000).toISOString()
                        }
                    ],
                    isActive: true
                };
                
                this.users.push(demoUser);
                this.saveUsers();
                console.log('💡 Демо пользователь создан: demo@example.com / 123456');
            }
        }

        // Получение статистики пользователей
        getUsersStats() {
            return {
                totalUsers: this.users.length,
                activeUsers: this.users.filter(u => u.isActive).length,
                blockedUsers: this.users.filter(u => !u.isActive).length,
                totalSessions: this.sessions.length,
                totalDonations: this.users.reduce((sum, user) => 
                    sum + user.donationHistory.reduce((userSum, donation) => userSum + donation.amount, 0), 0
                ),
                averageDevicesPerUser: this.users.length > 0 ? 
                    this.users.reduce((sum, user) => sum + user.devices.length, 0) / this.users.length : 0
            };
        }
    }

    // Создаем глобальный экземпляр
    window.AuthSystem = new AuthSystem();

    // Глобальные функции для продакшена
    let isDark = localStorage.getItem('theme') === 'dark';
    let currentForm = 'login';

    // Показ модала авторизации
    function showAuthModal(mode = 'login') {
        const modal = document.getElementById('authModal');
        if (!modal) return;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        if (mode === 'register') {
            switchToRegister();
        } else {
            switchToLogin();
        }
    }
    
    // Закрытие модала
    function closeAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    // Theme functionality
    function updateTheme() {
        document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
        
        const moonIcon = document.querySelector('.moon-icon');
        const sunIcon = document.querySelector('.sun-icon');
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

    // Form switching
    function switchToLogin() {
        currentForm = 'login';
        
        document.getElementById('loginForm').classList.add('active');
        document.getElementById('registerForm').classList.remove('active');
        
        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage) {
            welcomeMessage.innerHTML = `
                <h2 class="welcome-title">Добро пожаловать!</h2>
                <p class="welcome-text">Присоединяйтесь к сообществу любителей манги. Тысячи тайтлов, эксклюзивный контент и многое другое ждут вас!</p>
                <button class="switch-btn" onclick="switchToRegister()">Создать аккаунт</button>
            `;
        }
    }

    function switchToRegister() {
        currentForm = 'register';
        
        document.getElementById('registerForm').classList.add('active');
        document.getElementById('loginForm').classList.remove('active');
        
        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage) {
            welcomeMessage.innerHTML = `
                <h2 class="welcome-title">Уже есть аккаунт?</h2>
                <p class="welcome-text">Войдите в свой аккаунт, чтобы продолжить чтение любимой манги и получить доступ ко всем функциям сайта.</p>
                <button class="switch-btn" onclick="switchToLogin()">Войти</button>
            `;
        }
    }

    // Event listeners setup
    function setupEventListeners() {
        // Form submissions
        const loginForm = document.getElementById('loginFormElement');
        const registerForm = document.getElementById('registerFormElement');
        
        if (loginForm) loginForm.addEventListener('submit', handleLogin);
        if (registerForm) registerForm.addEventListener('submit', handleRegister);
        
        // Закрытие модала по клику вне его
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeAuthModal();
                }
            });
        }
    }

    // Validation functions
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validatePassword(password) {
        return password.length >= 6;
    }

    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorDiv = document.getElementById(fieldId + 'Error');
        
        if (field && errorDiv) {
            field.classList.add('error');
            errorDiv.textContent = message;
            errorDiv.classList.add('show');
        }
    }

    function clearError(fieldId) {
        const field = document.getElementById(fieldId);
        const errorDiv = document.getElementById(fieldId + 'Error');
        
        if (field && errorDiv) {
            field.classList.remove('error');
            errorDiv.classList.remove('show');
        }
    }

    function clearAllErrors() {
        const errorMessages = document.querySelectorAll('.error-message');
        const errorFields = document.querySelectorAll('.form-input.error');
        
        errorMessages.forEach(error => error.classList.remove('show'));
        errorFields.forEach(field => field.classList.remove('error'));
    }

    // Login handler
    async function handleLogin(e) {
        e.preventDefault();
        clearAllErrors();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        let hasErrors = false;
        
        // Validation
        if (!email) {
            showError('loginEmail', 'Введите email');
            hasErrors = true;
        } else if (!validateEmail(email)) {
            showError('loginEmail', 'Введите корректный email');
            hasErrors = true;
        }
        
        if (!password) {
            showError('loginPassword', 'Введите пароль');
            hasErrors = true;
        }
        
        if (hasErrors) return;
        
        // Show loading
        const loginBtn = document.getElementById('loginBtn');
        const loginLoading = document.getElementById('loginLoading');
        
        if (loginBtn) loginBtn.disabled = true;
        if (loginLoading) loginLoading.classList.add('show');
        
        try {
            const { data, error } = await window.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;
            
            closeAuthModal();
            
            if (typeof window.showNotification === 'function') {
                window.showNotification('Добро пожаловать!', 'success');
            }
            
            // Обновляем состояние авторизации
            if (typeof window.updateAuthState === 'function') {
                setTimeout(window.updateAuthState, 100);
            }
            
        } catch (error) {
            showError('loginPassword', error.message);
        } finally {
            if (loginBtn) loginBtn.disabled = false;
            if (loginLoading) loginLoading.classList.remove('show');
        }
    }

    // Register handler
    async function handleRegister(e) {
        e.preventDefault();
        clearAllErrors();
        
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        let hasErrors = false;
        
        // Validation
        if (!username) {
            showError('registerUsername', 'Введите имя пользователя');
            hasErrors = true;
        } else if (username.length < 2) {
            showError('registerUsername', 'Имя должно содержать минимум 2 символа');
            hasErrors = true;
        }
        
        if (!email) {
            showError('registerEmail', 'Введите email');
            hasErrors = true;
        } else if (!validateEmail(email)) {
            showError('registerEmail', 'Введите корректный email');
            hasErrors = true;
        }
        
        if (!password) {
            showError('registerPassword', 'Введите пароль');
            hasErrors = true;
        } else if (!validatePassword(password)) {
            showError('registerPassword', 'Пароль должен содержать минимум 6 символов');
            hasErrors = true;
        }
        
        if (!confirmPassword) {
            showError('confirmPassword', 'Подтвердите пароль');
            hasErrors = true;
        } else if (password !== confirmPassword) {
            showError('confirmPassword', 'Пароли не совпадают');
            hasErrors = true;
        }
        
        if (hasErrors) return;
        
        // Show loading
        const registerBtn = document.getElementById('registerBtn');
        const registerLoading = document.getElementById('registerLoading');
        
        if (registerBtn) registerBtn.disabled = true;
        if (registerLoading) registerLoading.classList.add('show');
        
        try {
            const { data, error } = await window.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username
                    }
                }
            });

            if (error) throw error;
            
            closeAuthModal();
            
            if (typeof window.showNotification === 'function') {
                window.showNotification('Аккаунт создан! Добро пожаловать!', 'success');
            }
            
            // Обновляем состояние авторизации
            if (typeof window.updateAuthState === 'function') {
                setTimeout(window.updateAuthState, 100);
            }
            
        } catch (error) {
            if (error.message.includes('email')) {
                showError('registerEmail', error.message);
            } else {
                showError('registerPassword', error.message);
            }
        } finally {
            if (registerBtn) registerBtn.disabled = false;
            if (registerLoading) registerLoading.classList.remove('show');
        }
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        updateTheme();
        setupEventListeners();
    });
    
    // Export functions globally
    window.showAuthModal = showAuthModal;
    window.closeAuthModal = closeAuthModal;
    window.switchToLogin = switchToLogin;
    window.switchToRegister = switchToRegister;
    window.toggleTheme = toggleTheme;
    window.handleLogin = handleLogin;
    window.handleRegister = handleRegister;
    window.validateEmail = validateEmail;
    window.validatePassword = validatePassword;
    window.showError = showError;
    window.clearError = clearError;
    window.clearAllErrors = clearAllErrors;
    window.updateTheme = updateTheme;

    console.log('🔐 Light Fox Manga Auth System загружена');

})();