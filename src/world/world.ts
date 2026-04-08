import { Shader, BaseShader, UIShader, MainShader } from "../graphics/shader";
import * as assets from "../graphics/assets";
import { Planet, PlanetData } from "../world/planet";
import * as ui from "../world/ui";
import { vec3 } from "gl-matrix";

let planets: Planet[] = [];

let radiusScale = 1;
let orbitRadiusScale = 1e-9;
let moonOrbitRadiusScale = 0.5e-7;

let sunRadiusScale = 0.1;

let timeScale = 0.001;

function findPlanetByName(name: string): Planet {
    for(let p of planets) {
        if(p.name.toLowerCase() == name.toLowerCase()) {
            return p;
        }
    }
    return null;
}

function addPlanet(data: PlanetData, gl: WebGL2RenderingContext) {
    let tex = assets.loadTexture(data.texture, gl, true);
    let texLow = data.textureLow ? assets.loadTexture(data.textureLow, gl, true) : tex;
    let texOverlay = data.textureOverlay ? assets.loadTexture(data.textureOverlay, gl, true) : assets.emptyTexture;
    let p = new Planet(data.name, data.diameter_earth * 0.01 * radiusScale, data.tilt_deg * 3.14159 / 180,
        1 / data.rotation_days * 365.25 * timeScale, tex, texLow, findPlanetByName(data.body_it_orbits), 
        data.orbit_radius_earth * 1.49e9 * (data.type == "Moon" ? moonOrbitRadiusScale : orbitRadiusScale), 
        1 / data.revolution_years * timeScale, texOverlay);
    
    if(data.type == "Star") {
        p.lightEmitting = true;
        p.radius *= sunRadiusScale;
    }
    
    planets.push(p);
}

export function loadPlanets(path: string, gl: WebGL2RenderingContext) {
    let xhr = new XMLHttpRequest();
	xhr.open("GET", path, true);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.onreadystatechange = function () {
        if(xhr.readyState == 4) {
            if(xhr.status === 200) {
                let data = JSON.parse(xhr.responseText).solar_system_bodies as PlanetData[];
                for(let pd of data) {
                    addPlanet(pd, gl);
                }
                console.log(planets);
            } else {
                alert("planet data couldn't load :(");
            }
        }
	}
	xhr.send();
}

export function addPlanetsToUI() {
    ui.planets.push(...planets);
}

export function update(delta: number, time: number) {
    for(let p of planets) {
        p.update(delta, time);
    }
}

export function draw(shader: BaseShader, camPos: vec3) {
    for(let p of planets) {
        p.draw(shader, camPos);
    }
}