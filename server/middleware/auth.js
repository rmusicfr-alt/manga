const jwt = require('jsonwebtoken');

// Middleware для проверки аутентификации
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Токен доступа не предоставлен' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', async (err, decoded) => {
        if (err) {
            console.warn(`🚨 Недействительный токен от IP: ${req.ip}`);
            return res.status(403).json({ error: 'Недействительный или истекший токен' });
        }

        try {
            // Проверяем существование пользователя
            const user = await req.db.get(
                'SELECT id, username, email, role, is_active FROM users WHERE id = ?',
                [decoded.userId]
            );

            if (!user || !user.is_active) {
                console.warn(`🚨 Попытка доступа заблокированного пользователя ID: ${decoded.userId}, IP: ${req.ip}`);
                return res.status(403).json({ error: 'Пользователь не найден или заблокирован' });
            }

            // Обновляем время последней активности
            await req.db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

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
        console.warn(`🚨 Попытка доступа к админке без прав: пользователь ${req.user?.id || 'неизвестен'}, IP: ${req.ip}`);
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

    jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', async (err, decoded) => {
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

// Middleware для проверки владельца ресурса
const requireOwnership = (resourceType) => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params.id;
            let resource;

            switch (resourceType) {
                case 'manga':
                    resource = await req.db.get('SELECT created_by FROM manga WHERE id = ?', [resourceId]);
                    break;
                case 'donation_project':
                    resource = await req.db.get('SELECT created_by FROM donation_projects WHERE id = ?', [resourceId]);
                    break;
            if (!resource) {
                return res.status(404).json({ error: 'Ресурс не найден' });
            }
                default:
            // Админы могут редактировать всё, обычные пользователи - только свои ресурсы
            if (req.user.role !== 'admin' && resource.created_by !== req.user.id) {
                return res.status(403).json({ error: 'Недостаточно прав для редактирования' });
            }
                    return res.status(400).json({ error: 'Неизвестный тип ресурса' });
            next();
        } catch (error) {
            console.error('Ошибка проверки владельца:', error);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    };
};
            }
module.exports = {
    authenticateToken,
    requireAdmin,
    optionalAuth,
    requireOwnership
};