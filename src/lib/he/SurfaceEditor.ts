import { SurfaceBuilder } from './SurfaceBuilder'
import { Surface } from './Surface'
import { Facet, Halfedge, Node } from './combels'

/**
 * @category Halfedge
 */
export class SurfaceEditor extends SurfaceBuilder {
    private is_modified_ = false

    constructor(mesh: Surface) {
        super()
        this.setSurface(mesh)
    }

    get isModified() {
        return this.is_modified_
    }

    beginModif() {
        this.is_modified_ = true
    }

    endModif() {
        this.is_modified_ = false
        this.reindexNodes()
        this.reindexFacets()
    }

    eraseFacet(facet: Facet) {
        console.assert(this.is_modified_)
        console.assert(facet !== undefined)

        let h = facet.halfedge
        console.assert(!h.isBorder)

        const edges_to_delete: Array<Halfedge> = []
        this.deleteFacet(h.facet)
        let end = h

        do {
            this.setHalfedgeFacet(h, undefined)
            const g = h.next
            const h_opp_on_border = h.opposite.isBorder
            const g_opp_on_border = g.opposite.isBorder
            if (h_opp_on_border) {
                if (g_opp_on_border) {
                    if (g.opposite.next == h.opposite) {
                        this.deleteNode(h.node)
                    } else {
                        this.makeNodeKey(h.opposite.prev)
                        this.link(h.opposite.prev, g.opposite.next, 1)
                    }
                }
                edges_to_delete.push(h)
            } else {
                if (h.next.opposite.isBorder) {
                    this.link(h, h.next.opposite.next, 1)
                    this.makeNodeKey(h)
                }
                if (h.prev.opposite.isBorder) {
                    const prev = h.prev.opposite.prev
                    this.link(prev, h, 1)
                    this.makeNodeKey(prev)
                }
            }
            h = g
        } while (h !== end)

        edges_to_delete.forEach((edge) => this.deleteEdge(edge))
    }

    eraseNode(v: Node) {
        console.assert(this.is_modified_)
        console.assert(v)
        console.assert(v.halfedge)

        const facets_to_delete: Array<Facet> = []
        let e = v.halfedge
        do {
            if (e.facet) facets_to_delete.push(e.facet)
            e = e.nextAroundNode
        } while (e !== v.halfedge)

        facets_to_delete.forEach((facet) => this.eraseFacet(facet))
        return true
    }

    /**
     * @returns undefined if failed, an halfedge of the new facet if succeed
     */
    collapseNode(v: Node, triangulate = true) {
        console.assert(this.is_modified_)

        if (v.halfedge.opposite.isBorder && v.halfedge.next.opposite.isBorder) {
            return undefined
        }

        {
            let b = undefined
            let it = v.halfedge
            do {
                if (it.isBorder) {
                    b = it
                    break
                }
                it = it.nextAroundNode
            } while (it !== v.halfedge)

            if (b !== undefined) {
                if (b.prev == b.next) {
                    return undefined
                }
                this.addFacetToBorder(b.prev, b.next)
            }
        }

        let h = v.halfedge.prev
        let it = h
        do {
            let jt = it.next
            if (jt.node === v) {
                jt = jt.opposite.next
                this.deleteEdge(it.next)
                this.deleteFacet(it.facet)
                this.link(it, jt, 1)
                this.makeNodeKey(it)
            }
            it = jt
        } while (it !== h)

        this.setFacetOnOrbit(h, this.newFacet())
        this.makeFacetKey(h)
        this.deleteNode(v)

        // triangulate
        if (triangulate) {
            this.triangulateFacet(h)
        }

        return h
    }

    addFacetToBorder(h: Halfedge, g: Halfedge) {
        console.assert(this.is_modified_)
        console.assert(h.isBorder)
        console.assert(g.isBorder)
        console.assert(h !== g)
        console.assert(this.halfedgesOnSameFacet(h, g))

        let h2 = h.next
        let g2 = g.next
        let n = this.newEdge()
        this.link(n, h2, 1)
        this.setHalfedgeNode(n, h.node)

        this.link(g, n, 1)
        this.setHalfedgeNode(n.opposite, g.node)

        this.link(h, n.opposite, 1)
        this.link(n.opposite, g2, 1)

        this.setFacetOnOrbit(n, this.newFacet())
        this.makeFacetKey(n)

        return n
    }

