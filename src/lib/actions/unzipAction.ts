import { BufferGeometry, Mesh } from 'three'
import { getAdjacentFaces } from '../utils/topology'
import { Action } from './Action'

const _name_ = 'Unzip'

export function executeUnzip(
    mesh: Mesh,
    json: any,
    isAction: boolean,
): boolean {
    if (json.name !== _name_) {
        return false
    }

    throw new Error('Todo...')
}

export class UnzipAction implements Action {
    geom: BufferGeometry = undefined
    id1: number
    id2: number

    constructor(
        private obj: Mesh,
        v1: number,
        v2: number,
    ) {
        this.geom = obj.geometry

        const faces = getAdjacentFaces(this.geom.index, v1, v2)
        if (faces.length !== 2) {
            return
        }

        this.id1 = v1
        this.id2 = v2
    }

    name() {
        return _name_
    }

    serialize() {
        return {
            name: _name_,
            id1: this.id1,
            id2: this.id2,
        }
    }

    do() {}

    undo() {}
}
