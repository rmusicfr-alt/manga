// Загружаем API клиент
const script = document.createElement('script');
script.src = '/js/api.js';
script.onload = () => {
    console.log('🦊 Light Fox Manga API клиент загружен');
    
    // Уведомляем о готовности данных для совместимости
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('mangaDataReady', {
            detail: { api: window.MangaAPI }
        }));
    }, 100);
};
document.head.appendChild(script);
