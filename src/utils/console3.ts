/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { AbstractMesh, Color3, Color4, Engine, Material, Mesh, MeshBuilder, Scene, StandardMaterial, Vector2, Vector3 } from '@babylonjs/core'
import * as GUI from '@babylonjs/gui'

interface Console3CustomOptions {
  floatPrecision?: number
  mainPanelWidth?: number
  consolePanelWidth?: number
  observerPanelWidthInPixels?: number
  observerPanelColor?: Color3
  debuggerHitPanelColor?: Color3
  highliteHitPanelColor?: Color3
  meshBadgeLinkXOffsetInPixels?: number
  meshBadgeLinkYOffsetInPixels?: number
  consolePanelAlpha?: number
  mainPanelAlpha?: number
  linesAlpha?: number
  maxConsoleEntities?: number
  consoleLineHeightInPixels?: number
  consolePanelHeightInPixels?: number
}

interface Console3Options {
  floatPrecision: number
  mainPanelWidth: number
  consolePanelWidth: number
  observerPanelWidthInPixels: number
  observerPanelColor: Color3
  debuggerHitPanelColor: Color3
  highliteHitPanelColor: Color3
  meshBadgeLinkXOffsetInPixels: number
  meshBadgeLinkYOffsetInPixels: number
  consolePanelAlpha: number
  mainPanelAlpha: number
  linesAlpha: number
  maxConsoleLineEntities: number
  consoleLineHeightInPixels: number
  consolePanelHeightInPixels: number
}

const DefaultConsole3Options: Console3Options = {
  floatPrecision: 4,
  mainPanelWidth: 1,
  consolePanelWidth: 1,
  observerPanelWidthInPixels: 160,
  observerPanelColor: Color3.Gray(),
  debuggerHitPanelColor: Color3.Red(),
  highliteHitPanelColor: Color3.Yellow(),
  meshBadgeLinkXOffsetInPixels: 100,
  meshBadgeLinkYOffsetInPixels: 200,
  consolePanelAlpha: 0.4,
  mainPanelAlpha: 0.4,
  linesAlpha: 0.4,
  maxConsoleLineEntities: 10,
  consoleLineHeightInPixels: 12,
  consolePanelHeightInPixels: 10 * 12
}

enum Console3LoggedEntityType {
  Text,
  Float,
  Boolean,
  Mesh,
  Vector2,
  Vector3,
  Color3,
  Color4,
  Vector3Array
}

enum Side {
  Left,
  Right
}

enum SharedMaterials {
  Vector3ArrayLine,
  Vector3ArrayMarker
}

interface Console3LoggedEntityTypeMapping {
  color: Color3
  drawFunction: (entity: Console3LoggedEntity) => void
  widthInPixels?: number
}

interface Console3LoggedEntityOption {
  docked?: boolean
  linkedWithMesh?: boolean
  linkedWithVector?: boolean
  console?: boolean
  mapping?: Console3LoggedEntityTypeMapping
  widthInPixels?: number
  color?: Color3
}
class Console3LoggedEntity {
  public textInputs: GUI.InputText[] = []
  public debugWhen?: (value: any) => boolean
  public highliteWhen?: (value: any) => boolean
  public refreshRate = 1
  public ticks = 0
  public millis = 0

  public getObject<T>() {
    if (this.property) {
      return <T>this.source[this.property]
    }
    return <T>this.source
  }

  public getLinkedMesh() {
    return this.getObject<AbstractMesh>()
  }

  public debug(debugWhen?: (value: any) => boolean) {
    this.debugWhen = debugWhen
    return this
  }

  public highlite(highliteWhen?: (value: any) => boolean) {
    this.highliteWhen = highliteWhen
    return this
  }

  constructor(
    public name: string,
    public type: Console3LoggedEntityType,
    public source: any,
    public property: string,
    public options: Console3LoggedEntityOption
  ) {}
}

export class console3 {
  private static instance: console3

  public static create(engine: Engine, scene: Scene, options?: Console3CustomOptions, gui?: GUI.AdvancedDynamicTexture) {
    if (!console3.instance) {
      console3.instance = new console3(engine, scene, options, gui)
    }
    return console3.instance
  }

