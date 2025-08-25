const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { userValidation } = require('../utils/validation');
const { sanitizeInput } = require('../utils/security');

const router = express.Router();

// Генерация JWT токена
const generateToken = (userId) => {
    return jwt.sign(
        { userId, iat: Math.floor(Date.now() / 1000) }, 
        process.env.JWT_SECRET || 'fallback-secret', 
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Получение информации об устройстве
const getDeviceInfo = (req) => {
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    let deviceType = 'Desktop';
    let browser = 'Unknown';
    
    if (/Mobi|Android/i.test(userAgent)) {
        deviceType = 'Mobile';
    } else if (/Tablet|iPad/i.test(userAgent)) {
        deviceType = 'Tablet';
    }
    
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    return {
        deviceType,
        browser,
        userAgent: userAgent.substring(0, 500), // Ограничиваем длину
        ipAddress: ip
    };
};

// Регистрация
router.post('/register', userValidation.register, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Ошибка валидации', 
                details: errors.array() 
            });
        }

        let { username, email, password } = req.body;
        
        // Очищаем входные данные
        username = sanitizeInput(username);
        email = sanitizeInput(email);

        // Проверяем существование пользователя
        const existingUser = await req.db.get(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUser) {
            return res.status(400).json({ 
                error: 'Пользователь с таким email или именем уже существует' 
            });
        }

        // Хешируем пароль
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Создаем пользователя
        const result = await req.db.run(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, passwordHash]
        );

        const userId = result.lastID;

        // Сохраняем информацию об устройстве
        const deviceInfo = getDeviceInfo(req);
        const deviceId = `device_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await req.db.run(
            `INSERT INTO user_devices (user_id, device_id, device_type, browser, user_agent, ip_address)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, deviceId, deviceInfo.deviceType, deviceInfo.browser, 
             deviceInfo.userAgent, deviceInfo.ipAddress]
        );

        // Генерируем токен
        const token = generateToken(userId);

        // Обновляем время последнего входа
        await req.db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [userId]);

        console.log(`✅ Новый пользователь зарегистрирован: ${username} (${email})`);
        res.status(201).json({
            message: 'Пользователь успешно зарегистрирован',
            token,
            user: {
                id: userId,
                username,
                email,
                role: 'user'
            }
        });

    } catch (error) {
        console.error('Ошибка регистрации:', error);
        res.status(500).json({ error: 'Ошибка сервера при регистрации' });
    }
});

// Вход
router.post('/login', userValidation.login, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Ошибка валидации', 
                details: errors.array() 
            });
        }

        let { email, password, rememberMe } = req.body;
        email = sanitizeInput(email);

        // Находим пользователя
        const user = await req.db.get(
            'SELECT id, username, email, password_hash, role, is_active FROM users WHERE email = ?',
            [email]
        );

        if (!user || !user.is_active) {
            console.warn(`🚨 Попытка входа с несуществующим email: ${email}, IP: ${req.ip}`);
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        // Проверяем пароль
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            console.warn(`🚨 Неверный пароль для пользователя: ${email}, IP: ${req.ip}`);
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        // Проверяем лимит устройств
        const deviceCount = await req.db.get(
            'SELECT COUNT(*) as count FROM user_devices WHERE user_id = ? AND is_active = 1',
            [user.id]
        );

        if (deviceCount.count >= 3) {
            return res.status(400).json({ 
                error: 'Достигнут лимит устройств (максимум 3). Отвяжите одно из устройств в настройках.' 
            });
        }

        // Сохраняем информацию об устройстве
        const deviceInfo = getDeviceInfo(req);
        const deviceId = `device_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await req.db.run(
            `INSERT OR REPLACE INTO user_devices 
             (user_id, device_id, device_type, browser, user_agent, ip_address, last_used)
             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [user.id, deviceId, deviceInfo.deviceType, deviceInfo.browser,
             deviceInfo.userAgent, deviceInfo.ipAddress]
        );

        // Генерируем токен
        const tokenExpiry = rememberMe ? '30d' : '7d';
        const token = jwt.sign(
            { userId: user.id, iat: Math.floor(Date.now() / 1000) }, 
            process.env.JWT_SECRET || 'fallback-secret', 
            { expiresIn: tokenExpiry }
        );

        // Обновляем время последнего входа
        await req.db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

        console.log(`✅ Успешный вход: ${user.username} (${user.email})`);
        res.json({
            message: 'Успешный вход',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Ошибка входа:', error);
        res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
});

// Проверка токена
router.get('/verify', authenticateToken, (req, res) => {
    res.json({
        valid: true,
        user: {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role
        }
    });
});

// Выход
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        // Деактивируем текущее устройство
        const deviceInfo = getDeviceInfo(req);
        await req.db.run(
            'UPDATE user_devices SET is_active = 0 WHERE user_id = ? AND user_agent = ?',
            [req.user.id, deviceInfo.userAgent]
        );

        console.log(`✅ Пользователь ${req.user.username} вышел из системы`);
        
        res.json({ message: 'Успешный выход' });
    } catch (error) {
        console.error('Ошибка выхода:', error);
        res.status(500).json({ error: 'Ошибка сервера при выходе' });
    }
});

// Получение устройств пользователя
router.get('/devices', authenticateToken, async (req, res) => {
    try {
        const devices = await req.db.all(
            `SELECT device_id, device_type, browser, created_at, last_used, is_active
             FROM user_devices WHERE user_id = ? ORDER BY last_used DESC`,
            [req.user.id]
        );

        res.json({ devices });
    } catch (error) {
        console.error('Ошибка получения устройств:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Отвязка устройства
router.delete('/devices/:deviceId', authenticateToken, async (req, res) => {
    try {
        const { deviceId } = req.params;

        await req.db.run(
            'UPDATE user_devices SET is_active = 0 WHERE user_id = ? AND device_id = ?',
            [req.user.id, deviceId]
        );

        res.json({ message: 'Устройство отвязано' });
    } catch (error) {
        console.error('Ошибка отвязки устройства:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;