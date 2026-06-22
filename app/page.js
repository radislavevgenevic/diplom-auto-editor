'use client'

import { useState, useEffect } from 'react'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import BlockEditor from '../components/BlockEditor'
import SearchReplacePanel from '../components/SearchReplacePanel'
import { useEditorStore } from '../store/editorStore'
import AuthScreen from '../components/AuthScreen'
import AdminDashboard from '../components/AdminDashboard'
import TelegramPaymentModal from '../components/TelegramPaymentModal'

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
  const { user, setUser, adminOpen, setAdminOpen, payModalOpen, setPayModalOpen, loadFromJSON } = useEditorStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Проверка активной сессии при запуске
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (data.user) {
          setUser(data.user)
          // Загружаем данные пользователя
          const loadRes = await fetch('/api/load')
          if (loadRes.ok) {
            loadFromJSON(await loadRes.json())
          }
        }
      } catch (err) {
        console.error('Ошибка проверки сессии:', err)
      } finally {
        setInitialLoading(false)
      }
    }
    checkSession()
  }, [setUser, loadFromJSON])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const handler = (e) => setIsMobile(e.matches)
    setIsMobile(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Обработка успешного входа
  const handleAuthSuccess = async (loggedInUser) => {
    setUser(loggedInUser)
    setInitialLoading(true)
    try {
      const loadRes = await fetch('/api/load')
      if (loadRes.ok) {
        loadFromJSON(await loadRes.json())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setInitialLoading(false)
    }
  }

  // Close sidebar when selecting on mobile
  const handleSidebarSelect = () => {
    if (isMobile) setSidebarOpen(false)
  }

  if (initialLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-0)',
        color: 'var(--text-2)',
        fontSize: 14,
        flexDirection: 'column',
        gap: 12
      }}>
        <div style={{
          width: 32, height: 32,
          border: '3px solid rgba(99,102,241,0.2)',
          borderTop: '3px solid var(--accent-1)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <span>Подключение...</span>
      </div>
    )
  }

  // Если не авторизован, показываем экран входа/регистрации
  if (!user) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />
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

      {/* Modals */}
      {adminOpen && <AdminDashboard onClose={() => setAdminOpen(false)} />}
      {payModalOpen && <TelegramPaymentModal onClose={() => setPayModalOpen(false)} />}
    </div>
  )
}

