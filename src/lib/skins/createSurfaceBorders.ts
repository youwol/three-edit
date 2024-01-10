import {
    Mesh,
    BufferGeometry,
    BufferAttribute,
    LineBasicMaterial,
    LineSegments,
    Color,
} from 'three'
import { HalfedgeAPI } from '../he/halfedgeAPI'

/**
 * Create the border edges for three.js given a triangulated surface (Mesh)
 */
export function createSurfaceBorders(mesh: Mesh, color = '#000') {
    const api = new HalfedgeAPI(mesh)
    const borders = api.borderNodes

    let geometry = undefined
    if (1) {
        // Fake indices
        const indices = []
        let id = 0
        for (let i = 0; i < borders.length / 6; ++i) {
            indices.push(id++, id++)
        }

        const geometry = new BufferGeometry()
        geometry.setAttribute('position', new BufferAttribute(borders, 3))
        geometry.setIndex(indices)
    } else {
        // TO BE TESTED
        const borders = api.borderIds
        const geometry = new BufferGeometry()
        geometry.setAttribute('position', mesh.geometry.attributs.position)
        geometry.setIndex(borders)
    }

    const material = new LineBasicMaterial({ color: new Color(color) })
    return new LineSegments(geometry, material)
}

/**
 * @brief Update an existing border edges (given by position) for a triangulated surface (Mesh)
 * @param mesh The triangulated surface for which we want to detect the border edges
 * @param position The existing BufferAttribute for the edges position
 * @see createSurfaceBorders for the returned LineSegments
 */
export function updateSurfaceBorders(mesh: Mesh, position: BufferAttribute) {
    const api = new HalfedgeAPI(mesh)
    const borders = api.borderNodes
    position.set(borders)
    position.needsUpdate = true
}
