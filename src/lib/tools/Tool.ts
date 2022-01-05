import { Camera, Object3D, Scene, WebGLRenderer } from "three"
import { ActionStack } from "../actions/ActionStack"
import { Controler } from "../controlers"
// import { RenderFunctions } from "../utils/RenderFunctions"
import { RenderFunctions } from "@youwol/three-extra"

export class ToolParameters {
    public scene     : Scene          = undefined
    public camera    : Camera         = undefined
    public renderer  : WebGLRenderer  = undefined
    public controler : Controler      = undefined
    public renderFunctions: RenderFunctions = undefined
    public actionStack: ActionStack = undefined
    public domElement: HTMLElement    = undefined

    constructor(
        {
            scene=undefined, 
            camera=undefined, 
            renderer=undefined, 
            controler=undefined, 
            renderFunctions, 
            actionStack=undefined, 
            domElement=undefined
        }:{
            scene?: Scene, 
            camera?: Camera, 
            renderer?: WebGLRenderer, 
            controler?: Controler, 
            renderFunctions?: RenderFunctions, 
            actionStack?: ActionStack, 
            domElement?: HTMLElement
        }={
        })
    {
        this.scene      = scene
        this.camera     = camera
        this.renderer   = renderer
        this.controler  = controler
        this.domElement = domElement
        this.renderFunctions = renderFunctions
        this.actionStack = actionStack
    }
}

export interface Tool {
    attachObject(object: Object3D): void
    detachObject(): void
    dispose(): void
}
