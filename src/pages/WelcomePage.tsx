import { gameConfig } from '../config/game'
import { Button } from '../components/Button'

type Props = { onEnter: () => void }

export function WelcomePage({ onEnter }: Props) {
  return (
    <section className="page welcome">
      <div className="welcome__badge" aria-hidden>
        OPERACIÓN CLASIFICADA
      </div>
      <h1 className="welcome__title">
        <span className="welcome__gift" aria-hidden>
          🎁
        </span>
        {gameConfig.name}
      </h1>
      <p className="welcome__subtitle">{gameConfig.welcomeSubtitle}</p>
      <div className="welcome__deck" aria-hidden>
        <span className="welcome__mini-card">?</span>
        <span className="welcome__mini-card">?</span>
        <span className="welcome__mini-card">?</span>
      </div>
      <Button onClick={onEnter} className="welcome__cta">
        {gameConfig.enterButton}
      </Button>
      <p className="welcome__fine">Solo para agentes autorizados (tú).</p>
    </section>
  )
}
