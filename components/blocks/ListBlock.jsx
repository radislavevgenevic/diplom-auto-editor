'use client'

import { useRef } from 'react'

export default function ListBlock({ block, onChange }) {
  const isBullet = block.type === 'bullet_list'
  const items = block.items || ['']
  const inputsRef = useRef([])

  const update = (i, value) => {
    onChange({ ...block, items: items.map((v, idx) => idx === i ? value : v) })
  }

  const addAfter = (i) => {
    const newItems = [...items.slice(0, i + 1), '', ...items.slice(i + 1)]
    onChange({ ...block, items: newItems })
    // Focus next input after render
    setTimeout(() => inputsRef.current[i + 1]?.focus(), 0)
  }

  const removeAt = (i) => {
    if (items.length === 1) {
      onChange({ ...block, items: [''] })
    } else {
      const newItems = items.filter((_, idx) => idx !== i)
      onChange({ ...block, items: newItems })
      setTimeout(() => inputsRef.current[Math.max(0, i - 1)]?.focus(), 0)
    }
  }

  const handleKeyDown = (e, i) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addAfter(i)
    }
    if (e.key === 'Backspace' && items[i] === '' && items.length > 1) {
      e.preventDefault()
      removeAt(i)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Bullet/number */}
          <span style={{
            minWidth: 28, textAlign: 'center',
            color: 'var(--accent-1)',
            fontWeight: 700, fontSize: isBullet ? 18 : 13,
            userSelect: 'none', flexShrink: 0,
          }}>
            {isBullet ? '•' : `${i + 1}.`}
          </span>

          {/* Input */}
          <input
            ref={el => inputsRef.current[i] = el}
            className="inp"
            value={item}
            onChange={(e) => update(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            placeholder={`Пункт ${i + 1}`}
            style={{ flex: 1, fontSize: 13 }}
          />

          {/* Delete */}
          <button className="btn-danger" style={{ fontSize: 14 }} onClick={() => removeAt(i)} title="Удалить пункт">×</button>
        </div>
      ))}

      {/* Add item */}
      <button
        onClick={() => addAfter(items.length - 1)}
        style={{
          background: 'none', border: 'none',
          color: 'var(--accent-1)',
          cursor: 'pointer', fontSize: 12,
          padding: '3px 0 3px 36px',
          textAlign: 'left',
          fontFamily: 'inherit',
        }}
      >
        + добавить пункт
      </button>
    </div>
  )
}
