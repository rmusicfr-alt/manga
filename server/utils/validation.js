const { body, query, param } = require('express-validator');

// Валидация для манги
const mangaValidation = {
    create: [
        body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Название должно быть от 1 до 255 символов'),
        body('type').isIn(['Манга', 'Маньхуа', 'Маньхва', 'Аниме', 'Ранобэ']).withMessage('Неверный тип'),
        body('status').isIn(['Анонс', 'Выходит', 'Завершён', 'Заморожен', 'Лицензировано']).withMessage('Неверный статус'),
        body('year').optional().isInt({ min: 1900, max: 2030 }).withMessage('Год должен быть от 1900 до 2030'),
        body('rating').optional().isFloat({ min: 0, max: 10 }).withMessage('Рейтинг должен быть от 0 до 10'),
        body('image_url').optional().isURL().withMessage('Некорректный URL изображения'),
        body('description').optional().isLength({ max: 2000 }).withMessage('Описание не должно превышать 2000 символов'),
        body('available_chapters').optional().isInt({ min: 0 }).withMessage('Количество доступных глав должно быть положительным'),
        body('total_chapters').optional().isInt({ min: 0 }).withMessage('Общее количество глав должно быть положительным'),
        body('donation_goal').optional().isInt({ min: 1000, max: 1000000 }).withMessage('Цель доната должна быть от 1000₽ до 1,000,000₽'),
        body('genres').optional().isArray().withMessage('Жанры должны быть массивом'),
        body('categories').optional().isArray().withMessage('Категории должны быть массивом')
    ],
    
    update: [
        param('id').isInt().withMessage('Некорректный ID'),
        body('title').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Название должно быть от 1 до 255 символов'),
        body('type').optional().isIn(['Манга', 'Маньхуа', 'Маньхва', 'Аниме', 'Ранобэ']).withMessage('Неверный тип'),
        body('status').optional().isIn(['Анонс', 'Выходит', 'Завершён', 'Заморожен', 'Лицензировано']).withMessage('Неверный статус'),
        body('year').optional().isInt({ min: 1900, max: 2030 }).withMessage('Год должен быть от 1900 до 2030'),
        body('rating').optional().isFloat({ min: 0, max: 10 }).withMessage('Рейтинг должен быть от 0 до 10'),
        body('image_url').optional().isURL().withMessage('Некорректный URL изображения'),
        body('description').optional().isLength({ max: 2000 }).withMessage('Описание не должно превышать 2000 символов'),
        body('available_chapters').optional().isInt({ min: 0 }).withMessage('Количество доступных глав должно быть положительным'),
        body('total_chapters').optional().isInt({ min: 0 }).withMessage('Общее количество глав должно быть положительным'),
        body('donation_goal').optional().isInt({ min: 1000, max: 1000000 }).withMessage('Цель доната должна быть от 1000₽ до 1,000,000₽')
    ]
};

// Валидация для пользователей
const userValidation = {
    register: [
        body('username').trim().isLength({ min: 2, max: 50 }).withMessage('Имя пользователя должно быть от 2 до 50 символов'),
        body('email').isEmail().normalizeEmail().withMessage('Некорректный email'),
        body('password').isLength({ min: 6, max: 128 }).withMessage('Пароль должен быть от 6 до 128 символов')
    ],
    
    login: [
        body('email').isEmail().normalizeEmail().withMessage('Некорректный email'),
        body('password').notEmpty().withMessage('Пароль обязателен')
    ],
    
    updateProfile: [
        body('username').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Имя пользователя должно быть от 2 до 50 символов'),
        body('avatar_url').optional().isURL().withMessage('Некорректный URL аватара')
    ]
};

// Валидация для донатов
const donationValidation = {
    create: [
        body('amount').isInt({ min: 10, max: 50000 }).withMessage('Сумма должна быть от 10₽ до 50,000₽'),
        body('project_id').optional().isInt().withMessage('Некорректный ID проекта'),
        body('manga_id').optional().isInt().withMessage('Некорректный ID манги')
    ],
    
    createProject: [
        body('manga_id').isInt().withMessage('ID манги обязателен'),
        body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Название должно быть от 1 до 255 символов'),
        body('goal_amount').isInt({ min: 1000, max: 1000000 }).withMessage('Цель должна быть от 1000₽ до 1,000,000₽'),
        body('description').optional().isLength({ max: 1000 }).withMessage('Описание не должно превышать 1000 символов'),
        body('priority').optional().isInt({ min: 1, max: 10 }).withMessage('Приоритет должен быть от 1 до 10'),
        body('status').optional().isIn(['active', 'completed', 'paused']).withMessage('Неверный статус')
    ]
};

// Валидация для списков пользователей
const listValidation = {
    addToList: [
        body('manga_id').isInt().withMessage('ID манги обязателен'),
        body('list_type').isIn(['favorites', 'watching', 'wantToWatch', 'completed']).withMessage('Неверный тип списка'),
        body('current_episode').optional().isInt({ min: 1 }).withMessage('Номер эпизода должен быть положительным')
    ]
};

// Валидация для поиска и фильтров
const searchValidation = [
    query('search').optional().isString().isLength({ max: 100 }).withMessage('Поисковый запрос слишком длинный'),
    query('genres').optional().isString(),
    query('categories').optional().isString(),
    query('statuses').optional().isString(),
    query('sortBy').optional().isIn(['popularity', 'rating', 'updated', 'alphabet']).withMessage('Неверный тип сортировки'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Лимит должен быть от 1 до 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Смещение должно быть положительным')
];

module.exports = {
    mangaValidation,
    userValidation,
    donationValidation,
    listValidation,
    searchValidation
};