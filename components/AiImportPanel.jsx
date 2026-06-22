'use client'

import { useState, useEffect } from 'react'
import { useEditorStore } from '../store/editorStore'

const SYSTEM_PROMPT = `Ты — профессиональный ИИ-ассистент для подготовки дипломных и курсовых работ.
Твоя задача — проанализировать предоставленный пользователем текст и преобразовать его в структурированную JSON-карту документа.

Выходной JSON должен строго соответствовать следующей схеме:
{
  "special": "Специальность (если есть в тексте, иначе оставить пустым)",
  "theme": "Тема работы (если есть, иначе оставить пустым)",
  "group": "Группа студента (если есть, иначе оставить пустым)",
  "name": "ФИО студента (если есть, иначе оставить пустым)",
  "name_teacher": "ФИО руководителя (если есть, иначе оставить пустым)",
  "name_nor": "ФИО нормоконтролёра (если есть, иначе оставить пустым)",
  "year": "Год (если есть, иначе текущий год)",
  "introduction": [
    // блоки введения (текст, списки, формулы, таблицы, картинки)
  ],
  "sections": [
    {
      "title": { "type": "paragraph1", "text": "1 Название раздела" },
      "content": [
        // блоки контента самого раздела
      ],
      "subsections": [
        {
          "title": { "type": "paragraph2", "text": "1.1 Название подраздела" },
          "content": [
            // блоки контента подраздела
          ]
        }
      ]
    }
  ],
  "conclusion": [
    // блоки заключения
  ],
  "reference": [
    { "text": "Название источника", "url": "URL адрес (если есть, иначе пусто)" }
  ]
}

Правила выделения блоков контента (content blocks):
Каждый блок должен быть объектом с ключом "type".
Поддерживаются следующие типы блоков:
1. Текст:
   { "type": "text", "text": "Сам текст абзаца" }
2. Маркированный список:
   { "type": "bullet_list", "items": ["Элемент 1", "Элемент 2"] }
3. Нумерованный список:
   { "type": "numbered_list", "items": ["Элемент 1", "Элемент 2"] }
4. Таблица:
   { "type": "table", "title": "Название таблицы", "headers": ["Колонка 1", "Колонка 2"], "rows": [["Ячейка 1-1", "Ячейка 1-2"], ["Ячейка 2-1", "Ячейка 2-2"]] }
5. Формула:
   { "type": "formula", "text": "формула, например: E = mc^2", "variables": [{ "symbol": "E", "description": "энергия" }, { "symbol": "m", "description": "масса" }] }
6. Рисунок/Изображение:
   Если в тексте есть фразы вида 'Рисунок 1 - Схема сети' или упоминается картинка/диаграмма, создай блок:
   { "type": "image", "src": "", "caption": "Название рисунка (например: Схема сети)" }
   Поле "src" оставь пустым.

Инструкции по разбору:
- Внимательно выдели разделы (начинаются с цифры: 1, 2, 3 и т.д.) и подразделы (начинаются с 1.1, 1.2, 2.1 и т.д.).
- Сгруппируй абзацы в соответствующие разделы/подразделы.
- Если в тексте упоминаются таблицы, извлеки заголовки колонок и строки и преобразуй в блок таблицы.
- Если есть списки (через дефисы, точки, цифры), сделай их блоками bullet_list или numbered_list.
- Если есть формулы с расшифровкой переменных ("где x - это..."), преобразуй их в формульный блок.
- Весь остальной текст разбей на абзацы (блоки типа text).
- Верни ТОЛЬКО валидный JSON-объект без форматирования markdown (без \`\`\`json ... \`\`\`).`

