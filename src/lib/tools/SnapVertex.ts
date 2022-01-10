import { 
    BufferAttribute, BufferGeometry, Camera, EventDispatcher, 
    Mesh, Plane, Points, Raycaster, Scene, 
    Vector2, Vector3, WebGLRenderer
} from "three"
import { SnapVertexAction } from '../actions'
import { ToolFactory } from "./factory"
import { Tool, ToolParameters } from "./Tool"
import { Controler } from "../controlers"
import { ActionStack } from "../actions/ActionStack"
import { getSize } from "../utils/getSize"
import { RenderFunction } from "@youwol/three-extra"
import { createCircleSprite } from "../utils/createCircleSprite"

ToolFactory.register('snapVertex', (params: ToolParameters) => new SnapVertexTool(params) )

// ------------------------------------------------

export class SnapVertexTool extends EventDispatcher implements Tool {
    scene: Scene
    camera: Camera
    actionStack: ActionStack
    renderer: WebGLRenderer
    controler: Controler
    renderFct: RenderFunction
    domElement: HTMLElement

    raycaster = new Raycaster

    marker = undefined // the moving vertex
    target = undefined // the target vertex
    targetID = -1

    mouse = new Vector2
    intersections = []

    mesh: Mesh = undefined
    points: Points = undefined
    dragging = false
    plane = new Plane
    planeNormal = new Vector3
    planePoint = new Vector3
    previousPos = new Vector3
    currentIndex = null
    posBefore = undefined
    posAfter  = undefined

    constructor(params: ToolParameters)
    {
        super()
        this.scene = params.scene
        this.actionStack = params.actionStack
        this.renderer = params.renderer
        this.camera = params.camera
        this.domElement = params.domElement ? params.domElement : params.renderer.domElement
        this.renderFct = params.renderFunctions.render
        this.controler = params.controler

        this.activate()
    }

    private activate() {
        const dom = this.domElement

        dom.addEventListener('pointerdown' , this.onPointerDown  , false)
        dom.addEventListener('pointermove' , this.onPointerMove  , false)
		dom.addEventListener('pointerup'   , this.onPointerCancel, false )
		dom.addEventListener('pointerleave', this.onPointerCancel, false )

        super.addEventListener('change', (e) => {
            this.track(e.event)
            this.renderFct()
        })

        this.marker = createCircleSprite(0.04)
        this.marker.visible = false
        this.scene.add(this.marker)

        this.target = createCircleSprite(0.04, undefined, false, '#11f')
        this.target.visible = false
        this.scene.add(this.target)

        dom.style.cursor = ''
    }

    dispose() {
        this.detachObject()
        super.removeEventListener('change', (e) => {
            this.track(e.event)
            this.renderFct()
        })

        const dom = this.domElement
        dom.removeEventListener('pointerdown' , this.onPointerDown  , false)
        dom.removeEventListener('pointermove' , this.onPointerMove  , false)
		dom.removeEventListener('pointerup'   , this.onPointerCancel, false )
        dom.removeEventListener('pointerleave', this.onPointerCancel, false )

        this.scene.remove(this.marker)
        this.scene.remove(this.target)
        this.controler.enabled = true
        dom.style.cursor = '';
    }

    attachObject(mesh: Mesh) {
        this.detachObject()
        this.mesh = mesh

        const threshold = getSize(mesh)
        this.raycaster.params.Points.threshold = threshold

        this.points = new Points(this.mesh.geometry)
        this.scene.add(this.points)

        // this.otherPoints = new Points(this.mesh.geometry)
        // this.scene.add(this.otherPoints)

        this.points.visible = false
    }

    detachObject() {
        this.mesh = undefined
        this.marker.visible = false
        this.target.visible = false
        this.controler.enabled = true
        this.dragging = false
        this.scene.remove(this.points)
    }

    private doAction(stack: ActionStack): void {
        const pos = (this.mesh.geometry as BufferGeometry).attributes.position as BufferAttribute

        if (this.currentIndex !== -1 && this.targetID !== -1 && this.currentIndex !== this.targetID) {
            const to = new Vector3(pos.getX(this.targetID), pos.getY(this.targetID), pos.getZ(this.targetID))
            this.actionStack.do( new SnapVertexAction(this.mesh, this.currentIndex, to) )
            this.currentIndex = -1
            this.targetID = -1
        }
    }

