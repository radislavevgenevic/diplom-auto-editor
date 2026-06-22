# Документация проекта "Diplom Auto Editor" для ИИ-анализа

Этот файл содержит всю необходимую информацию об архитектуре, структуре данных, технологиях и правилах проекта. Передавайте его любой нейросети (Gemini, Claude, ChatGPT) перед началом работы, чтобы она мгновенно поняла устройство проекта.

---

## 🛠️ Стек технологий и особенности

1. **Frontend**:
   - **Framework**: Next.js v16.2.9 (с использованием App Router) + React v19.2.4.
   - **Стили**: Tailwind CSS v4.0.0 (через `@tailwindcss/postcss`) + кастомные CSS переменные в `app/globals.css`.
   - **Управление состоянием**: Zustand v5.0.14 (`store/editorStore.js`).
2. **Backend / Генератор документов**:
   - **Скрипт генерации**: Python 3 с библиотекой `python-docx==1.1.2` (`public/generate.py`).
   - **Шаблоны**: Word-шаблоны (`templateD.docx`, `templateK.docx`, `templateO.docx`) с XML-плейсхолдерами для автозаполнения метаданных.

---

## 🔑 Авторизация, роли и подписки (`users.json`)

В проекте реализована система входа/регистрации, разграничения ролей и учета лимитов генераций.

1. **База данных пользователей**:
   Все пользователи хранятся локально в файле `users.json` в рабочей директории (там же, где и `data.json`).
   Схема объекта пользователя:
   ```json
   {
     "id": "UUID-строка",
     "username": "имя_пользователя (в нижнем регистре)",
     "passwordHash": "SHA-256 хеш пароля с солью",
     "role": "admin" | "teacher" | "student",
     "generationsLeft": 5 | "infinite", // Лимит доступных генераций
     "sessionToken": "случайный_токен_сессии"
   }
   ```
2. **Сессии**:
   Авторизация построена на HTTP-Only cookie `session_token` со сроком жизни 7 дней. В эндпоинтах сессия валидируется через сравнение токена из куки с `sessionToken` в `users.json`.
3. **Роли**:
   - `student` / `teacher`: Обычные роли с ограниченным/безлимитным количеством генераций. Редактируют только свои изолированные файлы `data_[username].json` и `images_[username]/`.
   - `admin`: Администратор. Имеет доступ к **Админ-панели**, где может управлять ролями пользователей и изменять их лимиты генераций (начислять по +5, убавлять или выставлять безлимитный доступ "infinite").
4. **Контроль лимитов**:
   - При успешной генерации документа (`/api/generate`) лимит `generationsLeft` у пользователя уменьшается на 1 (если не равен `'infinite'`).
   - Если лимит `generationsLeft` равен 0, генерация блокируется, API возвращает ошибку `LIMIT_EXCEEDED`, а на фронтенде открывается модальное окно оплаты со ссылкой на Telegram администратора (`TelegramPaymentModal.jsx`).

---

## 📁 Структура файлов проекта


* `/app` — Маршруты и страницы Next.js:
  * [layout.js](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/app/layout.js) — Базовый макет приложения.
  * [page.js](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/app/page.js) — Главная страница редактора (адаптивная сетка, боковая панель, редактор блоков).
  * [globals.css](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/app/globals.css) — Тема оформления (поддержка тёмной темы, CSS переменные, стили кнопок, форм и разметки).
* `/app/api` — Маршруты API (Next.js server-side):
  * [generate/route.js](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/app/api/generate/route.js) — POST-эндпоинт для генерации DOCX с проверкой лимитов генераций пользователя.
  * [load/route.js](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/app/api/load/route.js) — GET-эндпоинт для загрузки пользовательских данных из `data_[username].json`.
  * [save/route.js](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/app/api/save/route.js) — POST-эндпоинт для сохранения пользовательских данных и картинок.
  * `auth/register/route.js`, `auth/login/route.js`, `auth/logout/route.js`, `auth/me/route.js` — Управление регистрацией, входом в систему, выходом и проверкой сессии.
  * `admin/users/route.js` — Управление пользователями и их лимитами со стороны администратора.
* `/lib` — Вспомогательные утилиты бэкенда:
  * [db.js](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/lib/db.js) — Работа с базой пользователей `users.json`, хеширование паролей, управление путями файлов данных.
