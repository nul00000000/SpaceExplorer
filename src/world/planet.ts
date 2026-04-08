import { mat4, vec3 } from "gl-matrix";
import * as assets from "../graphics/assets";
import { BaseShader, Shader } from "../graphics/shader";

export type PlanetData = {
    name: string,
    type: string,
    mass_earth: number,
    diameter_earth: number,
    orbit_radius_earth: number,
    body_it_orbits: string,
    bodies_that_orbit: string[],
    gravity_earth: number,
    rotation_days: number,
    revolution_years: number,
    pressure_earth: number,
    temperature_f: number,
    age_billion_years: number,
    tilt_deg: number,
    description: string,
    colors: string[],
    texture: string,
    textureLow: string,
    textureOverlay: string
};

export class Planet {
    name: string;
    radius: number;
    tilt: number;
    rotSpeed: number;
    overlayTexture: WebGLTexture;
    texture: WebGLTexture;
    textureLow: WebGLTexture;

    x: number;
    y: number;
    z: number;
    a: number;

    orbiting: Planet;
    orbitRadius: number;
    orbitSpeed: number;
	
	lightEmitting: boolean = false;

    constructor(name: string, radius: number, tilt: number, rotSpeed: number, 
            texture = assets.testTexture, lowTexture = texture,
            orbiting?: Planet, orbitRadius?: number, orbitSpeed?: number, overlayTexture = assets.emptyTexture) {
        this.name = name;
        this.radius = radius;
        this.texture = texture;
        this.overlayTexture = overlayTexture;
        this.textureLow = lowTexture;
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.tilt = tilt;
        this.rotSpeed = rotSpeed;
        this.a = 0;
        this.orbiting = orbiting;
        this.orbitRadius = orbitRadius;
        this.orbitSpeed = orbitSpeed;
    }

    update(delta: number, time: number) {
        this.a = time * this.rotSpeed;
        if(this.orbiting) {
            this.x = this.orbiting.x + Math.cos(time * this.orbitSpeed) * this.orbitRadius;
            this.y = this.orbiting.y;
            this.z = this.orbiting.z + Math.sin(time * this.orbitSpeed) * this.orbitRadius;
        }
    }

    draw(shader: BaseShader, cameraPos: vec3) {
        let transform = mat4.create();
        mat4.translate(transform, transform, [this.x, this.y, this.z]);
        mat4.rotateZ(transform, transform, this.tilt);
        mat4.rotateY(transform, transform, this.a);
        mat4.scale(transform, transform, [this.radius, this.radius, this.radius]);
        
        shader.loadTransform(transform);
        shader.loadTexture(this.overlayTexture, 0);
        shader.loadTexture(
            vec3.dist(cameraPos, [this.x, this.y, this.z]) < this.radius * 2 ? this.texture : this.textureLow, 1);
		
		if(this.lightEmitting) (shader as Shader).loadDisplayMode(1);

        assets.icosphereModel.draw(shader);
		(shader as Shader).loadDisplayMode(0);
    }
}
