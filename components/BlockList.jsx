'use client'

import { useState, useRef, useEffect } from 'react'
import { useEditorStore } from '../store/editorStore'
import TextBlock from './blocks/TextBlock'
import ListBlock from './blocks/ListBlock'
import TableBlock from './blocks/TableBlock'
import FormulaBlock from './blocks/FormulaBlock'
import ImageBlock from './blocks/ImageBlock'

const BLOCK_TYPES = [
  { type: 'text',           icon: '📝', label: 'Текст' },
  { type: 'bullet_list',   icon: '•',  label: 'Маркированный список' },
  { type: 'numbered_list', icon: '1.', label: 'Нумерованный список' },
  { type: 'table',         icon: '📊', label: 'Таблица' },
  { type: 'formula',       icon: '∑',  label: 'Формула' },
  { type: 'image',         icon: '🖼️', label: 'Изображение' },
]

function defaultBlock(type) {
  switch (type) {
    case 'text':           return { type, text: '' }
    case 'bullet_list':   return { type, items: [''] }
    case 'numbered_list': return { type, items: [''] }
    case 'table':         return { type, title: '', headers: ['Колонка 1', 'Колонка 2'], rows: [['', '']] }
    case 'formula':       return { type, text: '', variables: [] }
    case 'image':         return { type, src: '', caption: '' }
    default:              return { type, text: '' }
  }
}

const BlockComponent = { text: TextBlock, bullet_list: ListBlock, numbered_list: ListBlock, table: TableBlock, formula: FormulaBlock, image: ImageBlock }

