import { CombelObservable, CombelObserver } from './observer'
import { Node, Facet, Halfedge } from './combels'
import { Surface } from './Surface'
import { vec } from './vectors'

type FacetObserver = CombelObserver<Facet>
type Star = Map<Node, Array<Halfedge>>

/**
 * @category Halfedge
 */
export class SurfaceBuilder {

    beginSurface(s: Surface) {
        this.surface_ = s
    }

    endSurface() {
        this.terminateSurface()
        this.nodes_ = []
    }

    reset() {
    }

    /**
     * @param x Either nothing, the x component or an array of size 3
     * @param y Either nothing (if x is an array) or the y component
     * @param z Either nothing (default 0) or the z component
     */
    //addNode(x?: any, y?: any, z?: any) {
    addNode(p: vec.Vector3) {
        return this.addNodeInternal(p[0], p[1], p[2])
    }

    beginFacet() {
        this.facet_node_ = []
    }

    endFacet() {
        const nb_vertices = this.facet_node_.length
        if (nb_vertices < 3) {
            throw new Error("SurfaceBuilder: Facet with less than 3 vertices")
        }

        // Detect and remove non-manifold edges by duplicating
        // the corresponding vertices.
        for (let from = 0; from < nb_vertices; from++) {
            const to = ((from + 1) % nb_vertices)
            if (this.findHalfedgeBetween(this.facet_node_[from], this.facet_node_[to]) !== undefined) {
                this.facet_node_[from] = this.copyNode(this.facet_node_[from])
                this.facet_node_[to] = this.copyNode(this.facet_node_[to]);
            }
        }

        this.beginFacetInternal()
        {
            for (let i = 0; i < nb_vertices; i++) {
                this.addNodeToFacetInternal(this.facet_node_[i])
            }
        }
        this.endFacetInternal()
        return this.currentFacet()
    }

    addNodeToFacet(i: number) {
        if (i < 0 || i >= this.nodes_.length) {
            return
        }
        this.facet_node_.push(this.nodes_[i])
    }

    surface(): Surface {
        return this.surface_
    }

    // --------------------------------------------------

    private insertInStar(n: Node) {
        this.star_.set(n, [])
    }

    private getOrCreateFromStar(n: Node) {
        if (this.star_.has(n) === false) {
            this.star_.set(n, [])
            return this.star_.get(n)
        }
        return this.star_.get(n)
    }

    private deleteFromStarIfEmpty(n: Node) {
        const t = this.star_.get(n)
        if (t !== undefined && t.length === 0) {
            this.star_.delete(n)
        }
    }

    private currentFacet(): Facet {
        return this.current_facet_
    }

    private notifyRemoveNode(n: Node) {
        this.node_observable_.notifyRemove(n)
    }

    public registerFacetObserser(c: FacetObserver) {
        this.facet_observable_.registerObserver(c)
    }

    public unregisterFacetObserser(c: FacetObserver) {
        this.facet_observable_.unregisterObserver(c)
    }

    private notifyRemoveFacet(f: Facet) {
        this.facet_observable_.notifyRemove(f)
    }

    private notifyRemoveHalfedge(h: Halfedge) {
        this.halfedge_observable_.notifyRemove(h);
    }

    // ----------------------------------------------------------

    protected reindexNodes() {
        let i = 0;
        this.nodes_.forEach(node => node.setId(i++))
    }

    protected reindexFacets() {
        let i = 0;
        this.surface_.facets.forEach(facet => facet.setId(i++))
    }

    // ----------------------------------------------------------

    protected setSurface(s: Surface) { this.surface_ = s }

    private addNodeInternal(x?: any, y?: any, z?: any): Node {
        const new_v = this.newNode()
        if (Array.isArray(x)) {
            new_v.setPos(x[0], x[1], x[2])
        } else {
            new_v.setPos(x, y, z !== undefined ? z : 0)
        }
        this.nodes_.push(new_v)
        this.insertInStar(new_v)
        return new_v
    }

    private beginFacetInternal() {
        this.current_facet_ = this.newFacet()
        this.first_node_in_facet_ = undefined
        this.current_node_ = undefined
        this.first_halfedge_in_facet_ = undefined
        this.current_halfedge_ = undefined
    }

    private endFacetInternal() {
        const h = this.newHalfedgeBetween(this.current_node_, this.first_node_in_facet_)
        this.link(this.current_halfedge_, h, 1)
        this.link(h, this.first_halfedge_in_facet_, 1)
    }

