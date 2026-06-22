'use client'

import { useState, useRef } from 'react'

export default function ImageBlock({ block, onChange }) {
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  const processFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const ext = file.name.split('.').pop().toLowerCase()
      const filename = `fig_${Date.now()}.${ext}`
      onChange({ ...block, src: `./images/${filename}`, _dataURL: e.target.result })
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    processFile(e.dataTransfer.files[0])
  }

  const handlePaste = (e) => {
    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'))
    if (item) processFile(item.getAsFile())
  }

  const clear = () => onChange({ ...block, src: '', _dataURL: undefined })

  const hasImage = block._dataURL || block.src

  return (
    <div onPaste={handlePaste}>
      {hasImage ? (
        /* ── Image preview ── */
        <div>
          <div style={{ position: 'relative', marginBottom: 12, display: 'inline-block', maxWidth: '100%' }}>
            {block._dataURL ? (
              <img
                src={block._dataURL}
                alt={block.caption || 'Изображение'}
                style={{
                  maxWidth: '100%', maxHeight: 300,
                  objectFit: 'contain', borderRadius: 10,
                  background: 'var(--bg-3)',
                  display: 'block',
                }}
              />
            ) : (
              <div style={{
                padding: '14px 18px',
                background: 'var(--bg-3)',
                borderRadius: 10,
                color: 'var(--text-2)',
                fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                🖼️ <span style={{ fontFamily: 'monospace' }}>{block.src}</span>
                <span style={{ color: 'var(--text-3)', fontSize: 11 }}>(файл будет прочитан генератором)</span>
              </div>
            )}

            <button
              onClick={clear}
              style={{
                position: 'absolute', top: 8, right: 8,
                background: 'rgba(0,0,0,0.7)', border: 'none',
                borderRadius: 6, color: 'white',
                cursor: 'pointer', padding: '4px 10px', fontSize: 12,
              }}
            >
              Заменить
            </button>
          </div>

          <input
            className="inp"
            value={block.caption || ''}
            onChange={(e) => onChange({ ...block, caption: e.target.value })}
            placeholder="Подпись: Рисунок 1 — Схема архитектуры приложения"
            style={{ fontSize: 13 }}
          />
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-3)' }}>
            Путь: <code style={{ color: 'var(--accent-1)' }}>{block.src || '—'}</code>
          </div>
        </div>
      ) : (
        /* ── Drop zone ── */
        <div>
          <div
            className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
            style={{ padding: '36px 24px', cursor: 'pointer' }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
          >
            <div style={{ fontSize: 40, marginBottom: 10 }}>🖼️</div>
            <div style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 6 }}>
              Перетащите изображение сюда
            </div>
            <div style={{ color: 'var(--text-3)', fontSize: 12, marginBottom: 4 }}>
              или <span style={{ color: 'var(--accent-1)' }}>нажмите для выбора</span>
              &nbsp;/ вставьте из буфера (Ctrl+V)
            </div>
            <div style={{ color: 'var(--text-3)', fontSize: 11 }}>PNG, JPG, JPEG, SVG, GIF</div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => processFile(e.target.files[0])}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>
              Или введите путь вручную (если файл уже в папке images/)
            </label>
            <input
              className="inp"
              value={block.src || ''}
              onChange={(e) => onChange({ ...block, src: e.target.value })}
              placeholder="./images/filename.png"
              style={{ fontSize: 13, fontFamily: 'monospace' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
