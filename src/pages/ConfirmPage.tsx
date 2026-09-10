import { useState } from 'react'
import type { Participant } from '../data/participants'
import { gameConfig } from '../config/game'
import { Button } from '../components/Button'

type Props = {
  participant: Participant
  onConfirm: (pin: string) => void
  onCancel: () => void
  busy?: boolean
  pinError?: string | null
}

export function ConfirmPage({
  participant,
  onConfirm,
  onCancel,
  busy,
  pinError,
}: Props) {
  const [pin, setPin] = useState('')

  return (
    <section className="page confirm">
      <div className="confirm__card">
        <img
          src={participant.image}
          alt=""
          className="confirm__photo"
          width={180}
          height={180}
        />
        <h1>{gameConfig.confirmTitle(participant.name)}</h1>
        <p className="confirm__hint">{gameConfig.confirmHint}</p>
        <p className="confirm__hint-alt">{gameConfig.confirmHintAlt}</p>

        <label className="confirm__pin-label" htmlFor="access-pin">
          {gameConfig.confirmPinLabel}
        </label>
        <input
          id="access-pin"
          className={`confirm__pin-input ${pinError ? 'is-invalid' : ''}`}
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder={gameConfig.confirmPinPlaceholder}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          disabled={busy}
          aria-invalid={Boolean(pinError)}
          aria-describedby="pin-hint"
        />
        <p id="pin-hint" className="confirm__pin-hint">
          {pinError ? (
            <span className="confirm__pin-error" role="alert">
              {pinError}
            </span>
          ) : (
            gameConfig.confirmPinHint
          )}
        </p>

        <div className="confirm__actions">
          <Button
            onClick={() => onConfirm(pin.trim())}
            disabled={busy || pin.trim().length < 4}
          >
            {gameConfig.confirmYes}
          </Button>
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            {gameConfig.confirmNo}
          </Button>
        </div>
      </div>
    </section>
  )
}
