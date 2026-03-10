#version 300 es

precision lowp float;

in vec3 pNormal;
in vec2 uvCoords;
in vec3 fragPos;
in vec4 fragPosLightSpaceLand;

out vec4 fragColor;

uniform vec3 lightDir;
uniform sampler2D overlayTex;
uniform sampler2D tex;

void main(void) {

    // float illumination = 0.1 + max(0.0, -dot(lightDir, normalize(pNormal))) * 0.9;
    float illumination = 0.1 + max(0.0, -dot(lightDir, normalize(pNormal))) * 0.9;

    //vec4 epic = calculateFoam();
    // float epic = texture(waterMap, uvCoords).r < 0.5 ? 1.0 : 0.0;
    fragColor = vec4(vec3(0, 0, 1.0) * illumination, 0.5);
    // fragColor = vec4((fragPosLightSpaceLand.xyz / fragPosLightSpaceLand.w) * 0.5 + 0.5, 1.0);
}