    halfedgesOnSameFacet(h1: Halfedge, h2: Halfedge) {
        let it = h1
        do {
            if (it == h2) {
                return true
            }
            it = it.next
        } while (it !== h1)
        return false
    }

    // return true if the facet can be splited, false otherwise
    canSplitFacet(h: Halfedge, g: Halfedge) {
        if (h === g) {
            return false
        }
        if (!this.halfedgesOnSameFacet(h, g)) {
            return false
        }
        if (h.next === g || g.next === h) {
            return false
        }
        return true
    }

    /**
        Do the following operation:
    
        o----o      o----o
        |     \     |\    \
        |      o => | \    o
        |     /     |  \  /
        o----o      o----o
    */
    splitFacet(h: Halfedge, g: Halfedge) {
        console.assert(this.is_modified_)
        if (!this.canSplitFacet(h, g)) {
            return false
        }

        let result = this.newEdge()

        this.link(result.opposite, g.next, 1)
        this.link(result, h.next, 1)
        this.link(g, result, 1)
        this.link(h, result.opposite, 1)
        this.setHalfedgeNode(result, h.node)
        this.setHalfedgeNode(result.opposite, g.node)
        this.makeFacetKey(result.opposite, h.facet)
        this.setFacetOnOrbit(result, this.newFacet())
        this.makeFacetKey(result)

        return true
    }

    /**
     * Triangulate a facet using split_facet() (for non triangular facet)
     */
    triangulateFacet(start: Halfedge) {
        console.assert(this.is_modified_)
        let cur = start.next.next
        while (cur.next != start) {
            this.splitFacet(start, cur)
            cur = cur.next.opposite.next
        }
    }

    createCenterNode(f: Facet) {
        console.assert(this.is_modified_)
        let h = f.halfedge
        let v = this.newNode()

        const p = f.barycenter
        this.deleteFacet(f)

        let first = true
        let it = h
        do {
            let jt = it.next
            let z = this.newEdge()
            this.link(it, z, 1)
            this.link(z.opposite, jt, 1)
            this.setHalfedgeNode(z, v)
            this.setHalfedgeNode(z.opposite, it.node)
            if (first) {
                first = false
                this.makeNodeKey(z)
            } else {
                this.link(z, it.prev, 1)
                this.setFacetOnOrbit(it, this.newFacet())
                this.makeFacetKey(it)
            }

            it = jt
        } while (it !== h)

        this.link(h.next, h.prev, 1)
        this.setFacetOnOrbit(h, this.newFacet())
        this.makeFacetKey(h)
        v.setPos(p)

        return v
    }

    // =======================================================================================

    canSwitchEdge(e: Halfedge) {
        if (e.isBorder) return false
        if (e.opposite.isBorder) return false
        if (!e.facet) return false
        if (!e.opposite.facet) return false
        if (!e.facet.isTriangle) return false
        if (!e.opposite.facet.isTriangle) return false
        return true
    }

    /**
        Do the following:
    
              o          o
          e1 /|\ e2o    / \
            / | \      /   \
           o  |  o => o-----o
            \ | /      \   /
          e2 \|/ e1o    \ /
              o          o
    */
    switchEdge(e0: Halfedge) {
        console.assert(this.is_modified_)
        if (!this.canSwitchEdge(e0)) {
            return false
        }

        let e1 = e0.next
        let e2 = e0.next.next
        let e0_opp = e0.opposite
        let e1_opp = e0_opp.next
        let e2_opp = e0_opp.next.next

        this.deleteFacet(e0.facet)
        this.deleteFacet(e0_opp.facet)
        this.deleteEdge(e0)

        e0 = this.newHalfedge()
        e0_opp = this.newHalfedge()
        this.link(e0, e0_opp, 2)
        this.setHalfedgeNode(e0, e1.node)
        this.setHalfedgeNode(e0_opp, e1_opp.node)

        this.link(e0, e2, 1)
        this.link(e2, e1_opp, 1)
        this.link(e1_opp, e0, 1)
        this.makeNodeKey(e0)
        this.makeNodeKey(e2)
        this.makeNodeKey(e1_opp)
        this.setFacetOnOrbit(e0, this.newFacet())
        this.makeFacetKey(e0)

        this.link(e0_opp, e2_opp, 1)
        this.link(e2_opp, e1, 1)
        this.link(e1, e0_opp, 1)
        this.makeNodeKey(e2_opp)
        this.setFacetOnOrbit(e0_opp, this.newFacet())
        this.makeFacetKey(e0_opp)

        return true
    }