  public static hide() {
    console3.instance._consoleVisible = false
    console3.instance._consoleLinesVisible = false
  }

  public static show() {
    console3.instance._consoleVisible = true
    console3.instance._consoleLinesVisible = true
  }

  public static log(object: any, property = '') {
    const name = 'default'
    return console3.instance?._log0(name, object, property, 1)
  }

  public static logv(name: string, vectors: Vector3[], property = '') {
    return console3.instance?._logv(name, vectors, property, 1)
  }

  public static logd(name: string, object: any, property = '') {
    return console3.instance?._logd(name, object, property, 1)
  }
  public static logd5(name: string, object: any, property = '') {
    return console3.instance?._logd(name, object, property, 5)
  }
  public static logd30(name: string, object: any, property = '') {
    return console3.instance?._logd(name, object, property, 30)
  }
  public static logd60(name: string, object: any, property = '') {
    return console3.instance?._logd(name, object, property, 60)
  }
  public static logd120(name: string, object: any, property = '') {
    return console3.instance?._logd(name, object, property, 120)
  }

  // floating
  public static logf(name: string, object: any, property = '') {
    return console3.instance?._logf(name, object, property, 1)
  }

  public static getTicks() {
    return console3.instance?._ticks
  }

  public static getTime() {
    return Date.now() - console3.instance?._timeSpawned
  }

  public static getTimeFormatted(time?: number) {
    const t = time ?? console3.getTime()
    const t1000 = t / 1000
    const millis = t1000 - Math.floor(t1000)
    const secs = Math.floor(t1000)

    const t60000 = t / 60000
    const mins = Math.floor(t60000)

    let minsLabel = mins > 0 ? mins.toString() : '0'
    let secsLabel = secs > 0 ? secs.toString() : '0'
    let millisLabel = Math.floor(millis * 1000).toString()
    const timeFormatted = (mins < 10 ? '0' + minsLabel : minsLabel) + ':' + (secs < 10 ? '0' + secsLabel : secsLabel) + '.' + millisLabel
    return timeFormatted
  }

  private _entities = new Map<string, Console3LoggedEntity>()

  private _consoleEntities: Console3LoggedEntity[] = []
  private _consoleLineControls: GUI.InputText[] = []
  private _consolePaused = false
  private _consoleVisible = true
  private _consoleLinesVisible = true

  private _entityTypeMappings = new Map<Console3LoggedEntityType, Console3LoggedEntityTypeMapping>()

  private _mainPanel!: GUI.StackPanel
  private _consoleLinesPanel!: GUI.StackPanel | GUI.ScrollViewer
  private _buttonPanel!: GUI.StackPanel
  private _scrollViewer!: GUI.ScrollViewer

  private _side: Side = Side.Right

  private _ticks = 0
  private _timeSpawned = 0
  private _options: Console3Options

  private _sharedMaterials = new Map<SharedMaterials, Material>()

  constructor(private _engine: Engine, private _scene: Scene, options?: Console3CustomOptions, private _gui?: GUI.AdvancedDynamicTexture) {
    this._timeSpawned = Date.now()

    this._gui = this._gui ?? GUI.AdvancedDynamicTexture.CreateFullscreenUI('Console3UI', true, this._scene)

    this._options = options ? { ...DefaultConsole3Options, ...options } : { ...DefaultConsole3Options }

    this._createSharedMaterials()
    this._createMappings()
    this._createMainPanel()
    this._createConsolePanel()

    this._createButtons()

    this._scene.onBeforeRenderObservable.add(() => {
      if (!this._consolePaused) {
        this._draw()
      }
      // this._offsetInPixelsIfSceneExplorer();
    })
  }

  private _createSharedMaterials() {
    const matVectorArrayLine = new StandardMaterial('console3-shared-material-vector3-array-line', this._scene)
    matVectorArrayLine.emissiveColor = new Color3(0, 0.4, 0)
    matVectorArrayLine.alpha = 0.4
    this._setSharedMaterial(SharedMaterials.Vector3ArrayLine, matVectorArrayLine)

    const matVectorArrayMarker = new StandardMaterial('console3-shared-material-vector3-array-marker', this._scene)
    matVectorArrayMarker.emissiveColor = new Color3(0.4, 0, 0)
    matVectorArrayMarker.alpha = 0.4
    this._setSharedMaterial(SharedMaterials.Vector3ArrayMarker, matVectorArrayMarker)
  }

