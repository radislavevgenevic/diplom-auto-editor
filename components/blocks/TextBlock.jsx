'use client'

export default function TextBlock({ block, onChange }) {
  const wordCount = block.text?.trim() ? block.text.trim().split(/\s+/).length : 0

  return (
    <div>
      <textarea
        className="inp"
        style={{
          minHeight: 100,
          lineHeight: 1.75,
          fontSize: 14,
          border: 'none',
          padding: 0,
          background: 'transparent',
          width: '100%',
        }}
        value={block.text || ''}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        placeholder="Введите текст абзаца..."
      />
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6, textAlign: 'right' }}>
        {wordCount} слов
      </div>
    </div>
  )
}