    onPointerDown = (e: PointerEvent) => {
        e.preventDefault()
		switch(e.pointerType) {
			case 'mouse':
			case 'pen':
				this.onMouseDown(e)
				break
			// TODO touch
		}
    }
    onPointerMove = (e: PointerEvent) => {
		e.preventDefault();
		switch(e.pointerType) {
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
        this.mouse.x =   ( e.clientX / window.innerWidth  ) * 2 - 1
        this.mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1
        this.raycaster.setFromCamera( this.mouse, this.camera )
        this.raycaster.intersectObject( this.points, false, this.intersections)

        if (this.intersections.length > 0) {
            this.dragging = true
            this.controler.enabled = false
            this.domElement.style.cursor = 'all-scroll';
            const intersect = this.findIndex()
            if (this.currentIndex !== -1) {
                this.previousPos = intersect.vertex
            }
            this.snappingNode()
        }
        else {
            this.dragging = false
        }
    }

    onMouseMove = (e: MouseEvent) => {
        this.mouse.x =   ( e.clientX / window.innerWidth  ) * 2 - 1
        this.mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1
        if (this.dragging) {
            this.snappingNode()
        }
        super.dispatchEvent( {type: 'change', event: e} )
    }

    onMouseUp = (e: MouseEvent) => {
        this.doAction(this.actionStack)
        if (this.dragging && this.currentIndex !== -1) {

        }
        this.controler.enabled = true
        this.dragging = false
        this.domElement.style.cursor = ''
        this.target.visible = false
    }

    private snappingNode() {
        /*
        In fact, we have to snap on other Object3D. Therefore, we have to:
            - use objects in scene (see this.scene)
            - convert them in points (see attachObject)
            - In the SnapVertexAction, use the postion instead of the target ID
        */
        const intersects = this.raycaster.intersectObject(this.points)
        if (intersects.length === 0) {
            this.targetID = -1
            this.target.visible = false
            return
        }

        const inter = intersects[0]
        const index = inter.index

        const pos = this.mesh.geometry.attributes.position as BufferAttribute
        if (inter && index !== -1) {
            this.target.position.copy( new Vector3(pos.getX(index), pos.getY(index), pos.getZ(index)) )
            this.target.visible = true
            this.targetID = index
        }
        else {
            this.target.visible = false
            this.targetID = -1
        }
    }

    private track(e: MouseEvent) {
        this.raycaster.setFromCamera( this.mouse, this.camera )
        const pos = this.mesh.geometry.attributes.position

        // Dragging an already picked vertex
        if (this.dragging === false) {
            const intersect = this.findIndex()
            if (intersect && intersect.index !== -1) {
                const id = intersect.index
                this.setPlane(intersect.point)
                this.raycaster.ray.intersectPlane(this.plane, this.planePoint)
                this.marker.position.copy( new Vector3(pos.getX(id), pos.getY(id), pos.getZ(id)) )
                this.marker.visible = true
            }
            else {
                this.marker.visible = false
            }
        }
        this.intersections.length = 0 // reset the result array
    }

    private findIndex(): {index:number, point: Vector3, vertex: Vector3} {
        const intersects = this.raycaster.intersectObject(this.points)
        if (intersects.length === 0) {
            this.currentIndex = -1
            return undefined
        }

        const inter = intersects[0]
        const index = inter.index
        const x = (this.mesh.geometry as BufferGeometry).attributes.position.getX(index)
        const y = (this.mesh.geometry as BufferGeometry).attributes.position.getY(index)
        const z = (this.mesh.geometry as BufferGeometry).attributes.position.getZ(index)
        this.currentIndex = index
        this.setPlane(inter.point)
        return {index, point: inter.point, vertex: new Vector3(x,y,z)}
    }

    // Plane where the vertex is going to move
    private setPlane(point: Vector3) {
        this.planeNormal.subVectors(this.camera.position, point).normalize()
        this.plane.setFromNormalAndCoplanarPoint(this.planeNormal, point)
    }
}
