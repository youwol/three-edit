import { 
    BufferAttribute, BufferGeometry, Camera, EventDispatcher, 
    Face3,
    Line3, 
    Line, 
    LineBasicMaterial, 
    Mesh, Plane, Raycaster, Scene, 
    Vector2, Vector3, WebGLRenderer
} from "three"
import { RenderFunction } from "@youwol/three-extra"

import { FlipEdgeAction }       from '../actions'
import { ToolFactory }          from "./factory"
import { Tool, ToolParameters } from "./Tool"
import { Controler }            from "../controlers"
import { ActionStack }         from "../actions/ActionStack"
import { getSize }              from "../utils/getSize"
import { createCircleSprite } from "../utils/createCircleSprite"

ToolFactory.register('flipEdge', (params: ToolParameters) => new FlipEdgeTool(params) )

// ------------------------------------------------

export class FlipEdgeTool extends EventDispatcher implements Tool {
    scene: Scene
    camera: Camera
    actionStack: ActionStack
    renderer: WebGLRenderer
    controler: Controler
    renderFct: RenderFunction
    domElement: HTMLElement

    raycaster = new Raycaster
    mouse = new Vector2
    intersections = []

    mesh: Mesh = undefined
    plane = new Plane
    planeNormal = new Vector3
    planePoint = new Vector3
    currentFace1: Face3 = undefined
    currentFace2: Face3 = undefined
    currentFaceIndex1 = -1
    currentFaceIndex2 = -1
    line: Line = undefined
    
    v1: number = -1
    v2: number = -1

    // DEBUG
    marker = []

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

        dom.style.cursor = ''

        const geometry = new BufferGeometry();
        geometry.setAttribute( 'position', new BufferAttribute( new Float32Array( 2 * 3 ), 3 ) )
        const material = new LineBasicMaterial( { color: 0xffff00, transparent: false } )
        this.line = new Line(geometry, material)
        this.scene.add(this.line)
        this.line.visible = false

