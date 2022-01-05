import { Camera, Object3D, Scene, WebGLRenderer } from "three"
import { ActionStack } from "../actions/ActionStack"
import { Controler } from "../controlers"
import { Tool, ToolParameters, ToolFactory } from "."
import { RenderFunctions } from "@youwol/three-extra"

const onColor  = 'rgb(0,0,0)'
const offColor = 'rgb(255,255,255)'

export class ToolbarParameters {
    public scene     : Scene          = undefined
    public camera    : Camera         = undefined
    public renderer  : WebGLRenderer  = undefined
    public controler : Controler      = undefined
    public renderFunctions: RenderFunctions = undefined
    public domElement: HTMLElement    = undefined
    public undoSize  : number
    public controlerDomName: string  = undefined
    public undoDomName: string  = undefined
    public redoDomName: string  = undefined

    constructor(
        {
            scene = undefined, 
            camera = undefined, 
            renderer = undefined, 
            controler = undefined, 
            renderFunctions, 
            domElement = undefined, 
            undoSize = 20,
            controlerDomName = undefined,
            undoDomName = undefined,
            redoDomName = undefined
        }:
        {
            scene?: Scene, 
            camera?: Camera, 
            renderer?: WebGLRenderer, 
            controler?: Controler, 
            renderFunctions?: RenderFunctions, 
            domElement?: HTMLElement,
            undoSize?: number,
            controlerDomName?: string,
            undoDomName?: string,
            redoDomName?: string
        })
    {
        this.scene      = scene 
        this.camera     = camera
        this.renderer   = renderer
        this.controler  = controler
        this.domElement = domElement
        this.renderFunctions = renderFunctions
        this.undoSize   = undoSize
        this.controlerDomName = controlerDomName
        this.undoDomName = undoDomName
        this.redoDomName = redoDomName
    }
}

export class Toolbar {
    private elts            : Array<HTMLElement> = []
    private tool            : Tool = undefined
    private toolButton      : HTMLElement = undefined // current toolbutton
    private controlerButton : HTMLElement = undefined // controler button
    private undoButton      : HTMLElement = undefined 
    private redoButton      : HTMLElement = undefined 
    private object          : Object3D = undefined
    
    private actionStack: ActionStack = undefined
    private scene: Scene
    private camera: Camera
    private renderer: WebGLRenderer
    private controler: Controler
    private domElement: HTMLElement
    private renderFunctions: RenderFunctions = undefined

    get toString() {
        return this.actionStack.toString()
    }

    constructor(params: ToolbarParameters) {
        this.actionStack    = new ActionStack(params.undoSize, params.renderFunctions.render)
        this.scene           = params.scene
        this.camera          = params.camera
        this.domElement      = params.domElement ? params.domElement : params.renderer.domElement
        this.controler       = params.controler
        this.renderer        = params.renderer
        this.renderFunctions = params.renderFunctions

        if (params.controlerDomName) {
            this.controlerButton = document.getElementById(params.controlerDomName)
            if (this.controlerButton) {
                this.controlerButton.addEventListener('click', () => {
                    this.detachTool()
                })
            }
        }

        if (params.undoDomName) {
            this.undoButton = document.getElementById(params.undoDomName)
            if (this.undoButton) {
                this.undoButton.addEventListener('click', () => {
                    this.actionStack.undo()
                })
            }
        }
        if (params.redoDomName) {
            this.redoButton = document.getElementById(params.redoDomName)
            if (this.redoButton) {
                this.redoButton.addEventListener('click', () => {
                    this.actionStack.redo()
                })
            }
        }

        // Have to use, for example, 'mousetrap' (https://www.npmjs.com/package/@types/mousetrap)
        // for keyboard binding in a generic way
        //
        if (params.domElement) {
            params.domElement.addEventListener( 'keydown', (event: KeyboardEvent) => {
                const isCtrl  = event.ctrlKey
                const isShift = event.shiftKey
                switch (event.key) {
                    case 'Z':
                    case 'z': {
                        if (isCtrl && !isShift) {
                            this.actionStack.undo()
                        }
                        if (isCtrl && isShift) {
                            this.actionStack.redo()
                        }
                        break
                    }
                    case 'Escape': 
                        if (this.tool) this.detachTool()
                        break
                }
            })
        }

        this.resetButton()
    }

    addTool(domName: string, toolNameInFactory: string) {
        const elt: HTMLElement = document.getElementById(domName)
        if (elt) {
            elt.addEventListener('click', () => {
                if (this.tool) {
                    this.detachTool()
                }
                this.toolButton = elt
                this.highlightButton()
                const params = new ToolParameters({
                    scene           : this.scene, 
                    renderer        : this.renderer,
                    camera          : this.camera,
                    controler       : this.controler,
                    renderFunctions : this.renderFunctions,
                    actionStack     : this.actionStack,
                    domElement      : this.domElement
                })
                this.tool = ToolFactory.get(toolNameInFactory, new ToolParameters(params))
                this.attachObject(this.object)
            })

            this.elts.push(elt)
            return true
        }
        return false
    }

    undo() {
        this.actionStack.undo()
    }

    redo() {
        this.actionStack.redo()
    }

    attachObject(object: Object3D) {
        this.object = object
        if (this.tool && this.object) {
            this.tool.attachObject(this.object)
        }
    }

    detachObject() {
        if (this.tool) {
            this.tool.detachObject()
        }
    }

    private highlightButton() {
        if (this.toolButton) {
            this.toolButton.style.color = onColor
        }
        if (this.controlerButton) {
            this.controlerButton.style.color = offColor
        }
    }

    private resetButton() {
        if (this.toolButton) {
            this.toolButton.style.color = offColor
        }
        if (this.controlerButton) {
            this.controlerButton.style.color = onColor
        }
    }

    private detachTool() {
        if (this.tool) {
            if (this.toolButton) {
                this.resetButton()
            }
            this.detachObject()
            this.tool.dispose()
            if (this.tool instanceof Object3D) this.scene.remove(this.tool)
            this.tool = undefined
        }
        this.renderFunctions.render()
    }
}

// function linkToolButton(name: string, cb: Function): boolean {
//     const elt: HTMLElement = document.getElementById(name)
//     if (elt) {
//         elt.addEventListener('click', () => cb() )
//         return true
//     }
//     return false
// }
