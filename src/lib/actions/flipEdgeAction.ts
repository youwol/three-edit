import { BufferGeometry, Mesh } from 'three'
import { Action } from './Action'

const _name_ = "FlipEdge"

/**
 * @see serialize
 */
 export function executeFlipEdge(mesh: Mesh, json: any): boolean {
    if (json.name !== _name_) {
        return false
    }

    const id1 = json.face1ID
    const id2 = json.face2ID

    const geom     = mesh.geometry as BufferGeometry
    const oldArray = geom.index.array
    
    // TOBE continuated...
    
    return true
}

export class FlipEdgeAction implements Action {
    geom    : BufferGeometry  = undefined
    oldArray: number[] = []
    newArray: number[] = []

    face1: number = undefined
    face2: number = undefined

    constructor(private obj: Mesh, v1: number, v2: number) {
        this.geom = obj.geometry as BufferGeometry

        const faces = this.getFaces(v1, v2)
        // this.checkFaces(faces)
        // this.toGocad()
        if (faces.length !== 2) return

        const index = this.geom.index
        const oldArray: number[] = Array.from(index.array)
        const newArray = [...oldArray]

        // Get the edge between face1 and face2
        const f1 = [oldArray[3*this.face1], oldArray[3*this.face1+1], oldArray[3*this.face1+2]]
        const f2 = [oldArray[3*this.face2], oldArray[3*this.face2+1], oldArray[3*this.face2+2]]
        const adj = [-1, -1] // the 2 adjacent vertices
        const opp = [-1, -1] // the 2 opposite vertices
        let i = 0
        for (let j=0; j<3; ++j) {
            const f = f1[j]
            if (f === f2[0] || f === f2[1] || f === f2[2]) {
                adj[i++] = f
            }
        }
        for (let j=0; j<3; ++j) {
            if (f1[j] !== adj[0] && f1[j] !== adj[1]) opp[i++] = f1[j]
            if (f2[j] !== adj[0] && f2[j] !== adj[1]) opp[i++] = f2[j]
        }   

        // TOBE continuated...

        //newArray.splice(3*this.id, 3)
        this.oldArray = oldArray
        this.newArray = newArray
    }

    name() {
        return _name_
    }

    serialize() {
        return {
            name: _name_,
            face1ID: this.face1,
            face2ID: this.face2
        }
    }

    private getFaces(v1: number, v2: number) {
        const geom = this.obj.geometry as BufferGeometry
        const index = geom.index.array
        const faces = []

        // Find the 2 adjacent faces
        for (let i=0; i<index.length; i+=3) {
            const I = index[i] // vertex 1
            const J = index[i+1] // vertex 2
            const K = index[i+2] // vertex 3
            if (I===J || I===K || J===K) continue // grrrr
            const contains = I => I===v1 || I===v2
            if (contains(I) && contains(J)) faces.push(i)
            if (contains(J) && contains(K)) faces.push(i)
            if (contains(K) && contains(I)) faces.push(i)
        }

        return faces
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
