const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const Database = require('./server/database');
const authRoutes = require('./server/routes/auth');
const mangaRoutes = require('./server/routes/manga');
const donationRoutes = require('./server/routes/donations');
const adminRoutes = require('./server/routes/admin');
const userRoutes = require('./server/routes/users');
const { 
    generalLimiter, 
    authLimiter, 
    apiLimiter, 
    adminLimiter, 
    helmetConfig,
    securityLogger,
    csrfProtection 
} = require('./server/utils/security');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Инициализация базы данных
const db = new Database();

// Trust proxy для правильного получения IP адресов
app.set('trust proxy', 1);

// Middleware для безопасности
app.use(helmet(helmetConfig));

// Middleware для логирования безопасности
app.use(securityLogger);

// Rate limiting
app.use('/api/auth', authLimiter);
app.use('/api/admin', adminLimiter);
app.use('/api', apiLimiter);
app.use(generalLimiter);

// Основные middleware
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CSRF защита
app.use(csrfProtection);

// Сессии
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-session-secret',
    resave: false,
    saveUninitialized: false,
    name: 'lightfox.sid',
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 часа
        sameSite: 'strict'
    }
}));

// Статические файлы
app.use(express.static(path.join(__dirname), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    etag: true,
    lastModified: true
}));

// Middleware для передачи db в routes
app.use((req, res, next) => {
    req.db = db;
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/manga', mangaRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Обработка всех HTML страниц
const pages = ['catalog', 'cabinet', 'player', 'admin', 'subscriptions', 'registr', 'test'];
pages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(__dirname, `${page}.html`));
    });
});

// API для проверки состояния сервера
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error(`❌ Ошибка сервера [${req.method} ${req.path}]:`, err);
    
    // Логируем подозрительные ошибки
    if (err.status === 400 || err.status === 401 || err.status === 403) {
        console.warn(`🚨 Подозрительный запрос: ${req.method} ${req.path} от IP: ${req.ip}`);
    }
    
    res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Что-то пошло не так'
    });
});

// 404 обработчик
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API endpoint не найден' });
    } else {
        res.status(404).sendFile(path.join(__dirname, 'index.html'));
    }
});

// Запуск сервера
const server = app.listen(PORT, () => {
    console.log(`🦊 Light Fox Manga Server запущен на порту ${PORT}`);
    console.log(`🌐 Откройте http://localhost:${PORT} в браузере`);
    console.log(`📊 Админка доступна по адресу http://localhost:${PORT}/admin`);
    console.log(`🔒 Режим: ${process.env.NODE_ENV || 'development'}`);
    
    // Инициализация базы данных
    db.init().then(() => {
        console.log('✅ База данных инициализирована');
    }).catch(err => {
        console.error('❌ Ошибка инициализации базы данных:', err);
        process.exit(1);
    });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`🔄 Получен сигнал ${signal}, завершение работы...`);
    
    server.close(() => {
        console.log('🔄 HTTP сервер закрыт');
        db.close();
        console.log('🔄 База данных закрыта');
        process.exit(0);
    });
    
    // Принудительное завершение через 10 секунд
    setTimeout(() => {
        console.error('❌ Принудительное завершение работы');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Обработка необработанных ошибок
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Необработанное отклонение промиса:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Необработанное исключение:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});