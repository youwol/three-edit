import { Mesh } from 'three'
import {
    executeDeleteFace, 
    executeDeleteVertex, 
    executeFlipEdge, 
    executeMatrixTransformObject, 
    executeMoveObject, 
    executeMoveVertex, 
    executeSnapVertex
} from '.'


const map = new Map<string, Function>()
map.set('DeleteFace',               executeDeleteFace)
map.set('DeleteVertex',             executeDeleteVertex)
map.set('FlipEdge',                 executeFlipEdge)
map.set('MatrixTransformObject',    executeMatrixTransformObject)
map.set('MoveObject',               executeMoveObject)
map.set('MoveVertex',               executeMoveVertex)
map.set('SnapVertex',               executeSnapVertex)

/**
 * ```json
 *  [
 *      {
 *          "name"   : "DeleteFace",
 *          "faceID" : 123
 *      },
 *      {
 *          "name"   : "SnapVertex",
 *          "vertexID" : 123,
 *          "targetID" : 4276
 *      },
 *      ...
 *  ]
 * ```
 * @see [[ActionRecoder]]
 */
export function play(mesh: Mesh, json: string, display = true) {
    const actions = JSON.parse(json)
    actions.forEach( actionParams => {
        if (map.has(actionParams.name) === false) {
            throw new Error(`Cannot play series of actions, unknown action ${actionParams}`)
        }
        const fct = map.get(actionParams.name)
        if (display) console.log('Doing action:',actionParams)
        const ok = fct(mesh, actionParams)
    })
}