function BlockWrapper({ block, index, total, onUpdate, onDelete, onMove }) {
  const info = BLOCK_TYPES.find(b => b.type === block.type)
  const Comp = BlockComponent[block.type] || TextBlock
  const [aiOpen, setAiOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const aiRef = useRef()

  useEffect(() => {
    if (!aiOpen) return
    const handler = (e) => { if (!aiRef.current?.contains(e.target)) setAiOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [aiOpen])

  const handleRephrase = async (actionType) => {
    let key = localStorage.getItem('gemini_api_key')
    if (!key) {
      const inputKey = window.prompt('Пожалуйста, введите ваш API-ключ Gemini для работы ИИ-улучшайзера:')
      if (!inputKey) return
      localStorage.setItem('gemini_api_key', inputKey.trim())
      key = inputKey.trim()
    }

    if (!block.text?.trim()) {
      alert('Сначала введите текст в блок!')
      return
    }

    setAiLoading(true)
    setAiOpen(false)

    try {
      let actionPrompt = ''
      switch (actionType) {
        case 'academic':
          actionPrompt = 'Перепиши следующий текст в строгом академическом и научном стиле для дипломной работы. Сделай его структурированным, грамотным и лаконичным. Не добавляй комментариев, отсебятины или кавычек. Верни ТОЛЬКО измененный текст.'
          break
        case 'expand':
          actionPrompt = 'Сделай следующий текст более подробным, развернутым и академически наполненным для дипломной работы. Добавь научной терминологии, избегай воды. Не добавляй комментариев и кавычек. Верни ТОЛЬКО измененный текст.'
          break
        case 'shorten':
          actionPrompt = 'Сократи следующий текст, оставив только самую важную суть в научном/академическом стиле. Не добавляй комментариев и кавычек. Верни ТОЛЬКО измененный текст.'
          break
        case 'fix':
          actionPrompt = 'Исправь орфографические, пунктуационные и грамматические ошибки в следующем тексте. Научный стиль оставь прежним. Не добавляй комментариев и кавычек. Верни ТОЛЬКО измененный текст.'
          break
        default:
          return
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`
      const payload = {
        contents: [{
          parts: [{
            text: `${actionPrompt}\n\nТекст для обработки:\n${block.text}`
          }]
        }]
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson?.error?.message || `Ошибка API: ${response.status}`)
      }

      const resJson = await response.json()
      const resultText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      if (resultText) {
        onUpdate({ ...block, text: resultText })
      } else {
        throw new Error('Пустой ответ от ИИ')
      }
    } catch (err) {
      alert(`Ошибка ИИ: ${err.message}`)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="card fade-in" style={{ marginBottom: 12 }}>
      {/* Block toolbar */}
      <div className="block-header" style={{ position: 'relative' }}>
        <span style={{ fontSize: 13, color: 'var(--text-3)', userSelect: 'none' }}>
          {info?.icon} {info?.label}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2 }} ref={aiRef}>
          {block.type === 'text' && (
            <div style={{ position: 'relative' }}>
              <button
                className="btn-icon"
                onClick={() => setAiOpen(v => !v)}
                disabled={aiLoading}
                title="ИИ-улучшайзер текста"
                style={{ color: 'var(--accent-2)', fontWeight: 'bold' }}
              >
                {aiLoading ? '⏳' : '🔮'}
              </button>
              {aiOpen && (
                <div className="popup-menu" style={{ right: 0, top: 26, width: 220, zIndex: 10 }}>
                  <div style={{ padding: '6px 12px', fontSize: 10, color: 'var(--text-3)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>
                    🤖 УЛУЧШИТЬ С ИИ
                  </div>
                  <button className="popup-item" onClick={() => handleRephrase('academic')}>🎓 Академический стиль</button>
                  <button className="popup-item" onClick={() => handleRephrase('expand')}>📝 Сделать подробнее</button>
                  <button className="popup-item" onClick={() => handleRephrase('shorten')}>✂️ Сделать короче</button>
                  <button className="popup-item" onClick={() => handleRephrase('fix')}>✍️ Исправить ошибки</button>
                </div>
              )}
            </div>
          )}
          <button className="btn-icon" onClick={() => onMove(index, index - 1)} disabled={index === 0} title="Вверх" style={{ minWidth: 32, minHeight: 32 }}>↑</button>
          <button className="btn-icon" onClick={() => onMove(index, index + 1)} disabled={index === total - 1} title="Вниз" style={{ minWidth: 32, minHeight: 32 }}>↓</button>
          <button className="btn-danger" onClick={() => onDelete(index)} title="Удалить блок" style={{ minWidth: 32, minHeight: 32 }}>×</button>
        </div>
      </div>
      {/* Block content */}
      <div style={{ padding: '14px 16px' }}>
        <Comp block={block} onChange={onUpdate} />
      </div>
    </div>
  )
}

function AddBlockMenu({ onAdd }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={ref}>
      <button
        className="btn btn-primary"
        onClick={() => setOpen(v => !v)}
        style={{ marginTop: 4 }}
      >
        + Добавить блок
      </button>
      {open && (
        <div className="popup-menu">
          {BLOCK_TYPES.map(bt => (
            <button
              key={bt.type}
              className="popup-item"
              onClick={() => { onAdd(bt.type); setOpen(false) }}
            >
              <span style={{ marginRight: 8 }}>{bt.icon}</span>
              {bt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function BlockList({ path, title, onTitleChange, level = 1 }) {
  const { getContent, setContent } = useEditorStore()
  const content = getContent(path)

  const update = (i, block) => {
    const c = [...content]; c[i] = block; setContent(path, c)
  }
  const remove = (i) => setContent(path, content.filter((_, idx) => idx !== i))
  const move = (from, to) => {
    if (to < 0 || to >= content.length) return
    const c = [...content]
    const [item] = c.splice(from, 1)
    c.splice(to, 0, item)
    setContent(path, c, { saveNow: true })
  }
  const add = (type) => setContent(path, [...content, defaultBlock(type)])

  return (
    <div className="block-list-container" style={{ maxWidth: 820 }}>
      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        {onTitleChange ? (
          <input
            className="inp"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--border)',
              borderRadius: 0,
              padding: '4px 0',
              fontSize: level === 1 ? 22 : 18,
              fontWeight: 700,
              color: 'var(--text-1)',
            }}
          />
        ) : (
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>{title}</h2>
        )}
      </div>

      {/* Blocks */}
      {content.length === 0 && (
        <div style={{
          border: '2px dashed var(--border)',
          borderRadius: 12,
          padding: '32px',
          textAlign: 'center',
          color: 'var(--text-3)',
          marginBottom: 16,
          fontSize: 14,
        }}>
          Нет блоков. Нажмите «Добавить блок» ниже.
        </div>
      )}

      {content.map((block, i) => (
        <BlockWrapper
          key={i}
          block={block}
          index={i}
          total={content.length}
          onUpdate={(b) => update(i, b)}
          onDelete={remove}
          onMove={move}
        />
      ))}

      <AddBlockMenu onAdd={add} />
    </div>
  )
}
