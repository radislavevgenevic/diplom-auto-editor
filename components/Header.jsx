'use client'

import { useState, useEffect } from 'react'
import { useEditorStore } from '../store/editorStore'

const spinnerStyle = {
  width: 14, height: 14,
  border: '2px solid rgba(255,255,255,0.3)',
  borderTop: '2px solid white',
  borderRadius: '50%',
  animation: 'spin 0.7s linear infinite',
  flexShrink: 0,
}

export default function Header({ onOpenSidebar }) {
  const { 
    loadFromJSON, exportJSON, collectImages, undo, redo, past, future, searchOpen, setSearchOpen,
    user, setUser, setAdminOpen, setPayModalOpen 
  } = useEditorStore()
  const [status, setStatus]           = useState(null)
  const [generating, setGenerating]   = useState(false)
  const [undoPulse, setUndoPulse]     = useState(false)
  const [redoPulse, setRedoPulse]     = useState(false)
  const [moreOpen, setMoreOpen]       = useState(false)
  const [isMobile, setIsMobile]       = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const handler = (e) => setIsMobile(e.matches)
    setIsMobile(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const flash = (text, ok = true) => {
    setStatus({ text, ok })
    setTimeout(() => setStatus(null), 4000)
  }

  // ── Global keyboard shortcuts ──
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase()
      const isEditing = tag === 'input' || tag === 'textarea' || document.activeElement?.contentEditable === 'true'

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z' && !isEditing) {
        e.preventDefault()
        undo()
        setUndoPulse(true)
        setTimeout(() => setUndoPulse(false), 300)
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z')) && !isEditing) {
        e.preventDefault()
        redo()
        setRedoPulse(true)
        setTimeout(() => setRedoPulse(false), 300)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault()
        setSearchOpen(!searchOpen)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !isEditing) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [undo, redo, searchOpen, setSearchOpen])

  const handleLogout = async () => {
    setMoreOpen(false)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      flash('Вы вышли из системы')
    } catch {
      flash('Ошибка выхода из системы', false)
    }
  }

  const handleLoadProject = async () => {
    setMoreOpen(false)
    try {
      const res = await fetch('/api/load')
      if (!res.ok) return flash((await res.json()).error, false)
      loadFromJSON(await res.json())
      flash('Загружено из diplom-auto ✓')
    } catch {
      flash('Ошибка подключения к серверу', false)
    }
  }

  const handleOpenFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        loadFromJSON(JSON.parse(ev.target.result))
        flash(`Открыт: ${file.name} ✓`)
      } catch {
        flash('Ошибка парсинга JSON', false)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
    setMoreOpen(false)
  }

  const handleSaveProject = async () => {
    setMoreOpen(false)
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: exportJSON(), images: collectImages() }),
      })
      if (!res.ok) return flash((await res.json()).error, false)
      const r = await res.json()
      flash(`Сохранено${r.imagesCount ? ` (${r.imagesCount} фото)` : ''} ✓`)
    } catch {
      flash('Ошибка сохранения', false)
    }
  }

  const handleDownload = () => {
    setMoreOpen(false)
    const blob = new Blob([JSON.stringify(exportJSON(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), { href: url, download: 'data.json' }).click()
    URL.revokeObjectURL(url)
    flash('JSON скачан ✓')
  }

  const handleGenerate = async () => {
    setMoreOpen(false)
    
    // Проверка локального лимита
    if (user && user.generationsLeft !== 'infinite') {
      const left = parseInt(user.generationsLeft, 10)
      if (isNaN(left) || left <= 0) {
        setPayModalOpen(true)
        return
      }
    }

    setGenerating(true)
    setStatus({ text: '⏳ Генерация...', ok: true })
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: exportJSON(), images: collectImages() }),
      })
      if (!res.ok) {
        const err = await res.json()
        if (err.error === 'LIMIT_EXCEEDED') {
          setPayModalOpen(true)
          flash('❌ Недостаточно генераций', false)
        } else {
          flash(`❌ ${err.error}`, false)
        }
        return
      }
      
      // Декрементируем локальный лимит после успешного скачивания
      if (user && user.generationsLeft !== 'infinite') {
        const left = parseInt(user.generationsLeft, 10)
        setUser({ ...user, generationsLeft: Math.max(0, left - 1) })
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      Object.assign(document.createElement('a'), { href: url, download: 'result.docx' }).click()
      URL.revokeObjectURL(url)
      flash('✅ Документ скачан!')
    } catch (e) {
      flash(`Ошибка: ${e.message}`, false)
    } finally {
      setGenerating(false)
    }
  }

  const canUndo = past.length > 0
  const canRedo = future.length > 0

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes undoRedo-flash {
          0% { transform: scale(1); }
          40% { transform: scale(0.88); }
          80% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes moreMenuIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .undo-redo-pulse { animation: undoRedo-flash 0.3s ease; }
      `}</style>

      <header style={{
        height: isMobile ? 52 : 58,
        background: 'var(--bg-1)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '0 12px' : '0 16px',
        gap: isMobile ? 6 : 6,
        flexShrink: 0,
        zIndex: 10,
        position: isMobile ? 'sticky' : 'relative',
        top: 0,
      }}>

        {/* ── Logo ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 'auto' }}>
          <div style={{
            width: isMobile ? 30 : 34,
            height: isMobile ? 30 : 34,
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isMobile ? 15 : 18,
            boxShadow: '0 2px 12px rgba(99,102,241,0.4)',
            flexShrink: 0,
          }}>📄</div>
          <div>
            <span style={{ fontWeight: 700, fontSize: isMobile ? 13 : 15 }}>
              <span className="grad-text">Diplom</span> Editor
            </span>
            {!isMobile && (
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: -2 }}>
                визуальный редактор data.json
              </div>
            )}
          </div>
        </div>

        {/* ── Status ── */}
        {status && (
          <span
            className={status.ok ? 'status-ok' : 'status-err'}
            style={{
              fontSize: isMobile ? 11 : 13,
              maxWidth: isMobile ? 110 : 280,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
            title={status.text}
          >
            {status.text}
          </span>
        )}

        {/* ── MOBILE layout ── */}
        {isMobile ? (
          <>
            {/* Search icon */}
            <button
              className="btn-icon"
              onClick={() => setSearchOpen(!searchOpen)}
              title="Поиск"
              style={{ fontSize: 18, padding: '5px 7px', color: searchOpen ? '#a5b4fc' : 'var(--text-2)' }}
            >🔍</button>

            {/* Generate button — compact */}
            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={generating}
              style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600 }}
            >
              {generating ? <><div style={spinnerStyle} /></> : <>⚡ DOCX</>}
            </button>

            {/* More menu */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn-icon"
                onClick={() => setMoreOpen(v => !v)}
                style={{ fontSize: 20, padding: '5px 7px', color: 'var(--text-2)' }}
                title="Ещё"
              >⋯</button>

              {moreOpen && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 998 }}
                    onClick={() => setMoreOpen(false)}
                  />
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    background: 'var(--bg-2)',
                    border: '1px solid var(--border-hover)',
                    borderRadius: 12,
                    padding: '6px',
                    zIndex: 999,
                    minWidth: 200,
                    boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                    animation: 'moreMenuIn 0.15s ease',
                  }}>
                    {/* Информация о пользователе */}
                    {user && (
                      <div style={{
                        padding: '6px 8px',
                        borderBottom: '1px solid var(--border)',
                        marginBottom: 6,
                        fontSize: 12
                      }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>
                          {user.role === 'admin' ? '👑' : user.role === 'teacher' ? '💼' : '🎓'} {user.username}
                        </div>
                        <div style={{ color: user.generationsLeft === 'infinite' ? 'var(--green)' : 'var(--text-3)', fontSize: 10 }}>
                          Генерации: {user.generationsLeft === 'infinite' ? 'Безлимит' : `${user.generationsLeft} шт.`}
                        </div>
                      </div>
                    )}

                    {/* Undo/Redo row */}
                    <div style={{
                      display: 'flex', gap: 6, padding: '6px 8px',
                      borderBottom: '1px solid var(--border)', marginBottom: 4,
                    }}>
                      <button
                        className="btn btn-ghost"
                        onClick={() => { undo(); setMoreOpen(false) }}
                        disabled={!canUndo}
                        style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}
                      >↩ Отмена</button>
                      <button
                        className="btn btn-ghost"
                        onClick={() => { redo(); setMoreOpen(false) }}
                        disabled={!canRedo}
                        style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}
                      >↪ Вернуть</button>
                    </div>

                    {user?.role === 'admin' && (
                      <button
                        className="popup-item"
                        onClick={() => { setAdminOpen(true); setMoreOpen(false) }}
                        style={{ color: 'var(--accent-2)', fontWeight: 600 }}
                      >
                        👑 Админка
                      </button>
                    )}

                    <label className="popup-item" style={{ cursor: 'pointer' }}>
                      📁 Открыть файл
                      <input type="file" accept=".json" onChange={handleOpenFile} style={{ display: 'none' }} />
                    </label>
                    <button className="popup-item" onClick={handleDownload}>⬇ Скачать JSON</button>

                    <button
                      className="popup-item"
                      onClick={handleLogout}
                      style={{ color: 'var(--red)', borderTop: '1px solid var(--border)', marginTop: 4, paddingTop: 8 }}
                    >
                      🚪 Выйти
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            {/* ── DESKTOP layout ── */}

            {/* Undo / Redo group */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 1,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
              borderRadius: 8, padding: '2px',
            }}>
              <button
                className={`btn-icon${undoPulse ? ' undo-redo-pulse' : ''}`}
                onClick={() => { undo(); setUndoPulse(true); setTimeout(() => setUndoPulse(false), 300) }}
                disabled={!canUndo}
                title="Отменить (Ctrl+Z)"
                style={{ fontSize: 15, padding: '5px 8px', borderRadius: 6, color: canUndo ? 'var(--text-2)' : 'var(--text-3)' }}
              >↩</button>

              <div style={{
                fontSize: 10, color: 'var(--text-3)',
                padding: '2px 4px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2,
              }}>
                <span style={{ color: canUndo ? '#a5b4fc' : 'var(--text-3)' }}>{past.length}</span>
                <span style={{ color: canRedo ? '#c084fc' : 'var(--text-3)' }}>{future.length}</span>
              </div>

              <button
                className={`btn-icon${redoPulse ? ' undo-redo-pulse' : ''}`}
                onClick={() => { redo(); setRedoPulse(true); setTimeout(() => setRedoPulse(false), 300) }}
                disabled={!canRedo}
                title="Вернуть (Ctrl+Y)"
                style={{ fontSize: 15, padding: '5px 8px', borderRadius: 6, color: canRedo ? 'var(--text-2)' : 'var(--text-3)' }}
              >↪</button>
            </div>

            {/* Search button */}
            <button
              className="btn btn-ghost"
              onClick={() => setSearchOpen(!searchOpen)}
              title="Поиск и замена (Ctrl+F / Ctrl+H)"
              style={{
                color: searchOpen ? '#a5b4fc' : 'var(--text-2)',
                borderColor: searchOpen ? 'rgba(99,102,241,0.5)' : 'var(--border)',
                background: searchOpen ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.04)',
              }}
            >
              🔍 Поиск
            </button>

            <label className="btn btn-ghost" style={{ cursor: 'pointer' }} title="Открыть любой JSON файл">
              📁 Открыть файл
              <input type="file" accept=".json" onChange={handleOpenFile} style={{ display: 'none' }} />
            </label>
            <button className="btn btn-ghost" onClick={handleDownload} title="Скачать data.json">
              ⬇ JSON
            </button>

            {/* Профиль пользователя и управление */}
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderRight: '1px solid var(--border)', paddingRight: 14, marginLeft: 8 }}>
                <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>
                    {user.role === 'admin' ? '👑' : user.role === 'teacher' ? '💼' : '🎓'} {user.username}
                  </span>
                  <span style={{ fontSize: 11, color: user.generationsLeft === 'infinite' ? 'var(--green)' : 'var(--text-3)' }}>
                    {user.generationsLeft === 'infinite' ? 'Безлимит' : `Генерации: ${user.generationsLeft}`}
                  </span>
                </div>
                {user.role === 'admin' && (
                  <button
                    className="btn btn-ghost"
                    onClick={() => setAdminOpen(true)}
                    style={{ padding: '5px 10px', fontSize: 11, background: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)', color: 'var(--text-1)' }}
                  >
                    Админка
                  </button>
                )}
                <button
                  className="btn btn-ghost"
                  onClick={handleLogout}
                  style={{ padding: '5px 10px', fontSize: 11, color: 'var(--red)' }}
                >
                  Выйти
                </button>
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={generating}
              title="Сгенерировать result.docx"
              style={{ padding: '8px 18px', fontSize: 14, fontWeight: 600, gap: 8, boxShadow: generating ? 'none' : '0 2px 16px rgba(99,102,241,0.45)' }}
            >
              {generating ? <><div style={spinnerStyle} /> Генерация...</> : <>⚡ Сгенерировать DOCX</>}
            </button>
          </>
        )}
      </header>
    </>
  )
}
