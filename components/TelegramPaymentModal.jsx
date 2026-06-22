'use client'

// Укажите здесь вашу ссылку на Telegram для связи
const TELEGRAM_LINK = 'https://t.me/t_r_e_1_9' // <-- ИЗМЕНИТЕ ЭТУ ССЫЛКУ НА СВОЮ

export default function TelegramPaymentModal({ onClose }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 110,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(7, 7, 15, 0.85)',
      backdropFilter: 'blur(10px)',
      padding: 16
    }}>
      <div className="card fade-in" style={{
        width: '100%',
        maxWidth: 440,
        padding: '36px 32px',
        background: 'var(--bg-1)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
        textAlign: 'center'
      }}>
        {/* Telegram logo icon */}
        <div style={{
          width: 64,
          height: 64,
          background: 'linear-gradient(135deg, #229ED9, #24A1DE)',
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          marginBottom: 20,
          boxShadow: '0 8px 32px rgba(34, 158, 217, 0.3)',
          color: 'white'
        }}>✈️</div>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', marginBottom: 12 }}>
          Генерации закончились!
        </h2>
        
        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 28 }}>
          У вас закончились доступные генерации документа.<br/>
          Свяжитесь со мной напрямую в <b>Telegram</b>, чтобы оплатить подписку и начислить дополнительные генерации (или безлимитный доступ).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a
            href={TELEGRAM_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #229ED9, #24A1DE)',
              color: 'white',
              padding: '12px 20px',
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 10,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(34,158,217,0.3)'
            }}
          >
            <span>Написать мне в Telegram</span>
          </a>

          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{
              padding: '10px 20px',
              fontSize: 13,
              borderRadius: 10,
              border: '1px solid var(--border)'
            }}
          >
            Вернуться назад
          </button>
        </div>
      </div>
    </div>
  )
}
