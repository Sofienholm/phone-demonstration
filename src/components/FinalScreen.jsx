import './FinalScreen.css'

/**
 * Designet slutskærm der vises NÅR kvitteringen er åbnet (animationen færdig).
 * Ren HTML/CSS — matcher mockup'en.
 *
 * Teksterne nedenfor må du frit rette. Kvitteringsbilledet hentes fra
 * public-mappen som /regning.png — læg din egen PNG der.
 */
export default function FinalScreen() {
  return (
    <div className="final">
      {/* lille atom-tegning øverst til venstre (fra mockup) */}
      <svg className="final__atom" viewBox="0 0 60 60" aria-hidden="true">
        <g fill="none" stroke="#9a958c" strokeWidth="1.3">
          <ellipse cx="30" cy="30" rx="22" ry="9" />
          <ellipse cx="30" cy="30" rx="22" ry="9" transform="rotate(60 30 30)" />
          <ellipse cx="30" cy="30" rx="22" ry="9" transform="rotate(120 30 30)" />
          <circle cx="30" cy="30" r="3" fill="#9a958c" />
        </g>
      </svg>

      <h1 className="final__title">EN MYSTISK REGNING??</h1>

      <div className="final__image-wrap">
        <img className="final__image" src="/regning.png" alt="Den gamle regning" />
      </div>

      <h2 className="final__subtitle">
        PÅ SPISEBORDET FINDER DU EN SAMMENFOLDET REGNING??
      </h2>

      <p className="final__body">
        DEN ER FRA EN SMYKKEFORRETNING, BELØBET ER HØJT, HØJERE END I PLEJER AT
        BRUGE, MEN DER STÅR IKKE PÅ HVAD?
      </p>
    </div>
  )
}
