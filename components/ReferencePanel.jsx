'use client'

import { useEditorStore } from '../store/editorStore'

export default function ReferencePanel() {
  const { reference, setContent } = useEditorStore()
  const refs = reference || []

  const add = () => setContent('reference', [...refs, { text: '', url: '' }])

  const update = (i, key, value) =>
    setContent('reference', refs.map((r, idx) => idx === i ? { ...r, [key]: value } : r))

  const remove = (i) =>
    setContent('reference', refs.filter((_, idx) => idx !== i))

  const move = (from, to) => {
    if (to < 0 || to >= refs.length) return
    const arr = [...refs]
    const [item] = arr.splice(from, 1)
    arr.splice(to, 0, item)
    setContent('reference', arr)
  }

  return (
    <div style={{ maxWidth: 820 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>📚 Список литературы</h2>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{refs.length} источник{refs.length === 1 ? '' : refs.length < 5 ? 'а' : 'ов'}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {refs.map((ref, i) => (
          <div key={i} className="card fade-in ref-card-row" style={{ padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            {/* Number */}
            <span style={{
              minWidth: 28, height: 28,
              background: 'linear-gradient(135deg, var(--accent-1), var(--accent-2))',
              borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
            }}>
              {i + 1}
            </span>

            {/* Fields */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                className="inp"
                value={ref.text || ''}
                onChange={(e) => update(i, 'text', e.target.value)}
                placeholder="Название источника / библиографическое описание"
                style={{ fontSize: 13 }}
              />
              <input
                className="inp"
                value={ref.url || ''}
                onChange={(e) => update(i, 'url', e.target.value)}
                placeholder="URL (необязательно)"
                style={{ fontSize: 12, color: '#818cf8' }}
              />
            </div>

            {/* Controls */}
            <div className="ref-controls" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <button className="btn-icon" onClick={() => move(i, i - 1)} disabled={i === 0} title="Вверх" style={{ minWidth: 32, minHeight: 32 }}>↑</button>
              <button className="btn-icon" onClick={() => move(i, i + 1)} disabled={i === refs.length - 1} title="Вниз" style={{ minWidth: 32, minHeight: 32 }}>↓</button>
              <button className="btn-danger" onClick={() => remove(i)} title="Удалить" style={{ minWidth: 32, minHeight: 32 }}>×</button>
            </div>
          </div>
        ))}
      </div>

      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={add}>
        + Добавить источник
      </button>
    </div>
  )
}
