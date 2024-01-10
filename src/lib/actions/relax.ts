import { vec } from '../he/vectors'
import { nodesAroundNodeFct, Surface } from '../he'
import { cloneArray, newArray, TypedArray } from '../utils/arrayUtils'
import { BufferGeometry, Mesh, BufferAttribute } from 'three'
import { Action } from './Action'

const _name_ = 'Relax'

export function executeRelax(
    mesh: Mesh,
    json: any,
    isAction: boolean,
): Action | boolean {
    if (json.name !== _name_) {
        return false
    }

    const iter = json.iter

    if (isAction) {
        return new RelaxAction(mesh, iter)
    }

    const geom = mesh.geometry
    const pos = relaxMesh(
        geom.attributes.position.array,
        geom.index.array,
        iter,
    )
    for (let i = 0; i < pos.length; ++i) {
        geom.attributes.position.array[i] = pos[i]
    }
    geom.attributes.position.needsUpdate = true
    geom.computeBoundingBox()
    geom.computeBoundingSphere()

    return true
}

export class RelaxAction implements Action {
    geom: BufferGeometry = undefined
    oldPos: BufferAttribute
    newPos: BufferAttribute

    constructor(
        private obj: Mesh,
        private iter: number,
    ) {
        this.geom = obj.geometry as BufferGeometry
        this.oldPos = cloneArray(this.geom.attributes.position.array)
        this.newPos = newArray(
            this.geom.attributes.position.array,
            this.geom.attributes.position.array.length,
        )

        const pos = relaxMesh(this.oldPos, this.geom.index.array, iter)
        for (let i = 0; i < pos.length; ++i) {
            this.newPos[i] = pos[i]
        }
    }

    name() {
        return _name_
    }

    serialize() {
        return {
            name: _name_,
            iter: this.iter,
        }
    }

    do() {
        this.geom.setAttribute(
            'position',
            new BufferAttribute(new Float32Array(this.newPos), 3),
        )
        this.geom.attributes.position.needsUpdate = true
        this.geom.computeBoundingBox()
        this.geom.computeBoundingSphere()
    }

    undo() {
        this.geom.setAttribute(
            'position',
            new BufferAttribute(new Float32Array(this.oldPos), 3),
        )
        this.geom.attributes.position.needsUpdate = true
        this.geom.computeBoundingBox()
        this.geom.computeBoundingSphere()
    }
}

/**
 * Beautify a flat triangulated surface
 */
function relaxMesh(
    positions: TypedArray | number[],
    indices: TypedArray | number[],
    iterations = 100,
    damp = 0.1,
) {
    const surface = Surface.create(positions, indices)

    let meanArea = 0
    surface.forEachFace((f) => (meanArea += f.area))
    meanArea /= surface.nbFacets

    const meanEdge = Math.sqrt((4 * meanArea) / Math.sqrt(3))

    for (let i = 0; i < iterations; ++i) {
        surface.forEachNode((n, i) => {
            if (n.isOnBorder === false) {
                let f = [0, 0, 0]
                nodesAroundNodeFct(n, (n1) => {
                    let f1 = vec.create(n.pos, n1.pos) // force vector
                    const norm = vec.norm(f1) // length force vector
                    f1[0] /= norm
                    f1[1] /= norm
                    f = vec.add(
                        f,
                        vec.scale(f1, norm - meanEdge),
                    ) as vec.Vector3
                })
                n.setPos(n.pos[0] + f[0] * damp, n.pos[1] + f[1] * damp, f[2])
            }
        })
    }

    console.warn('WARNING: have to return the same type as input')
    return surface.nodesAsArray
}
