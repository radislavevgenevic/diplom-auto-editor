'use client'

import { useState, useEffect } from 'react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import BlockEditor from '../components/BlockEditor'
import SearchReplacePanel from '../components/SearchReplacePanel'
import { useEditorStore } from '../store/editorStore'

// ── Mobile bottom nav icons ──
const NAV_ITEMS = [
  { id: 'sidebar',      icon: '☰',  label: 'Меню' },
  { id: 'metadata',     icon: '⚙️', label: 'Данные' },
  { id: 'introduction', icon: '📖', label: 'Введение' },
  { id: 'sections',     icon: '📑', label: 'Разделы' },
  { id: 'conclusion',   icon: '🏁', label: 'Заключение' },
]

function MobileBottomNav({ onOpenSidebar }) {
  const { selectedPath, setSelectedPath, sections } = useEditorStore()

  const handleNav = (id) => {
    if (id === 'sidebar') {
      onOpenSidebar()
    } else if (id === 'sections') {
      if (sections.length > 0) setSelectedPath({ si: 0 })
      else onOpenSidebar()
    } else {
      setSelectedPath(id)
    }
  }

  const activeId = (() => {
    if (selectedPath === 'metadata') return 'metadata'
    if (selectedPath === 'introduction') return 'introduction'
    if (selectedPath === 'conclusion') return 'conclusion'
    if (typeof selectedPath === 'object') return 'sections'
    return null
  })()

  return (
    <nav className="mobile-bottom-nav">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          className={`mobile-nav-btn${activeId === item.id ? ' active' : ''}`}
          onClick={() => handleNav(item.id)}
        >
          <span className="icon">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  )
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const handler = (e) => setIsMobile(e.matches)
    setIsMobile(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Close sidebar when selecting on mobile
  const handleSidebarSelect = () => {
    if (isMobile) setSidebarOpen(false)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: isMobile ? 'auto' : '100vh',
      minHeight: '100vh',
      overflow: isMobile ? 'visible' : 'hidden',
    }}>
      <Header />

      <div style={{ display: 'flex', flex: 1, overflow: isMobile ? 'visible' : 'hidden', position: 'relative' }}>

        {/* ── Desktop sidebar (always visible) ── */}
        {!isMobile && <Sidebar />}

        {/* ── Mobile sidebar overlay ── */}
        {isMobile && sidebarOpen && (
          <>
            {/* Backdrop */}
            <div
              className="sidebar-open-overlay"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Drawer */}
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: 280,
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideInLeft 0.22s cubic-bezier(0.34,1.2,0.64,1)',
            }}>
              {/* Close button inside drawer */}
              <div style={{
                position: 'absolute',
                top: 12,
                right: -44,
                zIndex: 51,
              }}>
                <button
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    width: 36, height: 36,
                    borderRadius: '50%',
                    background: 'var(--bg-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-2)',
                    fontSize: 18,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >×</button>
              </div>
              <Sidebar onSelect={handleSidebarSelect} />
            </div>
          </>
        )}

        {/* ── Main content ── */}
        <main
          className="main-content"
          style={{
            flex: 1,
            overflow: isMobile ? 'visible' : 'auto',
            padding: isMobile ? '16px 14px 80px' : '28px 32px',
            background: 'var(--bg-0)',
          }}
        >
          <BlockEditor />
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      {isMobile && <MobileBottomNav onOpenSidebar={() => setSidebarOpen(true)} />}

      {/* Global search/replace overlay */}
      <SearchReplacePanel />
    </div>
  )
}
