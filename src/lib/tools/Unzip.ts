import { ToolFactory } from './factory'
import { ToolParameters } from './Tool'
import { FlipEdgeTool } from '.'
import { UnzipAction } from '../actions/unzipAction'
import { Action } from '../actions'

ToolFactory.register('unzip', (params: ToolParameters) => new UnzipTool(params))

// ------------------------------------------------

export class UnzipTool extends FlipEdgeTool {
    getAction(): Action {
        return new UnzipAction(this.mesh, this.v1, this.v2)
    }
}
