import { mat4, vec3 } from "gl-matrix";
import { Model } from "./graphics/model";
import { Shader, BaseShader, WaterShader, MainShader } from "./graphics/shader";
import { Floor } from "./world/terrain";
import { Water } from "./world/water";
import * as assets from "./graphics/assets";
import { worldRand } from "./util/random";
import * as xr from "./graphics/xr";

let gl: WebGL2RenderingContext;
let canvas: HTMLCanvasElement;

let shader: Shader;

let waterShader: WaterShader;

let mainShader: MainShader;

let testAngle = 0;

let cameraPos: vec3 = [0, 1.5, 0];
let cameraYaw: number = 0;
let cameraPitch: number = 0;

let keys: {[id: string] : boolean} = {};

let floor: Floor;
let water: Water;

function init() {
	shader.use();

	assets.initAssets(gl);

	floor = new Floor(0.1, 100, 100, gl, (floor: Floor) => {

	});

	let fov = 45 * Math.PI / 180; //this has been vertical fov the whole time
	let aspect = (gl.canvas as HTMLCanvasElement).clientWidth / (gl.canvas as HTMLCanvasElement).clientHeight;
	let zNear = 0.01;
	let zFar = 20.0;
	let projection = mat4.create();

	mat4.perspective(projection, fov, aspect, zNear, zFar);
	shader.loadProjection(projection);

	setLightTowardsCenter([1, 1, 1]);

	waterShader.use();
	waterShader.loadProjection(projection);


	mainShader.use();
	mainShader.loadProjection(projection);

	console.log("Game initialized");
	if(!xr.xrStarted) window.requestAnimationFrame(loop);
}

function update(delta: number) {
	let speed = 0.1;
	testAngle += 0.01;
	if(keys["KeyD"]) {
		vec3.add(cameraPos, cameraPos, [Math.cos(-cameraYaw) * delta * speed, 0, Math.sin(-cameraYaw) * delta * speed]);
	}
	if(keys["KeyS"]) {
		vec3.add(cameraPos, cameraPos, [-Math.sin(-cameraYaw) * delta * speed, 0, Math.cos(-cameraYaw) * delta * speed]);
	}
	if(keys["KeyA"]) {
		vec3.add(cameraPos, cameraPos, [-Math.cos(-cameraYaw) * delta * speed, 0, -Math.sin(-cameraYaw) * delta * speed]);
	}
	if(keys["KeyW"]) {
		vec3.add(cameraPos, cameraPos, [Math.sin(-cameraYaw) * delta * speed, 0, -Math.cos(-cameraYaw) * delta * speed]);
	}
	if(keys["Space"]) {
		cameraPos[1] += delta * speed;
	}
	if(keys["ShiftLeft"]) {
		cameraPos[1] -= delta * speed;
	}
}

function renderFloor(shader: BaseShader) {
	let translation = mat4.create();

	mat4.translate(translation, translation, [0, 1, 1]);
	mat4.rotateY(translation, translation, testAngle);
	mat4.scale(translation, translation, [0.1, 0.1, 0.1]);

	shader.loadTransform(translation);

	shader.loadTexture(assets.cloudTexture, 0);
	shader.loadTexture(assets.earthTexture, 1);
	
	assets.icosphereModel.draw(shader);

	shader.loadTransform(mat4.create());

	floor.draw(shader, cameraPos[0], cameraPos[2]);

	// setLightTowardsCenter([Math.cos(testAngle) * 5, 5, Math.sin(testAngle) * 5]);
}

function renderMain(shader: BaseShader) {

	// setLightTowardsCenter([Math.cos(testAngle) * 5, 5, Math.sin(testAngle) * 5]);
}

function draw(gl: WebGL2RenderingContext) {
	gl.enable(gl.CULL_FACE);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND)
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	shader.use();
	gl.viewport(0, 0, canvas.width, canvas.height);
	
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clearDepth(1.0);
	gl.depthFunc(gl.LEQUAL);

	// gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, assets.cloudTexture);

	let camera = mat4.create();
	mat4.translate(camera, camera, cameraPos);
	mat4.rotateY(camera, camera, cameraYaw);
	mat4.rotateX(camera, camera, cameraPitch);
	mat4.invert(camera, camera);
	shader.loadCamera(camera);

	// let camera = mat4.ortho(mat4.create(), -5, 5, -5, 5, 0.1, 20);
    // let lookDown = mat4.create();
    // mat4.translate(lookDown, lookDown, [0, 10, 0]);
    // mat4.rotateX(lookDown, lookDown, -Math.PI / 2);
    // mat4.invert(lookDown, lookDown);
    // mat4.mul(camera, camera, lookDown);

	// shader.loadProjection(mat4.create());
	// shader.loadCamera(camera);

	renderFloor(shader);

	mainShader.use();
	mainShader.loadCamera(camera);

	renderMain(mainShader);

	if(water) {
		waterShader.use();
		// waterShader.loadProjection(mat4.create());
		waterShader.loadCamera(camera);
		waterShader.loadTime(testAngle);
		waterShader.loadTransform(mat4.create());
		water.draw(waterShader, camera[0], camera[2]);
	}
}