    fillHole(h: Halfedge, triangulate: boolean) {
        console.assert(this.is_modified_)

        if (!h.isBorder) return undefined

        let facet = this.newFacet()
        this.setFacetOnOrbit(h, facet)
        this.makeFacetKey(h)
        if (triangulate) {
            this.triangulateFacet(h)
        }

        return h
    }

    makePolygon(nb: number): Halfedge {
        console.assert(this.is_modified_)
        let first = undefined
        let cur = undefined
        for (let i = 0; i < nb; i++) {
            if (first === undefined) {
                first = this.newEdge()
                cur = first
                this.makeFacetKey(cur, this.newFacet())
            } else {
                this.link(cur, this.newEdge(), 1)
                this.link(cur.next.opposite, cur.opposite, 1)
                this.setHalfedgeFacet(cur.next, cur.facet)
                this.setHalfedgeNode(cur.next.opposite, cur.node)
                cur = cur ? cur.next : undefined
            }
            this.makeNodeKey(cur, this.newNode())
        }
        this.link(cur, first, 1)
        this.link(first.opposite, cur.opposite, 1)
        this.setHalfedgeNode(first.opposite, cur.node)

        return first
    }

    makeTriangle(p1?: any, p2?: any, p3?: any): Halfedge {
        console.assert(this.is_modified_)
        if (p1 === undefined) {
            return this.makePolygon(3)
        }

        console.assert(p2 !== undefined)
        console.assert(p3 !== undefined)

        if (Array.isArray(p1)) {
            let result = this.makeTriangle()
            result.node.setPos(p1)
            result.next.node.setPos(p2)
            result.next.next.node.setPos(p3)
            return result
        }

        let first = undefined
        let cur = undefined

        const v = Array(3).fill(undefined)
        v[0] = p1
        v[1] = p2
        v[2] = p3

        for (let i = 0; i < 3; i++) {
            if (first === undefined) {
                first = this.newEdge()
                cur = first
                this.makeFacetKey(cur, this.newFacet())
            } else {
                this.link(cur, this.newEdge(), 1)
                this.link(cur.next.opposite, cur.opposite, 1)
                this.setHalfedgeFacet(cur.next, cur.facet)
                this.setHalfedgeNode(cur.next.opposite, cur.node)
                if (cur) {
                    cur = cur.next
                } else {
                    throw new Error('cur is undefined')
                }
            }
            this.makeNodeKey(cur, v[i])
        }
        this.link(cur, first, 1)
        this.link(first.opposite, cur.opposite, 1)
        this.setHalfedgeNode(first.opposite, cur.node)

        return first
    }

    halfedgeBetween(v1: Node, v2: Node): Halfedge {
        let cir = v2.halfedge
        do {
            if (cir.opposite.node == v1) {
                return cir
            }
            cir = cir.nextAroundNode
        } while (cir !== v2.halfedge)

        return undefined
    }

    private swapNode(v1: Node, v2: Node) {
        let v = v1
        v1 = v2
        v2 = v
    }

