const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Получение всех манги с фильтрацией
router.get('/', [
    query('search').optional().isString(),
    query('genres').optional().isString(),
    query('categories').optional().isString(),
    query('statuses').optional().isString(),
    query('sortBy').optional().isIn(['popularity', 'rating', 'updated', 'alphabet']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Ошибка валидации', details: errors.array() });
        }

        const {
            search = '',
            genres = '',
            categories = '',
            statuses = '',
            sortBy = 'popularity',
            limit = 50,
            offset = 0
        } = req.query;

        let sql = `
            SELECT DISTINCT m.*, 
                   GROUP_CONCAT(DISTINCT g.name) as genres,
                   GROUP_CONCAT(DISTINCT c.name) as categories
            FROM manga m
            LEFT JOIN manga_genres mg ON m.id = mg.manga_id
            LEFT JOIN genres g ON mg.genre_id = g.id
            LEFT JOIN manga_categories mc ON m.id = mc.manga_id
            LEFT JOIN categories c ON mc.category_id = c.id
            WHERE 1=1
        `;
        
        const params = [];

        // Поиск по названию
        if (search) {
            sql += ' AND m.title LIKE ?';
            params.push(`%${search}%`);
        }

        // Фильтр по жанрам
        if (genres) {
            const genreList = genres.split(',').map(g => g.trim());
            const genrePlaceholders = genreList.map(() => '?').join(',');
            sql += ` AND m.id IN (
                SELECT mg.manga_id FROM manga_genres mg
                JOIN genres g ON mg.genre_id = g.id
                WHERE g.name IN (${genrePlaceholders})
            )`;
            params.push(...genreList);
        }

        // Фильтр по категориям
        if (categories) {
            const categoryList = categories.split(',').map(c => c.trim());
            const categoryPlaceholders = categoryList.map(() => '?').join(',');
            sql += ` AND m.id IN (
                SELECT mc.manga_id FROM manga_categories mc
                JOIN categories c ON mc.category_id = c.id
                WHERE c.name IN (${categoryPlaceholders})
            )`;
            params.push(...categoryList);
        }

        // Фильтр по статусам
        if (statuses) {
            const statusList = statuses.split(',').map(s => s.trim());
            const statusPlaceholders = statusList.map(() => '?').join(',');
            sql += ` AND m.status IN (${statusPlaceholders})`;
            params.push(...statusList);
        }

        sql += ' GROUP BY m.id';

        // Сортировка
        switch (sortBy) {
            case 'alphabet':
                sql += ' ORDER BY m.title ASC';
                break;
            case 'rating':
                sql += ' ORDER BY m.rating DESC';
                break;
            case 'updated':
                sql += ' ORDER BY m.updated_at DESC';
                break;
            case 'popularity':
            default:
                sql += ' ORDER BY (m.current_donations + m.rating * 1000) DESC';
                break;
        }

        sql += ' LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const manga = await req.db.all(sql, params);

        // Преобразуем строки жанров и категорий в массивы
        const processedManga = manga.map(item => ({
            ...item,
            genres: item.genres ? item.genres.split(',') : [],
            categories: item.categories ? item.categories.split(',') : []
        }));

        res.json({
            manga: processedManga,
            total: manga.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Ошибка получения манги:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение конкретной манги по ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const manga = await req.db.get(`
            SELECT m.*, 
                   GROUP_CONCAT(DISTINCT g.name) as genres,
                   GROUP_CONCAT(DISTINCT c.name) as categories
            FROM manga m
            LEFT JOIN manga_genres mg ON m.id = mg.manga_id
            LEFT JOIN genres g ON mg.genre_id = g.id
            LEFT JOIN manga_categories mc ON m.id = mc.manga_id
            LEFT JOIN categories c ON mc.category_id = c.id
            WHERE m.id = ?
            GROUP BY m.id
        `, [id]);

        if (!manga) {
            return res.status(404).json({ error: 'Манга не найдена' });
        }

        // Получаем эпизоды
        const episodes = await req.db.all(
            'SELECT * FROM episodes WHERE manga_id = ? ORDER BY episode_number ASC',
            [id]
        );

        // Формируем объект эпизодов в формате, совместимом с фронтендом
        const episodesObj = {};
        episodes.forEach(ep => {
            if (ep.video_url) {
                const key = ep.chapter_from === ep.chapter_to ? 
                    ep.chapter_from.toString() : 
                    `${ep.chapter_from}-${ep.chapter_to}`;
                episodesObj[key] = ep.video_url;
            }
        });

        const result = {
            ...manga,
            genres: manga.genres ? manga.genres.split(',') : [],
            categories: manga.categories ? manga.categories.split(',') : [],
            episodes: episodesObj
        };

        res.json(result);

    } catch (error) {
        console.error('Ошибка получения манги:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение жанров
router.get('/meta/genres', async (req, res) => {
    try {
        const genres = await req.db.all('SELECT name FROM genres ORDER BY name ASC');
        res.json(genres.map(g => g.name));
    } catch (error) {
        console.error('Ошибка получения жанров:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение категорий
router.get('/meta/categories', async (req, res) => {
    try {
        const categories = await req.db.all('SELECT name FROM categories ORDER BY name ASC');
        res.json(categories.map(c => c.name));
    } catch (error) {
        console.error('Ошибка получения категорий:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение статусов
router.get('/meta/statuses', async (req, res) => {
    try {
        const statuses = await req.db.all('SELECT DISTINCT status FROM manga ORDER BY status ASC');
        res.json(statuses.map(s => s.status));
    } catch (error) {
        console.error('Ошибка получения статусов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение статистики
router.get('/meta/stats', async (req, res) => {
    try {
        const stats = await req.db.get(`
            SELECT 
                COUNT(*) as totalManga,
                SUM(available_chapters) as totalEpisodes,
                AVG(rating) as averageRating,
                SUM(current_donations) as totalDonations
            FROM manga
        `);

        res.json({
            totalManga: stats.totalManga || 0,
            totalEpisodes: stats.totalEpisodes || 0,
            averageRating: parseFloat((stats.averageRating || 0).toFixed(1)),
            totalDonations: stats.totalDonations || 0
        });

    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Случайная манга
router.get('/random', async (req, res) => {
    try {
        const manga = await req.db.get('SELECT * FROM manga ORDER BY RANDOM() LIMIT 1');
        
        if (!manga) {
            return res.status(404).json({ error: 'Манга не найдена' });
        }

        res.json(manga);
    } catch (error) {
        console.error('Ошибка получения случайной манги:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;