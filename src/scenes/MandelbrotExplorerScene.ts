/* eslint-disable @typescript-eslint/no-non-null-assertion */
// Dude Particle Shooter , Roland Csibrei, 2021

import {
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
  Color4,
  Mesh,
  GlowLayer,
  Vector2,
  Texture,
  Scalar,
  Sound,
  KeyboardEventTypes,
  ShaderMaterial,
  Vector4,
  PostProcess,
  UniversalCamera,
  PointerEventTypes,
  Axis
} from '@babylonjs/core'
import '@babylonjs/loaders'

// import { console3 } from '../utils/console3'
import { BaseScene } from './BaseScene'
import defaulValues from './mandelbrot.config'
export class MandelbrotExplorerScene extends BaseScene {
  private _material?: ShaderMaterial
  private _postProcess?: PostProcess

  private _projectionCanvas?: Mesh

  private _ticks = 0

  private _music!: Sound

  private _area = new Vector4(-0.228556, -0.65227, 4, 4)
  private _angle = 0
  private _smoothAngle = 0
  private _maxIter = 20
  private _palette = 0
  private _glow = 1
  private _paletteAdd = 0.00001
  private _repeat = 2
  private _speed = 0.1
  private _stripeFactor = 0.2
  private _symmetry = 0
  private _displayUVs = 0

  private _scale = 10
  private _smoothScale = 60
  private _position = new Vector2(0, 0)
  private _smoothPosition = new Vector2(0, 0)

  private get _uniCamera() {
    return <UniversalCamera>this._camera
  }

  constructor(canvas: HTMLCanvasElement) {
    super(canvas)
  }

  public setupRenderLoop() {
    this._playMusic()

    this._engine.runRenderLoop(() => {
      this._scene.render()
    })
  }

  public async showDebugLayer() {
    await this._scene.debugLayer.show({
      embedMode: false,
      overlay: true
    })
  }

  public async hideDebugLayer() {
    await this._scene.debugLayer.hide()
  }

  public toggleMute() {
    if (this._music?.isPlaying) {
      this._music.pause()
    } else {
      this._music.play()
    }
  }

  public resetPosition() {
    this._position = new Vector2(defaulValues.positionX, defaulValues.positionY)
    this._scale = defaulValues.scale
  }

  public resetAll() {
    this.resetPosition()
    this._speed = defaulValues.speed
    this._repeat = defaulValues.repeat
    this._symmetry = defaulValues.symmetry
    this._maxIter = defaulValues.maxIter
    this._palette = defaulValues.palette
    this._stripeFactor = defaulValues.stripeFactor
    this._glow = defaulValues.glow
    this._angle = defaulValues.angle
  }

  public update(maxIter: number, repeat: number, speed: number, symmetry: number, displayUVs: number, stripeFactor: number, glow: number, palette = 0) {
    this._maxIter = maxIter
    this._repeat = repeat
    this._speed = speed
    this._symmetry = symmetry
    this._displayUVs = displayUVs
    this._stripeFactor = stripeFactor
    this._glow = glow
  }

  private async _createMandelbrotExplorerDemo() {
    // console3.create(this._engine, this._scene)
    // console3.log('Info', '')

    await this._createSounds()
    await this._createShaderMaterial()
    this._createProjectionCanvas()
    this._setupKeyboard()
    this._setupMouse()
    this._playMusic()
  }

  private _createProjectionCanvas() {
    const plane = Mesh.CreatePlane('projectionCanvas', 10, this._scene)
    this._projectionCanvas = plane

    plane.scaling.x = this._engine.getRenderWidth() / this._engine.getRenderHeight()
    if (this._material) {
      plane.material = this._material
    }
  }