function drawXR(gl: WebGL2RenderingContext, viewRef: XRReferenceSpace, frame: XRFrame) {

	let session = frame.session;
	let trans = new XRRigidTransform({x: -cameraPos[0], y: -cameraPos[1], z: -cameraPos[2]});
	let offsetRef = viewRef.getOffsetReferenceSpace(trans);
	let viewerPose = frame.getViewerPose(offsetRef);

	gl.enable(gl.CULL_FACE);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.BLEND)
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, session.renderState.baseLayer.framebuffer);
	
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	gl.clearDepth(1.0);
	gl.depthFunc(gl.LEQUAL);
	
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	for(const view of viewerPose.views) {
		shader.use();
		const viewport = session.renderState.baseLayer.getViewport(view);
		gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, assets.cloudTexture);

		shader.loadCamera(view.transform.inverse.matrix);
		shader.loadProjection(view.projectionMatrix);

		renderFloor(shader);

		mainShader.use();
		mainShader.loadCamera(view.transform.inverse.matrix);
		mainShader.loadProjection(view.projectionMatrix);

		renderMain(mainShader);

		if(water) {
			waterShader.use();
			waterShader.loadCamera(view.transform.inverse.matrix);
			waterShader.loadProjection(view.projectionMatrix);
			waterShader.loadTime(testAngle);
			waterShader.loadTransform(mat4.create());
			water.draw(waterShader, view.transform.position.x, view.transform.position.z);
		}
	}
}

let lastTimestamp: number;

function setLightTowardsCenter(lightPos: vec3) {
	shader.use();
	shader.loadLightDirection([-lightPos[0], -lightPos[1], -lightPos[2]]);
	waterShader.use();
	waterShader.loadLightDirection([-lightPos[0], -lightPos[1], -lightPos[2]]);

	mainShader.use();
	mainShader.loadLightDirection([-lightPos[0], -lightPos[1], -lightPos[2]]);
}

function loopXR(timestamp: number, frame: XRFrame) {
	let delta = timestamp - lastTimestamp;
	update(delta * 0.001);
	drawXR(gl, xr.xrRefSpace, frame);
	frame.session.requestAnimationFrame(loopXR);
	lastTimestamp = timestamp;
}

function loop(timestamp: number) {
	let delta = timestamp - lastTimestamp;
	update(delta * 0.001);
	draw(gl);
	if(!xr.xrStarted) window.requestAnimationFrame(loop);
	lastTimestamp = timestamp;
}

function main() {
	canvas = document.querySelector("#glcanvas") as HTMLCanvasElement;
	gl = canvas.getContext("webgl2", { xrCompatible: true });

	const vrButt = document.querySelector("#vrMode") as HTMLButtonElement;
	vrButt.onclick = () => {
		if(xr.hasXR()) 
			xr.initXR(gl, loopXR, () => {alert("vr inited?")});
	};

	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	gl.viewport(0, 0, canvas.width, canvas.height);

	if (gl === null) {
		alert(
		"Unable to initialize WebGL2. Your browser or machine may not support it.",
		);
		return;
	}

	shader = new Shader(gl, () => {
		mainShader = new MainShader(gl, () => {
			waterShader = new WaterShader(gl, init);
		});
	});
}

main();

document.addEventListener("keydown", (e: KeyboardEvent) => {
	keys[e.code] = true;
});

document.addEventListener("keyup", (e: KeyboardEvent) => {
	keys[e.code] = false;
});

document.addEventListener("click", async () => {
	canvas.requestPointerLock();
});

document.addEventListener("mousemove", (e: MouseEvent) => {
	if(document.pointerLockElement) {
		cameraYaw -= e.movementX * 0.003;
		cameraPitch -= e.movementY * 0.003;
		if(cameraPitch < -Math.PI / 2) {
			cameraPitch = -Math.PI / 2;
		} else if(cameraPitch > Math.PI / 2) {
			cameraPitch = Math.PI / 2;
		}
	}
});
