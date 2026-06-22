'use client'

export default function FormulaBlock({ block, onChange }) {
  const { text = '', variables = [] } = block

  const addVar = () => onChange({ ...block, variables: [...variables, { symbol: '', description: '' }] })

  const updateVar = (i, key, value) =>
    onChange({ ...block, variables: variables.map((v, idx) => idx === i ? { ...v, [key]: value } : v) })

  const removeVar = (i) =>
    onChange({ ...block, variables: variables.filter((_, idx) => idx !== i) })

  return (
    <div>
      {/* Formula input */}
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.05em' }}>
          ФОРМУЛА
        </label>
        <div style={{ position: 'relative' }}>
          <input
            className="inp"
            value={text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            placeholder="Например: E = mc^2"
            style={{ fontFamily: 'monospace', fontSize: 16, letterSpacing: '0.05em', paddingRight: 100 }}
          />
          {text && (
            <div style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              fontSize: 13, color: 'var(--accent-2)', fontStyle: 'italic',
              fontFamily: 'serif', pointerEvents: 'none',
            }}>
              {text}
            </div>
          )}
        </div>
      </div>

      {/* Variables */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.05em' }}>
            ОБОЗНАЧЕНИЯ
          </label>
          <button
            onClick={addVar}
            style={{
              background: 'none', border: 'none',
              color: 'var(--accent-1)', cursor: 'pointer',
              fontSize: 12, fontFamily: 'inherit',
            }}
          >
            + добавить
          </button>
        </div>

        {variables.length === 0 && (
          <div style={{ color: 'var(--text-3)', fontSize: 12, fontStyle: 'italic' }}>
            Нет обозначений. Нажмите «+ добавить» чтобы добавить описание переменных.
          </div>
        )}

        {variables.map((v, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <input
              className="inp"
              value={v.symbol}
              onChange={(e) => updateVar(i, 'symbol', e.target.value)}
              placeholder="Символ"
              style={{ width: 80, fontFamily: 'monospace', fontSize: 14, flexShrink: 0, textAlign: 'center' }}
            />
            <span style={{ color: 'var(--text-3)', flexShrink: 0 }}>—</span>
            <input
              className="inp"
              value={v.description}
              onChange={(e) => updateVar(i, 'description', e.target.value)}
              placeholder="Описание и единица измерения"
              style={{ flex: 1, fontSize: 13 }}
            />
            <button className="btn-danger" onClick={() => removeVar(i)} title="Удалить">×</button>
          </div>
        ))}
      </div>
    </div>
  )
}
