import {
    Camera,
    CanvasTexture,
    EventDispatcher,
    LineBasicMaterial,
    Object3D,
    Scene,
    Sprite,
    SpriteMaterial,
    Vector2,
    WebGLRenderer,
    Raycaster,
    BufferGeometry,
    BufferAttribute,
    Line,
    Vector3,
} from 'three'
import { RenderFunctions } from '@youwol/three-extra'

import { ToolFactory } from './factory'
import { ToolParameters, Tool } from './Tool'
import { createCircleSprite } from '@youwol/three-extra'

ToolFactory.register('ruler', (params: ToolParameters) => new Ruler(params))

/*
	Problem to solve: we have 2 scenes: spriteScene and lineScene
*/
export class Ruler extends EventDispatcher implements Tool {
    activeLine: RulerLine = undefined
    lineScene = new Scene()
    spriteScene = new Scene()
    hasMoved = false

    renderer: WebGLRenderer = undefined
    camera: Camera = undefined
    mesh: Object3D = undefined
    mainScene: Scene = undefined
    domElement: HTMLElement = undefined
    //renderFct: RenderFunction
    renderFunctions: RenderFunctions = undefined
    uuidFct: string = undefined

    constructor(params: ToolParameters) {
        super()
        this.camera = params.camera
        this.renderer = params.renderer
        this.mainScene = params.scene
        this.domElement = params.domElement
            ? params.domElement
            : params.renderer.domElement
        this.renderFunctions = params.renderFunctions

        this.domElement.addEventListener(
            'pointerdown',
            this.onPointerDown,
            false,
        )
        this.domElement.addEventListener(
            'pointermove',
            this.onPointerMove,
            false,
        )
    }

    attachObject(object: Object3D) {
        this.mesh = object

        this.uuidFct = this.renderFunctions.add(() => {
            this.renderer.clearDepth()
            this.renderer.render(this.lineScene, this.camera)
            this.renderer.clearDepth()
            this.renderer.render(this.spriteScene, this.camera)
        })
    }

    detachObject(): void {
        this.renderFunctions.remove(this.uuidFct)
    }

    dispose(): void {
        this.detachObject()
        this.domElement.removeEventListener(
            'pointerdown',
            this.onPointerDown,
            false,
        )
        this.domElement.removeEventListener(
            'pointermove',
            this.onPointerMove,
            false,
        )
    }

    onPointerDown = (e: PointerEvent) => {
        e.preventDefault()
        switch (e.pointerType) {
            case 'mouse':
            case 'pen':
                this.onClick(e)
                break
            // TODO touch
        }
    }
    onPointerMove = (e: PointerEvent) => {
        e.preventDefault()
        switch (e.pointerType) {
            case 'mouse':
            case 'pen':
                this.onMouseMove(e)
                break
            // TODO touch
        }
    }

    onClick = (evt: MouseEvent) => {
        if (this.hasMoved) {
            return false
        }

        let x = evt.offsetX
        let y = evt.offsetY
        let size = this.renderer.getSize(new Vector2())
        let mouse = new Vector2(
            (x / size.width) * 2 - 1,
            (-y / size.height) * 2 + 1,
        )
        let raycaster = new Raycaster()
        raycaster.setFromCamera(mouse, this.camera)
        let intersects = raycaster.intersectObject(this.mesh)

        if (intersects.length > 0) {
            let point = intersects[0].point

            if (this.activeLine === undefined) {
                this.activeLine = new RulerLine(point, this.spriteScene) // new rulerLine
                this.lineScene.add(this.activeLine)
            } else {
                this.activeLine.setExtremity(point)
                this.activeLine = undefined
            }
        } else {
            if (this.activeLine) {
                this.lineScene.remove(this.activeLine)
                this.activeLine.reset()
                this.activeLine = undefined
            }
        }
        this.renderFunctions.render()
    }

    onMouseMove = (e: MouseEvent) => {
        let x = e.offsetX
        let y = e.offsetY

        let size = this.renderer.getSize(new Vector2())
        let mouse = new Vector2(
            (x / size.width) * 2 - 1,
            (-y / size.height) * 2 + 1,
        )

        let raycaster = new Raycaster()
        raycaster.setFromCamera(mouse, this.camera)
        let intersects = raycaster.intersectObject(this.mesh)

        if (this.activeLine) {
            if (intersects.length > 0) {
                this.activeLine.moveTarget(intersects[0].point)
            } else {
                this.activeLine.moveTarget(0)
            }
            this.renderFunctions.render()
        }
    }
}

class RulerLine extends Line {
    sprite1: Sprite = undefined
    sprite2: Sprite = undefined
    sprite: Sprite = undefined
    circleSprite: Sprite = undefined
    lineMaterial: LineBasicMaterial = undefined
    spriteScene: Scene = undefined

