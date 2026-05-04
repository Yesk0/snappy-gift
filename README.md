# 🎁 Snappy Gift

> **Подарки, которые выбирают сами.** Соберите gift box из нескольких вариантов — получатель сам выберет то, что ему по-настоящему нужно.

SIS Project · Information Systems · 2026

---

## ✨ Основные функциональности (5+)

1. **Аутентификация** — регистрация, вход, Google OAuth, сброс пароля
2. **Профиль пользователя** — предпочтения (категории, аллергии, бюджет) и настройки приватности
3. **Gift Box Wizard** — 4-шаговый мастер создания подарка + публичная страница выбора по уникальной ссылке
4. **Каталог с AI-ассистентом** — фильтры (категория, цена, поиск) + streaming-чат Snappy на базе Gemini
5. **Корпоративный Secret Santa** — события, массовое добавление участников, автоматическое распределение алгоритмом derangement

---

## 🧱 Стек

| Слой | Технологии |
|------|------------|
| Frontend | React 18, Vite 5, TypeScript 5, TailwindCSS 3, shadcn/ui, React Router 6, React Query |
| Backend | Lovable Cloud (Supabase): PostgreSQL, Auth, Edge Functions (Deno) |
| AI | Lovable AI Gateway (Google Gemini 3 Flash) |
| Стиль | Semantic design tokens (HSL), Fraunces + Inter |

### Архитектура

```
├── src/
│   ├── components/        # UI (Header, Footer, ProductCard, AiAssistant, ProtectedRoute)
│   ├── hooks/useAuth.tsx  # Auth context (onAuthStateChange + getSession)
│   ├── pages/             # Роуты: Index, Login, Register, Dashboard, Catalog, CreateGift, GiftView, Corporate, ...
│   ├── integrations/supabase/  # Авто-генерируемый клиент и типы
│   └── index.css          # Design tokens, gradient/shadow utilities
├── supabase/
│   ├── migrations/        # SQL схема (8 таблиц + RLS + triggers + seed)
│   └── functions/
│       ├── ai-assistant/        # SSE-прокси к Lovable AI Gateway
│       └── secret-santa-assign/ # Derangement + JWT verify
└── index.html
```

---

## 🗄 Схема БД

| Таблица | Назначение |
|---------|------------|
| `profiles` | Данные пользователя, `preferences` (jsonb), `privacy_settings` (jsonb) |
| `user_roles` | Роли (app_role enum) — отдельно от profiles для защиты от эскалации привилегий |
| `products` | Каталог (24 seed-товара, 6 категорий) |
| `gift_boxes` | Созданные подарки с `unique_token` и статусом (pending → viewed → selected) |
| `gift_box_items` | Варианты в каждом box (N:N → products) |
| `selections` | Выбор получателя (публичный INSERT через RLS) |
| `corporate_events` | Secret Santa / корпоративные события |
| `corporate_participants` | Участники + результат распределения |

Все таблицы защищены RLS-политиками. Функция `has_role()` — `SECURITY DEFINER` во избежание рекурсии.

---

## 🚀 Запуск

Проект развёрнут на Vercel — backend предоставляется автоматически, база, auth и edge functions уже работают.

### Локальная разработка

```bash
# 1. Установить зависимости
bun install   # или npm install

# 2. Запустить dev-сервер
bun run dev   # http://localhost:8080
```

Переменные окружения (`.env`) генерируются автоматически средой Lovable — см. `.env.example` для перечня.

### Edge Functions

Функции деплоятся автоматически при редактировании в Lovable. Для ручного теста:

```bash
curl -X POST "$VITE_SUPABASE_URL/functions/v1/ai-assistant" \
  -H "Authorization: Bearer $VITE_SUPABASE_PUBLISHABLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Подарок маме на 50 лет, бюджет 3000"}]}'
```

---

## 🔐 Безопасность

- **RLS на всех таблицах** — пользователь видит только свои gift boxes и события
- **Роли в отдельной таблице** `user_roles` + функция `has_role()` с `SECURITY DEFINER`
- **JWT verification** в edge function `secret-santa-assign` через `supabase.auth.getUser()`
- **HIBP-check паролей** включён в Auth-настройках
- **Публичный доступ** только к `products`, `gift_boxes` по token и `selections` (INSERT под условием status)

---

## 🎨 Дизайн-система

Semantic tokens в `src/index.css`:

- `--primary: 12 78% 62%` (warm coral)
- `--primary-glow: 18 85% 72%` (peach)
- `--background: 36 50% 97%` (cream)
- `--foreground: 222 47% 14%` (deep navy)
- `--gradient-warm`, `--shadow-warm`, `--transition-smooth`
- Шрифты: **Fraunces** (заголовки), **Inter** (текст)

Все компоненты используют токены — кастомные цвета в классах отсутствуют.

---

## 📱 Маршруты

| Путь | Описание | Доступ |
|------|----------|--------|
| `/` | Лендинг | public |
| `/login`, `/register` | Вход / регистрация | public |
| `/forgot-password`, `/reset-password` | Сброс пароля | public |
| `/catalog` | Каталог + AI-ассистент | public |
| `/corporate` | Лендинг корпоративных / список событий | public + protected |
| `/gift/:token` | Страница получателя | public (по токену) |
| `/dashboard` | Мои подарки | **protected** |
| `/create-gift` | Wizard создания | **protected** |
| `/profile` | Профиль | **protected** |
| `/corporate/:id` | Событие Secret Santa | **protected** |

---

## 🧑‍💻 Автор

SIS Project · Information Systems course · 2026