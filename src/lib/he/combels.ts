import { vec } from './vectors'

/**
 * @category Halfedge
 */
export class Node {
    private pos_: [number, number, number] = [0, 0, 0]
    private id_ = -1
    private he_: Halfedge = undefined

    setPos(x: any, y?: number, z?: number) {
        if (Array.isArray(x)) {
            this.pos_[0] = x[0]
            this.pos_[1] = x[1]
            this.pos_[2] = x[2]
        } else {
            this.pos_[0] = x
            this.pos_[1] = y
            this.pos_[2] = z !== undefined ? z : 0
        }
    }

    setId(i: number) {
        this.id_ = i
    }

    get posVec3() {
        return this.pos_
    }
    get pos() {
        return this.pos_
    }
    get id() {
        return this.id_
    }
    get halfedge() {
        return this.he_
    }

    get isOnBorder(): boolean {
        let it = this.he_
        if (it === undefined) {
            return true
        }
        do {
            if (it.isBorder) {
                return true
            }
            it = it.nextAroundNode
        } while (it !== this.he_)
        return false
    }

    get degree(): number {
        let it = this.he_
        if (it === undefined) {
            return 0
        }
        let result = 0
        do {
            result++
            it = it.nextAroundNode
        } while (it !== this.he_)
        return result
    }

    setHalfedge(h: Halfedge) {
        this.he_ = h
    }
}

/**
 * @category Halfedge
 */
export class Facet {
    private halfedge_: Halfedge = undefined
    private id_ = -1

    get halfedge() {
        return this.halfedge_
    }
    get degree() {
        let result = 0
        let it = this.halfedge_
        do {
            result++
            it = it.next
        } while (it !== this.halfedge_)
        return result
    }
    get nbEdges() {
        return this.degree
    }
    get nbNodes() {
        return this.degree
    }
    get isOnBorder() {
        let it = this.halfedge_
        do {
            if (it.opposite.isBorder) {
                return true
            }
            it = it.next
        } while (it !== this.halfedge_)
        return false
    }
    get barycenter() {
        let pos = [0, 0, 0]
        let h = this.halfedge_
        let nb = 0
        do {
            const p = h.node.pos
            pos = pos.map((coord, i) => coord + p[i])
            h = h.next
            ++nb
        } while (h !== this.halfedge_)
        pos = pos.map((coord) => coord / nb)
        return pos
    }
    get isTriangle() {
        return this.halfedge_.next.next.next === this.halfedge_
    }
    get id() {
        return this.id_
    }
    get opposite() {
        return this.halfedge_.opposite.facet
    }

    setId(i: number) {
        this.id_ = i
    }
    setHalfedge(h: Halfedge) {
        this.halfedge_ = h
    }

    get nodes() {
        const ns = []
        let h = this.halfedge_
        do {
            ns.push(h.node)
            h = h.next
        } while (h !== this.halfedge_)
        return ns
    }

    get nodeIds() {
        const ns = []
        let h = this.halfedge_
        do {
            ns.push(h.node.id)
            h = h.next
        } while (h !== this.halfedge_)
        return ns
    }

    get area() {
        function triangleArea(v1: number[], v2: number[], v3: number[]) {
            return (
                vec.norm(
                    vec.cross(
                        vec.create(v1, v2) as vec.Vector3,
                        vec.create(v1, v3) as vec.Vector3,
                    ),
                ) * 0.5
            )
        }
        let result = 0
        let h = this.halfedge
        const p = h.node.pos
        h = h.next

        do {
            result += triangleArea(p, h.node.pos, h.next.node.pos)
            h = h.next
        } while (h !== this.halfedge)

        return result
    }
}

/**
 * An halfedge is made of a end-point node, and support a facet or
 * none if on border.
 *
 * @category Halfedge
 */
export class Halfedge {
    private node_: Node = undefined
    private opposite_: Halfedge = undefined
    private next_: Halfedge = undefined
    private prev_: Halfedge = undefined
    private facet_: Facet = undefined

    get opposite() {
        return this.opposite_
    }
    get next() {
        return this.next_
    }
    get prev() {
        return this.prev_
    }
    get facet() {
        return this.facet_
    }
    get node() {
        return this.node_
    } // The end node

    get length() {
        const a = this.node.pos
        const b = this.prev.node.pos
        const u = [0, 0, 0]
        for (let i = 0; i < 3; ++i) {
            u[i] = a[i] - b[i]
        }
        return Math.sqrt(u[0] ** 2 + u[1] ** 2 + u[2] ** 2)
    }

    get nextAroundNode() {
        return this.opposite.prev
    }
    get prevAroundNode() {
        return this.next.opposite
    }
    get isBorder() {
        return this.facet_ === undefined
    }
    get isBorderEdge() {
        return this.isBorder || this.opposite.isBorder
    }
    //get nextOnBorder() ;
    //get prevOnBorder() ;

    setOpposite(h: Halfedge) {
        this.opposite_ = h
    }
    setNext(h: Halfedge) {
        this.next_ = h
    }
    setPrev(h: Halfedge) {
        this.prev_ = h
    }
    setFacet(f: Facet) {
        this.facet_ = f
    }
    setNode(n: Node) {
        this.node_ = n
    }
}
