import { gameConfig } from '../config/game'
import { Button } from '../components/Button'

type Props = {
  onReveal: () => void
  onWriteHint: () => void
  onReadHint: () => void
}

export function MysteryPage({ onReveal, onWriteHint, onReadHint }: Props) {
  return (
    <section className="page mystery">
      <div className="mystery__box">
        <div className="mystery__seal" aria-hidden>
          🔒
        </div>
        <h1>{gameConfig.mysteryTitle}</h1>
        <p>{gameConfig.mysteryHint}</p>
        <div className="mystery__actions">
          <Button onClick={onReveal} className="mystery__cta">
            {gameConfig.revealButton}
          </Button>
          <Button variant="secondary" onClick={onWriteHint}>
            {gameConfig.giveHintButton}
          </Button>
          <Button variant="secondary" onClick={onReadHint}>
            {gameConfig.myHintButton}
          </Button>
        </div>
      </div>
    </section>
  )
}
