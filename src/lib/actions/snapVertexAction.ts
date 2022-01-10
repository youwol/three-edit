import { BufferGeometry, Mesh, Vector3 } from 'three'
import { Action } from './Action'

const _name_ = "SnapVertex"

/**
 * @see serialize
 */
 export function executeSnapVertex(mesh: Mesh, json: any, isAction: boolean): Action | boolean {
    if (json.name !== _name_) {
        return false
    }

    const id = json.vertexID
    const to = new Vector3()
    to.fromArray(json.to)

    if (isAction) {
        return new SnapVertexAction(mesh, id, to)
    }

    mesh.geometry.attributes.position.setXYZ(id, to.x, to.y, to.z)
    mesh.geometry.attributes.position.needsUpdate = true
    mesh.geometry.computeBoundingBox()
    mesh.geometry.computeBoundingSphere()
    
    return true
}

export class SnapVertexAction implements Action {
    geom: BufferGeometry = undefined
    from = new Vector3

    constructor(private obj: Mesh, private id: number, private to: Vector3) {
        this.geom = obj.geometry as BufferGeometry
        const x = this.geom.attributes.position.getX(this.id)
        const y = this.geom.attributes.position.getY(this.id)
        const z = this.geom.attributes.position.getZ(this.id)
        this.from.set(x,y,z)
    }

    name() {
        return _name_
    }

    serialize() {
        return {
            name: _name_,
            vertexID: this.id,
            to: this.to.toArray()
        }
    }

    do() {
        this.geom.attributes.position.setXYZ(this.id, this.to.x, this.to.y, this.to.z)
        this.geom.attributes.position.needsUpdate = true
        this.geom.computeBoundingBox()
        this.geom.computeBoundingSphere()
    }

    undo() {
        this.geom.attributes.position.setXYZ(this.id, this.from.x, this.from.y, this.from.z)
        this.geom.attributes.position.needsUpdate = true
        this.geom.computeBoundingBox()
        this.geom.computeBoundingSphere()
    }
}