  private async _createShaderMaterial() {
    return new Promise((resolve, reject) => {
      const mat = new ShaderMaterial('mandelbrot', this._scene, './mandelbrot/mandelbrot', {
        attributes: ['position', 'uv'],
        uniforms: ['worldViewProjection', 'time'],

        needAlphaBlending: true,
        needAlphaTesting: true
      })
      mat.backFaceCulling = false
      this._material = mat

      this._scene.onBeforeRenderObservable.add(() => {
        const width = this._engine.getRenderWidth()
        const height = this._engine.getRenderHeight()
        const aspect = width / height

        this._scale = Math.min(this._scale, 16)
        if (this._palette > 0.996 || this._palette < 0) {
          this._paletteAdd = -this._paletteAdd
        }
        // console3.logd('palette', this._palette)

        this._smoothPosition = Vector2.Lerp(this._smoothPosition, this._position, 0.03)
        this._smoothScale = Scalar.Lerp(this._smoothScale, this._scale, 0.03)
        this._smoothAngle = Scalar.Lerp(this._smoothAngle, this._angle, 0.03)

        let scaleX = this._smoothScale
        let scaleY = this._smoothScale
        if (aspect > 1) {
          scaleY /= aspect
        } else {
          scaleX *= aspect
        }
        this._area.z = scaleX
        this._area.w = scaleY

        this._area.x = this._smoothPosition.x
        this._area.y = this._smoothPosition.y

        // console3.logd('scaleX', scaleX)
        // console3.logd('scaleY', scaleY)
        // console3.logd('posX', this._area.x)
        // console3.logd('posY', this._area.y)

        if (this._material) {
          this._material.setVector4('area', this._area)
          this._material.setFloat('angle', this._smoothAngle)
          this._material.setFloat('maxIter', this._maxIter)
          this._material.setFloat('palette', this._palette)
          this._material.setFloat('repeat', this._repeat)
          this._material.setFloat('speed', this._speed)
          this._material.setInt('symmetry', this._symmetry)
          this._material.setInt('displayUVs', this._displayUVs)
          this._material.setFloat('stripeFactor', this._stripeFactor)
          this._material.setFloat('glow', this._glow)

          this._material.setFloat('time', this._ticks / 144)
        }

        this._palette += this._paletteAdd
        this._ticks++
      })

      const palette = 'palette-blurred.png'
      const paletteTexture = new Texture(`mandelbrot/${palette}`, this._scene, undefined, undefined, undefined, () => {
        mat.setTexture('paletteTexture', paletteTexture)

        resolve(paletteTexture)
      })
    })
  }

  private _setupKeyboard() {
    this._scene.onKeyboardObservable.add(kbInfo => {
      const key = kbInfo.event.key
      // console3.logd('key', key)
      switch (kbInfo.type) {
        case KeyboardEventTypes.KEYDOWN:
          if (key === 'ArrowUp') {
            this._scale *= 0.97
          }
          if (key === 'ArrowDown') {
            this._scale *= 1.03
          }

          //

          if (key === 'q') {
            this._angle += 0.05
          }
          if (key === 'e') {
            this._angle -= 0.05
          }

          let dir = new Vector2(0.1 * this._scale, 0)
          const s = Math.sin(this._angle)
          const c = Math.cos(this._angle)
          dir = new Vector2(dir.x * c, dir.x * s)

          if (key === 'a') {
            this._position = this._position.subtract(dir)
          }
          if (key === 'd') {
            this._position = this._position.add(dir)
          }

          dir = new Vector2(-dir.y, dir.x)
          if (key === 'w') {
            this._position = this._position.add(dir)
          }
          if (key === 's') {
            this._position = this._position.subtract(dir)
          }
          break
        case KeyboardEventTypes.KEYUP:
          break
      }
    })
  }

