import { Mesh } from 'three'
import { Surface, SurfaceEditor } from '.'
import { newArray } from '..'

/**
 * This class is meant to simplify the use of the Halfedge data structure.
 * 
 * Usage:
 * ```ts
 * const api = new HalfedgeAPI(mesh)
 * api.addNotifier( _ => console.log('edting'))
 * 
 * api.collapseVertex(23)
 * api.eraseTriangle(265)
 * 
 * const position = new BufferAttribute(api.position, 3)
 * const index    = new BufferAttribute(api.index, 3)
 * ...
 * ```
 */
export class HalfedgeAPI {
    private editor: SurfaceEditor
    private notifiers: Function[] = []

    constructor(private mesh: Mesh) {
        const geom = mesh.geometry
        const surface = Surface.create(geom.attributes.position.array, geom.index.array)
        this.editor = new SurfaceEditor(surface)
    }

    addNotifier(cb: Function) {
        this.notifiers.push(cb)
    }

    get surface() {
        return this.editor.surface()
    }

    collapseVertex(id: number) {
        // find the node
        if (id<0 || id>this.editor.surface().nbNodes) {
            throw new Error(`vertex index (${id}) out of bounds (${this.editor.surface().nbNodes})`)
        }

        if (!this.editor.isModified) {
            this.editor.beginModif()
        }
        const v = this.editor.surface().node(id)
        this.editor.collapseNode(v)
        this.notify('collapse')
    }

    eraseVertex(id: number) {
        if (!this.editor.isModified) {
            this.editor.beginModif()
        }

        // find the node
        if (id<0 || id>this.editor.surface().nbNodes) throw new Error(`vertex index (${id}) out of bounds (${this.editor.surface().nbNodes})`)
        const v = this.editor.surface().node(id)
        this.editor.eraseNode(v)
        this.notify('eraseNode')
    }

    eraseTriangle(id: number) {
        if (!this.editor.isModified) {
            this.editor.beginModif()
        }

        // find the node
        if (id<0 || id>this.editor.surface().nbFacets) throw new Error(`triangle index (${id}) out of bounds (${this.editor.surface().nbFacets})`)
        const f = this.editor.surface().facet(id)
        this.editor.eraseFacet(f)
        this.notify('eraseFacet')
    }

    switchEdge(id1: number, id2: number) {
        // tODO

        this.notify('switchEdge')
    }

    fillHole(id1: number, id2: number) {
        // TODO

        this.notify('fillHole')
    }

    createTriangle(v1: number, v2: number, v3: number) {
        // TODO

        this.notify('createTriangle')
    }

    zipEdges(v11: number, v12: number, v21: number, v22: number) {
        // TODO

        this.notify('zipEdges')
    }

    unzipEdge(v1: number, v2: number) {
        // TODO

        this.notify('unzipEdge')
    }

    flipNormal(f: number) {
        // TODO

        this.notify('flipNormal')
    }

    flipNormals() {
        // TODO

        this.notify('flipNormals')
    }

    /**
     * Return an array of positions (x,y,z) for the nodes (i.e., like geometry.attributes.position.array).
     * The array is the same type as geometry.attributes.position.array.
     * 
     * Usage for three.js:
     * ```ts
     * const api = new SurfaceAPI(mesh)
     * const position = new BufferAttribute(api.position, 3)
     * const index    = new BufferAttribute(api.index, 3)
     * const borders  = new BufferAttribute(api.borderNodes, 3)
     * ```
     */
    get position() {
        if (this.editor.isModified) {
            this.editor.endModif()
        }

        const nodes = this.editor.surface().nodesAsArray
        const position = newArray(this.mesh.geometry.attributes.position.array, nodes.length)
        for (let i=0; i<nodes.length; ++i) {
            position[i] = nodes[i]
        }
        return position
    }

    /**
     * Return an array of index for the triangles (i.e., like geometry.index.array)
     */
    get index() {
        if (this.editor.isModified) {
            this.editor.endModif()
        }

        const ids = this.editor.surface().trianglesAsArray
        const index = newArray(this.mesh.geometry.index.array, ids.length)
        for (let i=0; i<ids.length; ++i) {
            index[i] = ids[i]
        }
        return index
    }

    /**
     * Return an array of node position
     */
    get borderNodes() {
        if (this.editor.isModified) {
            this.editor.endModif()
        }

        const nodes = this.editor.surface().bordersAsArray
        const position = newArray(this.mesh.geometry.attributes.position.array, nodes.length)
        for (let i=0; i<nodes.length; ++i) {
            position[i] = nodes[i]
        }
        return position
    }

    /**
     * Return an array of node id
     */
    get borderIds() {
        if (this.editor.isModified) {
            this.editor.endModif()
        }

        const ids = this.editor.surface().bordersAsArray
        const index = newArray(this.mesh.geometry.index.array, ids.length)
        for (let i=0; i<ids.length; ++i) {
            index[i] = ids[i]
        }
        return index
    }

    private notify(msg: any = undefined) {
        this.notifiers.forEach( n => n(msg) )
    }
}
