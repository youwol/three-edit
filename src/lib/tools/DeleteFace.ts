import {
    BufferAttribute,
    BufferGeometry,
    Camera,
    EventDispatcher,
    Face3,
    Line,
    LineBasicMaterial,
    Mesh,
    Plane,
    Raycaster,
    Scene,
    Vector2,
    Vector3,
    WebGLRenderer,
} from 'three'
import { RenderFunction } from '@youwol/three-extra'

import { DeleteFaceAction } from '../actions'
import { ToolFactory } from './factory'
import { Tool, ToolParameters } from './Tool'
import { Controler } from '../controlers'
import { ActionStack } from '../actions/ActionStack'
import { getSize } from '../utils/getSize'

ToolFactory.register(
    'deleteFace',
    (params: ToolParameters) => new DeleteFaceTool(params),
)

// ------------------------------------------------

export class DeleteFaceTool extends EventDispatcher implements Tool {
    scene: Scene
    camera: Camera
    actionStack: ActionStack
    renderer: WebGLRenderer
    controler: Controler
    renderFct: RenderFunction
    domElement: HTMLElement

    raycaster = new Raycaster()
    //marker = undefined
    mouse = new Vector2()
    intersections = []

    mesh: Mesh = undefined
    plane = new Plane()
    planeNormal = new Vector3()
    planePoint = new Vector3()
    currentFace: Face3 = undefined
    currentFaceIndex = -1
    line: Line = undefined

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

        dom.style.cursor = ''

        const geometry = new BufferGeometry()
        geometry.setAttribute(
            'position',
            new BufferAttribute(new Float32Array(4 * 3), 3),
        )
        const material = new LineBasicMaterial({
            color: 0xffff00,
            transparent: false,
        })
        this.line = new Line(geometry, material)
        this.scene.add(this.line)
        this.line.visible = false
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
        if (this.mesh) {
            this.mesh = undefined
            this.controler.enabled = true
            this.currentFace = undefined
            this.line.visible = false
            this.scene.remove(this.line)
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
        this.raycaster.intersectObject(this.mesh, false, this.intersections)

        if (this.intersections.length > 0) {
            this.controler.enabled = false
            const intersect = this.findIndex()
            if (intersect) {
                this.actionStack.do(
                    new DeleteFaceAction(this.mesh, intersect.faceIndex),
                )
            }
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

        const intersect = this.findIndex()
        if (intersect && intersect.index !== -1) {
            const id = intersect.index
            this.setPlane(intersect.point)
            this.raycaster.ray.intersectPlane(this.plane, this.planePoint)
            this.line.visible = true
            this.currentFace = intersect.face
            this.currentFaceIndex = intersect.faceIndex

            const face = intersect.face
            const linePosition = (this.line.geometry as BufferGeometry)
                .attributes.position as BufferAttribute
            const meshPosition = (this.mesh.geometry as BufferGeometry)
                .attributes.position as BufferAttribute
            linePosition.copyAt(0, meshPosition, face.a)
            linePosition.copyAt(1, meshPosition, face.b)
            linePosition.copyAt(2, meshPosition, face.c)
            linePosition.copyAt(3, meshPosition, face.a)
            this.mesh.updateMatrix()
            this.line.geometry.applyMatrix4(this.mesh.matrix)
        } else {
            this.line.visible = false
        }

        this.intersections.length = 0 // reset the result array
    }

    private findIndex(): any {
        const intersects = this.raycaster.intersectObject(this.mesh)
        if (intersects.length === 0) {
            this.currentFace = undefined
            return undefined
        }
        return intersects[0]
    }

    // Plane where the vertex is going to move
    private setPlane(point: Vector3) {
        this.planeNormal.subVectors(this.camera.position, point).normalize()
        this.plane.setFromNormalAndCoplanarPoint(this.planeNormal, point)
    }
}