  private _setSharedMaterial(materialKey: SharedMaterials, material: Material) {
    this._sharedMaterials.set(materialKey, material)
  }

  private _getSharedMaterial(materialKey: SharedMaterials) {
    return this._sharedMaterials.get(materialKey) ?? null
  }

  private _createMappings() {
    const entityTypeMappings = new Map<Console3LoggedEntityType, Console3LoggedEntityTypeMapping>()

    entityTypeMappings.set(Console3LoggedEntityType.Text, {
      color: new Color3(0.4, 0.4, 0.4),
      drawFunction: entity => this._drawText(entity)
    })
    entityTypeMappings.set(Console3LoggedEntityType.Float, {
      color: new Color3(0.6, 0.6, 0.9),
      drawFunction: entity => this._drawFloat(entity)
    })
    entityTypeMappings.set(Console3LoggedEntityType.Boolean, {
      color: new Color3(0.9, 0.6, 0.6),
      drawFunction: entity => this._drawBoolean(entity)
    })
    entityTypeMappings.set(Console3LoggedEntityType.Mesh, {
      color: new Color3(0.0, 0.1, 0.7),
      drawFunction: entity => this._drawMesh(entity)
    })
    entityTypeMappings.set(Console3LoggedEntityType.Vector2, {
      color: new Color3(0.0, 0.7, 0.1),
      drawFunction: entity => this._drawVector2(entity)
    })
    entityTypeMappings.set(Console3LoggedEntityType.Vector3, {
      color: new Color3(0.0, 0.7, 0.1),
      drawFunction: entity => this._drawVector3(entity)
    })
    entityTypeMappings.set(Console3LoggedEntityType.Color3, {
      color: new Color3(0.0, 0.0, 0.0),
      drawFunction: entity => this._drawColor3(entity)
    })
    entityTypeMappings.set(Console3LoggedEntityType.Color4, {
      color: new Color3(0.0, 0.0, 0.0),
      drawFunction: entity => this._drawColor4(entity)
    })
    entityTypeMappings.set(Console3LoggedEntityType.Vector3Array, {
      color: new Color3(0.0, 0.0, 0.0),
      drawFunction: entity => this._drawVector3Array(entity)
    })
    this._entityTypeMappings = entityTypeMappings
  }

  private _drawText(entity: Console3LoggedEntity) {
    if (entity.textInputs) {
      entity.textInputs[0].text = console3._getObject<string>(entity)
    }
  }

  private _drawFloat(entity: Console3LoggedEntity) {
    if (entity.textInputs) {
      entity.textInputs[0].text = console3._getObject<number>(entity).toString()
    }
  }

  private _drawBoolean(entity: Console3LoggedEntity) {
    if (entity.textInputs) {
      entity.textInputs[0].text = console3._getObject<boolean>(entity).toString()
    }
  }

  private _drawMesh(entity: Console3LoggedEntity) {
    if (entity.textInputs) {
      const obj = console3._getObject<AbstractMesh>(entity)
      entity.textInputs[0].text = `${obj.position.x.toFixed(this._options.floatPrecision)}, ${obj.position.y.toFixed(
        this._options.floatPrecision
      )}, ${obj.position.z.toFixed(this._options.floatPrecision)} `
      entity.textInputs[1].text = `${obj.rotation.x.toFixed(this._options.floatPrecision)}, ${obj.rotation.y.toFixed(
        this._options.floatPrecision
      )}, ${obj.rotation.z.toFixed(this._options.floatPrecision)} `
      entity.textInputs[2].text = `${obj.scaling.x.toFixed(this._options.floatPrecision)}, ${obj.scaling.y.toFixed(
        this._options.floatPrecision
      )}, ${obj.scaling.z.toFixed(this._options.floatPrecision)} `
    }
  }

  private _drawVector2(entity: Console3LoggedEntity) {
    if (entity.textInputs) {
      const obj = console3._getObject<Vector2>(entity)
      entity.textInputs[0].text = `${obj.x.toFixed(this._options.floatPrecision)}, ${obj.y.toFixed(this._options.floatPrecision)}`
    }
  }

