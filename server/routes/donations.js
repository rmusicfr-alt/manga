const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Получение активных донат-проектов
router.get('/projects', async (req, res) => {
    try {
        const projects = await req.db.all(`
            SELECT dp.*, m.title as manga_title, m.image_url as manga_image,
                   m.type as manga_type, m.year as manga_year
            FROM donation_projects dp
            JOIN manga m ON dp.manga_id = m.id
            WHERE dp.status = 'active' AND dp.current_amount < dp.goal_amount
            ORDER BY dp.priority DESC, dp.created_at DESC
            LIMIT 20
        `);

        res.json(projects);

    } catch (error) {
        console.error('Ошибка получения донат-проектов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Создание доната
router.post('/donate', optionalAuth, [
    body('project_id').optional().isInt(),
    body('manga_id').optional().isInt(),
    body('amount').isInt({ min: 10, max: 50000 }).withMessage('Сумма должна быть от 10₽ до 50,000₽')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Ошибка валидации', details: errors.array() });
        }

        const { project_id, manga_id, amount } = req.body;
        const userId = req.user ? req.user.id : null;

        let targetId, targetType, targetTitle;

        if (project_id) {
            // Донат в проект
            const project = await req.db.get('SELECT * FROM donation_projects WHERE id = ? AND status = "active"', [project_id]);
            if (!project) {
                return res.status(404).json({ error: 'Проект не найден или неактивен' });
            }

            const newAmount = Math.min(project.current_amount + amount, project.goal_amount);
            
            await req.db.run(
                'UPDATE donation_projects SET current_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [newAmount, project_id]
            );

            targetId = project_id;
            targetType = 'project';
            targetTitle = project.title;

        } else if (manga_id) {
            // Донат в мангу (старая система)
            const manga = await req.db.get('SELECT * FROM manga WHERE id = ?', [manga_id]);
            if (!manga) {
                return res.status(404).json({ error: 'Манга не найдена' });
            }

            const newAmount = Math.min(manga.current_donations + amount, manga.donation_goal);
            
            await req.db.run(
                'UPDATE manga SET current_donations = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [newAmount, manga_id]
            );

            targetId = manga_id;
            targetType = 'manga';
            targetTitle = manga.title;

        } else {
            return res.status(400).json({ error: 'Укажите project_id или manga_id' });
        }

        // Сохраняем запись о донате
        const donationResult = await req.db.run(`
            INSERT INTO donations (user_id, manga_id, project_id, amount, status)
            VALUES (?, ?, ?, ?, 'completed')
        `, [userId, manga_id || null, project_id || null, amount]);

        res.json({
            message: 'Спасибо за поддержку!',
            donation: {
                id: donationResult.lastID,
                amount,
                target: targetTitle,
                type: targetType
            }
        });

    } catch (error) {
        console.error('Ошибка создания доната:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// История донатов пользователя
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const donations = await req.db.all(`
            SELECT d.*, m.title as manga_title, dp.title as project_title
            FROM donations d
            LEFT JOIN manga m ON d.manga_id = m.id
            LEFT JOIN donation_projects dp ON d.project_id = dp.id
            WHERE d.user_id = ?
            ORDER BY d.created_at DESC
            LIMIT 50
        `, [req.user.id]);

        res.json(donations);

    } catch (error) {
        console.error('Ошибка получения истории донатов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Статистика донатов
router.get('/stats', async (req, res) => {
    try {
        const stats = await req.db.get(`
            SELECT 
                COUNT(*) as totalDonations,
                SUM(amount) as totalAmount,
                AVG(amount) as averageAmount
            FROM donations
            WHERE status = 'completed'
        `);

        const topDonors = await req.db.all(`
            SELECT u.username, SUM(d.amount) as total_donated
            FROM donations d
            JOIN users u ON d.user_id = u.id
            WHERE d.status = 'completed'
            GROUP BY d.user_id
            ORDER BY total_donated DESC
            LIMIT 10
        `);

        res.json({
            stats: {
                totalDonations: stats.totalDonations || 0,
                totalAmount: stats.totalAmount || 0,
                averageAmount: parseFloat((stats.averageAmount || 0).toFixed(2))
            },
            topDonors
        });

    } catch (error) {
        console.error('Ошибка получения статистики донатов:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

module.exports = router;