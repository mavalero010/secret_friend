import { useEffect, useState } from 'react'
import { gameConfig } from '../config/game'
import { Button } from '../components/Button'
import { getHintForMe } from '../services/hints'

type Props = {
  participantId: string
  accessPin: string
  onBack: () => void
}

export function ReadHintPage({ participantId, accessPin, onBack }: Props) {
  const [loading, setLoading] = useState(true)
  const [hasHint, setHasHint] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const result = await getHintForMe(participantId, accessPin)
        if (cancelled) return
        setHasHint(result.hasHint)
        setHint(result.hintText)
      } catch (err) {
        console.error(err)
        if (!cancelled) setError(gameConfig.readHintError)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [participantId, accessPin])

  return (
    <section className="page hint-page">
      <div className="hint-page__box">
        <h1>{gameConfig.readHintTitle}</h1>

        {loading && <p role="status">{gameConfig.readHintLoading}</p>}

        {!loading && error && (
          <p className="hint-page__error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && !hasHint && (
          <p className="hint-page__empty" role="status">
            {gameConfig.readHintEmpty}
          </p>
        )}

        {!loading && !error && hasHint && hint && (
          <>
            <p>{gameConfig.readHintIntro}</p>
            <blockquote className="hint-page__quote">“{hint}”</blockquote>
          </>
        )}

        <div className="hint-page__actions">
          <Button variant="secondary" onClick={onBack}>
            {gameConfig.readHintBack}
          </Button>
        </div>
      </div>
    </section>
  )
}
