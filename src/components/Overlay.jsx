/**
 * Rent visuelt UI-lag ovenpå kameraet. Ingen logik — den får bare
 * at vide om markøren er fundet (found) og om kvitteringen er tappet (tapped).
 */
export default function Overlay({ found, tapped }) {
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

        {found && !tapped && (
          <div className="overlay__hint">Tryk på kvitteringen</div>
        )}
      </div>
    </div>
  )
}