  private _drawVector3(entity: Console3LoggedEntity) {
    if (entity.textInputs) {
      const obj = console3._getObject<Vector3>(entity)
      entity.textInputs[0].text = `${obj.x.toFixed(this._options.floatPrecision)}, ${obj.y.toFixed(this._options.floatPrecision)}, ${obj.z.toFixed(
        this._options.floatPrecision
      )}`
    }
  }

  private _drawVector3Array(entity: Console3LoggedEntity) {
    // TODO: create object pool
    const markers = this._scene.meshes.filter(m => m.name.indexOf('console3-vector-array-marker') > -1)
    markers.forEach(m => {
      m.dispose()
    })

    const vectors = console3._getObject<Vector3[]>(entity)

    // tubes
    const tube = MeshBuilder.CreateTube(`console3-vector-array-marker`, { path: vectors, radius: 0.01, sideOrientation: Mesh.DOUBLESIDE }, this._scene)
    tube.material = this._getSharedMaterial(SharedMaterials.Vector3ArrayLine)

    // marker points
    vectors.forEach((v, idx) => {
      const arrayVectorMarker = Mesh.CreateSphere(`console3-vector-array-marker-${idx}`, 8, 0.08, this._scene)
      arrayVectorMarker.position = v
      arrayVectorMarker.material = this._getSharedMaterial(SharedMaterials.Vector3ArrayMarker)
    })
  }

  private _drawColor3(entity: Console3LoggedEntity) {
    if (entity.textInputs) {
      const obj = console3._getObject<Color3>(entity)
      entity.textInputs[0].text = `${obj.r.toFixed(this._options.floatPrecision)}, ${obj.g.toFixed(this._options.floatPrecision)}, ${obj.b.toFixed(
        this._options.floatPrecision
      )}`
      this._setColorEntityColor(entity.name, obj)
    }
  }

  private _drawColor4(entity: Console3LoggedEntity) {
    if (entity.textInputs) {
      const obj = console3._getObject<Color4>(entity)
      entity.textInputs[0].text = `${obj.r.toFixed(this._options.floatPrecision)}, ${obj.g.toFixed(this._options.floatPrecision)}, ${obj.b.toFixed(
        this._options.floatPrecision
      )}, , ${obj.a.toFixed(this._options.floatPrecision)}`
      this._setColorEntityColor(entity.name, obj)
    }
  }

  // Visual Console private methods

  private _offsetInPixelsIfSceneExplorer() {
    const sceneExplorerHost = document.getElementById('sceneExplorer')
    const inspectorHost = document.getElementById('actionTabs')
    const sceneExplorerOffset = sceneExplorerHost?.clientWidth ?? 0
    const inspectorOffset = inspectorHost?.clientWidth ?? 0
    this._mainPanel.paddingRightInPixels = 0
    this._mainPanel.paddingLeftInPixels = 0
    if (this._side === Side.Left && sceneExplorerHost) {
      this._mainPanel.paddingLeftInPixels = sceneExplorerOffset
      this._mainPanel.paddingRightInPixels = 0

      this._consoleLinesPanel.paddingLeftInPixels = sceneExplorerOffset
      this._consoleLinesPanel.paddingRightInPixels = 0
    } else if (this._side === Side.Right && inspectorHost) {
      this._mainPanel.paddingLeftInPixels = 0
      this._mainPanel.paddingRightInPixels = inspectorOffset

      this._consoleLinesPanel.paddingLeftInPixels = 0
      this._consoleLinesPanel.paddingRightInPixels = inspectorOffset
    }
  }

  private _createConsolePanel() {
    if (this._gui) {
      const scrollViewer = new GUI.ScrollViewer()
      this._scrollViewer = scrollViewer

      scrollViewer.thickness = 0
      scrollViewer.alpha = this._options.consolePanelAlpha
      scrollViewer.width = this._options.consolePanelWidth
      scrollViewer.heightInPixels = this._options.consolePanelHeightInPixels

      scrollViewer.verticalAlignment = GUI.StackPanel.VERTICAL_ALIGNMENT_BOTTOM

      scrollViewer.forceVerticalBar = true

      const consolePanel = new GUI.StackPanel()
      this._consoleLinesPanel = consolePanel
      consolePanel.name = 'console3-console-lines-panel'
      consolePanel.paddingBottomInPixels = 4
      consolePanel.zIndex = 1
      consolePanel.alpha = this._options.consolePanelAlpha

      this._createConsoleLines(consolePanel)

      this._gui.addControl(scrollViewer)
      scrollViewer.addControl(consolePanel)
    }
  }