    createFacet(v1: Node, v2: Node, v3: Node) {
        console.assert(this.is_modified_)
        let e12 = this.halfedgeBetween(v1, v2)
        let e23 = this.halfedgeBetween(v2, v3)
        let e31 = this.halfedgeBetween(v3, v1)

        if (e12 !== undefined && e12.node === v2) {
            this.swapNode(v1, v2)
        }
        if (e23 !== undefined && e23.node === v3) {
            this.swapNode(v2, v3)
        }
        if (e31 !== undefined && e31.node === v1) {
            this.swapNode(v3, v1)
        }

        let e = this.makeTriangle(v1, v2, v3)
        if (e12) {
            this.glue(
                e12.isBorder ? e12 : e12.opposite,
                e.next.isBorder ? e.next : e.next.opposite,
            )
        }
        if (e23) {
            this.glue(
                e23.isBorder ? e23 : e23.opposite,
                e.next.next.isBorder ? e.next.next : e.next.next.opposite,
            )
        }
        if (e31) {
            this.glue(
                e31.isBorder ? e31 : e31.opposite,
                e.isBorder ? e : e.opposite,
            )
        }

        return true
    }

    canGlue(h0: Halfedge, h1: Halfedge) {
        if (!h0.isBorder) return false
        if (!h1.isBorder) return false
        if (h0.opposite.facet == h1.opposite.facet) return false
        if (
            this.halfedgeExistsBetweenNodes(h0.node, h1.opposite.node) ||
            this.halfedgeExistsBetweenNodes(h1.node, h0.opposite.node)
        ) {
            return false
        }
        if (
            !this.canMergeNodes(h0, h1.opposite) ||
            !this.canMergeNodes(h1, h0.opposite)
        ) {
            return false
        }

        return true
    }

