// Улучшенная система многоязычности
(function() {
    'use strict';

    // Переводы для всех языков
    const TRANSLATIONS = {
        ru: {
            // Навигация
            'nav.home': 'Главная',
            'nav.catalog': 'Каталог',
            'nav.cabinet': 'Кабинет',
            'nav.subscriptions': 'Подписка',
            'nav.random': 'Случайное',
            'nav.profile': 'Профиль',
            'nav.news': 'Новости',
            
            // Главная страница
            'home.hero.title': 'Добро пожаловать в Light Fox Manga!',
            'home.hot.title': 'Горячие новинки',
            'home.popular.title': 'Популярное',
            'home.news.title': 'Новости',
            'home.updates.title': 'Последние обновления',
            'home.view.all': 'Смотреть все',
            
            // Каталог
            'catalog.search.placeholder': 'Поиск по названию манги...',
            'catalog.sort.popularity': 'По популярности',
            'catalog.sort.rating': 'По рейтингу',
            'catalog.sort.updated': 'По дате обновления',
            'catalog.sort.alphabet': 'По алфавиту',
            'catalog.filters': 'Фильтры',
            'catalog.genres': 'Жанры',
            'catalog.categories': 'Категории',
            'catalog.status': 'Статус',
            'catalog.clear.filters': 'Очистить фильтры',
            'catalog.no.results': 'Ничего не найдено',
            'catalog.auth.required': 'Требуется авторизация',
            'catalog.auth.message': 'Войдите в аккаунт для просмотра полного каталога',
            
            // Подписки
            'subs.title': 'Премиум подписки',
            'subs.subtitle': 'Откройте безграничный мир манги и аниме!',
            'subs.free': 'Любители Манги',
            'subs.basic': 'Любители Пика',
            'subs.premium': 'Орден Шейхов',
            'subs.vip': 'Лисямбы',
            'subs.popular': 'Популярный',
            'subs.select': 'Выбрать план',
            'subs.free.start': 'Начать бесплатно',
            'subs.month': 'месяц',
            'subs.months.3': '3 месяца',
            'subs.months.6': '6 месяцев',
            'subs.months.12': '12 месяцев',
            
            // Авторизация
            'auth.welcome': 'Добро пожаловать!',
            'auth.login': 'Вход в аккаунт',
            'auth.register': 'Регистрация',
            'auth.email': 'Электронная почта',
            'auth.password': 'Пароль',
            'auth.username': 'Имя пользователя',
            'auth.confirm.password': 'Подтвердите пароль',
            'auth.remember': 'Запомнить меня',
            'auth.forgot.password': 'Забыли пароль?',
            'auth.create.account': 'Создать аккаунт',
            'auth.have.account': 'Уже есть аккаунт?',
            'auth.login.btn': 'Войти',
            'auth.register.btn': 'Создать аккаунт',
            
            // Общие
            'common.loading': 'Загрузка...',
            'common.error': 'Ошибка',
            'common.success': 'Успешно',
            'common.cancel': 'Отмена',
            'common.save': 'Сохранить',
            'common.delete': 'Удалить',
            'common.edit': 'Редактировать',
            'common.back': 'Назад',
            'common.close': 'Закрыть',
            'common.logout': 'Выйти',
            'common.dark.theme': 'Темная тема'
        },
        
        ua: {
            // Навигация
            'nav.home': 'Головна',
            'nav.catalog': 'Каталог',
            'nav.cabinet': 'Кабінет',
            'nav.subscriptions': 'Підписка',
            'nav.random': 'Випадкове',
            'nav.profile': 'Профіль',
            'nav.news': 'Новини',
            
            // Главная страница
            'home.hero.title': 'Ласкаво просимо до Light Fox Manga!',
            'home.hot.title': 'Гарячі новинки',
            'home.popular.title': 'Популярне',
            'home.news.title': 'Новини',
            'home.updates.title': 'Останні оновлення',
            'home.view.all': 'Дивитися все',
            
            // Каталог
            'catalog.search.placeholder': 'Пошук за назвою манги...',
            'catalog.sort.popularity': 'За популярністю',
            'catalog.sort.rating': 'За рейтингом',
            'catalog.sort.updated': 'За датою оновлення',
            'catalog.sort.alphabet': 'За алфавітом',
            'catalog.filters': 'Фільтри',
            'catalog.genres': 'Жанри',
            'catalog.categories': 'Категорії',
            'catalog.status': 'Статус',
            'catalog.clear.filters': 'Очистити фільтри',
            'catalog.no.results': 'Нічого не знайдено',
            'catalog.auth.required': 'Потрібна авторизація',
            'catalog.auth.message': 'Увійдіть в акаунт для перегляду повного каталогу',
            
            // Подписки
            'subs.title': 'Преміум підписки',
            'subs.subtitle': 'Відкрийте безмежний світ манги та аніме!',
            'subs.free': 'Любителі Манги',
            'subs.basic': 'Любителі Піку',
            'subs.premium': 'Орден Шейхів',
            'subs.vip': 'Лисямби',
            'subs.popular': 'Популярний',
            'subs.select': 'Вибрати план',
            'subs.free.start': 'Почати безкоштовно',
            'subs.month': 'місяць',
            'subs.months.3': '3 місяці',
            'subs.months.6': '6 місяців',
            'subs.months.12': '12 місяців',
            
            // Авторизация
            'auth.welcome': 'Ласкаво просимо!',
            'auth.login': 'Вхід в акаунт',
            'auth.register': 'Реєстрація',
            'auth.email': 'Електронна пошта',
            'auth.password': 'Пароль',
            'auth.username': 'Ім\'я користувача',
            'auth.confirm.password': 'Підтвердіть пароль',
            'auth.remember': 'Запам\'ятати мене',
            'auth.forgot.password': 'Забули пароль?',
            'auth.create.account': 'Створити акаунт',
            'auth.have.account': 'Вже є акаунт?',
            'auth.login.btn': 'Увійти',
            'auth.register.btn': 'Створити акаунт',
            
            // Общие
            'common.loading': 'Завантаження...',
            'common.error': 'Помилка',
            'common.success': 'Успішно',
            'common.cancel': 'Скасувати',
            'common.save': 'Зберегти',
            'common.delete': 'Видалити',
            'common.edit': 'Редагувати',
            'common.back': 'Назад',
            'common.close': 'Закрити',
            'common.logout': 'Вийти',
            'common.dark.theme': 'Темна тема'
        },
        
        en: {
            // Navigation
            'nav.home': 'Home',
            'nav.catalog': 'Catalog',
            'nav.cabinet': 'Cabinet',
            'nav.subscriptions': 'Subscription',
            'nav.random': 'Random',
            'nav.profile': 'Profile',
            'nav.news': 'News',
            
            // Home page
            'home.hero.title': 'Welcome to Light Fox Manga!',
            'home.hot.title': 'Hot New Releases',
            'home.popular.title': 'Popular',
            'home.news.title': 'News',
            'home.updates.title': 'Recent Updates',
            'home.view.all': 'View All',
            
            // Catalog
            'catalog.search.placeholder': 'Search manga titles...',
            'catalog.sort.popularity': 'By Popularity',
            'catalog.sort.rating': 'By Rating',
            'catalog.sort.updated': 'By Update Date',
            'catalog.sort.alphabet': 'Alphabetically',
            'catalog.filters': 'Filters',
            'catalog.genres': 'Genres',
            'catalog.categories': 'Categories',
            'catalog.status': 'Status',
            'catalog.clear.filters': 'Clear Filters',
            'catalog.no.results': 'No Results Found',
            'catalog.auth.required': 'Authorization Required',
            'catalog.auth.message': 'Login to view the full catalog',
            
            // Subscriptions
            'subs.title': 'Premium Subscriptions',
            'subs.subtitle': 'Unlock the limitless world of manga and anime!',
            'subs.free': 'Manga Lovers',
            'subs.basic': 'Peak Lovers',
            'subs.premium': 'Sheikh Order',
            'subs.vip': 'Foxes',
            'subs.popular': 'Popular',
            'subs.select': 'Select Plan',
            'subs.free.start': 'Start Free',
            'subs.month': 'month',
            'subs.months.3': '3 months',
            'subs.months.6': '6 months',
            'subs.months.12': '12 months',
            
            // Authorization
            'auth.welcome': 'Welcome!',
            'auth.login': 'Login',
            'auth.register': 'Registration',
            'auth.email': 'Email',
            'auth.password': 'Password',
            'auth.username': 'Username',
            'auth.confirm.password': 'Confirm Password',
            'auth.remember': 'Remember Me',
            'auth.forgot.password': 'Forgot Password?',
            'auth.create.account': 'Create Account',
            'auth.have.account': 'Already have an account?',
            'auth.login.btn': 'Login',
            'auth.register.btn': 'Create Account',
            
            // Common
            'common.loading': 'Loading...',
            'common.error': 'Error',
            'common.success': 'Success',
            'common.cancel': 'Cancel',
            'common.save': 'Save',
            'common.delete': 'Delete',
            'common.edit': 'Edit',
            'common.back': 'Back',
            'common.close': 'Close',
            'common.logout': 'Logout',
            'common.dark.theme': 'Dark Theme'
        }
    };

    class LanguageSystem {
        constructor() {
            this.currentLanguage = this.loadLanguage();
            this.translations = TRANSLATIONS;
            this.initializeLanguage();
        }

        loadLanguage() {
            const saved = localStorage.getItem('language');
            if (saved && this.translations[saved]) {
                return saved;
            }
            
            // Определяем по браузеру
            const browserLang = navigator.language || navigator.languages[0] || 'en';
            
            if (browserLang.startsWith('ru')) return 'ru';
            if (browserLang.startsWith('uk')) return 'ua';
            
            return 'ru'; // По умолчанию русский
        }

        saveLanguage(lang) {
            localStorage.setItem('language', lang);
        }

        initializeLanguage() {
            this.applyLanguage(this.currentLanguage);
            this.setupLanguageSelectors();
            
            // Слушаем изменения в других вкладках
            window.addEventListener('storage', (e) => {
                if (e.key === 'language') {
                    this.currentLanguage = e.newValue || 'ru';
                    this.applyLanguage(this.currentLanguage);
                }
            });
        }

        applyLanguage(lang) {
            // Обновляем все селекторы
            const selectors = document.querySelectorAll('#langSwitch, #mobileLangSwitch');
            selectors.forEach(selector => {
                if (selector) selector.value = lang;
            });
            
            // Переводим страницу
            this.translatePage();
        }

        translatePage() {
            // Переводим элементы с data-translate
            document.querySelectorAll('[data-translate]').forEach(element => {
                const key = element.getAttribute('data-translate');
                const translation = this.getTranslation(key);
                
                if (translation) {
                    if (element.tagName === 'INPUT' && element.type !== 'submit') {
                        element.placeholder = translation;
                    } else {
                        element.textContent = translation;
                    }
                }
            });
        }

        getTranslation(key) {
            const langData = this.translations[this.currentLanguage];
            return langData ? langData[key] : key;
        }

        updateLanguage(lang) {
            if (!this.translations[lang]) {
                console.warn(`Язык ${lang} не поддерживается`);
                return;
            }

            this.currentLanguage = lang;
            this.saveLanguage(lang);
            this.applyLanguage(lang);
        }

        setupLanguageSelectors() {
            const selectors = document.querySelectorAll('#langSwitch, #mobileLangSwitch');
            selectors.forEach(selector => {
                if (selector && !selector.hasAttribute('data-lang-listener')) {
                    selector.addEventListener('change', (e) => {
                        this.updateLanguage(e.target.value);
                    });
                    selector.setAttribute('data-lang-listener', 'true');
                }
            });
        }
    }

    // Создаем глобальные системы
    window.LanguageSystem = new LanguageSystem();
    
    // Экспортируем функции для совместимости
    window.updateLanguage = (lang) => window.LanguageSystem.updateLanguage(lang);
    window.t = (key) => window.LanguageSystem.getTranslation(key);

    console.log('🌍 Глобальная система языков загружена');

})();