import { useState } from 'react'
import ARScene from './components/ARScene.jsx'
import Overlay from './components/Overlay.jsx'
import './App.css'

export default function App() {
  const [started, setStarted] = useState(false) // brugeren har trykket START
  const [ready, setReady] = useState(false) // kamera + model klar
  const [tapped, setTapped] = useState(false) // modellen er blevet tappet

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

  if (!started) {
    return (
      <div className="start-screen">
        <h1>AR-kvittering</h1>
        <p>
          Tryk for at starte kameraet. Hold telefonen op — så ligger
          kvitteringen ca. en meter foran dig.
        </p>
        <button type="button" className="start-button" onClick={handleStart}>
          START
        </button>
      </div>
    )
  }

  return (
    <>
      <ARScene onReady={() => setReady(true)} onTap={() => setTapped(true)} />
      <Overlay tapped={tapped} />
      {!ready && (
        <div className="loading">
          Starter kamera… giv adgang til kamera og bevægelse når du bliver spurgt.
        </div>
      )}
    </>
  )
}