  private _createMainPanel() {
    this._mainPanel = new GUI.StackPanel('console3-main-panel')
    this._mainPanel.horizontalAlignment = GUI.StackPanel.HORIZONTAL_ALIGNMENT_RIGHT
    this._mainPanel.verticalAlignment = GUI.StackPanel.VERTICAL_ALIGNMENT_TOP
    this._mainPanel.width = this._options.mainPanelWidth
    // this._mainPanel.height = 1
    this._gui?.addControl(this._mainPanel)
  }

  private _createButtons() {
    const buttonPanel = new GUI.StackPanel('console3-button-panel')
    buttonPanel.isVertical = false

    buttonPanel.horizontalAlignment = GUI.StackPanel.HORIZONTAL_ALIGNMENT_RIGHT
    buttonPanel.verticalAlignment = GUI.StackPanel.VERTICAL_ALIGNMENT_TOP
    buttonPanel.widthInPixels = 120
    buttonPanel.heightInPixels = 40
    this._buttonPanel = buttonPanel
    this._mainPanel.addControl(buttonPanel)

    // this._createSideToggleButton(buttonPanel);
    this._createInspectorButton(buttonPanel)
    this._createConsoleLinesToggleButton(buttonPanel)
    this._createConsoleToggleButton(buttonPanel)
    this._createPauseButton(buttonPanel)
  }

  private _createInspectorButton(parent: GUI.StackPanel) {
    const btn = GUI.Button.CreateSimpleButton('console3-button-inspector-toggle', 'D')
    btn.widthInPixels = 28
    btn.heightInPixels = 24
    btn.color = 'white'
    btn.fontSize = 12
    btn.background = '#222'
    btn.paddingRightInPixels = 4

    btn.horizontalAlignment = GUI.Button.HORIZONTAL_ALIGNMENT_RIGHT
    btn.onPointerUpObservable.add(() => {
      const isVisible = this._scene.debugLayer.isVisible()
      if (isVisible) {
        void this._scene.debugLayer.hide()
      } else {
        void this._scene.debugLayer.show({
          embedMode: false,
          overlay: false
        })
      }
      // this._scene.debugLayer.select();
    })
    parent.addControl(btn)
  }

  private _createConsoleLinesToggleButton(parent: GUI.StackPanel) {
    const btn = GUI.Button.CreateSimpleButton('console3-buttton-console-lines-toggle', 'C')
    btn.widthInPixels = 28
    btn.heightInPixels = 24
    btn.color = 'white'
    btn.fontSize = 12
    btn.background = '#444'
    btn.paddingRightInPixels = 4
    btn.onPointerUpObservable.add(() => {
      this._consoleLinesVisible = !this._consoleLinesVisible
    })
    parent.addControl(btn)
  }

  private _createConsoleToggleButton(parent: GUI.StackPanel) {
    const btn = GUI.Button.CreateSimpleButton('console3-button-console-toggle', 'O')
    btn.widthInPixels = 28
    btn.heightInPixels = 24
    btn.color = 'white'
    btn.fontSize = 12
    btn.background = '#666'
    btn.paddingRightInPixels = 4
    btn.onPointerUpObservable.add(() => {
      this._consoleVisible = !this._consoleVisible
    })
    parent.addControl(btn)
  }

  private _createPauseButton(parent: GUI.StackPanel) {
    const btn = GUI.Button.CreateSimpleButton('console3-button-console-pause', 'P')
    btn.widthInPixels = 28
    btn.heightInPixels = 24
    btn.color = 'white'
    btn.fontSize = 12
    btn.background = '#844'
    btn.onPointerUpObservable.add(() => {
      this._consolePaused = !this._consolePaused
    })
    parent.addControl(btn)
  }

