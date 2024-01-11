import { BufferAttribute, BufferGeometry, Mesh } from 'three'
import { HalfedgeAPI } from '..'
import { Action } from './Action'

const _name_ = 'CollapseVertex'

/**
 * @see serialize
 */
export function executeCollapseVertex(
    mesh: Mesh,
    json: any,
    isAction: boolean,
): Action | boolean {
    if (json.name !== _name_) {
        return false
    }

    const id = json.nodeID

    if (isAction) {
        return new CollapseVertexAction(mesh, id)
    }

    const he = new HalfedgeAPI(mesh)
    he.collapseVertex(id)

    mesh.geometry.index.set(he.index)
    mesh.geometry.attributes.position.set(he.position)

    mesh.geometry.index.needsUpdate = true
    mesh.geometry.attributes.position.needsUpdate = true
    mesh.geometry.computeBoundingBox()
    mesh.geometry.computeBoundingSphere()

    return true
}

export class CollapseVertexAction implements Action {
    geom: BufferGeometry = undefined
    oldIndex: BufferAttribute
    newIndex: BufferAttribute
    oldPos: BufferAttribute
    newPos: BufferAttribute

    constructor(
        private obj: Mesh,
        private id: number,
    ) {
        this.geom = obj.geometry

        this.oldIndex = this.geom.index.array
        this.oldPos = this.geom.attributes.position.array

        // Modify obj here
        const he = new HalfedgeAPI(obj)
        he.collapseVertex(id)

        this.newIndex = he.index
        this.newPos = he.position
    }

    name() {
        return _name_
    }

    serialize() {
        return {
            name: _name_,
            nodeID: this.id,
        }
    }

    do() {
        this.geom.index.copyArray(this.newIndex)
        this.geom.attributes.position.copyArray(this.newPos)

        this.geom.index.needsUpdate = true
        this.geom.attributes.position.needsUpdate = true
        this.geom.computeBoundingBox()
        this.geom.computeBoundingSphere()
    }

    undo() {
        this.geom.index.copyArray(this.oldIndex)
        this.geom.attributes.position.copyArray(this.oldPos)

        this.geom.index.needsUpdate = true
        this.geom.attributes.position.needsUpdate = true
        this.geom.computeBoundingBox()
        this.geom.computeBoundingSphere()
    }
}