    private addNodeToFacetInternal(v: Node) {
        if (this.first_node_in_facet_ === undefined) {
            this.first_node_in_facet_ = v
        } else {
            const new_halfedge = this.newHalfedgeBetween(this.current_node_, v)
            if (this.first_halfedge_in_facet_ === undefined) {
                this.first_halfedge_in_facet_ = new_halfedge
                this.makeFacetKey(this.first_halfedge_in_facet_)
            } else {
                this.link(this.current_halfedge_, new_halfedge, 1)
            }
            this.current_halfedge_ = new_halfedge
        }
        this.current_node_ = v
    }

    private copyNode(from: Node): Node {
        const result = this.newNode()
        result.setPos(from.pos[0], from.pos[1], from.pos[2]);
        return result;
    }

    protected link(h1: Halfedge, h2: Halfedge, dim: number) {
        switch (dim) {
            case 1:
                h1.setNext(h2)
                h2.setPrev(h1)
                break;
            case 2:
                h1.setOpposite(h2);
                h2.setOpposite(h1);
                break;
        }
    }

    // for each next linked halfedge around vertex stating at h, 
    // set vertex to v
    protected setNodeOnOrbit(h: Halfedge, v: Node) {
        let it = h
        do {
            it.setNode(v)
            it = it.nextAroundNode
        } while (it !== h)
    }

    // for each next linked halfedge stating at h, 
    // set facet to f
    protected setFacetOnOrbit(h: Halfedge, f: Facet) {
        let it = h
        do {
            it.setFacet(f)
            it = it.next
        } while (it !== h)
    }

    protected makeNodeKey(h: Halfedge, v?: Node) {
        if (v === undefined) {
            h.node.setHalfedge(h)
        } else {
            v.setHalfedge(h)
            h.setNode(v)
        }
    }

    protected makeFacetKey(h: Halfedge, f?: Facet) {
        if (f === undefined) {
            h.facet.setHalfedge(h)
        } else {
            f.setHalfedge(h)
            h.setFacet(f)
        }
    }

    protected newEdge(): Halfedge {
        return this.surface_.newEdge()
    }

    protected newNode(rhs?: Node): Node {
        return this.surface_.newNode(rhs);
    }

    protected newHalfedge(rhs?: Halfedge): Halfedge {
        return this.surface_.newHalfedge(rhs);
    }

    protected newFacet(rhs?: Facet): Facet {
        return this.surface_.newFacet(rhs)
    }

    protected deleteEdge(h: Halfedge) {
        this.notifyRemoveHalfedge(h)
        this.notifyRemoveHalfedge(h.opposite)
        this.surface_.deleteEdge(h)
    }

    protected deleteNode(v: Node) {
        this.notifyRemoveNode(v)
        this.surface_.deleteNode(v)
    }

    protected deleteHalfedge(h: Halfedge) {
        this.notifyRemoveHalfedge(h)
        this.surface_.deleteHalfedge(h)
    }

    public deleteFacet(f: Facet) {
        if (f === undefined) {
            return
        }
        this.notifyRemoveFacet(f)
        this.surface_.deleteFacet(f)
    }

    // Set vertex halfedge pointing to h
    protected setNodeHalfedge(v: Node, h: Halfedge) {
        v.setHalfedge(h)
    }

    // set opposite of h1 to be h2
    protected setHalfedgeOpposite(h1: Halfedge, h2: Halfedge) {
        h1.setOpposite(h2)
    }

    // Set next of h1 to be h2
    protected setHalfedgeNext(h1: Halfedge, h2: Halfedge) {
        h1.setNext(h2)
    }

    // set previous of h1 to be h2
    protected setHalfedgePrev(h1: Halfedge, h2: Halfedge) {
        h1.setPrev(h2)
    }

    // Set facet of h to be f
    protected setHalfedgeFacet(h: Halfedge, f: Facet) {
        h.setFacet(f)
    }

    // Set vertex of h to be v
    protected setHalfedgeNode(h: Halfedge, v: Node) {
        h.setNode(v)
    }

    // Set halfedge of f to be h
    protected setFacetHalfedge(f: Facet, h: Halfedge) {
        f.setHalfedge(h)
    }

    // --------------------------------------------------

    private newHalfedgeBetween(from: Node, to: Node): Halfedge {
        // Non-manifold edges have been removed
        // by the higher level public functions.
        // Let us do a sanity check anyway ...
        console.assert(this.findHalfedgeBetween(from, to) === undefined)
        const result = this.newHalfedge()
        this.setHalfedgeFacet(result, this.current_facet_)
        this.setHalfedgeNode(result, to)

        const opposite = this.findHalfedgeBetween(to, from)
        if (opposite !== undefined) {
            this.link(result, opposite, 2)
        }

        this.getOrCreateFromStar(from).push(result)
        this.setNodeHalfedge(to, result)
        return result
    }

