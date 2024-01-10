import { BufferGeometry, Mesh } from 'three'
import { splice, TypedArray, cloneArray } from '../utils/arrayUtils'
import { Action } from './Action'

const _name_ = 'DeleteFace'

/**
 * @see serialize
 */
export function executeDeleteFace(
    mesh: Mesh,
    json: any,
    isAction: boolean,
): Action | boolean {
    if (json.name !== _name_) {
        return false
    }

    const id = json.faceID

    if (isAction) {
        return new DeleteFaceAction(mesh, id)
    }

    const geom = mesh.geometry
    const array = cloneArray(geom.index.array)
    const newArray = splice(array, 3 * id, 3)
    geom.index.copyArray(newArray)

    geom.index.needsUpdate = true
    geom.attributes.position.needsUpdate = true
    geom.computeBoundingBox()
    geom.computeBoundingSphere()

    return true
}

// ----------------------------------------------

export class DeleteFaceAction implements Action {
    geom: BufferGeometry = undefined
    oldArray: number[] | TypedArray
    newArray: number[] | TypedArray

    constructor(
        private obj: Mesh,
        private id: number,
    ) {
        this.geom = obj.geometry

        const index = this.geom.index
        const oldArray = cloneArray(index.array)

        // const newArray = [...oldArray]
        // newArray.splice(3*this.id, 3)

        const newArray = splice(oldArray, 3 * this.id, 3)

        this.oldArray = oldArray
        this.newArray = newArray
    }

    name() {
        return _name_
    }

    serialize() {
        return {
            name: _name_,
            faceID: this.id,
        }
    }

    do() {
        this.geom.index.copyArray(this.newArray)
        this.geom.index.needsUpdate = true

        this.geom.attributes.position.needsUpdate = true
        this.geom.computeBoundingBox()
        this.geom.computeBoundingSphere()
    }

    undo() {
        this.geom.index.copyArray(this.oldArray)
        this.geom.index.needsUpdate = true

        this.geom.attributes.position.needsUpdate = true
        this.geom.computeBoundingBox()
        this.geom.computeBoundingSphere()
    }
}
