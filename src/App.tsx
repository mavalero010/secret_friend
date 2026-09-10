import { FestiveBackground } from './components/FestiveBackground'
import { SoundToggle } from './components/SoundToggle'
import { useGameFlow } from './hooks/useGameFlow'
import { useSound } from './hooks/useSound'
import { WelcomePage } from './pages/WelcomePage'
import { IdentifyPage } from './pages/IdentifyPage'
import { ConfirmPage } from './pages/ConfirmPage'
import { AssigningPage } from './pages/AssigningPage'
import { MysteryPage } from './pages/MysteryPage'
import { WriteHintPage } from './pages/WriteHintPage'
import { ReadHintPage } from './pages/ReadHintPage'
import { RevealingPage } from './pages/RevealingPage'
import { RevealedPage } from './pages/RevealedPage'
import { ErrorPage } from './pages/ErrorPage'
import { gameConfig } from './config/game'

export default function App() {
  const flow = useGameFlow()
  const sound = useSound()

  const handleEnter = () => {
    sound.startMusic()
    flow.enter()
  }

  return (
    <div className="app-shell">
      <FestiveBackground />
      <SoundToggle enabled={sound.enabled} onToggle={sound.toggle} />

      <main className="app-main">
        {flow.screen === 'welcome' && <WelcomePage onEnter={handleEnter} />}

        {flow.screen === 'identify' && (
          <IdentifyPage onSelect={flow.selectParticipant} />
        )}

        {flow.screen === 'confirm' && flow.selected && (
          <ConfirmPage
            participant={flow.selected}
            onConfirm={flow.confirmIdentity}
            onCancel={flow.cancelConfirm}
            busy={flow.loading}
            pinError={flow.pinError}
          />
        )}

        {flow.screen === 'assigning' && <AssigningPage />}

        {flow.screen === 'mystery' && flow.assignment && (
          <MysteryPage
            onReveal={() => {
              sound.startMusic()
              flow.startReveal()
            }}
            onWriteHint={flow.openWriteHint}
            onReadHint={flow.openReadHint}
          />
        )}

        {flow.screen === 'write-hint' && flow.selected && flow.accessPin && (
          <WriteHintPage
            participantId={flow.selected.id}
            accessPin={flow.accessPin}
            onBack={flow.closeHint}
          />
        )}

        {flow.screen === 'read-hint' && flow.selected && flow.accessPin && (
          <ReadHintPage
            participantId={flow.selected.id}
            accessPin={flow.accessPin}
            onBack={flow.closeHint}
          />
        )}

        {flow.screen === 'revealing' && flow.assignment && flow.selected && (
          <RevealingPage
            giverId={flow.selected.id}
            receiver={flow.assignment.receiver}
            onDone={flow.finishReveal}
            onTick={sound.tick}
            onFanfare={sound.fanfare}
          />
        )}

        {flow.screen === 'revealed' && flow.assignment && (
          <RevealedPage
            receiver={flow.assignment.receiver}
            phrase={flow.phrase || gameConfig.afterUnderstood}
            onWriteHint={flow.openWriteHint}
            onReadHint={flow.openReadHint}
            onHome={flow.goHome}
          />
        )}

        {flow.screen === 'error' && <ErrorPage onRetry={flow.retry} />}
      </main>
    </div>
  )
}
