const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Настройки rate limiting
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: { error: message },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                error: message,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
    });
};

// Общий лимит
const generalLimiter = createRateLimit(
    15 * 60 * 1000, // 15 минут
    100, // 100 запросов
    'Слишком много запросов. Попробуйте позже.'
);

// Лимит для аутентификации
const authLimiter = createRateLimit(
    15 * 60 * 1000, // 15 минут
    5, // 5 попыток
    'Слишком много попыток входа. Попробуйте через 15 минут.'
);

// Лимит для API
const apiLimiter = createRateLimit(
    1 * 60 * 1000, // 1 минута
    30, // 30 запросов
    'Слишком много API запросов. Подождите минуту.'
);

// Лимит для админки
const adminLimiter = createRateLimit(
    5 * 60 * 1000, // 5 минут
    50, // 50 запросов
    'Слишком много запросов к админке.'
);

// Настройки Helmet для безопасности
const helmetConfig = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
            connectSrc: ["'self'", "https:", "http:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'", "https:", "http:", "blob:"],
            frameSrc: ["'self'", "https://www.youtube.com", "https://youtube.com", "https://drive.google.com"],
            workerSrc: ["'self'", "blob:"],
            childSrc: ["'self'", "blob:"]
        }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
};

// Функция для очистки и валидации входных данных
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    return input
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Удаляем script теги
        .replace(/javascript:/gi, '') // Удаляем javascript: протокол
        .replace(/on\w+\s*=/gi, ''); // Удаляем event handlers
};

// Middleware для логирования подозрительной активности
const securityLogger = (req, res, next) => {
    const suspiciousPatterns = [
        /script/i,
        /javascript/i,
        /vbscript/i,
        /onload/i,
        /onerror/i,
        /eval\(/i,
        /alert\(/i,
        /document\.cookie/i,
        /window\.location/i
    ];

    const checkSuspicious = (obj, path = '') => {
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;
            
            if (typeof value === 'string') {
                for (const pattern of suspiciousPatterns) {
                    if (pattern.test(value)) {
                        console.warn(`🚨 Подозрительный контент обнаружен: ${currentPath} = "${value}" от IP: ${req.ip}`);
                        break;
                    }
                }
            } else if (typeof value === 'object' && value !== null) {
                checkSuspicious(value, currentPath);
            }
        }
    };

    if (req.body && typeof req.body === 'object') {
        checkSuspicious(req.body);
    }

    if (req.query && typeof req.query === 'object') {
        checkSuspicious(req.query);
    }

    next();
};

// Middleware для проверки CSRF (упрощенная версия)
const csrfProtection = (req, res, next) => {
    // Пропускаем GET запросы
    if (req.method === 'GET') {
        return next();
    }

    // Проверяем наличие заголовка X-Requested-With для AJAX запросов
    const isAjax = req.headers['x-requested-with'] === 'XMLHttpRequest' ||
                   req.headers['content-type']?.includes('application/json');

    if (!isAjax) {
        // Для обычных форм проверяем referer
        const referer = req.headers.referer;
        const origin = req.headers.origin;
        const host = req.headers.host;

        if (!referer && !origin) {
            return res.status(403).json({ error: 'Отсутствует referer или origin' });
        }

        const allowedOrigins = [
            `http://${host}`,
            `https://${host}`,
            process.env.FRONTEND_URL
        ].filter(Boolean);

        const requestOrigin = origin || new URL(referer).origin;
        
        if (!allowedOrigins.includes(requestOrigin)) {
            console.warn(`🚨 Подозрительный CSRF запрос от: ${requestOrigin}, IP: ${req.ip}`);
            return res.status(403).json({ error: 'Недопустимый источник запроса' });
        }
    }

    next();
};

module.exports = {
    generalLimiter,
    authLimiter,
    apiLimiter,
    adminLimiter,
    helmetConfig,
    sanitizeInput,
    securityLogger,
    csrfProtection
};