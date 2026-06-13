import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

/**
 * Markerløs AR (3DOF):
 *  - Kameraet vises som baggrund (getUserMedia).
 *  - three-kameraet roteres af telefonens gyroskop (deviceorientation).
 *  - Modellen placeres ÉN gang foran dig og bliver liggende i rummet —
 *    drejer du telefonen væk og tilbage, er den der stadig.
 *  - Tap PÅ modellen: afspiller animationen OG glider tæt på, vendt mod dig.
 *
 *  >>> Alle tal du normalt vil ændre (afstand, størrelse, slutposition osv.)
 *      ligger samlet i SETTINGS-blokken lige inde i useEffect nedenfor. <<<
 *
 * Props:
 *  - onReady(): kamera + model klar
 *  - onTap():   brugeren tappede på modellen
 */
export default function ARScene({ onReady, onTap }) {
  const containerRef = useRef(null)
  const cb = useRef({ onReady, onTap })
  cb.current = { onReady, onTap }

  useEffect(() => {
    // ══════════════════════════════════════════════════════════════════
    //  JUSTÉR HER  —  alle de tal du normalt vil pille ved, samlet ét sted.
    //  Ret tallet, gem, kør "npm run build" og redeploy.
    // ══════════════════════════════════════════════════════════════════
    const SETTINGS = {
      // --- START (hvor modellen ligger FØR man tapper) ---
      startAfstand: 2.0, // meter foran dig (større tal = længere væk)
      startHoejde: -0.2, // højde: negativt = lavere, positivt = højere
      skala: 0.5, // modellens størrelse (samme på alle akser)

      // --- SLUT (kvitteringens position EFTER man tapper) ---
      slutAfstand: 1.0, // meter fra kameraet (mindre tal = tættere på)
      slutForskydX: 0.0, // sidelæns: + = mod højre, - = mod venstre
      slutForskydY: 0.2, // lodret:  + = op,        - = ned

      // Modellen ligger FLADT/vandret ved start. Disse to REJSER den op,
      // så man kan læse kvitteringen når den er kommet tæt på:
      slutVipGrader: -90, // VIP op fra vandret -> lodret (prøv 90 eller -90)
      slutDrejGrader: 0, // drej om lodret akse hvis fladen vender forkert (prøv 180)

      glideHastighed: 0.12, // hvor hurtigt den glider hen (0.05 = blødt, 0.3 = hurtigt)
    }

    const container = containerRef.current
    let renderer, scene, camera
    let mixer = null
    let action = null
    let model = null
    let stream = null
    let placed = false
    let allowFallbackPlace = false
    const clock = new THREE.Clock()
    let stopped = false

    // --- Tween-state til "kom tættere på" ved tap ---
    const targetPos = new THREE.Vector3()
    const targetQuat = new THREE.Quaternion()
    const _aim = new THREE.Object3D() // hjælpeobjekt til at beregne rotation
    let moving = false

    // --- Gyroskop-state ---
    let deviceOrientation = null
    let screenOrientation = getScreenOrientation()
    const onDeviceOrientation = (e) => {
      if (e.alpha === null || e.alpha === undefined) return
      deviceOrientation = e
    }
    const onScreenOrientation = () => {
      screenOrientation = getScreenOrientation()
    }

    // --- Kamera-video som baggrund ---
    const video = document.createElement('video')
    video.setAttribute('playsinline', '') // ellers åbner iOS video i fullscreen
    video.muted = true
    Object.assign(video.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    })
    container.appendChild(video)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    const handleTap = (event) => {
      if (!model || !placed) return
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObject(model, true)
      if (hits.length > 0) {
        // ===== KVITTERINGENS SLUTPOSITION beregnes her =====
        // (styres af SETTINGS.slut* ovenfor — du behøver ikke røre koden her)

        // Retning fra kameraet: "frem", "højre" og "op" lige nu
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion)

        // Slutposition = frem * afstand + sidelæns + lodret forskydning
        targetPos
          .set(0, 0, 0)
          .addScaledVector(forward, SETTINGS.slutAfstand)
          .addScaledVector(right, SETTINGS.slutForskydX)
          .addScaledVector(up, SETTINGS.slutForskydY)

        // Vend modellen mod dig (mod kameraet i origo)
        _aim.position.copy(targetPos)
        _aim.up.set(0, 1, 0)
        _aim.lookAt(0, 0, 0)
        targetQuat.copy(_aim.quaternion)

        // Vip modellen OP fra vandret til lodret, så kvitteringen kan læses
        // (rotation om modellens egen X-akse — styres af SETTINGS.slutVipGrader)
        if (SETTINGS.slutVipGrader !== 0) {
          targetQuat.multiply(
            new THREE.Quaternion().setFromAxisAngle(
              new THREE.Vector3(1, 0, 0),
              THREE.MathUtils.degToRad(SETTINGS.slutVipGrader),
            ),
          )
        }

        // Ekstra spin om lodret akse hvis fladen STADIG vender forkert
        // (SETTINGS.slutDrejGrader)
        if (SETTINGS.slutDrejGrader !== 0) {
          targetQuat.multiply(
            new THREE.Quaternion().setFromAxisAngle(
              new THREE.Vector3(0, 1, 0),
              THREE.MathUtils.degToRad(SETTINGS.slutDrejGrader),
            ),
          )
        }

        moving = true // sætter glide-bevægelsen i gang (sker i loop())

        playAnimation()
        cb.current.onTap?.()
      }
    }

    const playAnimation = () => {
      if (!action) return
      action.reset()
      action.play()
    }

    const onResize = () => {
      if (!renderer || !camera) return
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    const loop = () => {
      // Roter kameraet med telefonen
      if (deviceOrientation) {
        setCameraQuaternion(camera.quaternion, deviceOrientation, screenOrientation)
      }

      // Placér modellen én gang foran den retning kameraet pegede ved start
      // (afstand/højde styres af SETTINGS.startAfstand / startHoejde)
      if (!placed && model && (deviceOrientation || allowFallbackPlace)) {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
        model.position.copy(forward.multiplyScalar(SETTINGS.startAfstand))
        model.position.y += SETTINGS.startHoejde
        model.visible = true
        placed = true
      }

      // Glid hen til slutpositionen når man har tappet (hastighed = SETTINGS.glideHastighed)
      if (moving && model) {
        model.position.lerp(targetPos, SETTINGS.glideHastighed)
        model.quaternion.slerp(targetQuat, SETTINGS.glideHastighed)
        if (model.position.distanceTo(targetPos) < 0.01) {
          model.position.copy(targetPos)
          model.quaternion.copy(targetQuat)
          moving = false
        }
      }

      if (mixer) mixer.update(clock.getDelta())
      if (renderer) renderer.render(scene, camera)
    }

    const start = async () => {
      // Bagkamera
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      video.srcObject = stream
      await video.play()

      // three-opsætning (kameraet bliver i origo og roterer kun)
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setClearAlpha(0) // gennemsigtig, så kamera-videoen ses bagved
      Object.assign(renderer.domElement.style, { position: 'absolute', inset: '0' })
      container.appendChild(renderer.domElement)

      scene = new THREE.Scene()
      camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        1000,
      )

      scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.2))
      const dir = new THREE.DirectionalLight(0xffffff, 1.0)
      dir.position.set(1, 2, 1)
      scene.add(dir)

      // Model — henter /kvi4.glb fra public-mappen
      const gltf = await new GLTFLoader().loadAsync('/kvi4.glb')
      model = gltf.scene
      model.scale.setScalar(SETTINGS.skala) // størrelse (SETTINGS.skala ovenfor)
      model.visible = false // skjult indtil den placeres i loop()
      scene.add(model)

      // Forbered animationen. Vi bruger den FØRSTE animation i filen.
      // Har din GLB flere, og du vil have en anden: skift [0] til fx [1].
      if (gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model)
        action = mixer.clipAction(gltf.animations[0])
        action.loop = THREE.LoopOnce // afspil én gang (sæt THREE.LoopRepeat for at gentage)
        action.clampWhenFinished = true // bliv stående på sidste frame
      }

      window.addEventListener('deviceorientation', onDeviceOrientation)
      window.addEventListener('orientationchange', onScreenOrientation)
      window.addEventListener('resize', onResize)
      renderer.domElement.addEventListener('pointerdown', handleTap)

      // Fallback (fx desktop uden gyroskop): placér ligeud efter kort tid
      setTimeout(() => {
        allowFallbackPlace = true
      }, 800)

      if (stopped) return
      cb.current.onReady?.()
      renderer.setAnimationLoop(loop)
    }

    start().catch((err) => {
      console.error('AR kunne ikke starte:', err)
      alert('Kunne ikke starte kamera/sensor: ' + (err?.message || err))
    })

    return () => {
      stopped = true
      renderer?.setAnimationLoop(null)
      window.removeEventListener('deviceorientation', onDeviceOrientation)
      window.removeEventListener('orientationchange', onScreenOrientation)
      window.removeEventListener('resize', onResize)
      renderer?.domElement?.removeEventListener('pointerdown', handleTap)
      stream?.getTracks().forEach((t) => t.stop()) // sluk kameraet
      if (renderer) {
        renderer.dispose()
        renderer.domElement?.remove()
      }
      video.remove()
    }
  }, [])

  return <div ref={containerRef} className="ar-container" />
}

// --- Hjælpere til gyroskop-rotation (samme matematik som three's
//     DeviceOrientationControls, inlinet så vi ikke afhænger af den fil) ---

function getScreenOrientation() {
  const angle =
    (typeof screen !== 'undefined' && screen.orientation && screen.orientation.angle) ??
    window.orientation ??
    0
  return THREE.MathUtils.degToRad(angle)
}

const _zee = new THREE.Vector3(0, 0, 1)
const _euler = new THREE.Euler()
const _q0 = new THREE.Quaternion()
const _q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)) // -90° om x

function setCameraQuaternion(quaternion, e, orient) {
  const alpha = THREE.MathUtils.degToRad(e.alpha) // z
  const beta = THREE.MathUtils.degToRad(e.beta) // x
  const gamma = THREE.MathUtils.degToRad(e.gamma) // y
  _euler.set(beta, alpha, -gamma, 'YXZ')
  quaternion.setFromEuler(_euler)
  quaternion.multiply(_q1) // kig mod horisonten i stedet for jorden
  quaternion.multiply(_q0.setFromAxisAngle(_zee, -orient)) // tag højde for skærmrotation
}