  private _setupMouse() {
    let move = false
    let rotate = false
    this._scene.onPrePointerObservable.add(
      (pointerInfo, eventState) => {
        if (this._scene) {
          const event = pointerInfo.event as any
          // console3.logd('movement x', event.movementX)
          // console3.logd('movement y', event.movementY)
          let delta = 0
          if (event.wheelDelta) {
            delta = event.wheelDelta / 100
          } else if (event.detail) {
            delta = -event.detail / 100
          }

          if (rotate) {
            const sc = 0.001 // Math.log(this._scale + 1) * 0.0001
            const dx = event.movementX * sc
            this._angle += dx
          }
          if (move) {
            const sc = 0.001 // Math.log(this._scale + 1) * 0.0001
            const dx = event.movementX * sc
            const dy = event.movementY * sc

            let dir = new Vector2(sc * this._scale, 0)

            const s = Math.sin(this._angle)
            const c = Math.cos(this._angle)
            dir = new Vector2(dir.x * c, dir.x * s)

            if (event.movementX > 0) {
              this._position = this._position.subtract(dir)
            }
            if (event.movementX < 0) {
              this._position = this._position.add(dir)
            }

            dir = new Vector2(-dir.y, dir.x)
            if (event.movementY > 0) {
              this._position = this._position.add(dir)
            }
            if (event.movementY < 0) {
              this._position = this._position.subtract(dir)
            }
          }

          if (delta) {
            // console3.logd('delta', delta)
            if (delta > 0) {
              this._scale *= 1 - 0.01 * (this._scale + 2)
            } else {
              this._scale *= 1 + 0.01 * (this._scale + 2)
            }
          }
        }
      },
      PointerEventTypes.POINTERWHEEL | PointerEventTypes.POINTERMOVE,
      false
    )

    this._scene.onPointerDown = evt => {
      if (evt.button === 0) {
        this._scene.defaultCursor = 'move'

        move = true
        // console3.logd('mouseX', `${this._scene.pointerX}`)
        // console3.logd('mouseY', `${this._scene.pointerY}`)
      } else if (evt.button === 1) {
        rotate = true
      }
    }
    this._scene.onPointerUp = evt => {
      if (evt.button === 0) {
        this._scene.defaultCursor = 'auto'
        move = false
      } else if (evt.button === 1) {
        rotate = false
      }
    }
  }

  private _playMusic() {
    this._music?.play()
  }

  private async _createSounds(): Promise<void> {
    return new Promise(resolve => {
      const music = new Sound(
        'music',
        'mandelbrot/bensound-slowmotion.mp3',
        this._scene,
        () => {
          this._music = music
          resolve()
        },
        { loop: false, autoplay: false, volume: 0.6 }
      )
    })
  }

  createCamera() {
    const camera = new UniversalCamera('camera', new Vector3(0, 0, -10), this._scene)
    this._camera = camera

    camera.setTarget(new Vector3(0, 0, 0))
  }

  createLight() {}

  public async initScene() {
    this._scene.clearColor = new Color4(0, 0, 0, 1)
    this.createCamera()
    this.createLight()

    await this._createMandelbrotExplorerDemo()
    // console3.hide()
  }

  /*
  private async _createPostProcessShader() {
    const pp = new PostProcess(
      'mandelbrot',
      './mandelbrotpp',
      ['area', 'angle', 'maxIter', 'palette', 'repeat', 'speed', 'symmetry', 'time'],
      ['paletteTexture'],
      1,
      this._camera
    )

    pp.onApply = effect => {
      const palette = 'palette-blurred.png'
      const paletteTexture = new Texture(`textures/mandelbrot/${palette}`, this._scene)
      effect.setTexture('paletteTexture', paletteTexture)

      this._scene.onBeforeRenderObservable.add(() => {
        const width = this._engine.getRenderWidth()
        const height = this._engine.getRenderHeight()
        const aspect = width / height

        this._smoothPosition = Vector2.Lerp(this._smoothPosition, this._position, 0.003)
        this._smoothScale = Scalar.Lerp(this._smoothScale, this._scale, 0.003)

        let scaleX = this._smoothScale
        let scaleY = this._smoothScale
        if (aspect > 1) {
          scaleY /= aspect
        } else {
          scaleX *= aspect
        }

        this._area.z = scaleX
        this._area.w = scaleY

        this._area.x = this._smoothPosition.x
        this._area.y = this._smoothPosition.y

        effect.setVector4('area', this._area)
        effect.setFloat('angle', this._angle)
        effect.setFloat('maxIter', this._maxIter)
        effect.setFloat('palette', this._palette)
        effect.setFloat('repeat', this._repeat)
        effect.setFloat('speed', this._speed)
        effect.setFloat('symmetry', this._symmetry)

        effect.setFloat('time', this._ticks / 100_000)

        this._ticks++
      })
    }
  }
  */
}