  private _createSideToggleButton(parent: GUI.StackPanel) {
    const btn = GUI.Button.CreateSimpleButton('console3-button-side-toggle', '>')
    btn.widthInPixels = 28
    btn.heightInPixels = 24
    btn.color = 'white'
    btn.fontSize = 12
    btn.background = '#444'
    btn.rotation = Math.PI
    btn.paddingRightInPixels = 4
    btn.horizontalAlignment = GUI.Button.HORIZONTAL_ALIGNMENT_RIGHT
    btn.onPointerUpObservable.add(() => {
      const existingControls = this._gui?.getDescendants()
      if (this._side === Side.Left) {
        btn.rotation = Math.PI
        btn.horizontalAlignment = GUI.Button.HORIZONTAL_ALIGNMENT_RIGHT
        this._mainPanel.horizontalAlignment = GUI.StackPanel.HORIZONTAL_ALIGNMENT_RIGHT
        this._buttonPanel.horizontalAlignment = GUI.StackPanel.HORIZONTAL_ALIGNMENT_RIGHT
      } else {
        btn.rotation = 0

        btn.horizontalAlignment = GUI.Button.HORIZONTAL_ALIGNMENT_LEFT
        this._mainPanel.horizontalAlignment = GUI.StackPanel.HORIZONTAL_ALIGNMENT_LEFT
        this._buttonPanel.horizontalAlignment = GUI.StackPanel.HORIZONTAL_ALIGNMENT_LEFT
      }
      this._entities.forEach(e => {
        if (e.options.docked) {
          const panel = existingControls?.find(c => c.name == `console3-panel-${e.name}`)
          if (panel) {
            if (this._side === Side.Left) {
              panel.horizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_RIGHT
            } else {
              panel.horizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
            }
          }
        }
      })
      this._side = this._side === Side.Left ? Side.Right : Side.Left
    })

    parent.addControl(btn)
  }

