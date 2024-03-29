import {
    Camera,
    EventDispatcher,
    Mesh,
    Plane,
    Points,
    Raycaster,
    Scene,
    Vector2,
    Vector3,
    WebGLRenderer,
} from 'three'
import { DeleteVertexAction, Action } from '../actions'
import { ToolFactory } from './factory'
import { Tool, ToolParameters } from './Tool'
import { Controler } from '../controlers'
import { ActionStack } from '../actions/ActionStack'
import { getSize } from '../utils/getSize'
import { RenderFunction, createCircleSprite } from '@youwol/three-extra'

ToolFactory.register(
    'deleteVertex',
    (params: ToolParameters) => new DeleteVertexTool(params),
)

// ------------------------------------------------

export class DeleteVertexTool extends EventDispatcher implements Tool {
    scene: Scene
    camera: Camera
    actionStack: ActionStack
    renderer: WebGLRenderer
    controler: Controler
    renderFct: RenderFunction
    domElement: HTMLElement

    raycaster = new Raycaster()
    marker = undefined
    mouse = new Vector2()
    intersections = []

    mesh: Mesh = undefined
    points: Points = undefined
    plane = new Plane()
    planeNormal = new Vector3()
    planePoint = new Vector3()
    currentIndex = null

    constructor(params: ToolParameters) {
        super()
        this.scene = params.scene
        this.actionStack = params.actionStack
        this.renderer = params.renderer
        this.camera = params.camera
        this.domElement = params.domElement
            ? params.domElement
            : params.renderer.domElement
        this.renderFct = params.renderFunctions.render
        this.controler = params.controler

        this.activate()
    }

    private activate() {
        const dom = this.domElement

        dom.addEventListener('pointerdown', this.onPointerDown, false)
        dom.addEventListener('pointermove', this.onPointerMove, false)
        dom.addEventListener('pointerup', this.onPointerCancel, false)
        dom.addEventListener('pointerleave', this.onPointerCancel, false)
        super.addEventListener('change', (e) => {
            this.track(e.event)
            this.renderFct()
        })

        this.marker = createCircleSprite(0.04)
        this.marker.visible = false
        this.scene.add(this.marker)
        dom.style.cursor = ''
    }

    executeAction(action: Action) {
        this.actionStack.do(action)
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

        this.scene.remove(this.marker)
        this.controler.enabled = true
        dom.style.cursor = ''
    }

    attachObject(mesh: Mesh) {
        this.detachObject()
        this.mesh = mesh

        const threshold = getSize(mesh)

        this.raycaster.params.Points.threshold = threshold
        this.points = new Points(this.mesh.geometry)
        this.scene.add(this.points)

        this.points.visible = false
    }

    detachObject() {
        this.mesh = undefined
        this.marker.visible = false
        this.controler.enabled = true
        this.currentIndex = -1
        this.scene.remove(this.points)
    }

    onPointerDown = (e: PointerEvent) => {
        e.preventDefault()
        switch (e.pointerType) {
            case 'mouse':
            case 'pen':
                this.onMouseDown(e)
                break
            // TODO touch
        }
    }
    onPointerMove = (e: PointerEvent) => {
        e.preventDefault()
        switch (e.pointerType) {
            case 'mouse':
            case 'pen':
                this.onMouseMove(e)
                break
            // TODO touch
        }
    }
    onPointerCancel = (e: PointerEvent) => {
        e.preventDefault()
        switch (e.pointerType) {
            case 'mouse':
            case 'pen':
                this.onMouseUp(e)
                break
            // TODO touch
        }
    }

    onMouseDown = (e: MouseEvent) => {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
        this.raycaster.setFromCamera(this.mouse, this.camera)
        this.raycaster.intersectObject(this.points, false, this.intersections)

        if (this.intersections.length > 0) {
            this.controler.enabled = false
            const intersect = this.findIndex()
            this.executeAction(
                new DeleteVertexAction(this.mesh, intersect.index),
            )
            this.currentIndex = -1
        } else {
            this.controler.enabled = true
        }
    }
    onMouseMove = (e: MouseEvent) => {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
        // Will call track(e) because of the following
        super.dispatchEvent({ type: 'change', event: e })
    }
    onMouseUp = (e: MouseEvent) => {
        this.controler.enabled = true
    }

    private track(e: MouseEvent) {
        this.raycaster.setFromCamera(this.mouse, this.camera)
        const pos = this.mesh.geometry.attributes.position

        const intersect = this.findIndex()
        if (intersect && intersect.index !== -1) {
            const id = intersect.index
            this.setPlane(intersect.point)
            this.raycaster.ray.intersectPlane(this.plane, this.planePoint)
            this.marker.position.copy(
                new Vector3(pos.getX(id), pos.getY(id), pos.getZ(id)),
            )
            this.marker.visible = true
        } else {
            this.marker.visible = false
        }

        this.intersections.length = 0 // reset the result array
    }

    protected findIndex(): { index: number; point: Vector3; vertex: Vector3 } {
        const intersects = this.raycaster.intersectObject(this.points)
        if (intersects.length === 0) {
            this.currentIndex = -1
            return undefined
        }

        const inter = intersects[0]
        const index = inter.index
        const x = this.mesh.geometry.attributes.position.getX(index)
        const y = this.mesh.geometry.attributes.position.getY(index)
        const z = this.mesh.geometry.attributes.position.getZ(index)
        //console.log(index, x, y, z)
        this.currentIndex = index
        this.setPlane(inter.point)
        return { index, point: inter.point, vertex: new Vector3(x, y, z) }
    }

    // Plane where the vertex is going to move
    protected setPlane(point: Vector3) {
        this.planeNormal.subVectors(this.camera.position, point).normalize()
        this.plane.setFromNormalAndCoplanarPoint(this.planeNormal, point)
    }
}
