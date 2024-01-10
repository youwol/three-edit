import { Mesh, Object3D } from 'three'
import { TransformControls } from '../third/TransformControls'
import { MatrixTransformObjectAction } from '../actions'
import { Tool, ToolParameters } from './Tool'
import { ToolFactory } from './factory'
import { ActionStack } from '../actions/ActionStack'
import { RenderFunction } from '@youwol/three-extra'

initialize()

// ----------------------------------------------------

function initialize() {
    const names = ['translate', 'rotate', 'scale']
    names.forEach((name) => {
        ToolFactory.register(name, (params: ToolParameters) => {
            const tool = new Transform(params, name)
            setup(tool, params)
            return tool
        })
    })
}

// ----------------------

export class Transform extends TransformControls implements Tool {
    protected mesh: Object3D = undefined
    protected ActionStack: ActionStack = undefined
    private renderFct: RenderFunction = undefined

    constructor(params: ToolParameters, mode: string) {
        super(params.camera, params.renderer.domElement)

        const self = this as TransformControls
        this.ActionStack = params.actionStack
        self.setMode(mode)
        this.renderFct = params.renderFunctions.render
        self.addEventListener('change', this.renderFct)
        //this.setSpace('world')
        self.setSpace('local')
        self.addEventListener('dragging-changed', (event) => {
            params.controler.enabled = !event.value
        })
        params.scene.add(this)
        const domElement = params.domElement
            ? params.domElement
            : params.renderer.domElement
        domElement.addEventListener('keydown', (event) => {
            switch (event.key) {
                case '+':
                    self.setSize(self.size + 0.1)
                    break
                case '-':
                    self.setSize(Math.max(self.size - 0.1, 0.1))
                    break
                case 'x':
                    self.showX = !self.showX
                    break
                case 'y':
                    self.showY = !self.showY
                    break
                case 'z':
                    self.showZ = !self.showZ
                    break
                case ' ':
                    self.enabled = !self.enabled
                    break
            }
        })
    }

    attachObject(object: Object3D): void {
        if (object instanceof Mesh === false) {
            throw new Error('object is not an instance of Mesh')
        }
        this.mesh = object

        const mesh = object
        mesh.geometry.computeBoundingSphere()
        const center = mesh.geometry.boundingSphere.center.clone()

        const self = this as TransformControls
        self.position.copy(center)

        self.attach(object)
        this.renderFct()
    }

    detachObject() {
        this.doAction(this.ActionStack)
        const self = this as TransformControls
        self.detach()
    }

    dispose() {
        this.detachObject()
        //const self = this as TransformControls
        super.dispose()
    }

    private doAction(stack: ActionStack) {
        const t = this.mesh.position
        const s = this.mesh.scale
        const r = this.mesh.rotation
        let useless = t.x === 0 && t.y === 0 && t.z === 0
        useless = useless && s.x === 1 && s.y === 1 && s.z === 1
        useless = useless && r.x === 0 && r.y === 0 && r.z === 0
        if (useless === false) {
            const action = new MatrixTransformObjectAction(
                this.mesh,
                this.mesh.matrixWorld.clone(),
            )
            stack.do(action)
        } else {
            console.warn('Useless action')
        }
    }
}

// ----------------------

function setup(tool: Transform, params: ToolParameters): void {
    const self = Object.getPrototypeOf(tool)
    self.addEventListener('change', params.renderFunctions.render)
    self.setSpace('world')
    self.addEventListener('dragging-changed', (event) => {
        params.controler.enabled = !event.value
    })
    params.scene.add(tool)
    const domElement = params.domElement
        ? params.domElement
        : params.renderer.domElement
    domElement.addEventListener('keydown', (event) => {
        switch (event.key) {
            case '+':
                self.setSize(self.size + 0.1)
                break
            case '-':
                self.setSize(Math.max(self.size - 0.1, 0.1))
                break
            case 'x':
                self.showX = !self.showX
                break
            case 'y':
                self.showY = !self.showY
                break
            case 'z':
                self.showZ = !self.showZ
                break
            case ' ':
                self.enabled = !self.enabled
                break
        }
    })
}
