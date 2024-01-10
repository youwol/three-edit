import { Node, Halfedge, Facet } from './combels'

/**
 * Loop over all nodes around a node
 */
export function nodesAroundNodeFct(node: Node, cb: Function) {
    let cir = node.halfedge
    let i = 0
    do {
        const n = cir.opposite.node
        cb(n, i++)
        cir = cir.nextAroundNode
    } while (cir !== node.halfedge)
}

export function nodesAroundNode(node: Node): Node[] {
    let cir = node.halfedge
    let i = 0
    const r = []
    do {
        const n = cir.opposite.node
        r.push(n)
        cir = cir.nextAroundNode
    } while (cir !== node.halfedge)
    return r
}

/**
 * Loop over all nodes around an halfedge
 */
export function nodesAroundHalfedge(edge: Halfedge, cb: Function) {
    let cir = edge
    let i = 0
    do {
        const e = cir.opposite.node
        cb(e, i++)
        cir = cir.nextAroundNode
    } while (cir !== edge)
}

/**
 * Loop over all facets around a node
 */
export function facetsAroundNodeFct(node: Node, cb: Function) {
    let cir = node.halfedge
    let i = 0
    do {
        const facet = cir.facet
        cb(facet, i++)
        cir = cir.nextAroundNode
    } while (cir !== node.halfedge)
}

export function facetsAroundNode(node: Node): Facet[] {
    let cir = node.halfedge
    let i = 0
    const r = []
    do {
        const facet = cir.facet
        r.push(facet)
        cir = cir.nextAroundNode
    } while (cir !== node.halfedge)
    return r
}
