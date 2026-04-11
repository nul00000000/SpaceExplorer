import { mat4, vec3 } from "gl-matrix";
import { Shader, BaseShader, UIShader, MainShader } from "./graphics/shader";
import * as assets from "./graphics/assets";
import * as xr from "./graphics/xr";
import { Planet } from "./world/planet";
import * as ui from "./world/ui";

import * as world from "./world/world"

let gl: WebGL2RenderingContext;
let canvas: HTMLCanvasElement;

let shader: Shader;

let uiShader: UIShader;

let mainShader: MainShader;

let cameraPos: vec3 = [0, 2, 0];
let cameraYaw: number = 3.14159;
let cameraPitch: number = 0;

let gripPoses: XRPose[] = [];

let rightHandPos: vec3 = [0, 0, 0];
let rightHandDir: vec3 = [0, 0, 1];
let rightGrip: XRPose;

let selectionDist: number = 40;
let lightLevel = 1;

let keys: {[id: string] : boolean} = {};

function init() {
	shader.use();

	assets.initAssets(gl);

	world.loadPlanets("assests/planetData.json", gl);

	let fov = 45 * Math.PI / 180; //this has been vertical fov the whole time
	let aspect = (gl.canvas as HTMLCanvasElement).clientWidth / (gl.canvas as HTMLCanvasElement).clientHeight;
	let zNear = 0.1;
	let zFar = 100.0;
	let projection = mat4.create();

	mat4.perspective(projection, fov, aspect, zNear, zFar);
	shader.loadProjection(projection);

	shader.loadLightPos([0, 0, 0]);
	shader.loadLightColor([lightLevel * 100, lightLevel * 100, lightLevel * 100]);

	uiShader.use();
	uiShader.loadProjection(projection);

	ui.initUI(gl);

	mainShader.use();
	mainShader.loadProjection(projection);

	console.log("Game initialized");
	if(!xr.xrStarted) window.requestAnimationFrame(loop);
}

let selectorPlanet: Planet = null;
let lastSelectorPressed: boolean = false;
let selectorPressed: boolean = false;

let selectedPlanet: Planet = null;
let viewAngle = 0;
let viewMag = 1;

function update(delta: number, time: number, frame: XRFrame = null) {
	ui.update(delta, time);
	world.update(delta, time);
	if(frame) {
		let session = frame.session;
		let trans = new XRRigidTransform({x: -cameraPos[0], y: -cameraPos[1], z: -cameraPos[2]});
		let offsetRef = xr.xrRefSpace.getOffsetReferenceSpace(trans);
		let viewerPose = frame.getViewerPose(offsetRef);

		gripPoses = [];

		for(const inputSource of session.inputSources) {
			if(inputSource.gripSpace) {
				let gripPose = frame.getPose(inputSource.gripSpace, offsetRef);
				if(gripPose) {
					gripPoses.push(gripPose);
					if(inputSource.handedness == "right") {
						rightGrip = gripPose;
						let pos = gripPose.transform.position;
						rightHandPos = [pos.x, pos.y, pos.z];
						let quat = gripPose.transform.orientation;
						let quatMat = mat4.fromQuat(mat4.create(), [quat.x, quat.y, quat.z, quat.w]);
						rightHandDir = vec3.transformMat4(vec3.create(), [0, 1, 0], quatMat); 

						lastSelectorPressed = selectorPressed;
						selectorPressed = inputSource.gamepad.buttons[0].pressed;
						viewAngle -= inputSource.gamepad.axes[2] * delta;
						lightLevel *= Math.pow(1.5, inputSource.gamepad.axes[3] * delta);
					}
				}
			}
		}
		[selectionDist, selectorPlanet] = world.updateSelection(rightHandPos, rightHandDir);
		if(selectorPressed && !lastSelectorPressed && selectorPlanet) {
			selectedPlanet = selectorPlanet;
			viewAngle = 3.14159 + Math.atan2(selectorPlanet.z - cameraPos[2], selectorPlanet.x - cameraPos[0]);
			console.log("selected planet " + (selectorPlanet ? selectorPlanet.name : "None"));
		}

		let exp = Math.pow(0.5, delta);
		if(selectedPlanet)
			vec3.lerp(cameraPos, cameraPos, 
					  [selectedPlanet.x + Math.cos(viewAngle) * 5 * selectedPlanet.effectiveRadius, 
						  selectedPlanet.y + 2 * selectedPlanet.effectiveRadius, 
						  selectedPlanet.z + Math.sin(viewAngle) * 5 * selectedPlanet.effectiveRadius], 1 - exp);
		//else
			//vec3.lerp(cameraPos, cameraPos, [0, 2, 0], exp);
	} else {
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
}

function renderFloor(shader: BaseShader) {
	world.draw(shader, cameraPos);
	// (shader as Shader).loadLightBlocker([moon.x, moon.y, moon.z], moon.radius);
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
	shader.loadLightColor([lightLevel * 100, lightLevel * 100, lightLevel * 100]);
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

		shader.loadLightColor([lightLevel * 100, lightLevel * 100, lightLevel * 100]);
		renderFloor(shader);

		//render hands
		shader.loadDisplayMode(1);
		for(let gripPose of gripPoses) {
			shader.loadTexture(assets.sunTextureLow, 1);
			let t = mat4.clone(gripPose.transform.matrix);
			let n: mat4 = mat4.create();
			//mat4.rotateX(n, t, 3.14159 * 0.4);
			mat4.scale(n, t, [0.015, 0.1, 0.015]);
			shader.loadTransform(n);
			assets.cubeModel.draw(shader);
			if(gripPose == rightGrip) {
				//mat4.rotateX(n, t, 3.14159 * 0.4);
				mat4.translate(n, t, [0, -Math.min(80, selectionDist) / 2, 0]);
				mat4.scale(n, n, [0.008, Math.min(80, selectionDist) / 2, 0.008]);
				shader.loadTexture(assets.cloudTexture, 1);
				shader.loadTransform(n);
				assets.cubeModel.draw(shader);
				
			}
		}
		
		shader.loadDisplayMode(0);

		renderUIXR(shader, [view.transform.position.x, view.transform.position.y, view.transform.position.z]);
	}
}

let lastTimestamp: number = 0;

function loopXR(timestamp: number, frame: XRFrame) {
	let delta = timestamp - lastTimestamp;
	update(delta * 0.001, timestamp * 0.001, frame);
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
