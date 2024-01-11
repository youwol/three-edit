import { Facet } from './combels'
import { vec } from './vectors'

/**
 * @category Halfedge
 */
export function triangleArea(v1: number[], v2: number[], v3: number[]) {
    return (
        vec.norm(
            vec.cross(
                vec.create(v1, v2) as vec.Vector3,
                vec.create(v1, v3) as vec.Vector3,
            ),
        ) * 0.5
    )
}

/**
 * @see Facet.area
 *
 * @category Halfedge
 */
export function facetArea(f: Facet): number {
    let result = 0
    let h = f.halfedge
    const p = h.node.pos
    h = h.next

    do {
        result += triangleArea(p, h.node.pos, h.next.node.pos)
        h = h.next
    } while (h !== f.halfedge)

    return result
}
