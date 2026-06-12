import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js'

/**
 * ARScene starter kameraet, tracker billed-markøren (targets.mind),
 * viser GLB-modellen ovenpå markøren og afspiller dens animation ved tap.
 *
 * Props (callbacks til UI'en i App):
 *  - onReady():  kaldes når kamera + model er klar
 *  - onFound():  kaldes når markøren kommer i syne
 *  - onLost():   kaldes når markøren forsvinder
 *  - onTap():    kaldes når brugeren tapper PÅ kvitteringen
 */
export default function ARScene({ onReady, onFound, onLost, onTap }) {
  const containerRef = useRef(null)

  // Gem callbacks i refs, så useEffect kun kører én gang (ikke ved hver render)
  const cb = useRef({ onReady, onFound, onLost, onTap })
  cb.current = { onReady, onFound, onLost, onTap }

  useEffect(() => {
    let mindarThree
    let action = null // animationen vi afspiller ved tap
    let model = null
    let mixer = null
    const clock = new THREE.Clock()
    let stopped = false

    const start = async () => {
      mindarThree = new MindARThree({
        container: containerRef.current,
        imageTargetSrc: '/targets.mind',
        // Vi laver vores egen overlay, så slå MindARs indbyggede UI fra
        uiScanning: false,
        uiLoading: false,
        uiError: false,
      })

      const { renderer, scene, camera } = mindarThree

      // Lys så modellen kan ses
      scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.2))
      const dir = new THREE.DirectionalLight(0xffffff, 1.0)
      dir.position.set(1, 2, 1)
      scene.add(dir)

      // Anchor 0 = første (eneste) billede i targets.mind
      const anchor = mindarThree.addAnchor(0)

      // Indlæs GLB
      const gltf = await new GLTFLoader().loadAsync('/kvi4.glb')
      model = gltf.scene
      model.scale.set(0.5, 0.5, 0.5) // juster hvis modellen er for stor/lille
      model.position.set(0, 0, 0)
      anchor.group.add(model)

      // Forbered animationen (afspilles først ved tap)
      if (gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model)
        action = mixer.clipAction(gltf.animations[0])
        action.loop = THREE.LoopOnce
        action.clampWhenFinished = true // bliv på sidste frame i stedet for at hoppe tilbage
      }

      // Marker fundet / mistet -> opdater UI
      anchor.onTargetFound = () => cb.current.onFound?.()
      anchor.onTargetLost = () => cb.current.onLost?.()

      // Tap-til-afspil via raycast mod modellen
      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()
      const handleTap = (event) => {
        if (!model) return
        const rect = renderer.domElement.getBoundingClientRect()
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)
        const hits = raycaster.intersectObject(model, true)
        if (hits.length > 0) {
          playAnimation()
          cb.current.onTap?.()
        }
      }
      renderer.domElement.addEventListener('pointerdown', handleTap)
      cleanupTap = () =>
        renderer.domElement.removeEventListener('pointerdown', handleTap)

      const playAnimation = () => {
        if (!action) return
        action.reset()
        action.play()
      }

      await mindarThree.start() // beder om kamera-tilladelse og starter tracking
      if (stopped) return
      cb.current.onReady?.()

      renderer.setAnimationLoop(() => {
        if (mixer) mixer.update(clock.getDelta())
        renderer.render(scene, camera)
      })
    }

    let cleanupTap = () => {}
    start().catch((err) => {
      console.error('AR kunne ikke starte:', err)
      alert('AR kunne ikke starte: ' + (err?.message || err))
    })

    return () => {
      stopped = true
      cleanupTap()
      try {
        mindarThree?.renderer?.setAnimationLoop(null)
        mindarThree?.stop() // slukker kameraet
      } catch {
        // ignorer hvis det aldrig nåede at starte
      }
    }
  }, [])

  return <div ref={containerRef} className="ar-container" />
}
