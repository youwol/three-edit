import { BufferGeometry,  Mesh, Vector3 } from 'three'
import { Action } from './Action'

const _name_ = "MoveObject"

/**
 * @see serialize
 */
 export function executeMoveObject(mesh: Mesh, json: any, isAction: boolean): Action | boolean {
    if (json.name !== _name_) {
        return false
    }

    const translation = new Vector3
    translation.fromArray(json.translation)

    if (isAction) {
        return new MoveObjectAction(mesh, translation)
    }

    const geom  = mesh.geometry as BufferGeometry
    geom.translate( translation.x,  translation.y, translation.z)
    
    return true
}

export class MoveObjectAction implements Action {
    geom: BufferGeometry = undefined

    constructor(private obj: Mesh, private u: Vector3) {
        this.geom = obj.geometry as BufferGeometry
    }

    name() {
        return _name_
    }

    serialize() {
        return {
            name: _name_,
            translation: this.u.toArray()
        }
    }

    do() {
        this.geom.translate( this.u.x,  this.u.y,  this.u.z)
    }

    undo() {
        this.geom.translate(-this.u.x, -this.u.y, -this.u.z)
    }
}