  private _addObjectEntity(name: string, object: any, property: string, options: Console3LoggedEntityOption) {
    let type = Console3LoggedEntityType.Text
    let inputCount = 1
    const value = property !== '' ? object[property] : object
    const objType = typeof value
    if (objType === 'object') {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          if (value[0] instanceof Vector3) {
            type = Console3LoggedEntityType.Vector3Array
          }
        }
      } else {
        if (value instanceof Vector3) {
          type = Console3LoggedEntityType.Vector3
        } else if (value instanceof Color3) {
          type = Console3LoggedEntityType.Color3
        } else if (value instanceof AbstractMesh) {
          type = Console3LoggedEntityType.Mesh
          inputCount = 3
        }
      }
    } else if (objType === 'string') {
      type = Console3LoggedEntityType.Text
    } else if (objType === 'number') {
      type = Console3LoggedEntityType.Float
    } else if (objType === 'boolean') {
      type = Console3LoggedEntityType.Boolean
    }

    const DEFAULT_MAPPING = {
      color: new Color3(0.4, 0.4, 0.4),
      drawFunction: (e: Console3LoggedEntity) => this._drawText(e)
    }

    const mapping = this._entityTypeMappings.get(type) ?? DEFAULT_MAPPING
    options.mapping = mapping
    const entity: Console3LoggedEntity = new Console3LoggedEntity(name, type, object, property, options)
    if (options.console === true) {
      entity.ticks = this._ticks
      this._addConsoleLine(entity)
    } else {
      this._entities.set(name, entity)
      this._addObserverFrame(entity, inputCount)
    }

    return entity
  }

  private _log0(name: string, object: any, property: string, refreshRate: number) {
    const docked = true
    const entity = this._addObjectEntity(name, object, property, {
      docked,
      console: true
    })
    entity.refreshRate = refreshRate
    return entity
  }

  private _logv(name: string, object: any, property: string, refreshRate: number) {
    const docked = false
    let entity = this._entities.get(name)
    if (!entity) {
      entity = this._addObjectEntity(name, object, property, {
        docked,
        console: false
      })
    } else {
      entity.source = object
      entity.property = property
      entity.options.docked = docked
    }
    entity.refreshRate = refreshRate
    return entity
  }

  private _logd(name: string, object: any, property: string, refreshRate: number) {
    const docked = true
    let entity = this._entities.get(name)
    if (!entity) {
      entity = this._addObjectEntity(name, object, property, {
        docked,
        console: false
      })
    } else {
      entity.source = object
      entity.property = property
      entity.options.docked = docked
    }
    entity.refreshRate = refreshRate
    return entity
  }

  private _logf(name: string, object: any, property: string, refreshRate: number) {
    const docked = false
    let entity = this._entities.get(name)
    if (!entity) {
      entity = this._addObjectEntity(name, object, property, {
        docked,
        console: false,
        linkedWithMesh: true,
        linkedWithVector: false
      })
    } else {
      console.warn('console3: entity', name, 'already exists.')
      entity.source = object
      entity.property = property
      entity.options.docked = docked
    }
    entity.refreshRate = refreshRate

    return entity
  }

  private _logvf(name: string, object: any, property: string, refreshRate: number) {
    const docked = false
    let entity = this._entities.get(name)
    if (!entity) {
      entity = this._addObjectEntity(name, object, property, {
        docked,
        console: false,
        linkedWithMesh: false,
        linkedWithVector: true
      })
    } else {
      console.warn('console3: entity', name, 'already exists.')
      entity.source = object
      entity.property = property
      entity.options.docked = docked
    }
    entity.refreshRate = refreshRate

    return entity
  }

  private _setColorEntityColor(key: string, color: Color3 | Color4) {
    const existingControls = this._gui!.getDescendants()
    const control = existingControls.find(c => c.name === `console3-observer-panel-${key}`)
    if (control instanceof GUI.StackPanel) {
      control.background = `rgb(${color.r * 255},${color.g * 255},${color.b * 255})`
    }
  }

  private static _getObject<T>(entity: Console3LoggedEntity) {
    if (entity.property) {
      return <T>entity.source[entity.property]
    }
    return <T>entity.source
  }

  private _draw() {
    if (!this._gui) {
      return
    }

    this._showConsole()
    this._showConsoleLines()

    this._drawEntites()
    this._drawConsoleLines()

    this._ticks++
  }

  private _showConsoleLines() {
    this._consoleLinesPanel.isVisible = this._consoleLinesVisible
  }

  private _showConsole() {
    const controls = this._gui?.getDescendants()
    controls?.forEach(c => {
      if (c?.name) {
        if (c.name.indexOf('console3-observer-panel-') > -1 || c.name.indexOf('console3-line-') > -1) {
          c.isVisible = this._consoleVisible
        }
      }
    })
  }

  private _drawEntites() {
    this._entities.forEach(e => {
      if (this._ticks % e.refreshRate === 0) {
        const drawFunction = this._entityTypeMappings.get(e.type)?.drawFunction
        if (drawFunction) {
          drawFunction(e)
        }
      }
      const val = e.getObject()
      if (e.debugWhen && e.debugWhen(val)) {
        this._setColorEntityColor(e.name, this._options.debuggerHitPanelColor)
        debugger
      }
      if (e.highliteWhen && e.highliteWhen(val)) {
        this._setColorEntityColor(e.name, this._options.highliteHitPanelColor)
      }
    })
  }

  private _drawConsoleLines() {
    if (this._consoleLinesVisible === false) {
      this._scrollViewer.isVisible = false
      return
    }
    if (this._gui) {
      const linesCount = this._consoleEntities.length
      const controlsCount = this._consoleLineControls.length
      const drawCount = Math.min(controlsCount, linesCount)
      if (drawCount === 0) {
        this._scrollViewer.isVisible = false
      } else {
        this._scrollViewer.isVisible = true
      }
      for (let i = 0; i < drawCount; i++) {
        const lineControl = this._consoleLineControls[this._options.maxConsoleLineEntities - 1 - i]
        if (lineControl) {
          const entity = this._consoleEntities[linesCount - i - 1]
          lineControl.text =
            entity.ticks.toString() +
            // " | " +
            // console3.getTimeFormatted() +
            ' : ' +
            entity.getObject()
        }
      }

      if (drawCount < this._options.maxConsoleLineEntities) {
        this._scrollViewer.verticalBar.value = 1
      }
    }
  }

  private _createConsoleLines(consolePanel: GUI.StackPanel) {
    if (this._gui) {
      for (let i = 0; i < this._options.maxConsoleLineEntities; i++) {
        const textValue = new GUI.InputText()
        textValue.width = 1
        textValue.heightInPixels = this._options.consoleLineHeightInPixels
        textValue.thickness = 0
        textValue.text = ''
        textValue.color = 'white'
        textValue.fontSize = 12
        textValue.name = `console3-line-${i}`
        consolePanel.addControl(textValue)
        this._consoleLineControls.push(textValue)
      }

      // const color = this._entityTypeMappings.get(entity.type)?.color ?? OBSERVER_PANEL_COLOR
      // this._setColorEntityColor(entity.name, color)
    }
  }

  private _addConsoleLine(entity: Console3LoggedEntity) {
    if (this._consoleEntities.length >= this._options.maxConsoleLineEntities) {
      this._consoleEntities.shift()
    }
    this._consoleEntities.push(entity)
  }

  private _addObserverFrame(entity: Console3LoggedEntity, inputCount = 1) {
    if (this._gui) {
      const parentPanel = new GUI.StackPanel()
      parentPanel.name = `console3-observer-panel-${entity.name}`
      parentPanel.horizontalAlignment = GUI.StackPanel.HORIZONTAL_ALIGNMENT_RIGHT
      parentPanel.verticalAlignment = GUI.StackPanel.VERTICAL_ALIGNMENT_TOP
      parentPanel.widthInPixels = entity.options.mapping?.widthInPixels ?? this._options.observerPanelWidthInPixels
      parentPanel._automaticSize = true
      parentPanel.background = '#666'
      parentPanel.paddingBottomInPixels = 4
      parentPanel.zIndex = 1
      parentPanel.alpha = this._options.mainPanelAlpha

      if (entity.options.linkedWithMesh === true || entity.options.linkedWithVector === true) {
        this._gui.addControl(parentPanel)

        const line = new GUI.Line(`line-${entity.name}`)
        line.lineWidth = 2
        line.dash = [3, 3]
        line.color = 'white'
        line.y2 = 20
        line.zIndex = 0
        line.linkOffsetY = -20
        line.alpha = this._options.linesAlpha
        line.connectedControl = parentPanel

        this._gui.addControl(line)

        if (entity.options.linkedWithMesh === true) {
          const mesh = entity.getLinkedMesh()
          if (mesh) {
            parentPanel.linkWithMesh(mesh)
            line.linkWithMesh(mesh)
          }
        }

        if (entity.options.linkedWithVector === true) {
          const vector = entity.getObject<Vector3>()
          parentPanel.moveToVector3(vector, this._scene)
          line.moveToVector3(vector, this._scene)
        }

        parentPanel.linkOffsetX = this._options.meshBadgeLinkXOffsetInPixels
        parentPanel.linkOffsetY = this._options.meshBadgeLinkYOffsetInPixels
      }

      const textLabel = new GUI.TextBlock()
      textLabel.paddingBottomInPixels = 2
      textLabel.paddingTopInPixels = 2
      textLabel.paddingLeftInPixels = 2
      textLabel.paddingRightInPixels = 2
      textLabel.text = entity.name
      textLabel.color = 'white'
      textLabel.fontSize = 12
      textLabel.resizeToFit = true
      textLabel.name = `console3-textLabel-${entity.name}`
      textLabel.horizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT
      parentPanel.addControl(textLabel)

      for (let i = 0; i < inputCount; i++) {
        const textValue = new GUI.InputText()
        textValue.width = 0.98
        textValue.height = '24px'
        textValue.text = ''
        textValue.color = 'white'
        textValue.background = '#222'
        textValue.fontSize = 12
        textValue.name = `console3-textValue-${entity.name}-${i}`
        textValue.horizontalAlignment = GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER
        entity.textInputs.push(textValue)
        parentPanel.addControl(textValue)
      }

      if (entity.options.docked) {
        this._mainPanel.addControl(parentPanel)
      }

      const color = this._entityTypeMappings.get(entity.type)?.color ?? this._options.observerPanelColor
      this._setColorEntityColor(entity.name, color)
    }
  }
}

;(window as any).console3 = console3
