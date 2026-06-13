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
