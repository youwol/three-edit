import {
    Camera,
    EventDispatcher,
    Mesh,
    Raycaster,
    Scene,
    Vector2,
    WebGLRenderer,
} from 'three'
import { RenderFunction } from '@youwol/three-extra'

import { Tool, ToolParameters } from './Tool'
import { Controler } from '../controlers'
import { ActionStack } from '../actions/ActionStack'
import { getSize } from '../utils/getSize'

// ------------------------------------------------

/*
================================================================
=========  NOT USED (YET?) =====================================
================================================================
*/

export class ToolBase extends EventDispatcher implements Tool {
    protected scene: Scene
    protected camera: Camera
    protected ActionStack: ActionStack
    protected renderer: WebGLRenderer
    protected controler: Controler
    protected renderFct: RenderFunction
    protected domElement: HTMLElement

    protected raycaster = new Raycaster()
    protected mouse = new Vector2()
    protected intersections = []

    protected mesh: Mesh = undefined

    constructor(params: ToolParameters) {
        super()
        this.scene = params.scene
        this.ActionStack = params.actionStack
        this.renderer = params.renderer
        this.camera = params.camera
        this.domElement = params.domElement
            ? params.domElement
            : params.renderer.domElement
        this.renderFct = params.renderFunctions.render
        this.controler = params.controler
        this.activate()
    }

    protected activate() {
        const dom = this.domElement
        dom.addEventListener('pointerdown', this.onPointerDown, false)
        dom.addEventListener('pointermove', this.onPointerMove, false)
        dom.addEventListener('pointerup', this.onPointerCancel, false)
        dom.addEventListener('pointerleave', this.onPointerCancel, false)
        super.addEventListener('change', (e) => {
            this.track(e.event)
            this.renderFct()
        })

        dom.style.cursor = ''
    }

    dispose() {
        this.detachObject()
        const dom = this.domElement
        dom.removeEventListener('pointerdown', this.onPointerDown, false)
        dom.removeEventListener('pointermove', this.onPointerMove, false)
        dom.removeEventListener('pointerup', this.onPointerCancel, false)
        dom.removeEventListener('pointerleave', this.onPointerCancel, false)
        super.removeEventListener('change', (e) => {
            this.track(e.event)
            this.renderFct()
        })

        this.controler.enabled = true
        dom.style.cursor = ''
    }

    attachObject(mesh: Mesh) {
        this.detachObject()
        this.mesh = mesh
        const size = getSize(mesh)
        this.raycaster.params.Points.threshold = size
    }

    detachObject() {
        if (this.mesh) this.mesh = undefined
        if (this.controler) this.controler.enabled = true
    }

    onPointerDown = (e: PointerEvent) => {
        e.preventDefault()
        switch (e.pointerType) {
            case 'mouse':
            case 'pen':
                this.onMouseDown(e)
                break
        }
    }
    onPointerMove = (e: PointerEvent) => {
        e.preventDefault()
        switch (e.pointerType) {
            case 'mouse':
            case 'pen':
                this.onMouseMove(e)
                break
        }
    }
    onPointerCancel = (e: PointerEvent) => {
        e.preventDefault()
        switch (e.pointerType) {
            case 'mouse':
            case 'pen':
                this.onMouseUp(e)
                break
        }
    }

    protected onMouseDown = (e: MouseEvent) => {}
    protected onMouseMove = (e: MouseEvent) => {}
    protected onMouseUp = (e: MouseEvent) => {}
    protected track(e: MouseEvent) {}
}
