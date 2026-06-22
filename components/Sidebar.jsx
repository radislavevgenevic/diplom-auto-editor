'use client'

import { useState } from 'react'
import { useEditorStore } from '../store/editorStore'

function SubsectionItem({ sub, si, subi, onSelect }) {
  const { selectedPath, setSelectedPath, deleteSubsection, updateSubsectionTitle } = useEditorStore()
  const isActive = typeof selectedPath === 'object' && selectedPath?.si === si && selectedPath?.subi === subi
  const [editing, setEditing] = useState(false)

  return (
    <div
      className={`nav-item ${isActive ? 'active' : ''}`}
      style={{ paddingLeft: 28, fontSize: 12 }}
      onClick={() => { setSelectedPath({ si, subi }); onSelect?.() }}
    >
      <span style={{ color: 'var(--accent-2)', fontSize: 8 }}>●</span>
      {editing ? (
        <input
          className="inp"
          value={sub.title.text}
          onChange={(e) => { e.stopPropagation(); updateSubsectionTitle(si, subi, e.target.value) }}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
          autoFocus
          onClick={(e) => e.stopPropagation()}
          style={{ flex: 1, padding: '1px 6px', fontSize: 11, background: 'var(--bg-3)' }}
        />
      ) : (
        <span
          style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          onDoubleClick={(e) => { e.stopPropagation(); setEditing(true) }}
          title="Двойной клик для редактирования"
        >
          {sub.title.text}
        </span>
      )}
      <button
        className="btn-danger"
        style={{ fontSize: 13, padding: '1px 4px' }}
        onClick={(e) => { e.stopPropagation(); deleteSubsection(si, subi) }}
        title="Удалить подраздел"
      >×</button>
    </div>
  )
}

function SectionItem({ section, si, onSelect }) {
  const { selectedPath, setSelectedPath, deleteSection, addSubsection, updateSectionTitle } = useEditorStore()
  const isActive = typeof selectedPath === 'object' && selectedPath?.si === si && selectedPath?.subi === undefined
  const [expanded, setExpanded] = useState(true)
  const [editing, setEditing] = useState(false)

  return (
    <div>
      {/* Section row */}
      <div
        className={`nav-item ${isActive ? 'active' : ''}`}
        style={{ paddingLeft: 4 }}
        onClick={() => { setSelectedPath({ si }); onSelect?.() }}
      >
        {/* Expand toggle */}
        <button
          className="btn-icon"
          style={{ fontSize: 10, padding: '2px 4px', flexShrink: 0 }}
          onClick={(e) => { e.stopPropagation(); setExpanded(v => !v) }}
        >
          {expanded ? '▼' : '▶'}
        </button>

        {/* Title (editable on double-click) */}
        {editing ? (
          <input
            className="inp"
            value={section.title.text}
            onChange={(e) => { e.stopPropagation(); updateSectionTitle(si, e.target.value) }}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            style={{ flex: 1, padding: '2px 6px', fontSize: 12, background: 'var(--bg-3)' }}
          />
        ) : (
          <span
            style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}
            onDoubleClick={(e) => { e.stopPropagation(); setEditing(true) }}
            title="Двойной клик для редактирования"
          >
            {section.title.text}
          </span>
        )}

        <button
          className="btn-danger"
          style={{ fontSize: 13, padding: '1px 4px' }}
          onClick={(e) => { e.stopPropagation(); deleteSection(si) }}
          title="Удалить раздел"
        >×</button>
      </div>

      {/* Subsections */}
      {expanded && (
        <div>
          {(section.subsections || []).map((sub, subi) => (
            <SubsectionItem key={subi} sub={sub} si={si} subi={subi} onSelect={onSelect} />
          ))}

          <button
            onClick={() => addSubsection(si)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--accent-1)', fontSize: 11, padding: '4px 4px 4px 44px',
              display: 'block', width: '100%', textAlign: 'left',
              fontFamily: 'inherit',
            }}
          >
            + подраздел
          </button>
        </div>
      )}
    </div>
  )
}

export default function Sidebar({ onSelect }) {
  const { sections, selectedPath, setSelectedPath, addSection } = useEditorStore()

  return (
    <aside style={{
      width: 272,
      background: 'var(--bg-1)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      <div style={{ flex: 1, overflow: 'auto', padding: '10px 8px' }}>

        {/* Document group */}
        <div className="section-label" style={{ marginBottom: 4 }}>Документ</div>
        {[
          { id: 'metadata', label: '⚙️', name: 'Метаданные' },
          { id: 'ai_import', label: '🤖', name: 'Импорт ИИ (Бета)' },
          { id: 'introduction', label: '📖', name: 'Введение' },
        ].map(item => (
          <div
            key={item.id}
            className={`nav-item ${selectedPath === item.id ? 'active' : ''}`}
            onClick={() => { setSelectedPath(item.id); onSelect?.() }}
          >
            <span style={{ fontSize: 14 }}>{item.label}</span>
            {item.name}
          </div>
        ))}

        {/* Sections */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '14px 4px 4px' }}>
          <span className="section-label">Разделы</span>
          <button
            onClick={addSection}
            style={{
              background: 'linear-gradient(135deg, var(--accent-1), var(--accent-2))',
              border: 'none', borderRadius: 6, color: 'white',
              cursor: 'pointer', width: 22, height: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700,
            }}
            title="Добавить раздел"
          >+</button>
        </div>

        {sections.length === 0 && (
          <div style={{ color: 'var(--text-3)', fontSize: 12, padding: '6px 8px' }}>
            Нажмите + чтобы добавить раздел
          </div>
        )}

        {sections.map((section, si) => (
          <SectionItem key={si} section={section} si={si} onSelect={onSelect} />
        ))}

        {/* Tail group */}
        <div className="section-label" style={{ margin: '14px 4px 4px' }}>Завершение</div>
        {[
          { id: 'conclusion', label: '🏁', name: 'Заключение' },
          { id: 'reference', label: '📚', name: 'Список литературы' },
        ].map(item => (
          <div
            key={item.id}
            className={`nav-item ${selectedPath === item.id ? 'active' : ''}`}
            onClick={() => { setSelectedPath(item.id); onSelect?.() }}
          >
            <span style={{ fontSize: 14 }}>{item.label}</span>
            {item.name}
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '8px 12px',
        fontSize: 10,
        color: 'var(--text-3)',
        lineHeight: 1.5,
      }}>
        Двойной клик — переименовать раздел
      </div>
    </aside>
  )
}