    private findHalfedgeBetween(from: Node, to: Node): Halfedge {
        const star = this.getOrCreateFromStar(from)
        let sol = undefined
        star.forEach((cur: any) => {
            if (cur.node == to) {
                sol = cur
            }
        })
        return sol
    }

    private nodeIsManifold(v: Node): boolean {
        if (v.halfedge === undefined) {
            console.warn(`SurfaceBuilder: Warning, isolated vertex (${v.pos})`)
            return true
        }
        return (this.getOrCreateFromStar(v).length === v.degree)
    }

    private splitNonManifoldNode(v: Node): boolean {
        if (this.nodeIsManifold(v)) {
            return false
        }

        const star = new Set<Halfedge>()
        this.getOrCreateFromStar(v).forEach(h => star.add(h))

        // For the first wedge, reuse the vertex
        this.disconnectNode(v.halfedge.opposite, v, star)

        // There should be other wedges (else the vertex
        // would have been manifold)
        console.assert(star.size !== 0)

        // Create the vertices for the remaining wedges.
        while (star.size !== 0) {
            const new_v = this.copyNode(v)
            const h = star[0]
            this.disconnectNode(h, new_v, star)
        }
        return true
    }

    private disconnectNode(start_in: Halfedge, v: Node, star: Set<Halfedge>) {
        let start = start_in;
        this.insertInStar(v)

        console.assert(star.has(start))

        while (!start.isBorder) {
            start = start.prev.opposite
            if (start === start_in) {
                break
            }
        }
        this.setNodeHalfedge(v, start.opposite)

        let cur = start
        this.setHalfedgeNode(cur.opposite, v)
        this.getOrCreateFromStar(v).push(cur)
        // !!!
        star.delete(cur)

        while (!cur.opposite.isBorder) {
            cur = cur.opposite.next
            if (cur === start) {
                break;
            }
            this.setHalfedgeNode(cur.opposite, v)
            // !!!
            star.delete(cur);
            this.getOrCreateFromStar(v).push(cur)
        }

        if (start.isBorder) {
            this.link(cur.opposite, start, 1)
        }
    }

    private terminateSurface() {
        this.updateBorder(this.star_)

        // fix non-manifold vertices
        this.nodes_.forEach(node => {
            if (this.splitNonManifoldNode(node)) {
                // output warning
            }
        })

        this.nodes_.forEach(node => {
            this.deleteFromStarIfEmpty(node)
            // if (this.star_.get(node).length == 0) {
            //     this.deleteNode(node)
            // }
        })

        this.reindexNodes()
        this.reindexFacets()
    }

    private updateBorder(star: Star) {
        const tmp_list: Array<Halfedge> = []
        this.surface_.halfedges.forEach(h => {
            if (h.opposite === undefined) {
                tmp_list.push(h)
            }
        })

        if (tmp_list.length !== 0) {
            tmp_list.forEach(cur => {
                const h = this.newHalfedge()
                this.link(h, cur, 2)
                this.setHalfedgeNode(h, cur.prev.node)
                // For fixing non-manifold vertices later on
                star.get(cur.node).push(h)
            })
        }

        // Link the border
        this.surface_.halfedges.forEach(cur => {
            if (cur.facet === undefined) {
                let next = cur.opposite
                while (next.facet !== undefined) {
                    next = next.prev.opposite
                }
                this.setHalfedgeNext(cur, next)

                let prev = cur.opposite
                while (prev.facet !== undefined) {
                    prev = prev.next.opposite
                }
                this.setHalfedgePrev(cur, prev)
            }
        })
    }

    private node_observable_ = new CombelObservable<Node>()
    private facet_observable_ = new CombelObservable<Facet>()
    private halfedge_observable_ = new CombelObservable<Halfedge>()
    protected surface_: Surface = undefined
    private facet_node_ = new Array<Node>()
    private nodes_ = new Array<Node>()
    private current_facet_: Facet = undefined
    private current_node_: Node = undefined
    private current_halfedge_: Halfedge = undefined
    private first_node_in_facet_: Node = undefined
    private first_halfedge_in_facet_: Halfedge = undefined
    private star_ = new Map<Node, Array<Halfedge>>()
}
