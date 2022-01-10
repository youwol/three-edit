import { BufferAttribute, BufferGeometry, Matrix4, Mesh, Vector3 } from 'three'
import { cloneArray, TypedArray } from '..'
import { HalfedgeAPI, nodesAroundNode, Node } from '../he'
//import { splice, cloneArray, TypedArray } from '../utils/arrayUtils'
import { Action } from './Action'

// See https://github.com/brainexcerpts/laplacian_smoothing_triangle_mesh

const _name_ = 'LaplacianSmooth'

export function executeLaplacianSmooth(mesh: Mesh, json: any, isAction: boolean): Action | boolean {
    if (json.name !== _name_) {
        return false
    }

    const iter = json.iter

    if (isAction) {
        return new LaplacianSmoothAction(mesh, iter)
    }

    const pos = new BufferAttribute(smooth(mesh, iter), 3)
    mesh.geometry.attributes.position.set( pos )
    mesh.geometry.attributes.position.needsUpdate = true
    mesh.geometry.computeBoundingBox()
    mesh.geometry.computeBoundingSphere()
    
    return true
}

export class LaplacianSmoothAction implements Action {
    geom    : BufferGeometry  = undefined
    oldIndex: BufferAttribute
    newIndex: BufferAttribute
    oldPos  : BufferAttribute
    newPos  : BufferAttribute

    constructor(private obj: Mesh, private iter: number = 10) {
        this.geom = obj.geometry as BufferGeometry
        this.oldPos = cloneArray(this.geom.attributes.position.array)
        this.newPos = smooth(obj, iter)
    }

    name() {
        return _name_
    }

    serialize() {
        return {
            name: _name_,
            nodeID: this.iter
        }
    }

    do() {
        this.geom.attributes.position.copyArray(this.newPos)
        this.geom.attributes.position.needsUpdate = true
        this.geom.computeBoundingBox()
        this.geom.computeBoundingSphere()
    }
    
    undo() {
        this.geom.attributes.position.copyArray(this.oldPos)
        this.geom.attributes.position.needsUpdate = true
        this.geom.computeBoundingBox()
        this.geom.computeBoundingSphere()
    }
}

type OneRing = Node[]



function smooth(mesh: Mesh, iter: number): TypedArray | number[] {
    const oneRing: Array<OneRing> = []
    const nodes  : Array<Node> = []

    const he = new HalfedgeAPI(mesh)
    he.surface.forEachNode( node => oneRing.push(nodesAroundNode(node)) )

    const count = mesh.geometry.attributes.position.count
    for (let j=0; j<count; ++j) nodes.push(he.surface.node(j))

    for (let i=0; i<iter; ++i) {
        for (let j=0; j<count; ++j) {
            const node = nodes[j]
            const ring = oneRing[j]
            const n = ring.length
            let xt=0, yt=0, zt=0
            ring.forEach( nodeR => {
                xt += nodeR.pos[0]
                yt += nodeR.pos[1]
                zt += nodeR.pos[2]
            })
            xt /= n
            yt /= n
            zt /= n

            const damp = 10
            const x=node.pos[0], y=node.pos[1], z=node.pos[2]
            const dx = xt-x, dy=yt-y, dz=zt-z
            node.setPos(x+dx/damp, y+dy/damp, z+dz/damp)
        }
    }

    return he.position
}