    constructor(point: Vector3, spriteScene: Scene) {
        super(
            new BufferGeometry(),
            new LineBasicMaterial({
                color: 0xffff00,
                linewidth: 1,
            }),
        )

        this.spriteScene = spriteScene
        this.circleSprite = createCircleSprite()

        this.sprite1 = this.circleSprite.clone()
        this.sprite2 = this.circleSprite.clone()
        this.sprite1.position.copy(point.clone())
        this.sprite2.position.copy(point.clone())
        this.spriteScene.add(this.sprite1)
        this.spriteScene.add(this.sprite2)

        //this.geometry = new BufferGeometry() // Why call to super? Inheritance doesn't work???!

        const s1 = this.sprite1.position
        const s2 = this.sprite2.position
        const vertices = new Float32Array([s1.x, s1.y, s1.z, s2.x, s2.y, s2.z])

        const self = this as Line
        self.geometry.setAttribute('position', new BufferAttribute(vertices, 3))

        this.makeDistanceSprite()
    }

    update(point: Vector3) {
        let sprite1 = this.circleSprite
        let sprite2 = this.circleSprite
        sprite1.position.copy(point.clone())
        sprite2.position.copy(point.clone())
    }

    moveTarget(p: Vector3 | number) {
        const pos = (this as Line).geometry.getAttribute('position')
        if (p instanceof Number) {
            pos.setXYZ(1, pos.getX(p), pos.getY(p), pos.getZ(p))
        } else {
            pos.setXYZ(1, p.x, p.y, p.z)
        }

        this.makeDistanceSprite()
        pos.needsUpdate = true
    }

    setExtremity(point: Vector3) {
        const self = this as Line
        // Move the second point
        const geom = self.geometry.getAttribute('position')
        geom.setXYZ(1, point.x, point.y, point.z)
        this.sprite2.position.set(point.x, point.y, point.z)
        geom.needsUpdate = true
        this.makeDistanceSprite()
    }

    reset = () => {
        this.spriteScene.remove(this.sprite1)
        this.spriteScene.remove(this.sprite2)
        //this.lineScene.remove.apply(this.lineScene, this.lineScene.children);
        //this.spriteScene.remove.apply(this.spriteScene, this.spriteScene.children);
    }

    makeDistanceSprite() {
        if (this.sprite !== undefined) {
            this.spriteScene.remove(this.sprite)
        }

        let canvas = document.createElement('canvas')
        let ctx = canvas.getContext('2d')
        let fontsize = 22

        ctx.font = 'bolder ' + fontsize + 'px "Open Sans", Arial'

        const self = this as Line // ???

        const geom = self.geometry.getAttribute('position')
        const v0 = new Vector3(geom.getX(0), geom.getY(0), geom.getZ(0))
        const v1 = new Vector3(geom.getX(1), geom.getY(1), geom.getZ(1))

        let length = v0.clone().sub(v1).length().toFixed(1)
        //let text = '~ ' + length;
        let text = length.toString()
        let size = ctx.measureText(text)
        let paddingLeft = 5
        let paddingTop = 5
        let margin = 10

        canvas.width = size.width + paddingLeft * 2 + margin * 2
        canvas.height = fontsize + paddingTop * 2 + margin * 2

        ctx.shadowBlur = 2
        ctx.shadowColor = '#555'
        ctx.fillStyle = '#fffd82'
        this.roundRect(
            ctx,
            margin,
            margin,
            canvas.width - margin * 2,
            canvas.height - margin * 2,
            2,
        )

        ctx.shadowBlur = 0
        ctx.fillStyle = '#000'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.font = 'bolder ' + fontsize + 'px "Open Sans", Arial'
        ctx.fillText(text, paddingLeft + margin, paddingTop + margin)

        let texture = new CanvasTexture(canvas)
        let sprite = new Sprite(
            new SpriteMaterial({
                map: texture,
                sizeAttenuation: false,
            }),
        )

        let h = 0.3
        sprite.scale
            .set(0.002 * canvas.width, 0.0025 * canvas.height, 1)
            .multiplyScalar(h)
        sprite.position.copy(v0.clone().add(v1).multiplyScalar(0.5))
        this.spriteScene.add(sprite)
        this.sprite = sprite
    }

    private roundRect(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number,
        r: number,
    ) {
        ctx.beginPath()
        ctx.moveTo(x + r, y)
        ctx.lineTo(x + w - r, y)
        ctx.quadraticCurveTo(x + w, y, x + w, y + r)
        ctx.lineTo(x + w, y + h - r)
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
        ctx.lineTo(x + r, y + h)
        ctx.quadraticCurveTo(x, y + h, x, y + h - r)
        ctx.lineTo(x, y + r)
        ctx.quadraticCurveTo(x, y, x + r, y)
        ctx.closePath()
        ctx.fill()
    }
}
