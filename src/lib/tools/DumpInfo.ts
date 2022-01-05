import { Object3D } from "three"
import { ToolFactory } from "./factory"
import { ToolParameters, Tool } from "./Tool"

ToolFactory.register('dumpInfo', (params: ToolParameters) => new DumpInfo(params) )

/*
	Problem to solve: we have 2 scenes: spriteScene and lineScene
*/
export class DumpInfo implements Tool {
	domElement: HTMLElement = undefined

    constructor(private params: ToolParameters) {
		//console.log(params.actionStack.record)
		console.log( JSON.stringify(params.actionStack.record) )
	}
	
	attachObject(_: Object3D) {}
    detachObject(): void {}
    dispose(): void {}
}