* `/components` — React-компоненты интерфейса:
  * [BlockEditor.jsx](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/components/BlockEditor.jsx) — Диспетчер панелей редактора.
  * [BlockList.jsx](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/components/BlockList.jsx) — Список контентных блоков с перефразированием ИИ.
  * [Header.jsx](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/components/Header.jsx) — Шапка редактора (показывает имя пользователя, его генерации, кнопку админки и кнопку выхода).
  * [Sidebar.jsx](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/components/Sidebar.jsx) — Навигационное боковое меню.
  * [AuthScreen.jsx](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/components/AuthScreen.jsx) — Экран входа и регистрации пользователей с кнопками демо-доступа.
  * [AdminDashboard.jsx](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/components/AdminDashboard.jsx) — Панель управления пользователями, изменения их ролей и лимитов генераций.
  * [TelegramPaymentModal.jsx](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/components/TelegramPaymentModal.jsx) — Модальное окно при исчерпании лимитов со ссылкой на Telegram.
  * [MetadataPanel.jsx](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/components/MetadataPanel.jsx), [ReferencePanel.jsx](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/components/ReferencePanel.jsx), [SearchReplacePanel.jsx](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/components/SearchReplacePanel.jsx), [AiImportPanel.jsx](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/components/AiImportPanel.jsx) — Панели метаданных, источников, поиска/замены и Gemini импорта.
* `/components/blocks` — Компоненты отдельных блоков:
  * [TextBlock.jsx](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/components/blocks/TextBlock.jsx), [ListBlock.jsx](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/components/blocks/ListBlock.jsx), [TableBlock.jsx](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/components/blocks/TableBlock.jsx), [FormulaBlock.jsx](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/components/blocks/FormulaBlock.jsx), [ImageBlock.jsx](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/components/blocks/ImageBlock.jsx) — Типы блоков.
* `/store` — Управление локальным стейтом:
  * [editorStore.js](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/store/editorStore.js) — Хранилище Zustand. Содержит метаданные документа, разделы, подразделы, историю изменений (для Undo/Redo), поиск/замену и функции нормализации.
* `/public` — Публичные ресурсы и бэкенд:
  * [generate.py](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/public/generate.py) — Скрипт сборки DOCX-документа из `data.json`.
  * `templateD.docx`, `templateK.docx`, `templateO.docx` — Файлы-шаблоны Word.


---

## 📊 Формат хранения данных (`data.json`)

Хранилище стейта и файл обмена представляют собой единый JSON-объект.

```json
{
  "special": "Название специальности",
  "theme": "Тема дипломного проекта",
  "group": "Шифр учебной группы",
  "name": "ФИО Студента",
  "name_teacher": "ФИО Руководителя",
  "name_nor": "ФИО Нормоконтролёра",
  "year": "Год выпуска",
  "template": "D", // "D" | "K" | "O" (соответствует шаблонам templateD/K/O.docx)
  
  "introduction": [
    // Контентные блоки введения (по умолчанию пустой массив или текст)
  ],
  "sections": [
    {
      "title": { "type": "paragraph1", "text": "1 Название раздела" },
      "content": [
        // Блоки контента
      ],
      "subsections": [
        {
          "title": { "type": "paragraph2", "text": "1.1 Название подраздела" },
          "content": [
            // Блоки контента
          ]
        }
      ]
    }
  ],
  "conclusion": [
    // Контентные блоки заключения
  ],
  "reference": [
    {
      "text": "Название книги, статьи или ресурса",
      "url": "http://example.com"
    }
  ]
}
```

### 🧩 Контентные блоки (Content Blocks)

Внутри массивов `introduction`, `content` разделов/подразделов и `conclusion` содержатся объекты блоков следующего формата:

#### 1. Текст (`text`)
```json
{
  "type": "text",
  "text": "Текст обычного абзаца..."
}
```

#### 2. Списки (`bullet_list` / `numbered_list`)
```json
{
  "type": "bullet_list", // или "numbered_list"
  "items": [
    "Первый элемент списка",
    "Второй элемент списка"
  ]
}
```

#### 3. Таблица (`table`)
```json
{
  "type": "table",
  "title": "Название таблицы",
  "headers": ["Колонка 1", "Колонка 2"],
  "rows": [
    ["Ячейка 1-1", "Ячейка 1-2"],
    ["Ячейка 2-1", "Ячейка 2-2"]
  ]
}
```

#### 4. Формула (`formula`)
```json
{
  "type": "formula",
  "text": "E = m * c^2",
  "variables": [
    { "symbol": "E", "description": "энергия тела" },
    { "symbol": "m", "description": "масса тела" },
    { "symbol": "c", "description": "скорость света" }
  ]
}
```

