import type { Participant } from '../data/participants'
import { RevealAnimation } from '../components/RevealAnimation'

type Props = {
  giverId: string
  receiver: Participant
  onDone: () => void
  onTick?: () => void
  onFanfare?: () => void
}

export function RevealingPage(props: Props) {
  return (
    <section className="page revealing-page">
      <RevealAnimation {...props} />
    </section>
  )
}
