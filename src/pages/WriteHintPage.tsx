import { useEffect, useState } from 'react'
import { gameConfig } from '../config/game'
import { Button } from '../components/Button'
import { getMyOutgoingHint, setMyHint } from '../services/hints'

type Props = {
  participantId: string
  accessPin: string
  onBack: () => void
}

export function WriteHintPage({ participantId, accessPin, onBack }: Props) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const existing = await getMyOutgoingHint(participantId, accessPin)
        if (!cancelled) setText(existing)
      } catch (err) {
        console.error(err)
        if (!cancelled) setError(gameConfig.writeHintError)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [participantId, accessPin])

  const save = async () => {
    setError(null)
    setSaved(false)
    if (text.trim().length < 3) {
      setError(gameConfig.writeHintTooShort)
      return
    }
    setSaving(true)
    try {
      await setMyHint(participantId, accessPin, text)
      setSaved(true)
    } catch (err) {
      console.error(err)
      if (err instanceof Error && err.message === 'HINT_TOO_SHORT') {
        setError(gameConfig.writeHintTooShort)
      } else {
        setError(gameConfig.writeHintError)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page hint-page">
      <div className="hint-page__box">
        <h1>{gameConfig.writeHintTitle}</h1>
        <p>{gameConfig.writeHintIntro}</p>
        <p className="hint-page__tips">{gameConfig.writeHintTips}</p>

        {loading ? (
          <p role="status">{gameConfig.readHintLoading}</p>
        ) : (
          <>
            <label className="hint-page__label" htmlFor="hint-text">
              Tu pista
            </label>
            <textarea
              id="hint-text"
              className="hint-page__textarea"
              rows={5}
              maxLength={500}
              placeholder={gameConfig.writeHintPlaceholder}
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setSaved(false)
              }}
              disabled={saving}
            />
            <p className="hint-page__count">{text.trim().length}/500</p>
          </>
        )}

        {error && (
          <p className="hint-page__error" role="alert">
            {error}
          </p>
        )}
        {saved && (
          <p className="hint-page__ok" role="status">
            {gameConfig.writeHintSaved}
          </p>
        )}

        <div className="hint-page__actions">
          <Button onClick={save} disabled={loading || saving}>
            {gameConfig.writeHintSave}
          </Button>
          <Button variant="secondary" onClick={onBack} disabled={saving}>
            {gameConfig.writeHintBack}
          </Button>
        </div>
      </div>
    </section>
  )
}
