'use client'

import { useEditorStore } from '../store/editorStore'

const FIELDS = [
  { key: 'special',      label: 'Специальность',          placeholder: 'Программное обеспечение' },
  { key: 'theme',        label: 'Тема работы',             placeholder: 'Разработка веб-приложения...' },
  { key: 'group',        label: 'Группа',                  placeholder: 'ПО-21' },
  { key: 'name',         label: 'ФИО студента',            placeholder: 'Иванов И.И.' },
  { key: 'name_teacher', label: 'ФИО руководителя',        placeholder: 'Петров П.П.' },
  { key: 'name_nor',     label: 'ФИО нормоконтролёра',     placeholder: 'Сидоров С.С.' },
  { key: 'year',         label: 'Год',                     placeholder: '2026' },
]

export default function MetadataPanel() {
  const store = useEditorStore()
  const activeTemplate = store.template || 'D'

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: 'var(--text-1)' }}>
        ⚙️ Метаданные документа
      </h2>
      <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 24 }}>
        Эти данные используются в шапке, титульной странице и подписях документа.
      </p>

      {/* Шаблон документа */}
      <div style={{ marginBottom: 28 }}>
        <label style={{
          display: 'block', fontSize: 12, fontWeight: 600,
          color: 'var(--text-2)', marginBottom: 10, letterSpacing: '0.02em',
        }}>
          Выбор шаблона (файл .docx)
        </label>
        {/* Responsive grid: 3 cols on desktop, 1 col on mobile */}
        <div className="template-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { id: 'D', name: 'Диплом', desc: 'С нормоконтролёром' },
            { id: 'K', name: 'Курсовая', desc: 'Без нормоконтролёра' },
            { id: 'O', name: 'Отчёт', desc: 'Без нормоконтролёра' },
          ].map((tpl) => {
            const isSelected = activeTemplate === tpl.id
            return (
              <div
                key={tpl.id}
                onClick={() => store.updateField('template', tpl.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: isSelected ? '2px solid var(--accent-1)' : '1px solid var(--border)',
                  background: isSelected ? 'rgba(0, 102, 204, 0.08)' : 'var(--bg-2)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex', flexDirection: 'column', gap: 3,
                }}
              >
                {/* Selection dot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: isSelected ? 'var(--accent-1)' : 'var(--border)',
                    transition: 'background 0.2s',
                    flexShrink: 0,
                  }} />
                  <div style={{ fontWeight: 600, fontSize: 13, color: isSelected ? 'var(--accent-1)' : 'var(--text-1)' }}>
                    {tpl.name}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', paddingLeft: 14 }}>
                  {tpl.desc}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        {FIELDS.map(({ key, label, placeholder }) => {
          const isNormControl = key === 'name_nor'
          const isNotUsed = isNormControl && (activeTemplate === 'K' || activeTemplate === 'O')

          return (
            <div key={key} style={{ opacity: isNotUsed ? 0.5 : 1, transition: 'opacity 0.2s' }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 600,
                color: 'var(--text-2)', marginBottom: 6, letterSpacing: '0.02em',
              }}>
                {label}{' '}
                {isNotUsed && <span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: 11 }}>— не используется</span>}
              </label>
              <input
                className="inp"
                value={store[key] || ''}
                onChange={(e) => store.updateField(key, e.target.value)}
                placeholder={placeholder}
                disabled={isNotUsed}
                /* iOS prevents zooming when font-size >= 16px */
                style={{ fontSize: 'max(13px, 16px)' }}
              />
            </div>
          )
        })}
      </div>

      {/* Preview badge */}
      <div className="card" style={{ marginTop: 28, padding: '14px 18px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Предпросмотр данных
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 2 }}>
          <span style={{ color: 'var(--text-3)' }}>Шаблон:</span> template{activeTemplate}.docx<br/>
          <span style={{ color: 'var(--text-3)' }}>Специальность:</span> {store.special || '—'}<br/>
          <span style={{ color: 'var(--text-3)' }}>Тема:</span> {store.theme || '—'}<br/>
          <span style={{ color: 'var(--text-3)' }}>Студент:</span> {store.name || '—'}, гр. {store.group || '—'}<br/>
          <span style={{ color: 'var(--text-3)' }}>Руководитель:</span> {store.name_teacher || '—'}<br/>
          {!(activeTemplate === 'K' || activeTemplate === 'O') && (
            <><span style={{ color: 'var(--text-3)' }}>Нормоконтроль:</span> {store.name_nor || '—'}<br/></>
          )}
          <span style={{ color: 'var(--text-3)' }}>Год:</span> {store.year || '—'}
        </div>
      </div>
    </div>
  )
}
