export function FestiveBackground() {
  return (
    <div className="bg-festive" aria-hidden>
      <div className="bg-festive__gradient" />
      <div className="bg-festive__grid" />
      <div className="bg-festive__blob bg-festive__blob--a" />
      <div className="bg-festive__blob bg-festive__blob--b" />
      <div className="bg-festive__stars">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className={`star star--${i % 5}`} />
        ))}
      </div>
    </div>
  )
}
