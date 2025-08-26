// Система уведомлений с Supabase
(function() {
    'use strict';

    class NotificationSystem {
        constructor() {
            this.notifications = [];
            this.subscriptions = [];
            this.initializeSystem();
        }

        async initializeSystem() {
            // Ждем готовности Supabase
            if (window.supabase) {
                await this.loadFromSupabase();
            } else {
                this.loadFromLocalStorage();
            }
            
            // Слушаем изменения авторизации
            if (window.supabase) {
                window.supabase.auth.onAuthStateChange((event, session) => {
                    if (event === 'SIGNED_IN') {
                        this.loadFromSupabase();
                    }
                });
            }
        }

        async loadFromSupabase() {
            try {
                const { data: { user } } = await window.supabase.auth.getUser();
                if (!user) return;

                // Загружаем уведомления
                const { data: notifications } = await window.supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                this.notifications = notifications || [];

                // Загружаем подписки
                const { data: subscriptions } = await window.supabase
                    .from('manga_subscriptions')
                    .select('manga_id')
                    .eq('user_id', user.id);

                this.subscriptions = subscriptions?.map(s => s.manga_id) || [];

            } catch (error) {
                console.error('Load notifications error:', error);
                this.loadFromLocalStorage();
            }
        }

        loadFromLocalStorage() {
            try {
                this.notifications = JSON.parse(localStorage.getItem('user_notifications') || '[]');
                this.subscriptions = JSON.parse(localStorage.getItem('notification_subscriptions') || '[]');
            } catch (e) {
                this.notifications = [];
                this.subscriptions = [];
            }
        }

        // Подписка на уведомления о тайтле
        async subscribeToManga(mangaId) {
            try {
                if (window.supabase) {
                    const { data: { user } } = await window.supabase.auth.getUser();
                    
                    if (!user) {
                        throw new Error('Войдите в аккаунт для подписки на уведомления');
                    }

                    const { error } = await window.supabase
                        .from('manga_subscriptions')
                        .insert({
                            user_id: user.id,
                            manga_id: mangaId
                        });

                    if (error && error.code !== '23505') { // Игнорируем дублирование
                        throw error;
                    }

                    // Добавляем в избранное
                    await window.supabase
                        .from('user_lists')
                        .upsert({
                            user_id: user.id,
                            manga_id: mangaId,
                            list_type: 'favorites'
                        });

                    this.subscriptions.push(mangaId);
                    
                } else {
                    // Fallback к localStorage
                    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
                    if (!currentUser) {
                        throw new Error('Войдите в аккаунт для подписки на уведомления');
                    }

                    const subscriptionKey = `${currentUser.id}_${mangaId}`;
                    
                    if (!this.subscriptions.includes(subscriptionKey)) {
                        this.subscriptions.push(subscriptionKey);
                        localStorage.setItem('notification_subscriptions', JSON.stringify(this.subscriptions));
                        
                        // Добавляем в избранное
                        this.addToFavorites(mangaId);
                    }
                }
                
                return true;
            } catch (error) {
                console.error('Subscribe error:', error);
                throw error;
            }
        }

        // Отписка от уведомлений
        async unsubscribeFromManga(mangaId) {
            try {
                if (window.supabase) {
                    const { data: { user } } = await window.supabase.auth.getUser();
                    
                    if (!user) return false;

                    const { error } = await window.supabase
                        .from('manga_subscriptions')
                        .delete()
                        .eq('user_id', user.id)
                        .eq('manga_id', mangaId);

                    if (error) throw error;

                    this.subscriptions = this.subscriptions.filter(id => id !== mangaId);
                    
                } else {
                    // Fallback к localStorage
                    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
                    if (!currentUser) return false;

                    const subscriptionKey = `${currentUser.id}_${mangaId}`;
                    const index = this.subscriptions.indexOf(subscriptionKey);
                    
                    if (index !== -1) {
                        this.subscriptions.splice(index, 1);
                        localStorage.setItem('notification_subscriptions', JSON.stringify(this.subscriptions));
                    }
                }
                
                return true;
            } catch (error) {
                console.error('Unsubscribe error:', error);
                return false;
            }
        }

        // Проверка подписки на тайтл
        isSubscribedToManga(mangaId) {
            if (window.supabase) {
                return this.subscriptions.includes(mangaId);
            } else {
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
                if (!currentUser) return false;

                const subscriptionKey = `${currentUser.id}_${mangaId}`;
                return this.subscriptions.includes(subscriptionKey);
            }
        }

        // Добавление в избранное при подписке
        addToFavorites(mangaId) {
            const manga = window.MangaAPI ? window.MangaAPI.getMangaById(mangaId) : null;
            if (!manga) return;

            const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
            const exists = favorites.find(item => item.mangaId === mangaId);
            
            if (!exists) {
                favorites.push({
                    id: Date.now(),
                    mangaId: mangaId,
                    title: manga.title,
                    image: manga.image || manga.cover_url,
                    addedAt: new Date().toISOString()
                });
                localStorage.setItem('favorites', JSON.stringify(favorites));
            }
        }

        // Создание уведомления о новой серии (вызывается из админки)
        async createEpisodeNotification(mangaId, episodeNumber) {
            try {
                if (window.supabase) {
                    // Отправляем через Edge Function
                    const response = await fetch(`${window.SUPABASE_URL}/functions/v1/send-notifications`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            mangaId,
                            episodeNumber
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Failed to send notifications');
                    }

                    const result = await response.json();
                    console.log('Notifications sent:', result);
                    
                } else {
                    // Fallback к localStorage
                    const manga = window.MangaAPI ? window.MangaAPI.getMangaById(mangaId) : null;
                    if (!manga) return;

                    // Находим всех подписанных пользователей
                    const subscribedUsers = this.subscriptions
                        .filter(sub => sub.endsWith(`_${mangaId}`))
                        .map(sub => sub.split('_')[0]);

                    subscribedUsers.forEach(userId => {
                        const notification = {
                            id: Date.now() + Math.random(),
                            userId: userId,
                            mangaId: mangaId,
                            mangaTitle: manga.title,
                            mangaImage: manga.image || manga.cover_url,
                            type: 'new_episode',
                            title: 'Новая серия!',
                            message: `Вышла серия ${episodeNumber} тайтла "${manga.title}"`,
                            episodeNumber: episodeNumber,
                            createdAt: new Date().toISOString(),
                            read: false
                        };

                        this.notifications.push(notification);
                    });

                    localStorage.setItem('user_notifications', JSON.stringify(this.notifications));
                }
                
                // Уведомляем об обновлении
                window.dispatchEvent(new CustomEvent('notificationsUpdated', {
                    detail: { mangaId, episodeNumber }
                }));
                
            } catch (error) {
                console.error('Create notification error:', error);
            }
        }

        // Получение уведомлений для текущего пользователя
        getUserNotifications() {
            if (window.supabase) {
                return this.notifications;
            } else {
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
                if (!currentUser) return [];

                return this.notifications
                    .filter(notification => notification.userId === currentUser.id)
                    .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
            }
        }

        // Получение непрочитанных уведомлений
        getUnreadNotifications() {
            return this.getUserNotifications().filter(notification => !notification.read && !notification.is_read);
        }

        // Отметка уведомления как прочитанное
        async markAsRead(notificationId) {
            try {
                if (window.supabase) {
                    const { error } = await window.supabase
                        .from('notifications')
                        .update({ is_read: true })
                        .eq('id', notificationId);

                    if (error) throw error;

                    // Обновляем локальный кэш
                    const notification = this.notifications.find(n => n.id === notificationId);
                    if (notification) {
                        notification.is_read = true;
                    }
                    
                } else {
                    const notification = this.notifications.find(n => n.id === notificationId);
                    if (notification) {
                        notification.read = true;
                        localStorage.setItem('user_notifications', JSON.stringify(this.notifications));
                    }
                }
                
                this.updateNotificationBadge();
            } catch (error) {
                console.error('Mark as read error:', error);
            }
        }

        // Отметка всех как прочитанные
        async markAllAsRead() {
            try {
                if (window.supabase) {
                    const { data: { user } } = await window.supabase.auth.getUser();
                    if (!user) return;

                    const { error } = await window.supabase
                        .from('notifications')
                        .update({ is_read: true })
                        .eq('user_id', user.id)
                        .eq('is_read', false);

                    if (error) throw error;

                    // Обновляем локальный кэш
                    this.notifications.forEach(notification => {
                        notification.is_read = true;
                    });
                    
                } else {
                    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
                    if (!currentUser) return;

                    this.notifications.forEach(notification => {
                        if (notification.userId === currentUser.id) {
                            notification.read = true;
                        }
                    });

                    localStorage.setItem('user_notifications', JSON.stringify(this.notifications));
                }

                this.updateNotificationBadge();
            } catch (error) {
                console.error('Mark all as read error:', error);
            }
        }

        // Обновление счетчика уведомлений
        updateNotificationBadge() {
            const unreadCount = this.getUnreadNotifications().length;
            const badges = document.querySelectorAll('.notification-badge');
            
            badges.forEach(badge => {
                if (unreadCount > 0) {
                    badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                    badge.style.display = 'block';
                } else {
                    badge.style.display = 'none';
                }
            });
        }

        // Удаление уведомления
        async deleteNotification(notificationId) {
            try {
                if (window.supabase) {
                    const { error } = await window.supabase
                        .from('notifications')
                        .delete()
                        .eq('id', notificationId);

                    if (error) throw error;

                    this.notifications = this.notifications.filter(n => n.id !== notificationId);
                    
                } else {
                    const index = this.notifications.findIndex(n => n.id === notificationId);
                    if (index !== -1) {
                        this.notifications.splice(index, 1);
                        localStorage.setItem('user_notifications', JSON.stringify(this.notifications));
                    }
                }
                
                this.updateNotificationBadge();
            } catch (error) {
                console.error('Delete notification error:', error);
            }
        }
    }

    // Создаем глобальный экземпляр
    window.NotificationSystem = new NotificationSystem();

    console.log('🔔 Система уведомлений загружена');

})();