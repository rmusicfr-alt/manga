// Система авторизации для Light Fox Manga
(function() {
    'use strict';

    // Глобальные переменные
    let isDark = localStorage.getItem('theme') === 'dark';
    let currentForm = 'login';

    // Показ модала авторизации
    function showAuthModal(mode = 'login') {
        const modal = document.getElementById('authModal');
        if (!modal) {
            // Создаем модал если его нет
            createAuthModal();
        }
        
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            if (mode === 'register') {
                switchToRegister();
            } else {
                switchToLogin();
            }
        }
    }
    
    // Создание модала авторизации
    function createAuthModal() {
        const modalHTML = `
            <div class="modal-overlay" id="authModal" style="display: none;">
                <div class="auth-container">
                    <div class="auth-wrapper">
                        <div class="auth-panel left">
                            <div class="welcome-content">
                                <div class="logo-section">
                                    <span class="logo-icon">🦊</span>
                                    <div class="logo-text">Light Fox Manga</div>
                                    <div class="logo-subtitle">Твой мир манги</div>
                                </div>
                                
                                <div class="welcome-message" id="welcomeMessage">
                                    <h2 class="welcome-title">Добро пожаловать!</h2>
                                    <p class="welcome-text">Присоединяйтесь к сообществу любителей манги. Тысячи тайтлов, эксклюзивный контент и многое другое ждут вас!</p>
                                    <button class="switch-btn" onclick="switchToRegister()">Создать аккаунт</button>
                                </div>
                            </div>
                        </div>
                        <div class="auth-panel right">
                            <div class="form-container">
                                <!-- Login Form -->
                                <div class="auth-form active" id="loginForm">
                                    <div class="form-header">
                                        <h2 class="form-title">Вход в аккаунт</h2>
                                        <p class="form-subtitle">Введите ваши данные для входа</p>
                                    </div>

                                    <form id="loginFormElement">
                                        <div class="form-group">
                                            <label class="form-label">Электронная почта</label>
                                            <input type="email" class="form-input" id="loginEmail" placeholder="example@email.com" required>
                                            <div class="error-message" id="loginEmailError"></div>
                                        </div>

                                        <div class="form-group">
                                            <label class="form-label">Пароль</label>
                                            <input type="password" class="form-input" id="loginPassword" placeholder="Введите пароль" required>
                                            <div class="error-message" id="loginPasswordError"></div>
                                        </div>

                                        <button type="submit" class="auth-btn primary" id="loginBtn">
                                            Войти
                                        </button>

                                        <div class="loading" id="loginLoading">
                                            <div class="loading-spinner"></div>
                                            Вход в систему...
                                        </div>
                                    </form>

                                    <div class="divider">
                                        <span>или</span>
                                    </div>

                                    <button class="auth-btn google-btn" onclick="loginWithGoogle()">
                                        <svg class="google-icon" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                        Войти через Google
                                    </button>
                                </div>

                                <!-- Register Form -->
                                <div class="auth-form" id="registerForm">
                                    <div class="form-header">
                                        <h2 class="form-title">Регистрация</h2>
                                        <p class="form-subtitle">Создайте аккаунт для доступа ко всему контенту</p>
                                    </div>

                                    <form id="registerFormElement">
                                        <div class="form-group">
                                            <label class="form-label">Имя пользователя</label>
                                            <input type="text" class="form-input" id="registerUsername" placeholder="Как к вам обращаться?" required>
                                            <div class="error-message" id="registerUsernameError"></div>
                                        </div>

                                        <div class="form-group">
                                            <label class="form-label">Электронная почта</label>
                                            <input type="email" class="form-input" id="registerEmail" placeholder="example@email.com" required>
                                            <div class="error-message" id="registerEmailError"></div>
                                        </div>

                                        <div class="form-group">
                                            <label class="form-label">Пароль</label>
                                            <input type="password" class="form-input" id="registerPassword" placeholder="Минимум 6 символов" required>
                                            <div class="error-message" id="registerPasswordError"></div>
                                        </div>

                                        <div class="form-group">
                                            <label class="form-label">Подтвердите пароль</label>
                                            <input type="password" class="form-input" id="confirmPassword" placeholder="Повторите пароль" required>
                                            <div class="error-message" id="confirmPasswordError"></div>
                                        </div>

                                        <button type="submit" class="auth-btn primary" id="registerBtn">
                                            Создать аккаунт
                                        </button>

                                        <div class="loading" id="registerLoading">
                                            <div class="loading-spinner"></div>
                                            Создание аккаунта...
                                        </div>
                                    </form>

                                    <div class="divider">
                                        <span>или</span>
                                    </div>

                                    <button class="auth-btn google-btn" onclick="registerWithGoogle()">
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
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setupEventListeners();
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
        
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const welcomeMessage = document.getElementById('welcomeMessage');
        
        if (loginForm) loginForm.classList.add('active');
        if (registerForm) registerForm.classList.remove('active');
        
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
        
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const welcomeMessage = document.getElementById('welcomeMessage');
        
        if (registerForm) registerForm.classList.add('active');
        if (loginForm) loginForm.classList.remove('active');
        
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
            if (window.supabase && window.supabase.auth.signInWithPassword) {
                const { data, error } = await window.supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) throw error;
                
                closeAuthModal();
                
                if (typeof window.showNotification === 'function') {
                    window.showNotification('Добро пожаловать!', 'success');
                } else {
                    alert('Добро пожаловать!');
                }
                
                // Обновляем состояние авторизации
                if (typeof window.updateAuthState === 'function') {
                    setTimeout(window.updateAuthState, 100);
                }
            } else {
                // Демо режим
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', JSON.stringify({
                    id: Date.now(),
                    name: email.split('@')[0],
                    username: email.split('@')[0],
                    email: email
                }));
                
                closeAuthModal();
                
                if (typeof window.showNotification === 'function') {
                    window.showNotification('Добро пожаловать! (Демо режим)', 'success');
                } else {
                    alert('Добро пожаловать!');
                }
                
                if (typeof window.updateAuthState === 'function') {
                    setTimeout(window.updateAuthState, 100);
                }
            }
            
        } catch (error) {
            showError('loginPassword', error.message || 'Ошибка входа');
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
            if (window.supabase && window.supabase.auth.signUp) {
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
                } else {
                    alert('Аккаунт создан!');
                }
                
                // Обновляем состояние авторизации
                if (typeof window.updateAuthState === 'function') {
                    setTimeout(window.updateAuthState, 100);
                }
            } else {
                // Демо режим
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', JSON.stringify({
                    id: Date.now(),
                    name: username,
                    username: username,
                    email: email
                }));
                
                closeAuthModal();
                
                if (typeof window.showNotification === 'function') {
                    window.showNotification('Аккаунт создан! (Демо режим)', 'success');
                } else {
                    alert('Аккаунт создан!');
                }
                
                if (typeof window.updateAuthState === 'function') {
                    setTimeout(window.updateAuthState, 100);
                }
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

    // Google Auth
    async function loginWithGoogle() {
        try {
            if (window.supabase && window.supabase.auth.signInWithOAuth) {
                const { data, error } = await window.supabase.auth.signInWithOAuth({
                    provider: 'google'
                });

                if (error) throw error;
            } else {
                // Демо режим
                const email = 'google.user@gmail.com';
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', JSON.stringify({
                    id: Date.now(),
                    name: 'Google User',
                    username: 'Google User',
                    email: email
                }));
                
                closeAuthModal();
                
                if (typeof window.showNotification === 'function') {
                    window.showNotification('Вход через Google (Демо)', 'success');
                }
                
                if (typeof window.updateAuthState === 'function') {
                    setTimeout(window.updateAuthState, 100);
                }
            }
        } catch (error) {
            console.error('Google login error:', error);
            if (typeof window.showNotification === 'function') {
                window.showNotification('Ошибка входа через Google', 'error');
            }
        }
    }

    async function registerWithGoogle() {
        await loginWithGoogle(); // Тот же процесс
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        updateTheme();
    });
    
    // Export functions globally
    window.showAuthModal = showAuthModal;
    window.closeAuthModal = closeAuthModal;
    window.switchToLogin = switchToLogin;
    window.switchToRegister = switchToRegister;
    window.toggleTheme = toggleTheme;
    window.handleLogin = handleLogin;
    window.handleRegister = handleRegister;
    window.loginWithGoogle = loginWithGoogle;
    window.registerWithGoogle = registerWithGoogle;
    window.validateEmail = validateEmail;
    window.validatePassword = validatePassword;
    window.showError = showError;
    window.clearError = clearError;
    window.clearAllErrors = clearAllErrors;
    window.updateTheme = updateTheme;

    console.log('🔐 Light Fox Manga Auth System загружена');

})();