    barycenter(p1: number[], p2: number[]) {
        return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2]
    }

    glue(h0: Halfedge, h1: Halfedge) {
        console.assert(this.is_modified_)
        if (!this.canGlue(h0, h1)) {
            return false
        }

        const new_p0 = this.barycenter(h0.node.pos, h1.opposite.node.pos)
        const new_p1 = this.barycenter(h1.node.pos, h0.opposite.node.pos)

        // merge vertices if necessary
        const dest0 = h0.node
        const dest1 = h1.node
        const org0 = h0.opposite.node
        const org1 = h1.opposite.node

        if (org0 != dest1) {
            this.setNodeOnOrbit(h1, org0)
            this.deleteNode(dest1)
        }

        if (org1 != dest0) {
            this.setNodeOnOrbit(h0, org1)
            this.deleteNode(dest0)
        }

        this.link(h1.prev, h0.next, 1)
        this.link(h0.prev, h1.next, 1)
        this.link(h0.opposite, h1.opposite, 2)
        this.makeNodeKey(h0.opposite)
        this.makeNodeKey(h1.opposite)

        org1.setPos(new_p0)
        org0.setPos(new_p1)

        this.deleteHalfedge(h0)
        this.deleteHalfedge(h1)

        return true
    }

    canMergeNodes(h0: Halfedge, h1: Halfedge) {
        if (h0.node === h1.node) return true

        return (
            this.orbitsAreCompatible(h0, h1) && this.orbitsAreCompatible(h1, h0)
        )
    }

    halfedgeExistsBetweenNodes(v1: Node, v2: Node) {
        let cir = v1.halfedge
        do {
            if (cir.opposite.node == v2) {
                return true
            }
            cir = cir.nextAroundNode
        } while (cir !== v1.halfedge)
        return false
    }

    orbitsAreCompatible(h0: Halfedge, h1: Halfedge) {
        let cir_h0 = h0
        do {
            // Number of potential opposites half_edges
            // (should not be greater than 1)
            let nb_common = 0
            let hh0 = cir_h0.opposite
            let cir_h1 = h1
            do {
                let hh1 = cir_h1.opposite
                if (
                    hh0.node === hh1.node ||
                    (hh0.node === h0.opposite.node &&
                        hh1.node === h1.opposite.node) ||
                    (hh0.node === h1.opposite.node &&
                        hh1.node === h0.opposite.node)
                ) {
                    if (
                        (hh0.opposite.isBorder && hh1.isBorder) ||
                        (hh0.isBorder && hh1.opposite.isBorder)
                    ) {
                        // Found a potential opposite edge.
                        nb_common++
                    } else {
                        // Potential opposite edge not on the border.
                        return false
                    }
                }
                cir_h1 = cir_h1.nextAroundNode
            } while (cir_h1 !== h1)

            if (nb_common > 1) {
                return false
            }
            cir_h0 = cir_h0.nextAroundNode
        } while (cir_h0 !== h0)
        return true
    }

    canUnglue(h: Halfedge) {
        if (h.isBorderEdge) {
            return false
        }
        return h.node.isOnBorder || h.opposite.node.isOnBorder
    }

    unglue(h0: Halfedge, check: boolean) {
        console.assert(this.is_modified_)
        if (check && !this.canUnglue(h0)) {
            return false
        }

        if (h0.isBorderEdge) {
            return false
        }

        let h1 = h0.opposite
        let v0 = h0.node
        let v1 = h1.node
        let v0_on_border = v0.isOnBorder
        let v1_on_border = v1.isOnBorder

        console.assert(!check || v0_on_border || v1_on_border)

        let n0 = this.newEdge()
        let n1 = n0.opposite

        this.link(h0, n0, 2)
        this.link(h1, n1, 2)

        // If v1 is on the border, find the predecessor and
        // the successor of the newly created edges, and
        // split v1 into two vertices.
        if (v1_on_border) {
            let next0 = h0.prev.opposite
            while (!next0.isBorder) {
                next0 = next0.prev.opposite
            }
            console.assert(next0 != h0)
            let prev1 = h1.next.opposite
            while (!prev1.isBorder) {
                prev1 = prev1.next.opposite
            }
            console.assert(prev1 != h1)
            console.assert(prev1.node == v1)
            console.assert(prev1.next == next0)
            this.link(n0, next0, 1)
            this.link(prev1, n1, 1)
            this.setNodeOnOrbit(n0, this.newNode(v1))
            this.makeNodeKey(n0)
            this.makeNodeKey(h1)
        } else {
            this.setHalfedgeNode(n0, v1)
        }

        // If v0 is on the border, find the predecessor and
        // the successor of the newly created edges, and
        // split v0 into two vertices.
        if (v0_on_border) {
            let prev0 = h0.next.opposite
            while (!prev0.isBorder) {
                prev0 = prev0.next.opposite
            }
            console.assert(prev0 != h0)
            let next1 = h1.prev.opposite
            while (!next1.isBorder) {
                next1 = next1.prev.opposite
            }
            console.assert(next1 != h1)
            console.assert(prev0.next == next1)
            this.link(prev0, n0, 1)
            this.link(n1, next1, 1)
            this.setNodeOnOrbit(n1, this.newNode(v0))
            this.makeNodeKey(n1)
            this.makeNodeKey(h0)
        } else {
            this.setHalfedgeNode(n1, v0)
        }

        return true
    }

    flipNormals() {
        console.assert(this.is_modified_)
        this.surface_.facets.forEach((facet) => {
            this.flipNormal(facet.halfedge)
        })

        this.surface_.halfedges.forEach((h) => {
            if (h.isBorder && h.node === h.opposite.node) this.flipNormal(h)
        })
    }

    flipNormal(first: Halfedge) {
        console.assert(this.is_modified_)

        if (first === undefined) return

        let last = first
        let prev = first
        let start = first
        first = first.next
        let new_v = start.node

        while (first !== last) {
            let tmp_v = first.node
            this.setHalfedgeNode(first, new_v)
            this.setNodeHalfedge(first.node, first)
            new_v = tmp_v
            let next = first.next
            this.setHalfedgeNext(first, prev)
            this.setHalfedgePrev(first, next)
            prev = first
            first = next
        }
        this.setHalfedgeNode(start, new_v)
        this.setNodeHalfedge(start.node, start)
        let next = start.next
        this.setHalfedgeNext(start, prev)
        this.setHalfedgePrev(start, next)
    }

    zipEdge(src: Node) {
        console.assert(this.is_modified_)

        let h1 = undefined
        let h2 = undefined
        let it = src.halfedge
        do {
            if (it.isBorder) {
                if (h1 === undefined) {
                    h1 = it
                } else {
                    h2 = it
                }
            }
            if (it.opposite.isBorder) {
                if (h1 === undefined) {
                    h1 = it.opposite
                } else {
                    h2 = it.opposite
                }
            }
            it = it.nextAroundNode
        } while (it !== src.halfedge)

        if (h1 !== undefined && h2 !== undefined) {
            this.glue(h1, h2)
        }
        return true
    }
}
