// Продакшен инициализация Supabase клиента
(function() {
    'use strict';

    class ProductionSupabaseClient {
        constructor() {
            this.supabase = null;
            this.currentUser = null;
            this.initializeClient();
        }

        async initializeClient() {
            try {
                // Загружаем переменные окружения
                const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
                const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
                
                if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
                    console.warn('⚠️ Supabase переменные не настроены, используем демо режим');
                    this.enableDemoMode();
                    return;
                }
                
                // Загружаем Supabase SDK
                await this.loadSupabaseSDK();
                
                this.supabase = window.supabase.createClient(
                    SUPABASE_URL,
                    SUPABASE_ANON_KEY
                );

                // Устанавливаем глобальные переменные
                window.supabase = this.supabase;
                window.SUPABASE_URL = SUPABASE_URL;
                window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

                // Слушаем изменения авторизации
                this.supabase.auth.onAuthStateChange((event, session) => {
                    this.handleAuthChange(event, session);
                });

                // Получаем текущего пользователя
                await this.getCurrentUser();
                
                console.log('✅ Supabase успешно подключен');
                
                // Уведомляем о готовности
                window.dispatchEvent(new CustomEvent('supabaseReady', {
                    detail: { client: window.supabase }
                }));

            } catch (error) {
                console.error('❌ Ошибка Supabase, включаем демо режим:', error);
                this.enableDemoMode();
            }
        }

        enableDemoMode() {
            console.log('🔄 Включен демо режим (localStorage)');
            
            // Создаем заглушку для Supabase
            window.supabase = {
                auth: {
                    signUp: async (data) => ({ data: { user: { id: Date.now(), email: data.email } }, error: null }),
                    signInWithPassword: async (data) => ({ data: { user: { id: Date.now(), email: data.email } }, error: null }),
                    signOut: async () => ({ error: null }),
                    getUser: async () => ({ data: { user: null }, error: null }),
                    onAuthStateChange: () => {}
                },
                from: () => ({
                    select: () => ({ data: [], error: null }),
                    insert: () => ({ data: [], error: null }),
                    update: () => ({ data: [], error: null }),
                    delete: () => ({ data: [], error: null })
                })
            };
            
            // Уведомляем о готовности
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('supabaseReady', {
                    detail: { client: window.supabase, demoMode: true }
                }));
            }, 100);
        }

        async loadSupabaseSDK() {
            if (window.supabase) return;
            
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.56.0/dist/umd/supabase.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        async handleAuthChange(event, session) {
            if (event === 'SIGNED_IN' && session) {
                this.currentUser = session.user;
                await this.loadUserProfile(session.user);
                this.updateLegacyStorage();
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.clearLegacyStorage();
            }
            
            // Обновляем UI
            if (typeof window.updateAuthState === 'function') {
                window.updateAuthState();
            }
        }
        
        async loadUserProfile(user) {
            try {
                const { data: profile, error } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error && error.code === 'PGRST116') {
                    // Создаем профиль если его нет
                    await this.createUserProfile(user);
                }
            } catch (error) {
                console.error('Load user profile error:', error);
            }
        }
        
        async createUserProfile(user) {
            try {
                const { error } = await this.supabase
                    .from('users')
                    .insert({
                        id: user.id,
                        email: user.email,
                        username: user.user_metadata?.username || user.email.split('@')[0]
                    });

                if (error) throw error;
            } catch (error) {
                console.error('Create user profile error:', error);
            }
        }
        
        async getCurrentUser() {
            try {
                const { data: { user } } = await this.supabase.auth.getUser();
                if (user) {
                    this.currentUser = user;
                    await this.loadUserProfile(user);
                    this.updateLegacyStorage();
                }
            } catch (error) {
                console.error('Get current user error:', error);
            }
        }
        
        updateLegacyStorage() {
            if (this.currentUser) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', JSON.stringify({
                    id: this.currentUser.id,
                    name: this.currentUser.user_metadata?.username || 'Пользователь',
                    username: this.currentUser.user_metadata?.username || 'Пользователь',
                    email: this.currentUser.email
                }));
            }
        }
        
        clearLegacyStorage() {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
        }
    }

    // Создаем глобальный экземпляр
    window.SupabaseClient = new ProductionSupabaseClient();

    console.log('🚀 Supabase клиент инициализирован');

})();