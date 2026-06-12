import { useState } from 'react'
import ARScene from './components/ARScene.jsx'
import Overlay from './components/Overlay.jsx'
import './App.css'

export default function App() {
  const [ready, setReady] = useState(false) // kamera + model klar
  const [found, setFound] = useState(false) // markøren i syne lige nu
  const [tapped, setTapped] = useState(false) // kvitteringen er blevet tappet

  return (
    <>
      <ARScene
        onReady={() => setReady(true)}
        onFound={() => setFound(true)}
        onLost={() => setFound(false)}
        onTap={() => setTapped(true)}
      />

      <Overlay found={found} tapped={tapped} />

      {!ready && (
        <div className="loading">
          Starter kamera… giv adgang til kameraet når du bliver spurgt.
        </div>
      )}
    </>
  )
}
