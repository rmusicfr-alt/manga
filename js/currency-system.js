// Система региональных валют
(function() {
    'use strict';

    // Конфигурация валют по регионам
    const CURRENCY_CONFIG = {
        'RU': { symbol: '₽', rate: 1, name: 'рубль', locale: 'ru-RU' },
        'UA': { symbol: '$', rate: 0.027, name: 'доллар', locale: 'en-US' },
        'KZ': { symbol: '$', rate: 0.0022, name: 'доллар', locale: 'en-US' },
        'BY': { symbol: '$', rate: 0.031, name: 'доллар', locale: 'en-US' },
        'US': { symbol: '$', rate: 0.011, name: 'доллар', locale: 'en-US' },
        'DEFAULT': { symbol: '$', rate: 0.011, name: 'доллар', locale: 'en-US' }
    };

    class CurrencySystem {
        constructor() {
            this.currentRegion = this.detectRegion();
            this.currentCurrency = CURRENCY_CONFIG[this.currentRegion] || CURRENCY_CONFIG.DEFAULT;
            this.initializeSystem();
        }

        // Определение региона пользователя
        detectRegion() {
            // Сначала проверяем сохраненный регион
            const savedRegion = localStorage.getItem('user_region');
            if (savedRegion && CURRENCY_CONFIG[savedRegion]) {
                return savedRegion;
            }

            // Определяем по языку браузера
            const language = navigator.language || navigator.languages[0] || 'en';
            
            if (language.startsWith('ru')) return 'RU';
            if (language.startsWith('uk')) return 'UA';
            if (language.startsWith('kk')) return 'KZ';
            if (language.startsWith('be')) return 'BY';
            
            // Определяем по часовому поясу
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            if (timezone.includes('Moscow') || timezone.includes('Europe/Moscow')) return 'RU';
            if (timezone.includes('Kiev') || timezone.includes('Europe/Kiev')) return 'UA';
            if (timezone.includes('Almaty') || timezone.includes('Asia/Almaty')) return 'KZ';
            if (timezone.includes('Minsk') || timezone.includes('Europe/Minsk')) return 'BY';
            
            return 'DEFAULT';
        }

        // Инициализация системы
        initializeSystem() {
            localStorage.setItem('user_region', this.currentRegion);
            this.updateAllPrices();
            
            console.log(`💰 Валютная система: ${this.currentRegion} (${this.currentCurrency.symbol})`);
        }

        // Конвертация суммы
        convertAmount(rubleAmount) {
            if (this.currentRegion === 'RU') {
                return rubleAmount;
            }
            
            const converted = rubleAmount * this.currentCurrency.rate;
            return Math.round(converted);
        }

        // Форматирование суммы для отображения
        formatAmount(rubleAmount) {
            const converted = this.convertAmount(rubleAmount);
            
            if (this.currentRegion === 'RU') {
                return `${converted.toLocaleString('ru-RU')}₽`;
            } else {
                return `$${converted.toLocaleString()}`;
            }
        }

        // Обновление всех цен на странице
        updateAllPrices() {
            // Обновляем элементы с data-price
            document.querySelectorAll('[data-price]').forEach(element => {
                const rublePrice = parseInt(element.dataset.price);
                if (!isNaN(rublePrice)) {
                    element.textContent = this.formatAmount(rublePrice);
                }
            });

            // Обновляем элементы с data-amount
            document.querySelectorAll('[data-amount]').forEach(element => {
                const rubleAmount = parseInt(element.dataset.amount);
                if (!isNaN(rubleAmount)) {
                    element.textContent = this.formatAmount(rubleAmount);
                }
            });
        }

        // Получение текущей валюты
        getCurrentCurrency() {
            return this.currentCurrency;
        }

        // Получение региона
        getCurrentRegion() {
            return this.currentRegion;
        }
    }

    // Создаем глобальный экземпляр
    window.CurrencySystem = new CurrencySystem();

    // Обновляем цены при загрузке страницы
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            window.CurrencySystem.updateAllPrices();
        }, 1000);
    });

    console.log('💰 Система региональных валют загружена');

})();