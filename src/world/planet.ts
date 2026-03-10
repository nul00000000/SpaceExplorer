import * as assets from "../graphics/assets";
import { BaseShader } from "../graphics/shader";

export class Planet {
    name: string;
    radius: number;
    overlayTexture: WebGLTexture;
    texture: WebGLTexture;

    x: number;
    y: number;

    constructor(name: string, radius: number, texture = assets.testTexture, overlayTexture = assets.emptyTexture) {
        this.name = name;
        this.radius = radius;
        this.texture = texture;
        this.overlayTexture = overlayTexture;
        this.x = 0;
        this.y = 0;
    }

    draw(shader: BaseShader) {
        shader.loadTexture(this.overlayTexture, 0);
        shader.loadTexture(this.texture, 1);
        assets.icosphereModel.draw(shader);
    }
}