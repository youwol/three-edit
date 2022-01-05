import { Action } from './Action'

/**
 * Allows to record a serie of [[Action]]s. Used internally...
 * 
 * Usage:
 * ```ts
 * const stack = new ActionStack(renderFct, 20)
 * 
 * // -----------------
 * // WARNING: actions are perform on the same Mesh
 * stack.do( ... )
 * ...
 * stack.undo()
 * ...
 * stack.redo()
 * // -----------------
 * 
 * play(mesh, stack.record)
 * ```
 * The generated json file will look like this
 * ```json
 * [
    {
        "name": "MoveVertex",
        "vertexID": 0,
        "to": [
            -25.927839279174805,
            113.20491027832031,
            14.182173728942871
        ]
    },
    {
        "name": "MoveVertex",
        "vertexID": 1,
        "to": [
            -12.998046875,
            110.45531463623047,
            34.69169998168945
        ]
    },
    {
        "name": "DeleteVertex",
        "nodeID": 14
    },
    {
        "name": "DeleteFace",
        "faceID": 1
    },
    {
        "name": "MatrixTransformObject",
        "matrix": [
            0.5672751706526195,
            0.8235283120579653,
            0,
            0,
            -0.8235283120579653,
            0.5672751706526195,
            0,
            0,
            0,
            0,
            1,
            0,
            0,
            0,
            0,
            1
        ]
    }
]
 * ```
 */
export class ActionRecorder {
    private stack_: any[] = []

    // NOTE: redo is the same as do
    do(action: Action) {
        this.stack_.push( action.serialize() )
    }

    undo() {
        this.stack_.pop()
    }

    get record() {
        return this.stack_
    }
}
