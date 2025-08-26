// Система контроля доступа по подпискам
(function() {
    'use strict';

    class SubscriptionAccessControl {
        constructor() {
            this.subscriptionHierarchy = {
                'free': 0,
                'basic': 1,
                'premium': 2,
                'vip': 3
            };
        }

        // Получение уровня подписки пользователя
        async getUserSubscriptionLevel() {
            try {
                if (window.supabase) {
                    const { data: { user } } = await window.supabase.auth.getUser();
                    
                    if (!user) return null;

                    const { data: profile } = await window.supabase
                        .from('users')
                        .select('subscription_tier, subscription_expires_at')
                        .eq('id', user.id)
                        .single();

                    if (!profile) return 'free';

                    // Проверяем, не истекла ли подписка
                    if (profile.subscription_expires_at && new Date(profile.subscription_expires_at) <= new Date()) {
                        return 'free';
                    }

                    return profile.subscription_tier || 'free';
                } else {
                    // Fallback к localStorage
                    const subscription = JSON.parse(localStorage.getItem('userSubscription') || 'null');
                    
                    if (!subscription) return 'free';
                    
                    // Проверяем, не истекла ли подписка
                    if (new Date(subscription.expiresAt) <= new Date()) {
                        return 'free';
                    }
                    
                    return subscription.planType || 'free';
                }
            } catch (error) {
                console.error('Get user subscription error:', error);
                return 'free';
            }
        }

        // Проверка доступа к тайтлу
        async checkMangaAccess(mangaId) {
            try {
                // Получаем информацию о тайтле
                const manga = await this.getMangaInfo(mangaId);
                if (!manga) {
                    return { allowed: false, reason: 'not_found' };
                }

                // Получаем уровень подписки пользователя
                const userLevel = await this.getUserSubscriptionLevel();
                if (!userLevel) {
                    return { allowed: false, reason: 'auth_required' };
                }

                // Проверяем доступ
                const requiredTiers = manga.subscription_tiers || [manga.subscription_tier || 'free'];
                const hasAccess = this.checkSubscriptionAccess(userLevel, requiredTiers);

                if (!hasAccess) {
                    return {
                        allowed: false,
                        reason: 'subscription_required',
                        requiredTiers: requiredTiers,
                        userTier: userLevel,
                        manga: manga
                    };
                }

                return { allowed: true, manga: manga };
            } catch (error) {
                console.error('Check manga access error:', error);
                return { allowed: false, reason: 'error' };
            }
        }

        // Получение информации о тайтле
        async getMangaInfo(mangaId) {
            try {
                if (window.supabase) {
                    const { data, error } = await window.supabase
                        .from('manga')
                        .select('*')
                        .eq('id', mangaId)
                        .eq('is_active', true)
                        .single();

                    if (error) return null;
                    return data;
                } else {
                    return window.MangaAPI ? window.MangaAPI.getMangaById(mangaId) : null;
                }
            } catch (error) {
                console.error('Get manga info error:', error);
                return null;
            }
        }

        // Проверка доступа по подписке
        checkSubscriptionAccess(userTier, requiredTiers) {
            const userLevel = this.subscriptionHierarchy[userTier] || 0;
            
            // Проверяем, есть ли у пользователя доступ к любому из требуемых уровней
            return requiredTiers.some(tier => {
                const requiredLevel = this.subscriptionHierarchy[tier] || 0;
                return userLevel >= requiredLevel;
            });
        }

        // Фильтрация тайтлов по подписке
        async filterMangaBySubscription(mangaList) {
            const userLevel = await this.getUserSubscriptionLevel();
            if (!userLevel) return [];

            return mangaList.filter(manga => {
                const requiredTiers = manga.subscription_tiers || [manga.subscription_tier || 'free'];
                return this.checkSubscriptionAccess(userLevel, requiredTiers);
            });
        }

        // Показ popup подписки
        showSubscriptionPopup(requiredTiers, mangaTitle) {
            const tierNames = {
                'free': 'Любители Манги (Free)',
                'basic': 'Любители Пика (Basic)',
                'premium': 'Орден Шейхов (Premium)',
                'vip': 'Лисямбы (VIP)'
            };
            
            const tierName = tierNames[requiredTiers[0]] || requiredTiers[0];
            
            if (confirm(`Для просмотра "${mangaTitle}" требуется подписка "${tierName}" или выше. Перейти к выбору подписки?`)) {
                window.location.href = 'subscriptions.html';
            }
        }

        // Проверка и принуждение доступа
        async checkAndEnforceMangaAccess(mangaId) {
            const access = await this.checkMangaAccess(mangaId);
            
            if (!access.allowed) {
                if (access.reason === 'auth_required') {
                    if (confirm('Для просмотра тайтлов необходимо войти в аккаунт. Перейти к регистрации?')) {
                        if (typeof window.showAuthModal === 'function') {
                            window.showAuthModal('login');
                        } else {
                            window.location.href = 'registr.html';
                        }
                    }
                    return false;
                } else if (access.reason === 'subscription_required') {
                    this.showSubscriptionPopup(access.requiredTiers, access.manga.title);
                    return false;
                } else if (access.reason === 'not_found') {
                    alert('Тайтл не найден');
                    return false;
                }
            }
            
            return access.allowed;
        }
    }

    // Создаем глобальный экземпляр
    window.SubscriptionAccessControl = new SubscriptionAccessControl();

    console.log('🔐 Система контроля доступа по подпискам загружена');

})();