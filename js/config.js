// Конфигурация приложения
window.APP_CONFIG = {
  // Supabase настройки
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key',
  
  // Stripe настройки
  STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key',
  
  // Геоблокировка
  BLOCKED_COUNTRIES: ['KR', 'DE', 'CN', 'JP'],
  
  // Приложение
  APP_NAME: 'Light Fox Manga',
  APP_URL: import.meta.env.VITE_APP_URL || window.location.origin,
  
  // Режим разработки
  IS_DEV: import.meta.env.DEV || false,
  
  // Только продакшен режим
  ENABLE_FALLBACK: false
};