export default function AiImportPanel() {
  const store = useEditorStore()
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gemini-2.5-flash')
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusMsg, setStatusMsg] = useState('')

  // Load API key from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('gemini_api_key')
    if (saved) setApiKey(saved)
  }, [])

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setError('Пожалуйста, введите ваш API-ключ Gemini')
      return
    }
    if (!inputText.trim()) {
      setError('Пожалуйста, вставьте текст для разбора')
      return
    }

    setLoading(true)
    setError('')
    setStatusMsg('Подключение к Gemini API...')
    localStorage.setItem('gemini_api_key', apiKey.trim())

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`
      
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${SYSTEM_PROMPT}\n\nПожалуйста, разбери следующий текст:\n\n${inputText}` }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      }

      setStatusMsg('Анализирую текст и формирую структуру...')
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}))
        throw new Error(errorJson?.error?.message || `Ошибка API: ${response.status} ${response.statusText}`)
      }

      setStatusMsg('Обрабатываю структуру документа...')
      const resJson = await response.json()
      const textResult = resJson?.candidates?.[0]?.content?.parts?.[0]?.text

      if (!textResult) {
        throw new Error('Модель вернула пустой ответ. Попробуйте еще раз.')
      }

      let parsedData
      try {
        parsedData = JSON.parse(textResult)
      } catch (jsonErr) {
        console.error('Raw result:', textResult)
        throw new Error('Не удалось разобрать JSON ответа от модели. Убедитесь, что текст не слишком запутанный.')
      }

      // Load parsed data into store
      store.loadFromJSON(parsedData)
      store.setSelectedPath('metadata')
      
      alert('Успешно! Документ сгенерирован и загружен в редактор.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setStatusMsg('')
    }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: 'var(--text-1)' }}>
        🤖 Автогенерация структуры через ИИ
      </h2>
      <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 24 }}>
        Вставьте любой неотформатированный текст (черновики глав, введения, списки, формулы), и искусственный интеллект автоматически структурирует его по разделам, таблицам, формулам и спискам.
      </p>

      {/* API Key Form */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
            API-ключ Gemini (API Key)
          </label>
          <input
            type="password"
            className="inp"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            style={{ fontSize: 13, fontFamily: 'monospace' }}
          />
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-3)' }}>
            Ключ хранится локально в вашем браузере. Вы можете получить его бесплатно в{' '}
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-1)', textDecoration: 'underline' }}
            >
              Google AI Studio
            </a>.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
              Модель ИИ
            </label>
            <select
              className="inp"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{ fontSize: 13, padding: '8px 12px' }}
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Быстрая, бесплатная)</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Более умная, для сложных формул/таблиц)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Input area */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>
          Исходный текст диплома / раздела
        </label>
        <textarea
          className="inp"
          rows={12}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Вставьте сюда черновик или весь текст работы... Например:&#10;&#10;ВВЕДЕНИЕ&#10;Актуальность данной темы заключается в том...&#10;&#10;1 Глава первая&#10;Текст главы.&#10;&#10;1.1 Подраздел&#10;Формула площади круга выражается как S = pi * r^2, где S - площадь круга, r - радиус, pi - константа 3.14."
          style={{
            fontFamily: 'inherit',
            fontSize: 13,
            lineHeight: 1.5,
            padding: 14,
            resize: 'vertical',
            minHeight: 200,
          }}
        />
      </div>

      {/* Error state */}
      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(235, 87, 87, 0.1)',
          border: '1px solid var(--error, #eb5757)',
          borderRadius: 8,
          color: 'var(--error, #eb5757)',
          fontSize: 13,
          marginBottom: 20,
          whiteSpace: 'pre-wrap',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Action button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="btn-accent"
        style={{
          width: '100%',
          padding: '12px 20px',
          fontSize: 14,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          cursor: 'pointer',
        }}
      >
        {loading ? (
          <>
            <div className="spinner" style={{
              width: 16, height: 16,
              border: '2px solid rgba(255,255,255,0.3)',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span>{statusMsg}</span>
          </>
        ) : (
          <>
            <span>🚀 Сгенерировать структуру документа</span>
          </>
        )}
      </button>

      {/* Add CSS keyframes for spinner */}
      <style jsx>{`
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
