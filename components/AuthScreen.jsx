'use client'

import { useState } from 'react'

export default function AuthScreen({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Заполните все поля')
      return
    }

    setLoading(true)
    setError('')

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          role: isRegister ? role : undefined
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Произошла ошибка')
      }

      onAuthSuccess(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTestAccount = (user, pass) => {
    setUsername(user)
    setPassword(pass)
    setIsRegister(false)
    setError('')
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-0)',
      padding: 16
    }}>
      <div className="card fade-in" style={{
        width: '100%',
        maxWidth: 420,
        padding: '32px 28px',
        background: 'var(--bg-1)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header/Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48,
            height: 48,
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            borderRadius: 12,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            marginBottom: 12,
            boxShadow: '0 8px 24px rgba(99,102,241,0.3)'
          }}>📄</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)' }}>
            <span className="grad-text">Diplom</span> Editor
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
            Система автоматического форматирования
          </p>
        </div>

        {/* Tab switchers */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-2)',
          padding: 4,
          borderRadius: 8,
          marginBottom: 24,
          border: '1px solid var(--border)'
        }}>
          <button
            onClick={() => { setIsRegister(false); setError('') }}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: 6,
              background: !isRegister ? 'var(--bg-3)' : 'transparent',
              color: !isRegister ? 'var(--text-1)' : 'var(--text-2)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >Вход</button>
          <button
            onClick={() => { setIsRegister(true); setError('') }}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: 6,
              background: isRegister ? 'var(--bg-3)' : 'transparent',
              color: isRegister ? 'var(--text-1)' : 'var(--text-2)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >Регистрация</button>
        </div>

        {/* Error message */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
              Логин / Имя пользователя
            </label>
            <input
              type="text"
              className="inp"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите логин"
              disabled={loading}
              required
              style={{ fontSize: 13 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
              Пароль
            </label>
            <input
              type="password"
              className="inp"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              disabled={loading}
              required
              style={{ fontSize: 13 }}
            />
          </div>

          {isRegister && (
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                Роль в системе
              </label>
              <select
                className="inp"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
                style={{ fontSize: 13, padding: '8px 12px' }}
              >
                <option value="student">Ученик (Обычный пользователь)</option>
                <option value="teacher">Учитель</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 600,
              justifyContent: 'center',
              marginTop: 8
            }}
          >
            {loading ? 'Загрузка...' : isRegister ? 'Создать аккаунт' : 'Войти в систему'}
          </button>
        </form>

        {/* Demo Accounts Panel */}
        <div style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: '1px solid var(--border)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginBottom: 8 }}>
            ДЕМО-АККАУНТЫ ДЛЯ ТЕСТИРОВАНИЯ
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            <button
              onClick={() => handleTestAccount('admin', 'admin')}
              className="btn btn-ghost"
              style={{ padding: '4px 8px', fontSize: 10 }}
            >👑 Admin</button>
            <button
              onClick={() => handleTestAccount('teacher', 'teacher')}
              className="btn btn-ghost"
              style={{ padding: '4px 8px', fontSize: 10 }}
            >💼 Teacher</button>
            <button
              onClick={() => handleTestAccount('student', 'student')}
              className="btn btn-ghost"
              style={{ padding: '4px 8px', fontSize: 10 }}
            >🎓 Student</button>
          </div>
        </div>
      </div>
    </div>
  )
}
