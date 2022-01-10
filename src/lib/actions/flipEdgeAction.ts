import { BufferGeometry, Mesh } from 'three'
import { getAdjacentFaces } from '../utils/topology'
import { Action } from './Action'

const _name_ = "FlipEdge"

/**
 * @see serialize
 */
 export function executeFlipEdge(mesh: Mesh, json: any, isAction: boolean): Action | boolean {
    if (json.name !== _name_) {
        return false
    }

    if (isAction) {
        return new FlipEdgeAction(mesh, json.v1, json.v2)
    }

    const f1    = json.face1ID
    const f2    = json.face2ID
    const ids1  = json.face1IDs
    const ids2  = json.face2IDs
    const array = mesh.geometry.index.array
    
    for (let i=0; i<3; ++i) {
        array[f1+i] = ids1[i]
        array[f2+i] = ids2[i]
    }
    
    return true
}

export class FlipEdgeAction implements Action {
    geom : BufferGeometry  = undefined
    f1: number
    f2: number
    oldT1: number[]
    oldT2: number[]
    newT1: number[]
    newT2: number[]

    constructor(private obj: Mesh, private v1: number, private v2: number) {
        this.geom = obj.geometry as BufferGeometry
        const array = this.geom.index.array

        const faces = getAdjacentFaces(this.geom.index, v1, v2)
        if (faces.length !== 2) {
            return
        }

        const f1 = faces[0]
        const f2 = faces[1]
        this.f1 = f1
        this.f2 = f2

        // Indices of the current adjacent faces
        const t1 = new Tri(array[f1], array[f1+1], array[f1+2]) 
        const t2 = new Tri(array[f2], array[f2+1], array[f2+2])
        if (this.haveToSwap(t1, v1, v2)) {
            const v = v1
            v1 = v2
            v2 = v
        }
        t1.detect(v1, v2)
        t2.detect(v1, v2)

        this.oldT1 = t1.toArray()
        this.oldT2 = t2.toArray()
        this.newT1 = [t1.v, t2.v, v2]
        this.newT2 = [t2.v, t1.v, v1]
    }

    name() {
        return _name_
    }

    serialize() {
        return {
            name: _name_,
            v1: this.v1,
            v2: this.v2,
            face1ID: this.f1,
            face2ID: this.f2,
            face1IDs: this.newT1,
            face2IDs: this.newT2
        }
    }

    do() {
        const array = this.geom.index.array
        for (let i=0; i<3; ++i) {
            array[this.f1+i] = this.newT1[i]
            array[this.f2+i] = this.newT2[i]
        }
        this.geom.index.needsUpdate = true
    }

    undo() {
        const array = this.geom.index.array
        for (let i=0; i<3; ++i) {
            array[this.f1+i] = this.oldT1[i]
            array[this.f2+i] = this.oldT2[i]
        }
        this.geom.index.needsUpdate = true
    }

    // private getFaces(v1: number, v2: number) {
    //     const array = this.geom.index.array
    //     const faces = []

    //     // Find the 2 adjacent faces
    //     for (let i=0; i<array.length; i+=3) {
    //         const I = array[i]   // vertex 1
    //         const J = array[i+1] // vertex 2
    //         const K = array[i+2] // vertex 3
    //         if (I===J || I===K || J===K) continue // grrrr, sometime topology is bad
    //         const contains = I => I===v1 || I===v2
    //         if (contains(I) && contains(J)) faces.push(i)
    //         if (contains(J) && contains(K)) faces.push(i)
    //         if (contains(K) && contains(I)) faces.push(i)
    //     }

    //     return faces
    // }

    private haveToSwap(t: Tri, v1: number, v2: number) {
        if (t.i1 === v1) {
            if (t.i2 !== v2) return true
        }
        else if (t.i2 === v1) {
            if (t.i3 !== v2) return true
        }
        else {
            if (t.i1 !== v2) return true
        }
        return false
    }
}

class Tri {
    private v_: number = -1

    // Assume triangle
    constructor(public i1: number, public i2: number, public i3: number) {
    }

    get v() {
        return this.v_
    }

    toArray() {
        return [this.i1, this.i2, this.i3]
    }

    detect(v1: number, v2: number) {
        if (this.i1!==v1 && this.i1!==v2) {
            this.v_ = this.i1
        }
        else if (this.i2!==v1 && this.i2!==v2) {
            this.v_ = this.i2
        }
        else {
            this.v_ = this.i3
        }
    }
}
