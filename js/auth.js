


// Система авторизации для Light Fox Manga
(function() {
    'use strict';

    // Ключи для хранения в памяти (вместо localStorage)
    let users = [];
    let currentSession = null;

    class AuthSystem {
        constructor() {
            this.users = users;
            this.currentSession = currentSession;
        }

        // Проверка авторизации
        isAuthenticated() {
            if (!this.currentSession) return false;
            
            const user = this.users.find(u => u.id === this.currentSession.user.id);
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
            return this.isAuthenticated() ? this.currentSession.user : null;
        }

        // Регистрация пользователя
        async register(userData, deviceInfo) {
            // Проверяем, что email не занят
            if (this.users.find(u => u.email === userData.email)) {
                throw new Error('Пользователь с таким email уже существует');
            }

            // Создаем нового пользователя
            const newUser = {
                id: this.generateUserId(),
                username: userData.username,
                email: userData.email,
                password: btoa(userData.password), // Простое кодирование
                registeredAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                devices: [{
                    id: this.generateDeviceId(),
                    ...deviceInfo,
                    registrationDevice: true,
                    addedAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                }],
                subscription: null,
                settings: {
                    theme: 'light',
                    language: 'ru',
                    notifications: true
                },
                favorites: [],
                watching: [],
                wantToWatch: [],
                completed: [],
                watchingProgress: {},
                donationHistory: []
            };

            // Сохраняем пользователя
            this.users.push(newUser);

            // Создаем сессию
            this.createSession(newUser, newUser.devices[0].id);

            return newUser;
        }

        // Вход в систему
        async login(email, password, deviceInfo, rememberMe = false) {
            const user = this.users.find(u => u.email === email && u.password === btoa(password));
            if (!user) {
                throw new Error('Неверный email или пароль');
            }

            const currentDeviceId = this.generateDeviceId();
            const existingDevice = user.devices.find(d => d.id === currentDeviceId);
            
            if (!existingDevice && user.devices.length >= 3) {
                throw new Error('Достигнут лимит устройств (максимум 3). Отвяжите одно из устройств в настройках.');
            }

            if (!existingDevice) {
                user.devices.push({
                    id: currentDeviceId,
                    ...deviceInfo,
                    addedAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                });
            } else {
                existingDevice.lastLogin = new Date().toISOString();
            }

            user.lastLogin = new Date().toISOString();
            this.createSession(user, currentDeviceId, rememberMe);

            return user;
        }

        // Создание сессии
        createSession(user, deviceId, rememberMe = false) {
            this.currentSession = {
                user: user,
                deviceId: deviceId,
                loginTime: new Date().toISOString(),
                rememberMe: rememberMe
            };
            currentSession = this.currentSession;
        }

        // Выход из системы
        logout() {
            this.currentSession = null;
            currentSession = null;
        }

        // Утилиты
        generateUserId() {
            return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        generateDeviceId() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('Device fingerprint', 2, 2);
            
            return 'device_' + btoa(
                navigator.userAgent + 
                (canvas.toDataURL ? canvas.toDataURL() : '') + 
                screen.width + 
                screen.height + 
                new Date().getTimezoneOffset()
            ).replace(/[^a-zA-Z0-9]/g, '').substr(0, 16);
        }
    }

    // Создаем глобальный экземпляр
    window.AuthSystem = new AuthSystem();
    console.log('🔐 Light Fox Manga Auth System загружена');

})();
// Global state
        let isDark = false;
        let currentForm = 'login';
        let deviceInfo = {};

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            // Проверяем сохраненную тему
            const savedTheme = document.body.getAttribute('data-theme') || 'light';
            isDark = savedTheme === 'dark';
            updateTheme();
            
            detectDeviceInfo();
            setupEventListeners();
            
            // Check for redirect parameters
            const urlParams = new URLSearchParams(window.location.search);
            const action = urlParams.get('action');
            
            if (action === 'register') {
                switchToRegister();
            }
        });

        // Device detection
        function detectDeviceInfo() {
            const userAgent = navigator.userAgent;
            let deviceType = 'Desktop';
            let browser = 'Unknown';
            
            // Detect device type
            if (/Mobi|Android/i.test(userAgent)) {
                deviceType = 'Mobile';
            } else if (/Tablet|iPad/i.test(userAgent)) {
                deviceType = 'Tablet';
            }
            
            // Detect browser
            if (userAgent.indexOf('Chrome') > -1) {
                browser = 'Chrome';
            } else if (userAgent.indexOf('Firefox') > -1) {
                browser = 'Firefox';
            } else if (userAgent.indexOf('Safari') > -1) {
                browser = 'Safari';
            } else if (userAgent.indexOf('Edge') > -1) {
                browser = 'Edge';
            }
            
            deviceInfo = {
                type: deviceType,
                browser: browser,
                userAgent: userAgent,
                platform: navigator.platform,
                language: navigator.language
            };
            
            // Update device info display
            updateDeviceInfoDisplay();
        }

        function updateDeviceInfoDisplay() {
            const elements = {
                deviceType: document.getElementById('deviceType'),
                deviceBrowser: document.getElementById('deviceBrowser'),
                deviceLocation: document.getElementById('deviceLocation')
            };
            
            if (elements.deviceType) {
                elements.deviceType.textContent = `Тип: ${deviceInfo.type}`;
            }
            if (elements.deviceBrowser) {
                elements.deviceBrowser.textContent = `Браузер: ${deviceInfo.browser}`;
            }
            if (elements.deviceLocation) {
                elements.deviceLocation.textContent = `Язык: ${deviceInfo.language}`;
            }
        }

        // Theme functionality
        function updateTheme() {
            document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
            
            const moonIcon = document.querySelector('.moon-icon');
            const sunIcon = document.querySelector('.sun-icon');
            
            if (moonIcon && sunIcon) {
                if (isDark) {
                    moonIcon.style.display = 'none';
                    sunIcon.style.display = 'block';
                } else {
                    moonIcon.style.display = 'block';
                    sunIcon.style.display = 'none';
                }
            }
        }

        // Form switching
        function switchToLogin() {
            currentForm = 'login';
            
            document.getElementById('loginForm').classList.add('active');
            document.getElementById('registerForm').classList.remove('active');
            
            const welcomeMessage = document.getElementById('welcomeMessage');
            welcomeMessage.innerHTML = `
                <h2 class="welcome-title">Добро пожаловать!</h2>
                <p class="welcome-text">Присоединяйтесь к сообществу любителей манги. Тысячи тайтлов, эксклюзивный контент и многое другое ждут вас!</p>
                <button class="switch-btn" id="switchToRegister">Создать аккаунт</button>
            `;
            
            document.getElementById('switchToRegister').addEventListener('click', switchToRegister);
        }

        function switchToRegister() {
            currentForm = 'register';
            
            document.getElementById('registerForm').classList.add('active');
            document.getElementById('loginForm').classList.remove('active');
            
            const welcomeMessage = document.getElementById('welcomeMessage');
            welcomeMessage.innerHTML = `
                <h2 class="welcome-title">Уже есть аккаунт?</h2>
                <p class="welcome-text">Войдите в свой аккаунт, чтобы продолжить чтение любимой манги и получить доступ ко всем функциям сайта.</p>
                <button class="switch-btn" id="switchToLogin">Войти</button>
            `;
            
            document.getElementById('switchToLogin').addEventListener('click', switchToLogin);
        }

        // Event listeners setup
        function setupEventListeners() {
            // Theme toggle
            document.getElementById('themeToggle').addEventListener('click', function() {
                isDark = !isDark;
                updateTheme();
            });
            
            // Form switching
            document.getElementById('switchToRegister').addEventListener('click', switchToRegister);
            
            // Form submissions
            document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
            document.getElementById('registerFormElement').addEventListener('submit', handleRegister);
            
            // Google buttons
            document.getElementById('googleLoginBtn').addEventListener('click', handleGoogleLogin);
            document.getElementById('googleRegisterBtn').addEventListener('click', handleGoogleRegister);
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
            
            field.classList.add('error');
            errorDiv.textContent = message;
            errorDiv.classList.add('show');
        }

        function clearError(fieldId) {
            const field = document.getElementById(fieldId);
            const errorDiv = document.getElementById(fieldId + 'Error');
            
            field.classList.remove('error');
            errorDiv.classList.remove('show');
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
            const rememberMe = document.getElementById('rememberMe').checked;
            
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
            document.getElementById('loginBtn').disabled = true;
            document.getElementById('loginLoading').classList.add('show');
            
            try {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
                
                const user = await window.AuthSystem.login(email, password, deviceInfo, rememberMe);
                
                // Show success animation
                showSuccessAnimation();
                
                // Redirect after delay
                setTimeout(() => {
                    const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || 'index.html';
                    window.location.href = redirectUrl;
                }, 2000);
                
            } catch (error) {
                showError('loginPassword', error.message);
            } finally {
                document.getElementById('loginBtn').disabled = false;
                document.getElementById('loginLoading').classList.remove('show');
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
            const acceptTerms = document.getElementById('acceptTerms').checked;
            
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
            
            if (!acceptTerms) {
                alert('Вы должны принять условия использования');
                hasErrors = true;
            }
            
            if (hasErrors) return;
            
            // Show loading
            document.getElementById('registerBtn').disabled = true;
            document.getElementById('registerLoading').classList.add('show');
            
            try {
                await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
                
                const userData = { username, email, password };
                const user = await window.AuthSystem.register(userData, deviceInfo);
                
                // Show success animation
                showSuccessAnimation();
                
                // Redirect after delay
                setTimeout(() => {
                    const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || 'index.html';
                    window.location.href = redirectUrl;
                }, 2000);
                
            } catch (error) {
                if (error.message.includes('email')) {
                    showError('registerEmail', error.message);
                } else {
                    alert('Ошибка регистрации: ' + error.message);
                }
            } finally {
                document.getElementById('registerBtn').disabled = false;
                document.getElementById('registerLoading').classList.remove('show');
            }
        }

        // Success animation
        function showSuccessAnimation() {
            const forms = document.querySelectorAll('.auth-form');
            forms.forEach(form => form.style.display = 'none');
            
            document.getElementById('successAnimation').classList.add('show');
        }

        // Google authentication (placeholder)
        function handleGoogleLogin() {
            alert('Google вход будет реализован позже. Используйте обычную форму входа.');
        }

        function handleGoogleRegister() {
            alert('Google регистрация будет реализована позже. Используйте обычную форму регистрации.');
        }

        // Forgot password (placeholder)
        function showForgotPassword() {
            alert('Функция восстановления пароля будет реализована позже. Обратитесь в поддержку.');
        }

        // Demo users for testing
        setTimeout(() => {
            // Add demo user
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
                    registrationDevice: true,
                    addedAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                }],
                subscription: null,
                settings: {
                    theme: 'light',
                    language: 'ru',
                    notifications: true
                },
                favorites: [],
                watching: [],
                wantToWatch: [],
                completed: [],
                watchingProgress: {},
                donationHistory: []
            };
            
            window.AuthSystem.users.push(demoUser);
            console.log('💡 Демо пользователь добавлен: demo@example.com / 123456');
        }, 100);

