const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Все маршруты требуют аутентификации и прав администратора
router.use(authenticateToken);
router.use(requireAdmin);

// Создание/обновление манги
router.post('/manga', [
    body('title').notEmpty().withMessage('Название обязательно'),
    body('type').notEmpty().withMessage('Тип обязателен'),
    body('status').notEmpty().withMessage('Статус обязателен'),
    body('year').optional().isInt({ min: 1900, max: 2030 }),
    body('rating').optional().isFloat({ min: 0, max: 10 }),
    body('genres').optional().isArray(),
    body('categories').optional().isArray(),
    body('episodes').optional().isArray()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Ошибка валидации', details: errors.array() });
        }

        const {
            id,
            title,
            type,
            status,
            year,
            rating,
            image_url,
            description,
            available_chapters,
            total_chapters,
            donation_goal,
            genres = [],
            categories = [],
            episodes = []
        } = req.body;

        let mangaId;

        if (id) {
            // Обновление существующей манги
            await req.db.run(`
                UPDATE manga SET 
                    title = ?, type = ?, status = ?, year = ?, rating = ?,
                    image_url = ?, description = ?, available_chapters = ?,
                    total_chapters = ?, donation_goal = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [title, type, status, year, rating, image_url, description,
                available_chapters, total_chapters, donation_goal, id]);
            
            mangaId = id;
        } else {
            // Создание новой манги
            const result = await req.db.run(`
                INSERT INTO manga (title, type, status, year, rating, image_url, description,
                                 available_chapters, total_chapters, donation_goal, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [title, type, status, year, rating, image_url, description,
                available_chapters, total_chapters, donation_goal, req.user.id]);
            
            mangaId = result.lastID;
        }

        // Обновляем жанры
        await req.db.run('DELETE FROM manga_genres WHERE manga_id = ?', [mangaId]);
        for (const genreName of genres) {
            // Создаем жанр если не существует
            await req.db.run('INSERT OR IGNORE INTO genres (name) VALUES (?)', [genreName]);
            
            // Получаем ID жанра и связываем с мангой
            const genre = await req.db.get('SELECT id FROM genres WHERE name = ?', [genreName]);
            await req.db.run('INSERT INTO manga_genres (manga_id, genre_id) VALUES (?, ?)', [mangaId, genre.id]);
        }

        // Обновляем категории
        await req.db.run('DELETE FROM manga_categories WHERE manga_id = ?', [mangaId]);
        for (const categoryName of categories) {
            await req.db.run('INSERT OR IGNORE INTO categories (name) VALUES (?)', [categoryName]);
            
            const category = await req.db.get('SELECT id FROM categories WHERE name = ?', [categoryName]);
            await req.db.run('INSERT INTO manga_categories (manga_id, category_id) VALUES (?, ?)', [mangaId, category.id]);
        }

        // Обновляем эпизоды
        await req.db.run('DELETE FROM episodes WHERE manga_id = ?', [mangaId]);
        for (const episode of episodes) {
            await req.db.run(`
                INSERT INTO episodes (manga_id, title, episode_number, chapter_from, chapter_to, video_url, is_available)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [mangaId, episode.title, episode.episode_number, episode.chapter_from,
                episode.chapter_to, episode.video_url, !!episode.video_url]);
        }

        // Получаем обновленную мангу
        const updatedManga = await req.db.get('SELECT * FROM manga WHERE id = ?', [mangaId]);

        res.json({
            message: id ? 'Манга обновлена' : 'Манга создана',
            manga: updatedManga
        });

    } catch (error) {
        console.error('Ошибка сохранения манги:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Удаление манги
router.delete('/manga/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const manga = await req.db.get('SELECT title FROM manga WHERE id = ?', [id]);
        if (!manga) {
            return res.status(404).json({ error: 'Манга не найдена' });
        }

        // Удаляем мангу (каскадное удаление связанных данных)
        await req.db.run('DELETE FROM manga WHERE id = ?', [id]);

        res.json({ message: `Манга "${manga.title}" удалена` });

    } catch (error) {
        console.error('Ошибка удаления манги:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Создание/обновление донат-проекта
router.post('/donation-projects', [
    body('manga_id').isInt().withMessage('ID манги обязателен'),
    body('title').notEmpty().withMessage('Название проекта обязательно'),
    body('goal_amount').isInt({ min: 1000 }).withMessage('Цель должна быть не менее 1000₽'),
    body('status').optional().isIn(['active', 'completed', 'paused']),
    body('priority').optional().isInt({ min: 1, max: 10 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Ошибка валидации', details: errors.array() });
        }

        const {
            id,
            manga_id,
            title,
            description,
            goal_amount,
            current_amount = 0,
            status = 'active',
            priority = 5,
            image_url
        } = req.body;

        // Проверяем существование манги
        const manga = await req.db.get('SELECT id FROM manga WHERE id = ?', [manga_id]);
        if (!manga) {
            return res.status(404).json({ error: 'Манга не найдена' });
        }

        let projectId;

        if (id) {
            // Обновление проекта
            await req.db.run(`
                UPDATE donation_projects SET 
                    manga_id = ?, title = ?, description = ?, goal_amount = ?,
                    current_amount = ?, status = ?, priority = ?, image_url = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [manga_id, title, description, goal_amount, current_amount,
                status, priority, image_url, id]);
            
            projectId = id;
        } else {
            // Создание проекта
            const result = await req.db.run(`
                INSERT INTO donation_projects (manga_id, title, description, goal_amount,
                                             current_amount, status, priority, image_url, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [manga_id, title, description, goal_amount, current_amount,
                status, priority, image_url, req.user.id]);
            
            projectId = result.lastID;
        }

        const project = await req.db.get('SELECT * FROM donation_projects WHERE id = ?', [projectId]);

        res.json({
            message: id ? 'Проект обновлен' : 'Проект создан',
            project
        });

    } catch (error) {
        console.error('Ошибка сохранения донат-проекта:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение всех донат-проектов
router.get('/donation-projects', async (req, res) => {
    try {
        const projects = await req.db.all(`
            SELECT dp.*, m.title as manga_title, m.image_url as manga_image
            FROM donation_projects dp
            JOIN manga m ON dp.manga_id = m.id
            ORDER BY dp.priority DESC, dp.created_at DESC
        `);

        res.json(projects);

    } catch (error) {
        console.error('Ошибка получения донат-проектов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Удаление донат-проекта
router.delete('/donation-projects/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const project = await req.db.get('SELECT title FROM donation_projects WHERE id = ?', [id]);
        if (!project) {
            return res.status(404).json({ error: 'Проект не найден' });
        }

        await req.db.run('DELETE FROM donation_projects WHERE id = ?', [id]);

        res.json({ message: `Проект "${project.title}" удален` });

    } catch (error) {
        console.error('Ошибка удаления проекта:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Быстрое обновление суммы доната
router.patch('/donation-projects/:id/amount', [
    body('amount').isInt({ min: 0 }).withMessage('Сумма должна быть положительной')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Ошибка валидации', details: errors.array() });
        }

        const { id } = req.params;
        const { amount } = req.body;

        const project = await req.db.get('SELECT * FROM donation_projects WHERE id = ?', [id]);
        if (!project) {
            return res.status(404).json({ error: 'Проект не найден' });
        }

        const newAmount = Math.min(project.current_amount + amount, project.goal_amount);

        await req.db.run(
            'UPDATE donation_projects SET current_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newAmount, id]
        );

        res.json({
            message: 'Сумма обновлена',
            newAmount,
            added: amount
        });

    } catch (error) {
        console.error('Ошибка обновления суммы:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение статистики для дашборда
router.get('/dashboard/stats', async (req, res) => {
    try {
        const mangaStats = await req.db.get(`
            SELECT 
                COUNT(*) as totalManga,
                SUM(available_chapters) as totalEpisodes,
                AVG(rating) as averageRating,
                SUM(current_donations) as totalDonations
            FROM manga
        `);

        const donationStats = await req.db.get(`
            SELECT 
                COUNT(*) as totalProjects,
                SUM(goal_amount) as totalGoal,
                SUM(current_amount) as totalCurrent
            FROM donation_projects
        `);

        const userStats = await req.db.get('SELECT COUNT(*) as totalUsers FROM users WHERE role != "admin"');

        res.json({
            manga: {
                total: mangaStats.totalManga || 0,
                episodes: mangaStats.totalEpisodes || 0,
                averageRating: parseFloat((mangaStats.averageRating || 0).toFixed(1)),
                donations: mangaStats.totalDonations || 0
            },
            donations: {
                projects: donationStats.totalProjects || 0,
                goal: donationStats.totalGoal || 0,
                current: donationStats.totalCurrent || 0
            },
            users: {
                total: userStats.totalUsers || 0
            }
        });

    } catch (error) {
        console.error('Ошибка получения статистики дашборда:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;