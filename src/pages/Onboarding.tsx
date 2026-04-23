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
      <div className="onboarding-shell">
        <section className="onboarding-hero">
          <div className="onboarding-brand">
            <div className="onboarding-brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div>
              <p>Tracker Finance</p>
              <span>Workspace personale per denaro, investimenti e reporting</span>
            </div>
          </div>

          <div className="onboarding-copy">
            <span className="onboarding-kicker">Setup iniziale</span>
            <h1>Configura un workspace personale pensato per seguire il tuo patrimonio.</h1>
            <p>
              Tracker Finance raccoglie conti, cashflow, portafoglio, valute e report in un'unica
              dashboard. Inseriamo il nome profilo e prepariamo un ambiente ordinato fin dal primo accesso.
            </p>
          </div>

          <div className="onboarding-highlights">
            <article className="onboarding-highlight-card">
              <strong>Conti e cashflow</strong>
              <p>Saldi, movimenti e budget mensili leggibili in pochi pannelli essenziali.</p>
            </article>
            <article className="onboarding-highlight-card">
              <strong>Portafoglio</strong>
              <p>Posizioni aperte, P&amp;L, dividendi e impatto cambio in una vista unica.</p>
            </article>
            <article className="onboarding-highlight-card">
              <strong>Database locale</strong>
              <p>I dati restano nel browser con persistenza locale via IndexedDB.</p>
            </article>
          </div>
        </section>

        <section className="onboarding-card">
          <div className="onboarding-header">
            <span className="small-pill">Profilo iniziale</span>
            <h2>Configura il tuo spazio</h2>
            <p>Inserisci il nome da mostrare in home e nei riepiloghi operativi.</p>
          </div>

          <form onSubmit={handleSubmit} className="onboarding-form">
            <div className="form-group">
              <label htmlFor="userName">Nome profilo</label>
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
                autoComplete="given-name"
              />
              <span className="form-hint">Puoi modificarlo in seguito senza perdere i dati salvati.</span>
              {error && <span className="form-error">{error}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
              {isSubmitting ? 'Salvataggio...' : 'Apri la dashboard'}
            </button>

            <p className="onboarding-footer">
              Potrai aggiungere conti, movimenti e posizioni subito dopo.
            </p>
          </form>
        </section>
      </div>
    </div>
  )
}
