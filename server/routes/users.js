const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// Получение списков пользователя
router.get('/lists', async (req, res) => {
    try {
        const lists = await req.db.all(`
            SELECT ul.*, m.title, m.image_url, m.type, m.rating, m.status
            FROM user_lists ul
            JOIN manga m ON ul.manga_id = m.id
            WHERE ul.user_id = ?
            ORDER BY ul.updated_at DESC
        `, [req.user.id]);

        // Группируем по типам списков
        const groupedLists = {
            favorites: [],
            watching: [],
            wantToWatch: [],
            completed: []
        };

        lists.forEach(item => {
            if (groupedLists[item.list_type]) {
                groupedLists[item.list_type].push(item);
            }
        });

        res.json(groupedLists);

    } catch (error) {
        console.error('Ошибка получения списков пользователя:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Добавление в список
router.post('/lists', [
    body('manga_id').isInt().withMessage('ID манги обязателен'),
    body('list_type').isIn(['favorites', 'watching', 'wantToWatch', 'completed']).withMessage('Неверный тип списка'),
    body('current_episode').optional().isInt({ min: 1 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Ошибка валидации', details: errors.array() });
        }

        const { manga_id, list_type, current_episode = 1 } = req.body;

        // Проверяем существование манги
        const manga = await req.db.get('SELECT title FROM manga WHERE id = ?', [manga_id]);
        if (!manga) {
            return res.status(404).json({ error: 'Манга не найдена' });
        }

        // Добавляем или обновляем запись
        await req.db.run(`
            INSERT OR REPLACE INTO user_lists (user_id, manga_id, list_type, current_episode, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [req.user.id, manga_id, list_type, current_episode]);

        res.json({
            message: `Добавлено в список "${list_type}"`,
            manga_title: manga.title
        });

    } catch (error) {
        console.error('Ошибка добавления в список:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Удаление из списка
router.delete('/lists/:manga_id/:list_type', async (req, res) => {
    try {
        const { manga_id, list_type } = req.params;

        const deleted = await req.db.run(
            'DELETE FROM user_lists WHERE user_id = ? AND manga_id = ? AND list_type = ?',
            [req.user.id, manga_id, list_type]
        );

        if (deleted.changes === 0) {
            return res.status(404).json({ error: 'Запись не найдена' });
        }

        res.json({ message: 'Удалено из списка' });

    } catch (error) {
        console.error('Ошибка удаления из списка:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновление прогресса просмотра
router.post('/progress', [
    body('manga_id').isInt().withMessage('ID манги обязателен'),
    body('episode_number').isInt({ min: 1 }).withMessage('Номер эпизода обязателен'),
    body('progress_seconds').optional().isInt({ min: 0 }),
    body('completed').optional().isBoolean()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Ошибка валидации', details: errors.array() });
        }

        const { manga_id, episode_number, progress_seconds = 0, completed = false } = req.body;

        await req.db.run(`
            INSERT OR REPLACE INTO viewing_progress 
            (user_id, manga_id, episode_number, progress_seconds, completed, last_watched)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [req.user.id, manga_id, episode_number, progress_seconds, completed]);

        res.json({ message: 'Прогресс сохранен' });

    } catch (error) {
        console.error('Ошибка сохранения прогресса:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение прогресса просмотра
router.get('/progress/:manga_id', async (req, res) => {
    try {
        const { manga_id } = req.params;

        const progress = await req.db.all(
            'SELECT * FROM viewing_progress WHERE user_id = ? AND manga_id = ? ORDER BY episode_number ASC',
            [req.user.id, manga_id]
        );

        res.json(progress);

    } catch (error) {
        console.error('Ошибка получения прогресса:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение профиля пользователя
router.get('/profile', async (req, res) => {
    try {
        const user = await req.db.get(
            'SELECT id, username, email, avatar_url, created_at, last_login FROM users WHERE id = ?',
            [req.user.id]
        );

        // Статистика пользователя
        const stats = await req.db.get(`
            SELECT 
                (SELECT COUNT(*) FROM user_lists WHERE user_id = ? AND list_type = 'favorites') as favorites,
                (SELECT COUNT(*) FROM user_lists WHERE user_id = ? AND list_type = 'watching') as watching,
                (SELECT COUNT(*) FROM user_lists WHERE user_id = ? AND list_type = 'completed') as completed,
                (SELECT SUM(amount) FROM donations WHERE user_id = ?) as total_donated
        `, [req.user.id, req.user.id, req.user.id, req.user.id]);

        res.json({
            user,
            stats: {
                favorites: stats.favorites || 0,
                watching: stats.watching || 0,
                completed: stats.completed || 0,
                totalDonated: stats.total_donated || 0
            }
        });

    } catch (error) {
        console.error('Ошибка получения профиля:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Обновление профиля
router.patch('/profile', [
    body('username').optional().isLength({ min: 2 }).withMessage('Имя должно содержать минимум 2 символа'),
    body('avatar_url').optional().isURL().withMessage('Некорректный URL аватара')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Ошибка валидации', details: errors.array() });
        }

        const { username, avatar_url } = req.body;
        const updates = [];
        const params = [];

        if (username) {
            // Проверяем уникальность имени
            const existingUser = await req.db.get(
                'SELECT id FROM users WHERE username = ? AND id != ?',
                [username, req.user.id]
            );

            if (existingUser) {
                return res.status(400).json({ error: 'Имя пользователя уже занято' });
            }

            updates.push('username = ?');
            params.push(username);
        }

        if (avatar_url !== undefined) {
            updates.push('avatar_url = ?');
            params.push(avatar_url);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Нет данных для обновления' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(req.user.id);

        await req.db.run(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        res.json({ message: 'Профиль обновлен' });

    } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;