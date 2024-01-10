import {
    BufferAttribute,
    BufferGeometry,
    Camera,
    Color,
    EventDispatcher,
    Mesh,
    MeshBasicMaterial,
    Plane,
    Points,
    PointsMaterial,
    Raycaster,
    Scene,
    SphereGeometry,
    Vector2,
    Vector3,
    WebGLRenderer,
} from 'three'
import { MoveVertexAction } from '../actions'
import { ToolFactory } from './factory'
import { Tool, ToolParameters } from './Tool'
import { Controler } from '../controlers'
import { ActionStack } from '../actions/ActionStack'
import { getSize } from '../utils/getSize'
//import { RenderFunction } from "../utils/RenderFunctions"
import { RenderFunction } from '@youwol/three-extra'
import { createCircleSprite } from '@youwol/three-extra'

ToolFactory.register(
    'moveVertex',
    (params: ToolParameters) => new MoveVertexTool(params),
)

// ------------------------------------------------

export class MoveVertexTool extends EventDispatcher implements Tool {
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
    dragging = false
    plane = new Plane()
    planeNormal = new Vector3()
    planePoint = new Vector3()
    previousPos = new Vector3()
    currentIndex = null
    posBefore = undefined
    posAfter = undefined

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

        this.marker = createCircleSprite(0.04, undefined, false, '#1bf')
        this.marker.visible = false
        this.scene.add(this.marker)
        dom.style.cursor = ''
    }

    dispose() {
        this.detachObject()
        super.removeEventListener('change', (e) => {
            this.track(e.event)
            this.renderFct()
        })

        const dom = this.domElement
        dom.removeEventListener('pointerdown', this.onPointerDown, false)
        dom.removeEventListener('pointermove', this.onPointerMove, false)
        dom.removeEventListener('pointerup', this.onPointerCancel, false)
        dom.removeEventListener('pointerleave', this.onPointerCancel, false)

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
        // const size = getSize(mesh) ;
        // this.marker.scale.set(size/2, size/2, size/2);
        // (this.points.material as PointsMaterial).size = size;
        // (this.points.material as PointsMaterial).color = new Color('#ffff00')

        this.points.visible = false
    }

    detachObject() {
        this.mesh = undefined
        this.marker.visible = false
        this.controler.enabled = true
        this.dragging = false
        this.scene.remove(this.points)
    }

    private doAction(stack: ActionStack): void {
        if (this.currentIndex !== -1) {
            const id = this.currentIndex
            const pos = (this.mesh.geometry as BufferGeometry).attributes
                .position as BufferAttribute
            const to = new Vector3(pos.getX(id), pos.getY(id), pos.getZ(id))
            pos.setXYZ(
                this.currentIndex,
                this.previousPos.x,
                this.previousPos.y,
                this.previousPos.z,
            )
            if (to.length() !== 0) {
                this.actionStack.do(
                    new MoveVertexAction(this.mesh, this.currentIndex, to),
                )
            }
            this.currentIndex = -1
        }
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
            this.dragging = true
            this.controler.enabled = false
            this.domElement.style.cursor = 'all-scroll'
            const intersect = this.findIndex()
            if (this.currentIndex !== -1) {
                this.previousPos = intersect.vertex
            }
        } else {
            this.dragging = false
        }
    }

    onMouseMove = (e: MouseEvent) => {
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
        //console.log('move', this.mouse.x, this.mouse.y)
        // Will call track(e) because of the following
        super.dispatchEvent({ type: 'change', event: e })
    }

    onMouseUp = (e: MouseEvent) => {
        //console.log('mouseup', this.mouse.x, this.mouse.y)
        this.doAction(this.actionStack)
        //this.domElement.style.touchAction = ''
        //this.domElement.ownerDocument.removeEventListener('mousemove', this.onMouseMove, false )
        if (this.dragging && this.currentIndex !== -1) {
            //this.sendAction()
            // const pos = this.object.geometry.attributes.position
            // const from =  ;
            // const to = new THREE.Vector3(pos.getX(this.currentIndex), pos.getY(this.currentIndex), pos.getZ(this.currentIndex))
            // ActionStack.do(new MoveVertexAction(this.object, this.currentIndex, from, to))
            // this.posBefore = undefined
            // this.posAfter  = undefined
        }
        this.controler.enabled = true
        this.dragging = false
        this.domElement.style.cursor = ''
    }

    private track(e: MouseEvent) {
        this.raycaster.setFromCamera(this.mouse, this.camera)
        const pos = (this.mesh.geometry as BufferGeometry).attributes
            .position as BufferAttribute

        // Dragging an already picked vertex
        if (this.currentIndex !== -1 && this.dragging === true) {
            this.raycaster.ray.intersectPlane(this.plane, this.planePoint)

            this.marker.position.copy(this.planePoint)
            this.marker.visible = true
            pos.setXYZ(
                this.currentIndex,
                this.planePoint.x,
                this.planePoint.y,
                this.planePoint.z,
            )
            pos.needsUpdate = true
        }
        // Highlight a vertex close to the cursor
        else {
            const intersect = this.findIndex()
            if (intersect && intersect.index !== -1) {
                const id = intersect.index
                this.setPlane(intersect.point)
                this.raycaster.ray.intersectPlane(this.plane, this.planePoint)
                this.marker.position.copy(
                    new Vector3(pos.getX(id), pos.getY(id), pos.getZ(id)),
                )
                this.marker.visible = true
                //this.currentIndex = -1
            } else {
                this.marker.visible = false
            }
        }
        this.intersections.length = 0 // reset the result array
    }

    private findIndex(): { index: number; point: Vector3; vertex: Vector3 } {
        const intersects = this.raycaster.intersectObject(this.points)
        if (intersects.length === 0) {
            this.currentIndex = -1
            return undefined
        }

        const inter = intersects[0]
        const index = inter.index
        const x = (
            this.mesh.geometry as BufferGeometry
        ).attributes.position.getX(index)
        const y = (
            this.mesh.geometry as BufferGeometry
        ).attributes.position.getY(index)
        const z = (
            this.mesh.geometry as BufferGeometry
        ).attributes.position.getZ(index)
        //console.log(index, x, y, z)
        this.currentIndex = index
        this.setPlane(inter.point)
        return { index, point: inter.point, vertex: new Vector3(x, y, z) }
    }

    // Plane where the vertex is going to move
    private setPlane(point: Vector3) {
        this.planeNormal.subVectors(this.camera.position, point).normalize()
        this.plane.setFromNormalAndCoplanarPoint(this.planeNormal, point)
    }
}
