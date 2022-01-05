import { BufferGeometry, Mesh, Vector3 } from 'three'
import { Action } from './Action'

const _name_ = "SnapVertex"

/**
 * @see serialize
 */
 export function executeSnapVertex(mesh: Mesh, json: any): boolean {
    if (json.name !== _name_) {
        return false
    }

    const id = json.vertexID
    const target = json.targetID

    const x = mesh.geom.attributes.position.getX(target)
    const y = mesh.geom.attributes.position.getY(target)
    const z = mesh.geom.attributes.position.getZ(target)

    mesh.geometry.attributes.position.setXYZ(id, x, y, z)
    mesh.geometry.attributes.position.needsUpdate = true
    mesh.geometry.computeBoundingBox()
    mesh.geometry.computeBoundingSphere()
    
    return true
}

export class SnapVertexAction implements Action {
    geom: BufferGeometry = undefined
    from = new Vector3

    constructor(private obj: Mesh, private id: number, private to: number) {
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
            targetID: this.to
        }
    }

    do() {
        // get the to-vertex
        const x = this.geom.attributes.position.getX(this.to)
        const y = this.geom.attributes.position.getY(this.to)
        const z = this.geom.attributes.position.getZ(this.to)
        this.geom.attributes.position.setXYZ(this.id, x, y, z)
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
