import { Action } from './Action'
import { ActionRecorder } from './ActionRecorder'

/**
 * A stack of [[Action]]s
 */
export class ActionStack {
    callback: Function = undefined
    stackDo  : Array<Action> = []
    stackUndo: Array<Action> = []
    maxSize_ = 10
    recorder = new ActionRecorder

    constructor(maxSize = 10, callback: Function = undefined) {
        this.callback = callback
        this.maxSize_ = maxSize
    }

    get record() {
        return this.recorder.record
    }

    get maxSize() {
        return this.maxSize_
    }

    set maxSize(s: number) {
        this.maxSize_ = s
        while (this.stackDo.length > this.maxSize_) {
            this.stackDo.shift()
        }
        while (this.stackUndo.length > this.maxSize_) {
            this.stackUndo.shift()
        }
    }

    do(action: Action) {
        this.stackDo.push(action)
        if (this.stackDo.length>this.maxSize_) {
            this.stackDo.shift()
        }
        this.stackUndo = []
        action.do()

        if (this.recorder) {
            this.recorder.do(action)
        }
        if (this.callback) this.callback()
    }

    undo() {
        const action = this.stackDo.pop()
        if (action) {
            action.undo()
            this.stackUndo.push(action)
            if (this.callback) this.callback()

            if (this.recorder) {
                this.recorder.undo()
            }
        }
    }

    redo() {
        const action = this.stackUndo.pop()
        if (action) {
            action.do()
            this.stackDo.push(action)
            if (this.callback) this.callback()

            if (this.recorder) {
                this.recorder.do(action)
            }
        }
    }
}
