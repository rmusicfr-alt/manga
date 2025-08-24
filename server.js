const express = require('express');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
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

const app = express();
const PORT = process.env.PORT || 3000;

// Инициализация базы данных
const db = new Database();

// Middleware для безопасности
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'", "https:", "http:"],
            frameSrc: ["'self'", "https://www.youtube.com", "https://youtube.com"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // максимум 100 запросов с одного IP
    message: 'Слишком много запросов с этого IP, попробуйте позже.'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // максимум 5 попыток входа за 15 минут
    message: 'Слишком много попыток входа, попробуйте позже.'
});

app.use('/api/auth', authLimiter);
app.use(limiter);

// Основные middleware
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Сессии
app.use(session({
    secret: process.env.SESSION_SECRET || 'lightfox-manga-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 часа
    }
}));

// Статические файлы
app.use(express.static(path.join(__dirname), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
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
const pages = ['catalog', 'cabinet', 'player', 'admin', 'subscriptions', 'registr'];
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
        version: '1.0.0'
    });
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err);
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
app.listen(PORT, () => {
    console.log(`🦊 Light Fox Manga Server запущен на порту ${PORT}`);
    console.log(`🌐 Откройте http://localhost:${PORT} в браузере`);
    console.log(`📊 Админка доступна по адресу http://localhost:${PORT}/admin`);
    
    // Инициализация базы данных
    db.init().then(() => {
        console.log('✅ База данных инициализирована');
    }).catch(err => {
        console.error('❌ Ошибка инициализации базы данных:', err);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 Получен сигнал SIGTERM, завершение работы...');
    db.close();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔄 Получен сигнал SIGINT, завершение работы...');
    db.close();
    process.exit(0);
});