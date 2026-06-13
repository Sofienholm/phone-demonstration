import './Overlay.css'

/* Lille blå firkantet "sparkle"-stjerne (genbruges flere steder) */
function Sparkle({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 0c1 7 4 10 12 12-8 2-11 5-12 12-1-7-4-10-12-12 8-2 11-5 12-12Z"
        fill="currentColor"
      />
    </svg>
  )
}

/* Svag håndtegnet atom-doodle */
function Atom({ className }) {
  return (
    <svg className={className} viewBox="0 0 60 60" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.3">
        <ellipse cx="30" cy="30" rx="22" ry="9" />
        <ellipse cx="30" cy="30" rx="22" ry="9" transform="rotate(60 30 30)" />
        <ellipse cx="30" cy="30" rx="22" ry="9" transform="rotate(120 30 30)" />
        <circle cx="30" cy="30" r="2.5" fill="currentColor" />
      </g>
    </svg>
  )
}

/**
 * UI-overlay ovenpå kameraet.
 * Får kun at vide om kvitteringen er blevet tappet (for at opdatere tælleren).
 *
 * Tekst og antal kan rettes nedenfor (fx "0/3" hvis du har flere ting).
 */
export default function Overlay({ tapped }) {
  const fundet = tapped ? 1 : 0 // antal fundet lige nu
  const ialt = 3 // hvor mange der skal findes i alt

  return (
    <div className="overlay">
      <div className="overlay__top">
        {/* Dekorationer */}
        <Atom className="deco deco--atom-tr" />
        <Sparkle className="deco deco--star-tr1" />
        <Sparkle className="deco deco--star-tr2" />
        <Sparkle className="deco deco--star-r" />
        <Atom className="deco deco--atom-bl" />
        <Sparkle className="deco deco--star-bl" />

        {/* Mørkeblå taleboble */}
        <div className="bubble">
          BEVÆG DIG FREM OG SE OM DU KAN FINDE EN LEDETRÅD
        </div>

        {/* Lille "?"-boble nederst til venstre */}
        <div className="qmark">?</div>

        {/* Orange tæller-pille */}
        <div className={`counter${tapped ? ' counter--done' : ''}`}>
          {fundet}/{ialt} FUNDET
        </div>
      </div>
    </div>
  )
}
