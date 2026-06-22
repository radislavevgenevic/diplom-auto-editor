'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useEditorStore } from '../store/editorStore'

export default function SearchReplacePanel() {
  const { searchOpen, setSearchOpen, countMatches, findAndReplace } = useEditorStore()

  const [findText, setFindText]       = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [matchCount, setMatchCount]   = useState(0)
  const [replaced, setReplaced]       = useState(null)   // { count } | null
  const [shake, setShake]             = useState(false)
  const findRef = useRef()
  const panelRef = useRef()

  // Recount whenever findText or the panel opens
  useEffect(() => {
    if (!searchOpen) return
    const n = countMatches(findText)
    setMatchCount(n)
    setReplaced(null)
  }, [findText, searchOpen, countMatches])

  // Focus find input on open
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => findRef.current?.focus(), 60)
    }
  }, [searchOpen])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [searchOpen, setSearchOpen])

  const handleReplace = useCallback(() => {
    if (!findText) return
    if (matchCount === 0) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }
    findAndReplace(findText, replaceText)
    const n = matchCount
    setReplaced({ count: n })
    setMatchCount(0)
    setFindText(replaceText)   // update so next search reflects change
    setTimeout(() => setFindText(''), 1600)
    setTimeout(() => setReplaced(null), 3000)
  }, [findText, replaceText, matchCount, findAndReplace])

  // Ctrl+H to open, Ctrl+Enter to replace
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault()
        setSearchOpen(!searchOpen)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && searchOpen) {
        e.preventDefault()
        handleReplace()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [searchOpen, handleReplace, setSearchOpen])

  if (!searchOpen) return null

  const hasMatches = matchCount > 0
  const badgeColor = hasMatches
    ? 'rgba(99,102,241,0.25)'
    : findText
    ? 'rgba(248,113,113,0.2)'
    : 'rgba(255,255,255,0.06)'
  const badgeTextColor = hasMatches ? '#a5b4fc' : findText ? '#f87171' : 'var(--text-3)'

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(2px)',
          zIndex: 900,
        }}
        onClick={() => setSearchOpen(false)}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`search-panel${shake ? ' search-shake' : ''} search-panel-mobile`}
        style={{
          position: 'fixed',
          top: 78,
          right: 32,
          zIndex: 901,
          width: 440,
          background: 'var(--bg-2)',
          border: '1px solid var(--border-hover)',
          borderRadius: 16,
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.15)',
          overflow: 'hidden',
          animation: 'searchSlideIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px 10px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(99,102,241,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 18,
              background: 'linear-gradient(135deg, var(--accent-1), var(--accent-2))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>🔍</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>
              Поиск и замена
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'monospace' }}>
              Ctrl+H
            </span>
          </div>
          <button
            onClick={() => setSearchOpen(false)}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-3)',
              cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '2px 6px',
              borderRadius: 6, transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => { e.target.style.color = 'var(--text-1)'; e.target.style.background = 'rgba(255,255,255,0.06)' }}
            onMouseLeave={e => { e.target.style.color = 'var(--text-3)'; e.target.style.background = 'transparent' }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px' }}>

          {/* FIND row */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
              Найти
            </label>
            <div style={{ position: 'relative' }}>
              <input
                ref={findRef}
                className="inp"
                value={findText}
                onChange={e => setFindText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReplace()}
                placeholder="Искать по всему документу…"
                style={{ paddingRight: 56 }}
              />
              {/* Match badge */}
              <div style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: badgeColor,
                color: badgeTextColor,
                fontSize: 11, fontWeight: 700,
                padding: '2px 8px', borderRadius: 20,
                transition: 'background 0.2s, color 0.2s',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}>
                {findText
                  ? (hasMatches ? `${matchCount} совп.` : '0')
                  : '–'}
              </div>
            </div>
          </div>

          {/* REPLACE row */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
              Заменить на
            </label>
            <input
              className="inp"
              value={replaceText}
              onChange={e => setReplaceText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleReplace()}
              placeholder="Новое значение…"
            />
          </div>

          {/* Scope info */}
          <div style={{
            display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14,
          }}>
            {['Метаданные', 'Введение', 'Разделы', 'Заключение', 'Литература', 'Формулы'].map(s => (
              <span key={s} style={{
                fontSize: 10, padding: '2px 8px',
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 20, color: 'var(--accent-1)', fontWeight: 500,
              }}>{s}</span>
            ))}
          </div>

          {/* Actions row */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={handleReplace}
              disabled={!findText || matchCount === 0}
              style={{ flex: 1, justifyContent: 'center', fontWeight: 600 }}
            >
              ✦ Заменить все ({matchCount})
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => { setFindText(''); setReplaceText(''); setReplaced(null) }}
              style={{ padding: '7px 12px' }}
              title="Очистить поля"
            >
              ✕ Очистить
            </button>
          </div>

          {/* Success / hint message */}
          <div style={{
            marginTop: 12,
            minHeight: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {replaced ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(74,222,128,0.12)',
                border: '1px solid rgba(74,222,128,0.3)',
                borderRadius: 8, padding: '5px 14px',
                color: 'var(--green)', fontSize: 13, fontWeight: 500,
                animation: 'fadeIn 0.2s ease',
              }}>
                ✅ Заменено {replaced.count} вхождени{replaced.count === 1 ? 'е' : replaced.count < 5 ? 'я' : 'й'}
              </div>
            ) : (
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                Enter или Ctrl+Enter для замены • Esc для закрытия
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
