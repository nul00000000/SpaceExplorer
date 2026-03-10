#version 300 es

precision lowp float;

in vec3 pNormal;
in vec2 uvCoords;
in vec3 fragPos;
in mat3 TBN;

out vec4 fragColor;

uniform vec3 lightDir;
uniform sampler2D overlayTex;
uniform sampler2D tex;

void main(void) {

    vec3 nNormal = normalize(pNormal);

    float illumination = 0.05 + max(0.0, -dot(lightDir, nNormal)) * 0.95;

    vec4 clouds = texture(overlayTex, uvCoords);
    vec3 color = mix(texture(tex, uvCoords).rgb, vec3(1.0), clouds.r);

    fragColor = vec4(illumination * color, 1.0);
}
