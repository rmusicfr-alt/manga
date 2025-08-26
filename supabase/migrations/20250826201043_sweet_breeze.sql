/*
  # Создание таблицы новостей

  1. Новые таблицы
    - `news`
      - `id` (uuid, primary key) - ID новости
      - `title` (text) - Заголовок
      - `excerpt` (text) - Краткое описание
      - `content` (text) - Полный текст
      - `image_url` (text) - Изображение
      - `category` (text) - Категория
      - `is_published` (boolean) - Опубликована ли
      - `created_at` (timestamp) - Дата создания

  2. Безопасность
    - Включить RLS для таблицы news
    - Все могут читать опубликованные новости
    - Только админы могут управлять новостями
*/

CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  excerpt text NOT NULL,
  content text DEFAULT '',
  image_url text,
  category text DEFAULT 'Обновление' CHECK (category IN ('Обновление', 'Каталог', 'Функции', 'Анонс')),
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Все могут читать опубликованные новости
CREATE POLICY "Anyone can read published news"
  ON news
  FOR SELECT
  TO public
  USING (is_published = true);

-- Только админы могут управлять новостями
CREATE POLICY "Only admins can manage news"
  ON news
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Триггер для обновления updated_at
CREATE TRIGGER update_news_updated_at
  BEFORE UPDATE ON news
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();