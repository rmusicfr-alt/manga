// Продакшен инициализация Supabase клиента
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
                throw new Error('Supabase переменные окружения не настроены');
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
            
            // Проверяем геоблокировку после инициализации
            const isBlocked = await this.checkGeoRestriction();
            if (isBlocked) return;
            
            console.log('✅ Supabase успешно подключен');
            
            // Уведомляем о готовности
            window.dispatchEvent(new CustomEvent('supabaseReady', {
                detail: { client: window.supabase }
            }));

        } catch (error) {
            console.error('❌ Критическая ошибка Supabase:', error);
            this.showConnectionError(error.message);
        }
    }

    showConnectionError(message) {
        document.body.innerHTML = `
            <div style="
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #1a1a1a;
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                text-align: center;
                padding: 20px;
            ">
                <div style="max-width: 500px;">
                    <div style="font-size: 4rem; margin-bottom: 2rem;">⚠️</div>
                    <h1 style="font-size: 2rem; margin-bottom: 1rem;">Ошибка подключения</h1>
                    <p style="font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.8;">
                        ${message}
                    </p>
                    <p style="font-size: 0.9rem; opacity: 0.6;">
                        Проверьте настройки Supabase в переменных окружения
                    </p>
                </div>
            </div>
        `;
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

    async checkGeoRestriction() {
        try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geo-restriction`, {
                headers: {
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                },
            });

            const result = await response.json();
            
            if (result.blocked) {
                this.showGeoBlockPage(result);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Geo-restriction check error:', error);
            return false;
        }
    }

    showGeoBlockPage(result) {
        document.body.innerHTML = `
            <div style="
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                text-align: center;
                padding: 20px;
            ">
                <div style="max-width: 600px;">
                    <div style="font-size: 6rem; margin-bottom: 2rem;">🚫</div>
                    <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">Access Restricted</h1>
                    <div style="font-size: 1.4rem; margin-bottom: 2rem; opacity: 0.9;">
                        ${result.message}
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px;">
                        <p style="font-size: 1rem; opacity: 0.8; margin: 0;">
                            🌍 Country: <strong>${result.country}</strong><br>
                            🕒 Time: ${new Date(result.timestamp).toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>
        `;
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
