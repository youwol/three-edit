import { 
    Camera, EventDispatcher, 
    Matrix4, Mesh, Plane, Raycaster, Scene, 
    Vector2, Vector3, WebGLRenderer
} from "three"
import { ActionStack } from "../actions/ActionStack"
import { Controler } from "../controlers"
import { ToolFactory } from './factory'
import { Tool, ToolParameters } from "./Tool"
import { MoveObjectAction } from '../actions'
//import { RenderFunction } from "../utils/RenderFunctions"
import { RenderFunction } from "@youwol/three-extra"

ToolFactory.register('moveObject', (params: ToolParameters) => new MoveObjectTool(params) )

// ------------------------------------------------

export class MoveObjectTool extends EventDispatcher implements Tool {
    scene       : Scene
    camera      : Camera
    renderer    : WebGLRenderer
    controler   : Controler
    renderFct   : RenderFunction
    domElement  : HTMLElement

    raycaster       = new Raycaster
    mouse           = new Vector2
    intersections   = []

    mesh: Mesh      = undefined
    dragging        = false
    plane           = new Plane
    planeNormal     = new Vector3
    intersectionPoint = new Vector3
    worldPosition   = new Vector3
    offset          = new Vector3
    inverseMatrix   = new Matrix4
    _enabled        = true

    constructor(params: ToolParameters) {
        super()
        this.scene      = params.scene
        this.renderer   = params.renderer
        this.camera     = params.camera
        this.domElement = params.domElement ? params.domElement : params.renderer.domElement
        //this.domElement = params.renderer.domElement
        this.renderFct  = params.renderFunctions.render
        this.controler  = params.controler
        this.activate()
    }

    get enabled() {return this._enabled}
    set enabled(b: boolean) {this._enabled = b}

    private activate() {
        const dom = this.domElement
        dom.addEventListener('mousemove', this.onMouseMove, false)
        dom.addEventListener('mousedown', this.onMouseDown, false)
        dom.addEventListener('mouseup', this.onMouseUp, false)
        dom.style.cursor = ''
    }

    dispose() {
        const dom = this.domElement
        dom.removeEventListener('mousemove', this.onMouseMove, false)
        dom.removeEventListener('mousedown', this.onMouseDown, false)
        dom.removeEventListener('mouseup'  , this.onMouseUp  , false)
        this.controler.enabled = true
        dom.style.cursor = ''
    }

    attachObject(mesh: Mesh) {
        this.mesh = mesh
    }

    detachObject() {
        this.mesh = undefined
        this.controler.enabled = true
        this.dragging = false
    }

    doAction(stack: ActionStack): void {
        if (this.mesh) {
            const u = this.mesh.position.clone()
            if (u.length() !== 0) {
                this.mesh.position.set(0,0,0)
                stack.do(new MoveObjectAction(this.mesh, u))
            }
        }
    }

    onMouseDown = (e: MouseEvent) => {
        console.log('down')
        this.mouse.x =   ( e.clientX / window.innerWidth  ) * 2 - 1
        this.mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1
        this.raycaster.setFromCamera( this.mouse, this.camera )
        this.raycaster.intersectObject( this.mesh, false, this.intersections)

        if (this.intersections.length > 0) {
            this.mesh = this.intersections[0].object
            this.dragging = true
            this.controler.enabled = false
            this.domElement.style.cursor = 'all-scroll'

            this.plane.setFromNormalAndCoplanarPoint(
                this.camera.getWorldDirection(this.plane.normal),
                this.worldPosition.setFromMatrixPosition(this.mesh.matrixWorld)
            )

            if (this.raycaster.ray.intersectPlane(this.plane, this.intersectionPoint)) {
                this.inverseMatrix.copy(this.mesh.parent.matrixWorld).invert()
                //this.worldPosition.setFromMatrixPosition(this.mesh.matrixWorld)
                this.offset.copy(this.intersectionPoint).sub(this.worldPosition)
                this.domElement.style.cursor = 'move'
			}
        }
        else {
            this.dragging = false
            this.controler.enabled = true
            this.domElement.style.cursor = ''
        }
    }

    onMouseMove = (e: MouseEvent) => {
        const rect = this.domElement.getBoundingClientRect()
        this.mouse.x =   ( e.clientX / window.innerWidth  ) * 2 - 1
        this.mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1

        this.raycaster.setFromCamera( this.mouse, this.camera )
        //this.raycaster.intersectObject(this.mesh, true, this.intersections)
        if (this.mesh && this.enabled ) {
            if (this.raycaster.ray.intersectPlane(this.plane, this.intersectionPoint)) {
                const du = this.intersectionPoint.sub(this.offset).applyMatrix4(this.inverseMatrix)
                this.mesh.position.copy(du)
			}
        }
    }

    onMouseUp = (e: MouseEvent) => {
        console.log('up')
        this.domElement.style.cursor = ''
        this.controler.enabled = true

        if (this.dragging) {
            this.dragging = false
        }
    }
}
