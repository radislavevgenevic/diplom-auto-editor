'use client'

import { useState, useEffect } from 'react'

export default function AdminDashboard({ onClose }) {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) {
        throw new Error('Не удалось загрузить список пользователей')
      }
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleUpdateUser = async (userId, role, generationsLeft) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role, generationsLeft })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка обновления')
      }
      
      // Update local state
      setUsers(prev => prev.map(u => u.id === userId ? {
        ...u,
        role: data.user.role,
        generationsLeft: data.user.generationsLeft
      } : u))

      setSuccessMsg('Сохранено ✓')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      alert(`Ошибка: ${err.message}`)
    }
  }

  const handleGenerationsChange = (userId, currentVal, changeType) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    let newVal = currentVal
    if (changeType === 'toggle_infinite') {
      newVal = currentVal === 'infinite' ? 5 : 'infinite'
    } else if (changeType === 'add_5') {
      const currentNum = currentVal === 'infinite' ? 0 : parseInt(currentVal, 10) || 0
      newVal = currentNum + 5
    } else if (changeType === 'sub_5') {
      const currentNum = currentVal === 'infinite' ? 0 : parseInt(currentVal, 10) || 0
      newVal = Math.max(0, currentNum - 5)
    } else if (changeType === 'set_custom') {
      const res = window.prompt('Введите количество доступных генераций (число):', currentVal === 'infinite' ? '5' : currentVal)
      if (res === null) return
      const num = parseInt(res, 10)
      newVal = isNaN(num) ? 0 : num
    }

    handleUpdateUser(userId, user.role, newVal)
  }

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase().trim())
  )

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(7, 7, 15, 0.8)',
      backdropFilter: 'blur(8px)',
      padding: 20
    }}>
      <div className="card fade-in" style={{
        width: '100%',
        maxWidth: 720,
        maxHeight: '90vh',
        background: 'var(--bg-1)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>👑</span>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>
              Панель администратора
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '6px 12px', fontSize: 12 }}
          >Закрыть</button>
        </div>

        {/* Search */}
        <div style={{ padding: '16px 24px', display: 'flex', gap: 12, alignItems: 'center', background: 'var(--bg-2)' }}>
          <input
            type="text"
            className="inp"
            placeholder="🔍 Поиск пользователей по логину..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontSize: 13, flex: 1 }}
          />
          {successMsg && (
            <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>{successMsg}</span>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {error && (
            <div style={{
              background: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid var(--red)',
              borderRadius: 8,
              color: 'var(--red)',
              padding: '10px 12px',
              fontSize: 12,
              marginBottom: 16
            }}>
              ⚠️ {error}
            </div>
          )}

          {loading && users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>
              Загрузка списка пользователей...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>
              Пользователи не найдены
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 8px', fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>ЛОГИН</th>
                  <th style={{ padding: '10px 8px', fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>РОЛЬ</th>
                  <th style={{ padding: '10px 8px', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, width: 280 }}>ПОДПИСКА / ГЕНЕРАЦИИ</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    {/* Username */}
                    <td style={{ padding: '12px 8px', color: 'var(--text-1)', fontWeight: 600 }}>
                      {user.username}
                    </td>

                    {/* Role dropdown */}
                    <td style={{ padding: '12px 8px' }}>
                      <select
                        className="inp"
                        value={user.role}
                        onChange={(e) => handleUpdateUser(user.id, e.target.value, user.generationsLeft)}
                        style={{
                          fontSize: 12,
                          padding: '4px 8px',
                          background: 'var(--bg-2)',
                          width: 110
                        }}
                      >
                        <option value="student">Ученик</option>
                        <option value="teacher">Учитель</option>
                        <option value="admin">Админ</option>
                      </select>
                    </td>

                    {/* Subscription Adjustments */}
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: user.generationsLeft === 'infinite' ? 'var(--green)' : 'var(--text-2)',
                          background: user.generationsLeft === 'infinite' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                          padding: '3px 8px',
                          borderRadius: 6,
                          minWidth: 84,
                          textAlign: 'center',
                          border: user.generationsLeft === 'infinite' ? '1px solid rgba(74, 222, 128, 0.2)' : '1px solid var(--border)'
                        }}>
                          {user.generationsLeft === 'infinite' ? 'Безлимит' : `${user.generationsLeft} шт.`}
                        </span>

                        <button
                          onClick={() => handleGenerationsChange(user.id, user.generationsLeft, 'add_5')}
                          className="btn btn-ghost"
                          title="Добавить 5 генераций"
                          style={{ padding: '3px 6px', fontSize: 11 }}
                        >+5</button>

                        <button
                          onClick={() => handleGenerationsChange(user.id, user.generationsLeft, 'sub_5')}
                          className="btn btn-ghost"
                          title="Отнять 5 генераций"
                          disabled={user.generationsLeft === 'infinite'}
                          style={{ padding: '3px 6px', fontSize: 11 }}
                        >-5</button>

                        <button
                          onClick={() => handleGenerationsChange(user.id, user.generationsLeft, 'set_custom')}
                          className="btn btn-ghost"
                          title="Ввести число вручную"
                          style={{ padding: '3px 6px', fontSize: 11 }}
                        >✏️</button>

                        <button
                          onClick={() => handleGenerationsChange(user.id, user.generationsLeft, 'toggle_infinite')}
                          className="btn"
                          style={{
                            padding: '3px 6px',
                            fontSize: 11,
                            background: user.generationsLeft === 'infinite' ? 'rgba(248, 113, 113, 0.1)' : 'rgba(74, 222, 128, 0.1)',
                            border: user.generationsLeft === 'infinite' ? '1px solid var(--red)' : '1px solid var(--green)',
                            color: user.generationsLeft === 'infinite' ? 'var(--red)' : 'var(--green)'
                          }}
                        >
                          {user.generationsLeft === 'infinite' ? 'Лимит' : 'Безлимит'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
