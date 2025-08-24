const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        this.dbPath = process.env.DB_PATH || './data/manga.db';
        this.db = null;
    }

    async init() {
        // Создаем директорию для базы данных
        const dbDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Ошибка подключения к базе данных:', err);
                    reject(err);
                } else {
                    console.log('✅ Подключение к SQLite базе данных установлено');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async createTables() {
        const tables = [
            // Пользователи
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                avatar_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                is_active BOOLEAN DEFAULT 1
            )`,

            // Устройства пользователей
            `CREATE TABLE IF NOT EXISTS user_devices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                device_id TEXT NOT NULL,
                device_type TEXT,
                browser TEXT,
                user_agent TEXT,
                ip_address TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )`,

            // Манга/Аниме
            `CREATE TABLE IF NOT EXISTS manga (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                type TEXT NOT NULL,
                status TEXT NOT NULL,
                year INTEGER,
                rating REAL DEFAULT 0,
                image_url TEXT,
                description TEXT,
                available_chapters INTEGER DEFAULT 0,
                total_chapters INTEGER DEFAULT 0,
                donation_goal INTEGER DEFAULT 10000,
                current_donations INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER,
                FOREIGN KEY (created_by) REFERENCES users (id)
            )`,

            // Жанры
            `CREATE TABLE IF NOT EXISTS genres (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Связь манга-жанры
            `CREATE TABLE IF NOT EXISTS manga_genres (
                manga_id INTEGER NOT NULL,
                genre_id INTEGER NOT NULL,
                PRIMARY KEY (manga_id, genre_id),
                FOREIGN KEY (manga_id) REFERENCES manga (id) ON DELETE CASCADE,
                FOREIGN KEY (genre_id) REFERENCES genres (id) ON DELETE CASCADE
            )`,

            // Категории
            `CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Связь манга-категории
            `CREATE TABLE IF NOT EXISTS manga_categories (
                manga_id INTEGER NOT NULL,
                category_id INTEGER NOT NULL,
                PRIMARY KEY (manga_id, category_id),
                FOREIGN KEY (manga_id) REFERENCES manga (id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
            )`,

            // Эпизоды/Главы
            `CREATE TABLE IF NOT EXISTS episodes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                manga_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                episode_number INTEGER NOT NULL,
                chapter_from INTEGER,
                chapter_to INTEGER,
                video_url TEXT,
                is_available BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (manga_id) REFERENCES manga (id) ON DELETE CASCADE,
                UNIQUE(manga_id, episode_number)
            )`,

            // Донат-проекты
            `CREATE TABLE IF NOT EXISTS donation_projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                manga_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                goal_amount INTEGER NOT NULL,
                current_amount INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                priority INTEGER DEFAULT 5,
                image_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER,
                FOREIGN KEY (manga_id) REFERENCES manga (id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users (id)
            )`,

            // История донатов
            `CREATE TABLE IF NOT EXISTS donations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                manga_id INTEGER,
                project_id INTEGER,
                amount INTEGER NOT NULL,
                payment_method TEXT,
                transaction_id TEXT,
                status TEXT DEFAULT 'completed',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (manga_id) REFERENCES manga (id),
                FOREIGN KEY (project_id) REFERENCES donation_projects (id)
            )`,

            // Пользовательские списки
            `CREATE TABLE IF NOT EXISTS user_lists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                manga_id INTEGER NOT NULL,
                list_type TEXT NOT NULL,
                current_episode INTEGER DEFAULT 1,
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (manga_id) REFERENCES manga (id) ON DELETE CASCADE,
                UNIQUE(user_id, manga_id, list_type)
            )`,

            // Прогресс просмотра
            `CREATE TABLE IF NOT EXISTS viewing_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                manga_id INTEGER NOT NULL,
                episode_number INTEGER NOT NULL,
                progress_seconds INTEGER DEFAULT 0,
                completed BOOLEAN DEFAULT 0,
                last_watched DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (manga_id) REFERENCES manga (id) ON DELETE CASCADE,
                UNIQUE(user_id, manga_id, episode_number)
            )`
        ];

        for (const table of tables) {
            await this.run(table);
        }

        // Создаем индексы для производительности
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_manga_title ON manga(title)',
            'CREATE INDEX IF NOT EXISTS idx_manga_status ON manga(status)',
            'CREATE INDEX IF NOT EXISTS idx_manga_rating ON manga(rating)',
            'CREATE INDEX IF NOT EXISTS idx_episodes_manga ON episodes(manga_id)',
            'CREATE INDEX IF NOT EXISTS idx_donations_user ON donations(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_user_lists_user ON user_lists(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_user_lists_manga ON user_lists(manga_id)'
        ];

        for (const index of indexes) {
            await this.run(index);
        }

        // Создаем админа по умолчанию
        await this.createDefaultAdmin();
        
        // Добавляем тестовые данные если база пустая
        await this.addSampleDataIfEmpty();
    }

    async createDefaultAdmin() {
        const adminExists = await this.get('SELECT id FROM users WHERE role = "admin" LIMIT 1');
        
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
            await this.run(
                'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                ['admin', 'admin@lightfox.manga', hashedPassword, 'admin']
            );
            console.log('✅ Админ создан: admin@lightfox.manga / admin123');
        }
    }

    async addSampleDataIfEmpty() {
        const mangaCount = await this.get('SELECT COUNT(*) as count FROM manga');
        
        if (mangaCount.count === 0) {
            console.log('📚 Добавление тестовых данных...');
            
            // Добавляем жанры
            const genres = ['Экшен', 'Драма', 'Фэнтези', 'Комедия', 'Романтика', 'Ужасы', 'Приключения', 'Школа'];
            for (const genre of genres) {
                await this.run('INSERT OR IGNORE INTO genres (name) VALUES (?)', [genre]);
            }

            // Добавляем категории
            const categories = ['Сёнен', 'Сэйнэн', 'Сёдзё', 'Дзёсэй'];
            for (const category of categories) {
                await this.run('INSERT OR IGNORE INTO categories (name) VALUES (?)', [category]);
            }

            // Добавляем тестовую мангу
            const sampleManga = [
                {
                    title: 'Атака титанов',
                    type: 'Аниме',
                    status: 'Завершён',
                    year: 2013,
                    rating: 9.0,
                    description: 'Человечество живёт в городах, окружённых огромными стенами, защищающими от титанов.',
                    available_chapters: 87,
                    total_chapters: 87,
                    donation_goal: 10000,
                    current_donations: 7500,
                    image_url: 'https://via.placeholder.com/300x450/FF6B35/FFFFFF?text=Атака+титанов'
                },
                {
                    title: 'Наруто',
                    type: 'Аниме', 
                    status: 'Завершён',
                    year: 2002,
                    rating: 8.7,
                    description: 'История молодого ниндзя Наруто Узумаки.',
                    available_chapters: 720,
                    total_chapters: 720,
                    donation_goal: 15000,
                    current_donations: 12000,
                    image_url: 'https://via.placeholder.com/300x450/4A90E2/FFFFFF?text=Наруто'
                }
            ];

            for (const manga of sampleManga) {
                const result = await this.run(
                    `INSERT INTO manga (title, type, status, year, rating, description, 
                     available_chapters, total_chapters, donation_goal, current_donations, image_url)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [manga.title, manga.type, manga.status, manga.year, manga.rating,
                     manga.description, manga.available_chapters, manga.total_chapters,
                     manga.donation_goal, manga.current_donations, manga.image_url]
                );

                // Добавляем жанры для манги
                const mangaId = result.lastID;
                const genreIds = await this.all('SELECT id FROM genres WHERE name IN ("Экшен", "Драма")');
                for (const genre of genreIds) {
                    await this.run('INSERT INTO manga_genres (manga_id, genre_id) VALUES (?, ?)', [mangaId, genre.id]);
                }
            }

            console.log('✅ Тестовые данные добавлены');
        }
    }

    // Обертки для промисов
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Ошибка закрытия базы данных:', err);
                } else {
                    console.log('✅ База данных закрыта');
                }
            });
        }
    }
}

module.exports = Database;