// ========================================
// POPUP ФУНКЦИИ (заменить строки 752-768)
// ========================================

function createAuthPopup() {
    const popupHTML = `
        <div id="authPopup" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); display: none; align-items: center; justify-content: center; z-index: 10000; padding: 20px;">
            
            <!-- Animated Background для popup -->
            <div class="bg-animation" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; opacity: 0.1;">
                <div class="floating-shape"></div>
                <div class="floating-shape"></div>
                <div class="floating-shape"></div>
            </div>

            <div style="position: relative; width: 100%; max-width: 900px;">
                
                <!-- Кнопка закрытия -->
                <button onclick="hideAuthPopup()" style="position: absolute; top: 15px; right: 15px; width: 40px; height: 40px; background: rgba(0, 0, 0, 0.5); color: white; border: none; border-radius: 50%; cursor: pointer; z-index: 10001; display: flex; align-items: center; justify-content: center; font-size: 18px; transition: all 0.2s ease;">
                    ✕
                </button>

                <!-- Theme Toggle для popup -->
                <button class="theme-toggle" id="popupThemeToggle" style="position: absolute; top: 15px; left: 15px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; z-index: 10001;">
                    <svg class="moon-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 18px; height: 18px; fill: currentColor;">
                        <path d="M21 12.79C20.8427 14.4922 20.2039 16.1144 19.1583 17.4668C18.1127 18.8192 16.7035 19.8458 15.0957 20.4265C13.4879 21.0073 11.7431 21.1181 10.0644 20.7461C8.38579 20.374 6.8398 19.5345 5.61677 18.3271C4.39374 17.1198 3.54362 15.5916 3.17133 13.9299C2.79905 12.2682 2.91262 10.5378 3.49644 8.94267C4.08026 7.34753 5.10962 5.94939 6.46482 4.90969C7.82002 3.86999 9.44343 3.23112 11.16 3.08C10.1598 4.98048 9.94059 7.18295 10.5446 9.23931C11.1486 11.2957 12.5154 13.0464 14.3735 14.1467C16.2317 15.247 18.4549 15.6021 20.55 15.13L21 12.79Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <svg class="sun-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: none; width: 18px; height: 18px; fill: currentColor;">
                        <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                
                <!-- ВАШ СУЩЕСТВУЮЩИЙ КОНТЕЙНЕР -->
                <div class="auth-container" style="margin-top: 0;">
                    <div class="auth-wrapper">
                        
                        <!-- Left Panel -->
                        <div class="auth-panel left">
                            <div class="welcome-content">
                                <div class="logo-section">
                                    <span class="logo-icon">🦊</span>
                                    <div class="logo-text">Light Fox Manga</div>
                                    <div class="logo-subtitle">Твой мир манги</div>
                                </div>
                                
                                <div class="welcome-message" id="popupWelcomeMessage">
                                    <h2 class="welcome-title">Добро пожаловать!</h2>
                                    <p class="welcome-text">Присоединяйтесь к сообществу любителей манги. Тысячи тайтлов, эксклюзивный контент и многое другое ждут вас!</p>
                                    <button class="switch-btn" id="popupSwitchToRegister">Создать аккаунт</button>
                                </div>
                            </div>
                        </div>

                        <!-- Right Panel -->
                        <div class="auth-panel right">
                            <div class="form-container">
                                
                                <!-- Success Animation -->
                                <div class="success-animation" id="popupSuccessAnimation">
                                    <div class="success-icon">✅</div>
                                    <h3>Добро пожаловать!</h3>
                                    <p>Вы успешно вошли в систему. Переносим вас...</p>
                                    <div class="loading show">
                                        <div class="loading-spinner"></div>
                                        Загрузка...
                                    </div>
                                </div>

                                <!-- Login Form -->
                                <div class="auth-form active" id="popupLoginForm">
                                    <div class="form-header">
                                        <h2 class="form-title">Вход в аккаунт</h2>
                                        <p class="form-subtitle">Введите ваши данные для входа</p>
                                    </div>

                                    <form id="popupLoginFormElement">
                                        <div class="form-group">
                                            <label class="form-label">Электронная почта</label>
                                            <input type="email" class="form-input" id="popupLoginEmail" placeholder="example@email.com" required>
                                            <div class="error-message" id="popupLoginEmailError"></div>
                                        </div>

                                        <div class="form-group">
                                            <label class="form-label">Пароль</label>
                                            <input type="password" class="form-input" id="popupLoginPassword" placeholder="Введите пароль" required>
                                            <div class="error-message" id="popupLoginPasswordError"></div>
                                        </div>

                                        <div class="form-checkbox">
                                            <input type="checkbox" id="popupRememberMe">
                                            <label class="checkbox-label" for="popupRememberMe">Запомнить меня</label>
                                        </div>

                                        <button type="submit" class="auth-btn primary" id="popupLoginBtn">
                                            Войти
                                        </button>

                                        <div class="loading" id="popupLoginLoading">
                                            <div class="loading-spinner"></div>
                                            Вход в систему...
                                        </div>
                                    </form>

                                    <div class="divider">
                                        <span>или</span>
                                    </div>

                                    <button class="auth-btn google-btn" id="popupGoogleLoginBtn">
                                        <svg class="google-icon" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                        Войти через Google
                                    </button>

                                    <div class="forgot-password">
                                        <a href="#" onclick="showForgotPassword()">Забыли пароль?</a>
                                    </div>
                                </div>

                                <!-- Register Form -->
                                <div class="auth-form" id="popupRegisterForm">
                                    <div class="form-header">
                                        <h2 class="form-title">Регистрация</h2>
                                        <p class="form-subtitle">Создайте аккаунт для доступа ко всему контенту</p>
                                    </div>

                                    <form id="popupRegisterFormElement">
                                        <div class="form-group">
                                            <label class="form-label">Имя пользователя</label>
                                            <input type="text" class="form-input" id="popupRegisterUsername" placeholder="Как к вам обращаться?" required>
                                            <div class="error-message" id="popupRegisterUsernameError"></div>
                                        </div>

                                        <div class="form-group">
                                            <label class="form-label">Электронная почта</label>
                                            <input type="email" class="form-input" id="popupRegisterEmail" placeholder="example@email.com" required>
                                            <div class="error-message" id="popupRegisterEmailError"></div>
                                        </div>

                                        <div class="form-group">
                                            <label class="form-label">Пароль</label>
                                            <input type="password" class="form-input" id="popupRegisterPassword" placeholder="Минимум 6 символов" required>
                                            <div class="error-message" id="popupRegisterPasswordError"></div>
                                        </div>

                                        <div class="form-group">
                                            <label class="form-label">Подтвердите пароль</label>
                                            <input type="password" class="form-input" id="popupConfirmPassword" placeholder="Повторите пароль" required>
                                            <div class="error-message" id="popupConfirmPasswordError"></div>
                                        </div>

                                        <div class="form-checkbox">
                                            <input type="checkbox" id="popupAcceptTerms" required>
                                            <label class="checkbox-label" for="popupAcceptTerms">
                                                Я согласен с <a href="#" style="color: var(--primary-color);">условиями использования</a>
                                            </label>
                                        </div>

                                        <!-- Device Info -->
                                        <div class="device-info" id="popupDeviceInfo">
                                            <h4>📱 Информация об устройстве</h4>
                                            <p id="popupDeviceType">Тип: Определяется...</p>
                                            <p id="popupDeviceBrowser">Браузер: Определяется...</p>
                                            <p id="popupDeviceLocation">Местоположение: Определяется...</p>
                                            <p style="font-size: 0.75rem; opacity: 0.8; margin-top: 8px;">
                                                ⚠️ Максимум 3 устройства на аккаунт
                                            </p>
                                        </div>

                                        <button type="submit" class="auth-btn primary" id="popupRegisterBtn">
                                            Создать аккаунт
                                        </button>

                                        <div class="loading" id="popupRegisterLoading">
                                            <div class="loading-spinner"></div>
                                            Создание аккаунта...
                                        </div>
                                    </form>

                                    <div class="divider">
                                        <span>или</span>
                                    </div>

                                    <button class="auth-btn google-btn" id="popupGoogleRegisterBtn">
                                        <svg class="google-icon" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                        Регистрация через Google
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    setupPopupEventListeners();
}

// Popup версии функций переключения форм
function switchToPopupLogin() {
    if (!document.getElementById('popupLoginForm')) return;
    
    document.getElementById('popupLoginForm').classList.add('active');
    document.getElementById('popupRegisterForm').classList.remove('active');
    
    const welcomeMessage = document.getElementById('popupWelcomeMessage');
    welcomeMessage.innerHTML = `
        <h2 class="welcome-title">Добро пожаловать!</h2>
        <p class="welcome-text">Присоединяйтесь к сообществу любителей манги. Тысячи тайтлов, эксклюзивный контент и многое другое ждут вас!</p>
        <button class="switch-btn" id="popupSwitchToRegister">Создать аккаунт</button>
    `;
    
    document.getElementById('popupSwitchToRegister').addEventListener('click', switchToPopupRegister);
}

function switchToPopupRegister() {
    if (!document.getElementById('popupRegisterForm')) return;
    
    document.getElementById('popupRegisterForm').classList.add('active');
    document.getElementById('popupLoginForm').classList.remove('active');
    
    const welcomeMessage = document.getElementById('popupWelcomeMessage');
    welcomeMessage.innerHTML = `
        <h2 class="welcome-title">Уже есть аккаунт?</h2>
        <p class="welcome-text">Войдите в свой аккаунт, чтобы продолжить чтение любимой манги и получить доступ ко всем функциям сайта.</p>
        <button class="switch-btn" id="popupSwitchToLogin">Войти</button>
    `;
    
    document.getElementById('popupSwitchToLogin').addEventListener('click', switchToPopupLogin);
}

// Настройка обработчиков для popup
function setupPopupEventListeners() {
    // Theme toggle для popup
    const themeToggle = document.getElementById('popupThemeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            isDark = !isDark;
            updateTheme();
        });
    }
    
    // Form switching для popup
    const switchToRegister = document.getElementById('popupSwitchToRegister');
    if (switchToRegister) {
        switchToRegister.addEventListener('click', switchToPopupRegister);
    }
    
    // Form submissions для popup  
    const loginForm = document.getElementById('popupLoginFormElement');
    if (loginForm) {
        loginForm.addEventListener('submit', handlePopupLogin);
    }
    
    const registerForm = document.getElementById('popupRegisterFormElement');
    if (registerForm) {
        registerForm.addEventListener('submit', handlePopupRegister);
    }
    
    // Google buttons для popup
    const googleLoginBtn = document.getElementById('popupGoogleLoginBtn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleGoogleLogin);
    }
    
    const googleRegisterBtn = document.getElementById('popupGoogleRegisterBtn');
    if (googleRegisterBtn) {
        googleRegisterBtn.addEventListener('click', handleGoogleRegister);
    }
    
    // Закрытие по клику вне popup
    const authPopup = document.getElementById('authPopup');
    if (authPopup) {
        authPopup.addEventListener('click', function(e) {
            if (e.target === this) hideAuthPopup();
        });
    }
    
    // Обновляем device info для popup
    updatePopupDeviceInfoDisplay();
}

// Popup версии обработчиков форм
async function handlePopupLogin(e) {
    e.preventDefault();
    clearPopupErrors();
    
    const email = document.getElementById('popupLoginEmail').value.trim();
    const password = document.getElementById('popupLoginPassword').value;
    const rememberMe = document.getElementById('popupRememberMe').checked;
    
    let hasErrors = false;
    
    if (!email) {
        showPopupError('popupLoginEmail', 'Введите email');
        hasErrors = true;
    } else if (!validateEmail(email)) {
        showPopupError('popupLoginEmail', 'Введите корректный email');
        hasErrors = true;
    }
    
    if (!password) {
        showPopupError('popupLoginPassword', 'Введите пароль');
        hasErrors = true;
    }
    
    if (hasErrors) return;
    
    // Show loading
    document.getElementById('popupLoginBtn').disabled = true;
    document.getElementById('popupLoginLoading').classList.add('show');
    
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const user = await window.AuthSystem.login(email, password, deviceInfo, rememberMe);
        
        showPopupSuccessAnimation();
        
        setTimeout(() => {
            hideAuthPopup();
            // Обновляем страницу для отображения авторизованного состояния
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        showPopupError('popupLoginPassword', error.message);
    } finally {
        document.getElementById('popupLoginBtn').disabled = false;
        document.getElementById('popupLoginLoading').classList.remove('show');
    }
}

async function handlePopupRegister(e) {
    e.preventDefault();
    clearPopupErrors();
    
    const username = document.getElementById('popupRegisterUsername').value.trim();
    const email = document.getElementById('popupRegisterEmail').value.trim();
    const password = document.getElementById('popupRegisterPassword').value;
    const confirmPassword = document.getElementById('popupConfirmPassword').value;
    const acceptTerms = document.getElementById('popupAcceptTerms').checked;
    
    let hasErrors = false;
    
    if (!username) {
        showPopupError('popupRegisterUsername', 'Введите имя пользователя');
        hasErrors = true;
    } else if (username.length < 2) {
        showPopupError('popupRegisterUsername', 'Имя должно содержать минимум 2 символа');
        hasErrors = true;
    }
    
    if (!email) {
        showPopupError('popupRegisterEmail', 'Введите email');
        hasErrors = true;
    } else if (!validateEmail(email)) {
        showPopupError('popupRegisterEmail', 'Введите корректный email');
        hasErrors = true;
    }
    
    if (!password) {
        showPopupError('popupRegisterPassword', 'Введите пароль');
        hasErrors = true;
    } else if (!validatePassword(password)) {
        showPopupError('popupRegisterPassword', 'Пароль должен содержать минимум 6 символов');
        hasErrors = true;
    }
    
    if (!confirmPassword) {
        showPopupError('popupConfirmPassword', 'Подтвердите пароль');
        hasErrors = true;
    } else if (password !== confirmPassword) {
        showPopupError('popupConfirmPassword', 'Пароли не совпадают');
        hasErrors = true;
    }
    
    if (!acceptTerms) {
        alert('Вы должны принять условия использования');
        hasErrors = true;
    }
    
    if (hasErrors) return;
    
    // Show loading
    document.getElementById('popupRegisterBtn').disabled = true;
    document.getElementById('popupRegisterLoading').classList.add('show');
    
    try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const userData = { username, email, password };
        const user = await window.AuthSystem.register(userData, deviceInfo);
        
        showPopupSuccessAnimation();
        
        setTimeout(() => {
            hideAuthPopup();
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        if (error.message.includes('email')) {
            showPopupError('popupRegisterEmail', error.message);
        } else {
            alert('Ошибка регистрации: ' + error.message);
        }
    } finally {
        document.getElementById('popupRegisterBtn').disabled = false;
        document.getElementById('popupRegisterLoading').classList.remove('show');
    }
}

// Popup утилиты
function showPopupError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorDiv = document.getElementById(fieldId + 'Error');
    
    if (field && errorDiv) {
        field.classList.add('error');
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
    }
}

function clearPopupErrors() {
    const errorMessages = document.querySelectorAll('#authPopup .error-message');
    const errorFields = document.querySelectorAll('#authPopup .form-input.error');
    
    errorMessages.forEach(error => error.classList.remove('show'));
    errorFields.forEach(field => field.classList.remove('error'));
}

function showPopupSuccessAnimation() {
    const forms = document.querySelectorAll('#authPopup .auth-form');
    forms.forEach(form => form.style.display = 'none');
    
    const successAnimation = document.getElementById('popupSuccessAnimation');
    if (successAnimation) {
        successAnimation.classList.add('show');
    }
}

function updatePopupDeviceInfoDisplay() {
    const elements = {
        deviceType: document.getElementById('popupDeviceType'),
        deviceBrowser: document.getElementById('popupDeviceBrowser'),
        deviceLocation: document.getElementById('popupDeviceLocation')
    };
    
    if (elements.deviceType) {
        elements.deviceType.textContent = `Тип: ${deviceInfo.type}`;
    }
    if (elements.deviceBrowser) {
        elements.deviceBrowser.textContent = `Браузер: ${deviceInfo.browser}`;
    }
    if (elements.deviceLocation) {
        elements.deviceLocation.textContent = `Язык: ${deviceInfo.language}`;
    }
}
// НЕДОСТАЮЩИЕ ФУНКЦИИ (добавить в конец файла)

function showAuthPopup(mode = 'login') {
    // Создаем popup если его нет
    if (!document.getElementById('authPopup')) {
        createAuthPopup();
    }
    
    // Показываем popup
    document.getElementById('authPopup').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Переключаем на нужную форму
    if (mode === 'register') {
        switchToPopupRegister();
    } else {
        switchToPopupLogin();
    }
}
