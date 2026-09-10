import { participants, type Participant } from '../data/participants'
import { gameConfig } from '../config/game'
import { ParticipantCard } from '../components/ParticipantCard'

type Props = {
  onSelect: (p: Participant) => void
}

export function IdentifyPage({ onSelect }: Props) {
  return (
    <section className="page identify">
      <header className="page__header">
        <h1>{gameConfig.identifyTitle}</h1>
        <p>{gameConfig.identifyHint}</p>
      </header>
      <div className="player-grid" role="list">
        {participants.map((p) => (
          <div key={p.id} role="listitem">
            <ParticipantCard participant={p} onSelect={onSelect} />
          </div>
        ))}
      </div>
    </section>
  )
}
