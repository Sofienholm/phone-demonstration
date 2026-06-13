/**
 * Rent visuelt UI-lag ovenpå kameraet.
 * Får kun at vide om modellen er blevet tappet.
 */
export default function Overlay({ tapped }) {
  return (
    <div className="overlay">
      <div className="overlay__instruction">
        BEVÆG DIG FREM OG SE OM DU KAN FINDE NOGET
      </div>

      <div>
        <div
          className={`overlay__counter${tapped ? ' overlay__counter--done' : ''}`}
        >
          {tapped ? '1/1 FUNDET' : '0/1 FUNDET'}
        </div>

        {!tapped && (
          <div className="overlay__hint">
            Tryk på kvitteringen for at starte animationen
          </div>
        )}
      </div>
    </div>
  )
}
