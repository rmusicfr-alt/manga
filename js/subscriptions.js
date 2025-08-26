// Страница подписок с периодами и валютами
(function() {
    'use strict';

    // Состояние
    let currentPeriod = 1; // месяцы

    // Plan configurations с российскими ценами
    const planConfigs = {
        free: {
            name: 'Любители Манги',
            basePrice: 0,
            icon: '📖',
            tier: 'Free',
            features: ['3 главы в день', 'Базовое качество', 'С рекламой']
        },
        basic: {
            name: 'Любители Пика',
            basePrice: 290,
            icon: '🎯', 
            tier: 'Basic',
            features: ['10 глав в день', 'HD качество', 'Без рекламы']
        },
        premium: {
            name: 'Орден Шейхов',
            basePrice: 690,
            icon: '👑',
            tier: 'Premium',
            features: ['Безлимитные главы', '4K качество', 'Ранний доступ', 'Офлайн чтение']
        },
        vip: {
            name: 'Лисямбы',
            basePrice: 1290,
            icon: '🌟',
            tier: 'VIP Max',
            features: ['Все функции Premium', 'Эксклюзивный контент', 'VIP значок', 'Голосование']
        }
    };

    // Скидки по периодам
    const periodDiscounts = {
        1: 0,    // 0% скидка
        3: 0.1,  // 10% скидка
        6: 0.15, // 15% скидка
        12: 0.25 // 25% скидка
    };

    // Установка периода
    function setPeriod(months) {
        currentPeriod = months;
        
        // Обновляем активную кнопку
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.period) === months) {
                btn.classList.add('active');
            }
        });
        
        // Обновляем цены
        updatePlanPrices();
    }

    // Обновление цен планов
    function updatePlanPrices() {
        const currencySystem = window.CurrencySystem;
        
        Object.keys(planConfigs).forEach(planType => {
            if (planType === 'free') return;
            
            const plan = planConfigs[planType];
            const discount = periodDiscounts[currentPeriod] || 0;
            const totalPrice = plan.basePrice * currentPeriod * (1 - discount);
            const monthlyPrice = totalPrice / currentPeriod;
            
            const priceElement = document.getElementById(`${planType}Price`);
            if (priceElement) {
                if (currencySystem) {
                    priceElement.textContent = currencySystem.formatAmount(Math.round(monthlyPrice));
                } else {
                    priceElement.textContent = Math.round(monthlyPrice) + '₽';
                }
                priceElement.setAttribute('data-price', Math.round(totalPrice));
                priceElement.setAttribute('data-monthly-price', Math.round(monthlyPrice));
            }
        });
    }

    // Authentication
    function updateAuthState() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        
        const authSection = document.getElementById('authSection');
        const userSection = document.getElementById('userSection');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (isLoggedIn && currentUser) {
            if (authSection) authSection.style.display = 'none';
            if (userSection) userSection.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'block';
            
            const userName = document.getElementById('userName');
            const userEmail = document.getElementById('userEmail');
            if (userName) userName.textContent = currentUser.name || currentUser.username || 'Пользователь';
            if (userEmail) userEmail.textContent = currentUser.email || 'user@example.com';
        } else {
            if (authSection) authSection.style.display = 'block';
            if (userSection) userSection.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
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
            
            if (typeof showNotification === 'function') {
                showNotification('Вы успешно вышли из системы', 'success');
            }
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

    // Select plan function
    async function selectPlan(planType) {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (!isLoggedIn) {
            showNotification('Войдите в аккаунт для оформления подписки', 'error');
            login();
            return;
        }
        
        const plan = planConfigs[planType];
        
        if (planType === 'free') {
            // Activate free plan immediately
            activateSubscription(planType, 0);
            return;
        }
        
        // Рассчитываем цену с учетом периода и скидки
        const discount = periodDiscounts[currentPeriod] || 0;
        const totalPrice = plan.basePrice * currentPeriod * (1 - discount);
        
        // Создаем подписку
        try {
            if (window.supabase) {
                const { data: { user } } = await window.supabase.auth.getUser();
                
                if (!user) {
                    login();
                    return;
                }

                // В реальной версии здесь будет Stripe
                // Пока активируем сразу
                await activateSubscription(planType, totalPrice);
                
            } else {
                await activateSubscription(planType, totalPrice);
            }
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    async function activateSubscription(planType, price) {
        const plan = planConfigs[planType];
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + currentPeriod);
        
        const subscription = {
            planType: planType,
            planName: plan.name,
            tier: plan.tier,
            icon: plan.icon,
            features: plan.features,
            price: price,
            period: currentPeriod,
            activatedAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString()
        };
        
        // Сохраняем в localStorage
        localStorage.setItem('userSubscription', JSON.stringify(subscription));
        
        // Сохраняем в Supabase если доступен
        if (window.supabase) {
            try {
                const { data: { user } } = await window.supabase.auth.getUser();
                
                if (user) {
                    await window.supabase
                        .from('users')
                        .update({
                            subscription_tier: planType,
                            subscription_expires_at: expiresAt.toISOString()
                        })
                        .eq('id', user.id);
                }
            } catch (error) {
                console.error('Save subscription error:', error);
            }
        }
        
        showNotification(`Подписка "${plan.name}" активирована на ${currentPeriod} мес.!`, 'success');
        
        setTimeout(() => {
            window.location.href = 'cabinet.html';
        }, 2000);
    }

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

    // Event listeners
    document.addEventListener('DOMContentLoaded', function() {
        console.log('💎 Подписки: DOM загружен');
        
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
        updatePlanPrices();
        
        // Обновляем цены при готовности валютной системы
        setTimeout(() => {
            updatePlanPrices();
        }, 1000);
    });

    // Export functions globally
    window.toggleMenu = toggleMenu;
    window.closeMenu = closeMenu;
    window.login = login;
    window.logout = logout;
    window.openRandomManga = openRandomManga;
    window.selectPlan = selectPlan;
    window.setPeriod = setPeriod;
    window.showNotification = showNotification;
    window.updateAuthState = updateAuthState;

    console.log('💎 Подписки загружены');

})();