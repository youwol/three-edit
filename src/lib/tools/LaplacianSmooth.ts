import { EventDispatcher, Mesh } from 'three'
import { ActionStack } from '../actions/ActionStack'
import { Controler } from '../controlers'
import { ToolFactory } from './factory'
import { Tool, ToolParameters } from './Tool'
import { LaplacianSmoothAction } from '../actions'

ToolFactory.register(
    'laplacianSmooth',
    (params: ToolParameters) => new LaplacianSmooth(params),
)

export class LaplacianSmooth extends EventDispatcher implements Tool {
    stack: ActionStack = undefined
    _enabled = true
    controler: Controler = undefined

    constructor(params: ToolParameters) {
        super()
        this.stack = params.actionStack
        this.controler = params.controler
    }

    get enabled() {
        return this._enabled
    }
    set enabled(b: boolean) {
        this._enabled = b
    }

    dispose() {
        this.controler.enabled = true
    }

    attachObject(mesh: Mesh) {
        this.stack.do(new LaplacianSmoothAction(mesh, 10, 0.5))
    }

    detachObject() {
        this.controler.enabled = true
    }
}
