import { mat4, vec3 } from "gl-matrix";
import { Shader, BaseShader, UIShader, MainShader } from "./graphics/shader";
import * as assets from "./graphics/assets";
import * as xr from "./graphics/xr";
import { Planet } from "./world/planet";
import * as ui from "./world/ui";

let gl: WebGL2RenderingContext;
let canvas: HTMLCanvasElement;

let shader: Shader;

let uiShader: UIShader;

let mainShader: MainShader;

let cameraPos: vec3 = [0, 0, 0];
let cameraYaw: number = 3.14159;
let cameraPitch: number = 0;

let keys: {[id: string] : boolean} = {};

let mercury: Planet;
let venus: Planet;
let earth: Planet;
let moon: Planet;

function init() {
	shader.use();

	assets.initAssets(gl);

	mercury = new Planet("Mercury", 1, 0, 0.5, 
		assets.mercuryTexture, assets.mercuryTextureLow);
	mercury.x = -3;
	mercury.y = 0;
	mercury.z = 5;
	venus = new Planet("Venus", 1, 0, 0.5, 
		assets.venusTexture, assets.venusTextureLow);
	venus.x = 0;
	venus.y = 0;
	venus.z = 5;
	earth = new Planet("Earth", 1, 23.44 * Math.PI / 180, 0.5, 
		assets.earthTexture, assets.earthTextureLow, assets.cloudTexture);
	earth.x = 3;
	earth.y = 0;
	earth.z = 5;
	moon = new Planet("Moon", 0.3, 0, 0.2, assets.moonTextureLow);

	let fov = 45 * Math.PI / 180; //this has been vertical fov the whole time
	let aspect = (gl.canvas as HTMLCanvasElement).clientWidth / (gl.canvas as HTMLCanvasElement).clientHeight;
	let zNear = 0.1;
	let zFar = 100.0;
	let projection = mat4.create();

	mat4.perspective(projection, fov, aspect, zNear, zFar);
	shader.loadProjection(projection);

	shader.loadLightPos([0, 0, 0]);
	shader.loadLightColor([50, 50, 50]);

	uiShader.use();
	uiShader.loadProjection(projection);

	ui.initUI(gl);
	ui.planets.push(mercury, venus, earth, moon);

	mainShader.use();
	mainShader.loadProjection(projection);

	console.log("Game initialized");
	if(!xr.xrStarted) window.requestAnimationFrame(loop);
}

function update(delta: number, time: number) {
	ui.update(delta, time);

	mercury.update(delta);
	venus.update(delta);
	earth.update(delta);

	moon.update(delta);
	moon.x = earth.x + Math.cos(-moon.a) * 3;
	moon.y = earth.y;
	moon.z = earth.z + Math.sin(-moon.a) * 3;

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
	(shader as Shader).loadLightBlocker([moon.x, moon.y, moon.z], moon.radius);
	earth.draw(shader, cameraPos);

	(shader as Shader).loadLightBlocker([earth.x, earth.y, earth.z], earth.radius);
	moon.draw(shader, cameraPos);
	(shader as Shader).loadLightBlocker([earth.x, earth.y, earth.z], 0);
}

function renderUI(shader: BaseShader) {
	let test = mat4.create();
	mat4.rotateY(test, test, cameraYaw);
	mat4.rotateX(test, test, cameraPitch);

	let test2 = vec3.transformMat4([0, 0, 0], [0, 1, 0], test);

	ui.draw(shader, cameraPos, test2);
}

function renderUIXR(shader: BaseShader, camPos: vec3) {
	ui.draw(shader, camPos, [0, 1, 0]);
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
	
	mainShader.use();
	mainShader.loadCamera(camera);
	renderMain(mainShader);
	
	shader.use();
	shader.loadCamera(camera);
	renderFloor(shader);

	renderUI(shader);

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
		const viewport = session.renderState.baseLayer.getViewport(view);
		gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
		
		mainShader.use();
		mainShader.loadCamera(view.transform.inverse.matrix);
		mainShader.loadProjection(view.projectionMatrix);
		renderMain(mainShader);
		
		shader.use();
		shader.loadCamera(view.transform.inverse.matrix);
		shader.loadProjection(view.projectionMatrix);

		renderFloor(shader);
		renderUIXR(shader, [view.transform.position.x, view.transform.position.y, view.transform.position.z]);
	}
}

let lastTimestamp: number = 0;

function loopXR(timestamp: number, frame: XRFrame) {
	let delta = timestamp - lastTimestamp;
	update(delta * 0.001, timestamp * 0.001);
	drawXR(gl, xr.xrRefSpace, frame);
	frame.session.requestAnimationFrame(loopXR);
	lastTimestamp = timestamp;
}

function loop(timestamp: number) {
	let delta = timestamp - lastTimestamp;
	update(delta * 0.001, timestamp * 0.001);
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
			uiShader = new UIShader(gl, init);
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
