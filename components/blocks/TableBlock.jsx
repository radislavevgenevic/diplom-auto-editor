'use client'

export default function TableBlock({ block, onChange }) {
  const { title = '', headers = ['Колонка 1', 'Колонка 2'], rows = [['']] } = block

  const setTitle = (v) => onChange({ ...block, title: v })

  const setHeader = (ci, v) =>
    onChange({ ...block, headers: headers.map((h, i) => i === ci ? v : h) })

  const setCell = (ri, ci, v) =>
    onChange({ ...block, rows: rows.map((row, r) => r === ri ? row.map((c, i) => i === ci ? v : c) : row) })

  const addCol = () => onChange({
    ...block,
    headers: [...headers, `Колонка ${headers.length + 1}`],
    rows: rows.map(row => [...row, '']),
  })

  const delCol = (ci) => {
    if (headers.length <= 1) return
    onChange({
      ...block,
      headers: headers.filter((_, i) => i !== ci),
      rows: rows.map(row => row.filter((_, i) => i !== ci)),
    })
  }

  const addRow = () => onChange({
    ...block,
    rows: [...rows, headers.map(() => '')],
  })

  const delRow = (ri) => {
    if (rows.length <= 1) return
    onChange({ ...block, rows: rows.filter((_, i) => i !== ri) })
  }

  return (
    <div>
      {/* Table title */}
      <input
        className="inp"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Название таблицы (например: Таблица 1 — Сравнение методов)"
        style={{ marginBottom: 12, fontSize: 13, fontWeight: 500 }}
      />

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              {headers.map((h, ci) => (
                <th key={ci} style={{
                  border: '1px solid var(--border)',
                  background: 'var(--bg-3)',
                  padding: 0,
                  position: 'relative',
                  minWidth: 100,
                }}>
                  <input
                    value={h}
                    onChange={(e) => setHeader(ci, e.target.value)}
                    className="tbl-cell-input"
                    style={{ fontWeight: 600, textAlign: 'center', background: 'transparent' }}
                    placeholder={`Столбец ${ci + 1}`}
                  />
                  {headers.length > 1 && (
                    <button
                      onClick={() => delCol(ci)}
                      style={{
                        position: 'absolute', top: 2, right: 2,
                        background: 'none', border: 'none',
                        color: 'var(--text-3)', cursor: 'pointer',
                        fontSize: 12, lineHeight: 1, padding: 2, borderRadius: 3,
                      }}
                      onMouseOver={(e) => e.target.style.color = 'var(--red)'}
                      onMouseOut={(e) => e.target.style.color = 'var(--text-3)'}
                      title="Удалить столбец"
                    >×</button>
                  )}
                </th>
              ))}
              <th style={{ border: 'none', width: 32, background: 'transparent' }}>
                <button
                  onClick={addCol}
                  style={{
                    background: 'none', border: 'none',
                    color: 'var(--accent-1)', cursor: 'pointer',
                    fontSize: 20, lineHeight: 1,
                  }}
                  title="Добавить столбец"
                >+</button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ border: '1px solid var(--border)', padding: 0 }}>
                    <input
                      value={cell}
                      onChange={(e) => setCell(ri, ci, e.target.value)}
                      className="tbl-cell-input"
                      placeholder="—"
                    />
                  </td>
                ))}
                <td style={{ border: 'none', textAlign: 'center', width: 32 }}>
                  {rows.length > 1 && (
                    <button className="btn-danger" style={{ fontSize: 14 }} onClick={() => delRow(ri)} title="Удалить строку">×</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={addRow}
        style={{
          marginTop: 8, background: 'none', border: 'none',
          color: 'var(--accent-1)', cursor: 'pointer',
          fontSize: 12, fontFamily: 'inherit',
        }}
      >
        + добавить строку
      </button>
    </div>
  )
}
