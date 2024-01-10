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
 */
export class ActionRecorder {
    private stack_: any[] = []

    // NOTE: redo is the same as do
    do(action: Action) {
        this.stack_.push(action.serialize())
    }

    undo() {
        this.stack_.pop()
    }

    get record() {
        return this.stack_
    }
}
