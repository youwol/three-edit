import { DeleteVertexTool } from './DeleteVertex'
import { CollapseVertexAction } from '../actions'
import { ToolFactory } from "./factory"
import { ToolParameters } from "./Tool"

ToolFactory.register('collapseVertex', (params: ToolParameters) => new CollapseVertexTool(params) )

// ------------------------------------------------

export class CollapseVertexTool extends DeleteVertexTool {

    onMouseDown = (e: MouseEvent) => {
        this.mouse.x =   ( e.clientX / window.innerWidth  ) * 2 - 1
        this.mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1
        this.raycaster.setFromCamera( this.mouse, this.camera )
        this.raycaster.intersectObject( this.points, false, this.intersections)

        if (this.intersections.length > 0) {
            this.controler.enabled = false
            const intersect = this.findIndex()
            this.executeAction( new CollapseVertexAction(this.mesh, intersect.index) )
            this.currentIndex = -1
        }
        else {
            this.controler.enabled = true
        }
    }

}
