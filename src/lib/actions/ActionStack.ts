import { Action } from './Action'
import { ActionRecorder } from './ActionRecorder'

/**
 * A stack of [[Action]]s
 */
export class ActionStack {
    callback: Function = undefined
    stackDo  : Array<Action>   = []
    stackUndo: Array<Action>   = []
    notifiers: Array<Function> = []
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

    /**
     * If you want to be notified when a action is done or undone
     * @param cb 
     */
    addNotifier(cb: Function) {
        this.notifiers.push(cb)
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

        const s = action.serialize()
        s['type'] = 'do'
        this.notify(s)
    }

    undo() {
        const action = this.stackDo.pop()
        if (action) {
            action.undo()
            this.stackUndo.push(action)

            if (this.recorder) {
                this.recorder.undo()
            }

            const s = action.serialize()
            s['type'] = 'undo'
            this.notify(s)
        }
    }

    redo() {
        const action = this.stackUndo.pop()
        if (action) {
            action.do()
            this.stackDo.push(action)

            if (this.recorder) {
                this.recorder.do(action)
            }

            const s = action.serialize()
            s['type'] = 'redo'
            this.notify(s)
        }
    }

    private notify(msg: any) {
        this.notifiers.forEach( cb => cb(msg) )
        if (this.callback) {
            this.callback()
        }
    }
}