        for (let i=0; i<4; ++i) {
            this.marker[i] = createCircleSprite(0.04)
            this.marker[i].visible = false
            this.scene.add(this.marker[i])
        }
    }

    dispose() {
        this.detachObject()
        const dom = this.domElement
        dom.removeEventListener('pointerdown' , this.onPointerDown  , false)
        dom.removeEventListener('pointermove' , this.onPointerMove  , false)
        dom.removeEventListener('pointerup'   , this.onPointerCancel, false )
        dom.removeEventListener('pointerleave', this.onPointerCancel, false )
        super.removeEventListener('change', (e) => {
            this.track(e.event)
            this.renderFct()
        })

        this.controler.enabled = true
        dom.style.cursor = '';
    }

    attachObject(mesh: Mesh) {
        this.detachObject()
        this.mesh = mesh
        const size = getSize(mesh)
        this.raycaster.params.Points.threshold = size

        // this.scene.traverse( node => {
        //     console.log(node)
        // })
    }

    detachObject() {
        if (this.mesh) {
            this.mesh = undefined
            this.controler.enabled = true
            this.currentFace1 = undefined
            this.currentFace2 = undefined
            this.line.visible = false
            this.scene.remove(this.line)

            for (let i=0; i<2; ++i) {
                this.scene.remove(this.marker[i])
            }
        }
    }

    onPointerDown = (e: PointerEvent) => {
        e.preventDefault()
		switch(e.pointerType) {
			case 'mouse':
			case 'pen':
				this.onMouseDown(e)
				break
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
        this.raycaster.intersectObject( this.mesh, false, this.intersections)

        if (this.intersections.length > 0 && this.line.visible === true) {
            this.controler.enabled = false
            // const intersect = this.findIndex()
            // if (intersect) {
            //     this.ActionStack.do( new FlipEdgeAction(this.mesh, intersect.faceIndex) )
            // }
            console.log(this.v1, this.v2)
            this.actionStack.do( new FlipEdgeAction(this.mesh, this.v1, this.v2) )
        }
        else {
            this.controler.enabled = true
        }
    }

    onMouseMove = (e: MouseEvent) => {
        this.mouse.x =   ( e.clientX / window.innerWidth  ) * 2 - 1
        this.mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1
        // Will call track(e) because of the following
        super.dispatchEvent( {type: 'change', event: e} )
    }
    onMouseUp = (e: MouseEvent) => {
        this.controler.enabled = true
    }

    protected track(e: MouseEvent) {
        this.raycaster.setFromCamera( this.mouse, this.camera )

        const intersect = this.findIndex()
        if (intersect && intersect.index !== -1) {
            const id = intersect.index
            this.setPlane(intersect.point)
            this.raycaster.ray.intersectPlane(this.plane, this.planePoint)
            this.line.visible = true

            this.currentFace1 = intersect.face
            this.currentFaceIndex1 = intersect.faceIndex

            const face = intersect.face
            const linePosition = (this.line.geometry as BufferGeometry).attributes.position as BufferAttribute
            const meshPosition = (this.mesh.geometry as BufferGeometry).attributes.position as BufferAttribute

            const p = intersect.point

            function getPoint(id: string) {
                return new Vector3(
                    meshPosition.getX(face[id]),
                    meshPosition.getY(face[id]),
                    meshPosition.getZ(face[id])
                )
            }

            function copy(from: Vector3, to: Vector3) {
                to.copy(from)
            }

            const ids = ['a', 'b', 'c']
            const line = new Line3(new Vector3, new Vector3)
            let start: Vector3 = undefined, end: Vector3 = undefined
            let minDist = 1e30
            let index = -1
            let i1 = ''
            let i2 = ''
            const p1 = new Vector3

            for (let i=0; i<3; ++i) {
                const di1 = ids[i%3]
                const di2 = ids[(i+1)%3]
                line.start.copy(getPoint(di1))
                line.end  .copy(getPoint(di2))
                line.closestPointToPoint(p, false, p1)
                const d1 = p1.distanceTo(p)
                if (d1<minDist) {
                    start = line.start.clone()
                    end   = line.end.clone()
                    minDist = d1
                    index = i
                    i1 = di1
                    i2 = di2
                }
            }

            
            this.marker[0].position.copy(getPoint(i1))
            this.marker[0].visible = true
            this.marker[1].position.copy(getPoint(i2))
            this.marker[1].visible = true

            this.v1 = face[i1]
            this.v2 = face[i2]
            
            linePosition.setXYZ(0, start.x, start.y, start.z)
            linePosition.setXYZ(1, end.x, end.y, end.z)
            this.mesh.updateMatrix()
            this.line.geometry.applyMatrix4( this.mesh.matrix )
        }
        else {
            this.line.visible = false
        }

        this.intersections.length = 0 // reset the result array
    }

    private findIndex(): any {
        const intersects = this.raycaster.intersectObject(this.mesh)
        if (intersects.length === 0) {
            this.currentFace1 = undefined
            return undefined
        }
        return intersects[0]
    }

    private setPlane(point: Vector3) {
        this.planeNormal.subVectors(this.camera.position, point).normalize()
        this.plane.setFromNormalAndCoplanarPoint(this.planeNormal, point)
    }


    /*
     * See https://stackoverflow.com/a/51722234
     */
    // protected trackEdge(event: MouseEvent) {
    //     this.mouse.x =  (event.clientX / window.innerWidth ) * 2 - 1
    //     this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
      
    //     this.raycaster.setFromCamera(this.mouse, this.camera)
    //     const intersects = this.raycaster.intersectObject(this.mesh)
    //     if (intersects.length === 0) {
    //         this.line.visible = false
    //         return
    //     }
      
    //     let faceIdx = intersects[0].faceIndex
    //     let a = intersects[0].face.a
    //     let b = intersects[0].face.b
    //     let c = intersects[0].face.c
    //     const pos = this.mesh.geometry.attributes.position

    //     let lines = [
    //         new Line3(
    //             new Vector3().fromBufferAttribute(pos, a * 3 + 0),
    //             new Vector3().fromBufferAttribute(pos, a * 3 + 1)
    //         ),
    //         new Line3(
    //             new Vector3().fromBufferAttribute(pos, b * 3 + 0),
    //             new Vector3().fromBufferAttribute(pos, b * 3 + 1)
    //         ),
    //         new Line3(
    //             new Vector3().fromBufferAttribute(pos, c * 3 + 0),
    //             new Vector3().fromBufferAttribute(pos, c * 3 + 1)
    //         )
    //     ]
      
    //     let edgeIdx = 0
    //     this.mesh.worldToLocal(this.localPoint.copy(intersects[0].point))
      
    //     let minDistance = 1e30
    //     for (let i = 0; i < 3; i++) {
    //         lines[i].closestPointToPoint(this.localPoint, true, this.closestPoint)
    //         let dist = this.localPoint.distanceTo(this.closestPoint)
    //         if (dist < minDistance) {
    //             minDistance = dist
    //             edgeIdx = i
    //         }
    //     }
      
    //     const pStart = this.mesh.localToWorld(lines[edgeIdx].start)
    //     const pEnd   = this.mesh.localToWorld(lines[edgeIdx].end)
    //     this.line.geometry.attributes.position.setXYZ(0, pStart.x, pStart.y, pStart.z)
    //     this.line.geometry.attributes.position.setXYZ(1, pEnd.x, pEnd.y, pEnd.z)
    //     this.line.geometry.attributes.position.needsUpdate = true
    // }
}
