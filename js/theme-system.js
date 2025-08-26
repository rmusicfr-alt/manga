// Глобальная система темы для всех страниц
(function() {
    'use strict';

    class ThemeSystem {
        constructor() {
            this.currentTheme = this.loadTheme();
            this.initializeTheme();
        }

        loadTheme() {
            return localStorage.getItem('theme') || 'dark';
        }

        saveTheme(theme) {
            localStorage.setItem('theme', theme);
        }

        initializeTheme() {
            this.applyTheme(this.currentTheme);
            this.setupThemeToggles();
            
            // Слушаем изменения в других вкладках
            window.addEventListener('storage', (e) => {
                if (e.key === 'theme') {
                    this.currentTheme = e.newValue || 'dark';
                    this.applyTheme(this.currentTheme);
                }
            });
        }

        applyTheme(theme) {
            document.body.setAttribute('data-theme', theme);
            
            // Обновляем все иконки темы
            const moonIcons = document.querySelectorAll('.moon-icon, .mobile-moon-icon');
            const sunIcons = document.querySelectorAll('.sun-icon, .mobile-sun-icon');
            
            moonIcons.forEach(icon => {
                icon.style.display = theme === 'dark' ? 'none' : 'block';
            });
            
            sunIcons.forEach(icon => {
                icon.style.display = theme === 'dark' ? 'block' : 'none';
            });
        }

        toggleTheme() {
            this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
            this.saveTheme(this.currentTheme);
            this.applyTheme(this.currentTheme);
        }

        setupThemeToggles() {
            const toggles = document.querySelectorAll('#themeToggle, #mobileThemeToggle');
            toggles.forEach(toggle => {
                if (toggle && !toggle.hasAttribute('data-theme-listener')) {
                    toggle.addEventListener('click', () => this.toggleTheme());
                    toggle.setAttribute('data-theme-listener', 'true');
                }
            });
        }
    }

    // Создаем глобальную систему темы
    window.ThemeSystem = new ThemeSystem();
    
    // Экспортируем функции для совместимости
    window.toggleTheme = () => window.ThemeSystem.toggleTheme();
    window.updateTheme = () => window.ThemeSystem.applyTheme(window.ThemeSystem.currentTheme);

    console.log('🎨 Глобальная система темы загружена');

})();