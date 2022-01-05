import { CanvasTexture, Sprite, SpriteMaterial, Vector3 } from "three"

export function createCircleSprite(scale = 0.03, pos: Vector3 = undefined, sizeAttenuation = false, color='#fff') {
	const circleMaterial = new SpriteMaterial({ 
		map: new CanvasTexture(makeCircleImage(color)),
		sizeAttenuation 
	})
	const sprite = new Sprite(circleMaterial)
	sprite.scale.setScalar(scale)
    if (pos) sprite.position.copy(pos.clone())

    return sprite
}


function makeCircleImage(color: string) {
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    let size = 64;
    canvas.width = size;
    canvas.height = size;

    let r = size * 0.3 / 2;
    let blur = size - r;
    
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#555';

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000' //#009bff'
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, r * 0.5, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    return canvas;
}