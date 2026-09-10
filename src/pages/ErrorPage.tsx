import { gameConfig } from '../config/game'
import { Button } from '../components/Button'

type Props = {
  onRetry: () => void
}

export function ErrorPage({ onRetry }: Props) {
  return (
    <section className="page error-page">
      <div className="error-page__box">
        <h1>{gameConfig.errorTitle}</h1>
        <p>{gameConfig.errorHint}</p>
        <Button onClick={onRetry}>{gameConfig.retryButton}</Button>
      </div>
    </section>
  )
}
