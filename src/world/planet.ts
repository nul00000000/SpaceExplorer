import { mat4, vec3 } from "gl-matrix";
import * as assets from "../graphics/assets";
import { BaseShader } from "../graphics/shader";

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

    constructor(name: string, radius: number, tilt: number, rotSpeed: number, 
            texture = assets.testTexture, lowTexture = texture, overlayTexture = assets.emptyTexture) {
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
    }

    update(delta: number) {
        this.a += this.rotSpeed * delta;
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

        assets.icosphereModel.draw(shader);
        
        assets.icosphereModel.draw(shader);
    }
}