import { useState } from 'react'

interface OnboardingProps {
  onComplete: (userName: string) => void | Promise<void>
}

export function OnboardingPage({ onComplete }: OnboardingProps) {
  const [userName, setUserName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = userName.trim()

    if (!trimmed) {
      setError('Inserisci il tuo nome')
      return
    }

    if (trimmed.length < 2) {
      setError('Nome troppo breve')
      return
    }

    setIsSubmitting(true)

    try {
      await onComplete(trimmed)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h1>Benvenuto nel Financial Dashboard</h1>
          <p>Iniziamo con il tuo nome</p>
        </div>

        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="form-group">
            <label htmlFor="userName">Come ti chiami?</label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value)
                setError('')
              }}
              placeholder="Es: Salvatore"
              className="form-input"
              autoFocus
            />
            {error && <span className="form-error">{error}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
            {isSubmitting ? 'Salvataggio...' : 'Continua'}
          </button>

          <p className="onboarding-footer">
            Potrai aggiungere i tuoi conti e dati successivamente
          </p>
        </form>
      </div>
    </div>
  )
}
