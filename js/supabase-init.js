// Инициализация Supabase клиента для продакшена
(function() {
    'use strict';

    // Проверяем переменные окружения
    const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || window.SUPABASE_CONFIG?.url;
    const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || window.SUPABASE_CONFIG?.anonKey;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('❌ Supabase переменные не настроены');
        console.log('📝 Создайте файл .env с переменными VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY');
        return;
    }

    // Загружаем Supabase SDK
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
    script.onload = function() {
        // Инициализируем клиент
        window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Устанавливаем глобальные переменные
        window.SUPABASE_URL = SUPABASE_URL;
        window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
        
        console.log('✅ Supabase инициализирован');
        
        // Уведомляем о готовности
        window.dispatchEvent(new CustomEvent('supabaseReady'));
    };
    
    script.onerror = function() {
        console.error('❌ Ошибка загрузки Supabase SDK');
    };
    
    document.head.appendChild(script);

})();