import { BufferGeometry, Matrix4, Mesh, Vector3, Quaternion } from 'three'
import { Action } from './Action'

// ----------------------------------------------------

const _name_ = "MatrixTransformObject"

/**
 * @see serialize
 */
 export function executeMatrixTransformObject(mesh: Mesh, json: any): boolean {
    if (json.name !== _name_) {
        return false
    }

    const matrix = new Matrix4
    matrix.fromArray(json.matrix)

    const geom  = mesh.geometry as BufferGeometry

    const pos = geom.attributes.position
    pos.applyMatrix4(matrix)
    
    geom.computeBoundingBox()
    geom.computeBoundingSphere()
    geom.attributes.position.needsUpdate = true
    mesh.matrixWorldNeedsUpdate = true
    
    return true
}

export class MatrixTransformObjectAction implements Action {
    transform: Matrix4 = undefined

    constructor(private obj: Mesh) {
        this.obj = obj
        this.transform  = obj.matrixWorld.clone()

        this.obj.position.set(0,0,0)
        this.obj.scale.set(1,1,1)
        this.obj.quaternion.identity()
    }

    name() {
        return _name_
    }

    serialize() {
        const position = new Vector3
        const scale = new Vector3
        const quaternion = new Quaternion

        this.transform.decompose(position, quaternion, scale)
        let operation = ''
        if (position.length() !== 0) operation = 'translation'
        if (scale.x !==1 || scale.y !== 1 || scale.z !== 1) operation = 'scaling'
        if (quaternion.x !==0 || quaternion.y !== 0 || quaternion.z !== 0 || quaternion.w !== 1) operation = 'rotation'
        return {
            name: _name_,
            matrix: this.transform.toArray(),
            operation
        }
    }

    do() {
        const pos = (this.obj.geometry as BufferGeometry).attributes.position
        pos.applyMatrix4(this.transform)
        this.update()
    }

    undo() {
        const geom = this.obj.geometry as BufferGeometry
        let t = this.transform.clone().invert()
        geom.attributes.position.applyMatrix4(t)
        this.update()
    }

    update() {
        const geom = this.obj.geometry as BufferGeometry
        geom.computeBoundingBox()
        geom.computeBoundingSphere()
        geom.attributes.position.needsUpdate = true
        this.obj.matrixWorldNeedsUpdate = true
    }
}
