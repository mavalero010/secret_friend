import type { Participant } from '../data/participants'
import { gameConfig } from '../config/game'
import { Button } from '../components/Button'
import { useState } from 'react'

type Props = {
  receiver: Participant
  phrase: string
  onWriteHint: () => void
  onReadHint: () => void
  onHome: () => void
}

export function RevealedPage({
  receiver,
  phrase,
  onWriteHint,
  onReadHint,
  onHome,
}: Props) {
  const [ack, setAck] = useState(false)

  const handleUnderstood = () => {
    setAck(true)
    window.open(gameConfig.understoodYoutubeUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="page revealed">
      <div className="revealed__card">
        <p className="revealed__label">🎁 {gameConfig.resultLabel}</p>
        <img
          src={receiver.image}
          alt=""
          className="revealed__photo"
          width={200}
          height={200}
        />
        <h1 className="revealed__name">{receiver.name}</h1>
        <p className="revealed__phrase">“{phrase}”</p>

        {!ack ? (
          <Button onClick={handleUnderstood}>{gameConfig.understoodButton}</Button>
        ) : (
          <p className="revealed__after" role="status">
            {gameConfig.afterUnderstood}
          </p>
        )}

        <div className="revealed__hints">
          <Button variant="secondary" onClick={onWriteHint}>
            {gameConfig.giveHintButton}
          </Button>
          <Button variant="secondary" onClick={onReadHint}>
            {gameConfig.myHintButton}
          </Button>
          <Button variant="secondary" onClick={onHome}>
            {gameConfig.backHomeButton}
          </Button>
        </div>
      </div>
    </section>
  )
}
