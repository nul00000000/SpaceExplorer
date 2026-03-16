import { mat4, vec3 } from "gl-matrix";
import { BaseShader, Shader } from "../graphics/shader";
import * as assets from "../graphics/assets";
import { Planet } from "./planet";

let uiCanvas: OffscreenCanvas;
let uiCtx: OffscreenCanvasRenderingContext2D;
let uiTexture: WebGLTexture;

let time: number = 0;

export let planets: Planet[] = [];

export function initUI(gl: WebGL2RenderingContext) {
    uiCanvas = new OffscreenCanvas(512, 512);
	uiCtx = uiCanvas.getContext("2d");

	uiTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, uiTexture);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

	const bitmap = uiCanvas.transferToImageBitmap();
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
}

export function update(delta: number, timeIn: number) {
    time = timeIn;
}

export function draw(shader: BaseShader, cameraPos: vec3, cameraUp: vec3) {
    (shader as Shader).loadDisplayMode(1);

    planets.sort((a: Planet, b: Planet) => {
        return vec3.dist([b.x, b.y, b.z], cameraPos) - vec3.dist([a.x, a.y, a.z], cameraPos);
    });

    for(let p of planets) {
        uiCtx.clearRect(0, 0, 512, 512);

        uiCtx.fillStyle = "white";
        uiCtx.font = "bold 52px monospace";
        let nameWidth = uiCtx.measureText(p.name).width;
        uiCtx.fillText(p.name, (512 - nameWidth) / 2, 240 - 20);

        uiCtx.strokeStyle = "white";
        uiCtx.lineWidth = 6;

        uiCtx.beginPath();
        uiCtx.arc(512/2, 3 * 512/4, 252/2, 0, 7);
        uiCtx.stroke();

        uiCtx.strokeRect((512 - nameWidth) / 2, 240, nameWidth, 0);
        uiCtx.strokeRect(512/2, 240, 0, 512/2 - 240);

        const bitmap = uiCanvas.transferToImageBitmap();
        shader.gl.bindTexture(shader.gl.TEXTURE_2D, uiTexture);
        shader.gl.texSubImage2D(shader.gl.TEXTURE_2D, 0, 0, 0, shader.gl.RGBA, shader.gl.UNSIGNED_BYTE, bitmap);

        let trans = mat4.create();
        mat4.translate(trans, trans, [p.x, p.y, p.z]);
        // mat4.rotateY(trans, trans, cameraYaw);
        // mat4.rotateX(trans, trans, cameraPitch);
        // mat4.scale(trans, trans, [p.radius * 2.4, p.radius * 2.4, p.radius * 2.4]);
        // mat4.translate(trans, trans, [0, 0.5, 0]);
        let look = mat4.targetTo(mat4.create(), [0, 0, 0], 
            [cameraPos[0] - p.x, cameraPos[1] - p.y, cameraPos[2] - p.z], cameraUp);
        // let look = mat4.create();
        let rot = mat4.create();
        mat4.rotateY(rot, rot, 3.14159);
        mat4.scale(trans, trans, [p.radius * 2.1, p.radius * 2.1, p.radius * 2.1]);
        mat4.translate(rot, rot, [0, 0.5, 0]);
        // mat4.scale(look, look, [p.radius * 2.4, p.radius * 2.4, p.radius * 2.4]);
        // mat4.translate(look, look, [0, 0.5, 0]);

        mat4.mul(look, look, rot);
        mat4.mul(trans, trans, look);
    
        shader.loadTransform(trans);
        shader.loadTexture(assets.emptyTexture, 0);
        shader.loadTexture(uiTexture, 1);
        assets.planeModel.draw(shader);
    }

    (shader as Shader).loadDisplayMode(0);
}