#### 5. Изображение (`image`)
```json
{
  "type": "image",
  "src": "images/image_filename.png", // Локальный путь к сохранённому файлу
  "caption": "Схема архитектуры системы", // Название рисунка
  "_dataURL": "data:image/png;base64,..." // Временный base64 (используется на фронтенде перед сохранением)
}
```

---

## 🐍 Логика работы генератора DOCX (`public/generate.py`)

1. **Замена плейсхолдеров**:
   Сначала скрипт распаковывает выбранный `.docx` файл шаблона как ZIP-архив, находит все вхождения строковых плейсхолдеров:
   - `{{SPECIAL}}`
   - `{{THEME}}`
   - `{{GROUP}}`
   - `{{NAME}}`
   - `{{NAME_TEACHER}}`
   - `{{NAME_NOR}}`
   - `{{YEAR}}`
   
   И заменяет их в XML-структуре документа на значения из `data.json`. Затем запаковывает обратно во временный `temp.docx`.
   
2. **Вставка контента**:
   Скрипт открывает `temp.docx` через `python-docx` и ищет специальные параграфы-маркеры:
   - `{{INTRODUCTION}}` — вставляет блоки введения.
   - `{{SECTIONS}}` — вставляет заголовки разделов (Heading 1), подразделов (Heading 2), их контентные блоки, и добавляет разрыв раздела (Section Break) на новую страницу после каждого раздела.
   - `{{CONCLUSION}}` — вставляет блоки заключения.
   - `{{REFERENCE}}` — вставляет нумерованный список литературы, где название соединяется с ссылкой через среднее тире (`–`), а сама ссылка вставляется как кликабельный синий гиперлинк с подчёркиванием.
   
3. **Особенности отрисовки блоков**:
   - **Списки**: Используют базовый нумерационный стиль Word с переопределением ID нумерации (`create_numbering`) для изоляции списков друг от друга (чтобы каждый список начинался с 1). В конце элементов списков автоматически ставятся точки с запятой (`;`), а у последнего элемента — точка (`.`).
   - **Таблицы**: Снабжаются автоматической подписью формата `Таблица N – [Название]` (Times New Roman, 14pt, красная строка 1см, `keep_with_next=True`). Ячейки таблиц форматируются шрифтом Times New Roman, 12pt, без жирности.
   - **Формулы**: Создается невидимая таблица из 2 колонок: левая широкая колонка центрирует формулу, правая (1см) выравнивает номер формулы в круглых скобках `(N)` по правому краю. Если есть переменные ("где..."), после формулы ставится запятая, и ниже вставляется еще одна невидимая таблица с переменными и их описанием. У последней переменной в описании ставится точка (`.`), у остальных — точка с запятой (`;`).
   - **Изображения**: Центрируются по ширине, растягиваются до 15 см. Добавляется подпись снизу: `Рисунок N – [Название]` (Times New Roman, 14pt, без красной строки, по центру).

---

## 📌 Важные правила для разработчика (ИИ)

1. **Нестандартный Next.js**:
   Используется специфическая сборка Next.js 16. Прежде чем писать код, учитывайте, что структура папок и клиентские/серверные API могут отличаться от стандартных. Читайте логи и справочники в `node_modules/next/dist/docs/` при возникновении сомнений.
2. **Пути сохранения файлов (`load` / `save`)**:
   По умолчанию API сохранения и загрузки пытается найти папку `diplom-auto-editor` на Рабочем столе пользователя (`~/Desktop/diplom-auto-editor`). Если папки нет, сохранение происходит в корень текущей директории проекта.
3. **Целостность схемы данных**:
   Любые изменения в полях контентных блоков на фронтенде (в React-компонентах и Zustand-сторе) должны быть синхронизированы с:
   - Парсером ИИ-импорта в [AiImportPanel.jsx](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/components/AiImportPanel.jsx) (системный промпт).
   - Логикой рендеринга блоков в [generate.py](file:///C:/Users/Radislav/Desktop/diplom-auto-editor/public/generate.py) (метод `render_block`).
4. **Сохранение картинок**:
   Изображения загружаются пользователем как Base64 (`_dataURL` во фронтенде) и отправляются по API. Бэкенд сохраняет их как файлы в папку `images/` с оригинальными именами файлов, убирая base64-префикс, а в JSON-файле `data.json` заменяет путь на локальный `images/имя_файла.png`. Скрипт `generate.py` считывает изображение именно из этого пути.
