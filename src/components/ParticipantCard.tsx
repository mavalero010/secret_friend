import type { Participant } from '../data/participants'

type Props = {
  participant: Participant
  onSelect: (p: Participant) => void
  selected?: boolean
}

export function ParticipantCard({ participant, onSelect, selected }: Props) {
  return (
    <button
      type="button"
      className={`player-card ${selected ? 'is-selected' : ''}`}
      onClick={() => onSelect(participant)}
      aria-label={`Seleccionar a ${participant.name}`}
    >
      <span className="player-card__glow" aria-hidden />
      <span className="player-card__photo-wrap">
        <img
          src={participant.image}
          alt=""
          className="player-card__photo"
          loading="lazy"
          width={160}
          height={160}
        />
      </span>
      <span className="player-card__name">{participant.name}</span>
      <span className="player-card__stamp" aria-hidden>
        TOP SECRET
      </span>
    </button>
  )
}
