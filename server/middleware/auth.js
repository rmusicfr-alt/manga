const jwt = require('jsonwebtoken');

// Middleware для проверки аутентификации
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Токен доступа не предоставлен' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Недействительный токен' });
        }

        try {
            // Проверяем существование пользователя
            const user = await req.db.get(
                'SELECT id, username, email, role, is_active FROM users WHERE id = ?',
                [decoded.userId]
            );

            if (!user || !user.is_active) {
                return res.status(403).json({ error: 'Пользователь не найден или заблокирован' });
            }

            req.user = user;
            next();
        } catch (error) {
            console.error('Ошибка проверки пользователя:', error);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });
};

// Middleware для проверки роли администратора
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Требуются права администратора' });
    }
    next();
};

// Middleware для опциональной аутентификации
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            req.user = null;
            return next();
        }

        try {
            const user = await req.db.get(
                'SELECT id, username, email, role, is_active FROM users WHERE id = ?',
                [decoded.userId]
            );

            req.user = user && user.is_active ? user : null;
            next();
        } catch (error) {
            req.user = null;
            next();
        }
    });
};

module.exports = {
    authenticateToken,
    requireAdmin,
    optionalAuth
};