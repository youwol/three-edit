import { BufferGeometry, Mesh } from 'three'
import { Action } from './Action'

const _name_ = 'DeleteVertex'

/**
 * @see serialize
 */
export function executeDeleteVertex(
    mesh: Mesh,
    json: any,
    isAction: boolean,
): Action | boolean {
    if (json.name !== _name_) {
        return false
    }

    const id = json.nodeID

    if (isAction) {
        return new DeleteVertexAction(mesh, id)
    }

    const geom = mesh.geometry
    const oldArray = geom.index.array
    const array: number[] = []

    for (let i = 0; i < oldArray.length; i += 3) {
        if (
            !(
                oldArray[i] === id ||
                oldArray[i + 1] === id ||
                oldArray[i + 2] === id
            )
        ) {
            array.push(oldArray[i], oldArray[i + 1], oldArray[i + 2])
        }
    }
    geom.index.copyArray(array)

    // const newPos = splice(geom.attributes.position.array, 3*id, 3)
    // geom.setAttribute('position', new BufferAttribute( newPos, 3 ) )

    geom.index.needsUpdate = true
    geom.attributes.position.needsUpdate = true
    geom.computeBoundingBox()
    geom.computeBoundingSphere()

    return true
}

export class DeleteVertexAction implements Action {
    geom: BufferGeometry = undefined
    oldArray: number[] = []
    newArray: number[] = []

    constructor(
        private obj: Mesh,
        private id: number,
    ) {
        this.geom = obj.geometry as BufferGeometry

        const index = this.geom.index
        const oldArray: number[] = Array.from(index.array)
        const newArray: Array<number> = []
        for (let i = 0; i < oldArray.length; i += 3) {
            if (
                oldArray[i] === this.id ||
                oldArray[i + 1] === this.id ||
                oldArray[i + 2] === this.id
            ) {
            } else {
                newArray.push(oldArray[i], oldArray[i + 1], oldArray[i + 2])
            }
        }
        this.oldArray = oldArray
        this.newArray = newArray
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
