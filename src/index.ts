import { mat4, vec3 } from "gl-matrix";
import { Shader, BaseShader, WaterShader, MainShader } from "./graphics/shader";
import * as assets from "./graphics/assets";
import * as xr from "./graphics/xr";
import { Planet } from "./world/planet";

let gl: WebGL2RenderingContext;
let canvas: HTMLCanvasElement;

let shader: Shader;

let waterShader: WaterShader;

let mainShader: MainShader;

let cameraPos: vec3 = [9, 11, 1];
let cameraYaw: number = 0;
let cameraPitch: number = 0;

let keys: {[id: string] : boolean} = {};

let mercury: Planet;
let venus: Planet;
let earth: Planet;

function init() {
	shader.use();

	assets.initAssets(gl);

	mercury = new Planet("Mercury", 1, 0, 0.5, 
		assets.mercuryTexture, assets.mercuryTextureLow);
	mercury.x = 0;
	mercury.y = 10;
	venus = new Planet("Venus", 1, 0, 0.5, 
		assets.venusTexture, assets.venusTextureLow);
	venus.x = 3;
	venus.y = 10;
	earth = new Planet("Earth", 1, 23.44 * Math.PI / 180, 0.5, 
		assets.earthTexture, assets.earthTextureLow, assets.cloudTexture);
	earth.x = 6;
	earth.y = 10;

	let fov = 45 * Math.PI / 180; //this has been vertical fov the whole time
	let aspect = (gl.canvas as HTMLCanvasElement).clientWidth / (gl.canvas as HTMLCanvasElement).clientHeight;
	let zNear = 0.1;
	let zFar = 100.0;
	let projection = mat4.create();

	mat4.perspective(projection, fov, aspect, zNear, zFar);
	shader.loadProjection(projection);

	setLightTowardsCenter([1, 0, 0]);

	waterShader.use();
	waterShader.loadProjection(projection);


	mainShader.use();
	mainShader.loadProjection(projection);

	console.log("Game initialized");
	if(!xr.xrStarted) window.requestAnimationFrame(loop);
}

function update(delta: number) {
	mercury.update(delta);
	venus.update(delta);
	earth.update(delta);

	let speed = 2;
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
	mercury.draw(shader, cameraPos);
	venus.draw(shader, cameraPos);
	earth.draw(shader, cameraPos);
}

function renderMain(shader: BaseShader) {
	
	let transform = mat4.create();
	mat4.scale(transform, transform, [100, 100, 100]);
	shader.loadTransform(transform);

	shader.loadTexture(assets.emptyTexture, 0);
	shader.loadTexture(assets.skyboxTexture, 1);

	assets.skyboxModel.draw(shader);
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

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	let camera = mat4.create();
	mat4.translate(camera, camera, cameraPos);
	mat4.rotateY(camera, camera, cameraYaw);
	mat4.rotateX(camera, camera, cameraPitch);
	mat4.invert(camera, camera);
	shader.loadCamera(camera);

	renderFloor(shader);

	mainShader.use();
	mainShader.loadCamera(camera);

	renderMain(mainShader);
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

		shader.loadCamera(view.transform.inverse.matrix);
		shader.loadProjection(view.projectionMatrix);

		renderFloor(shader);

		mainShader.use();
		mainShader.loadCamera(view.transform.inverse.matrix);
		mainShader.loadProjection(view.projectionMatrix);

		renderMain(mainShader);
	}
}

let lastTimestamp: number = 0;

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
			xr.initXR(gl, loopXR);
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
