import { useEffect, useState } from 'react'
import ARScene from './components/ARScene.jsx'
import Overlay from './components/Overlay.jsx'
import FinalScreen from './components/FinalScreen.jsx'
import './App.css'

export default function App() {
  const [started, setStarted] = useState(false) // brugeren har trykket START
  const [ready, setReady] = useState(false) // kamera + model klar
  const [tapped, setTapped] = useState(false) // modellen er blevet tappet
  const [finished, setFinished] = useState(false) // animationen er færdig -> slutskærm
  const [arRemoved, setArRemoved] = useState(false) // fjern AR FØRST når kortet dækker

  // Når slutskærmen er toner ind (dækker hele skærmen), fjerner vi AR'en bagved.
  // Det giver en blød crossfade i stedet for et sort glimt.
  useEffect(() => {
    if (!finished) return
    const t = setTimeout(() => setArRemoved(true), 700)
    return () => clearTimeout(t)
  }, [finished])

  const handleStart = async () => {
    // iOS 13+ kræver at vi beder om bevægelses-sensoren INDE i et tap
    try {
      const DOE = window.DeviceOrientationEvent
      if (DOE && typeof DOE.requestPermission === 'function') {
        await DOE.requestPermission()
      }
    } catch {
      // ignorér – Android/desktop kræver ikke tilladelse
    }
    setStarted(true)
  }

  // 1) START-skærm
  if (!started) {
    return (
      <div className="start-screen">
        <h1>AR-kvittering</h1>
        <p>
          Tryk for at starte kameraet. Hold telefonen op — så ligger
          kvitteringen ca. to meter foran dig.
        </p>
        <button type="button" className="start-button" onClick={handleStart}>
          START
        </button>
      </div>
    )
  }

  // 2) AR-visning + 3) slutskærm der toner ind ovenpå (crossfade)
  return (
    <>
      {/* AR'en bliver liggende under slutskærmen indtil den er tonet helt ind */}
      {!arRemoved && (
        <ARScene
          onReady={() => setReady(true)}
          onTap={() => setTapped(true)}
          onFinished={() => setFinished(true)}
        />
      )}

      {/* Overlay (taleboble m.m.) vises kun før slutskærmen */}
      {!finished && <Overlay tapped={tapped} />}

      {/* Slutskærmen lægges OVENPÅ og toner ind */}
      {finished && <FinalScreen />}

      {!ready && !finished && (
        <div className="loading">
          Starter kamera… giv adgang til kamera og bevægelse når du bliver spurgt.
        </div>
      )}
    </>
  )
}
