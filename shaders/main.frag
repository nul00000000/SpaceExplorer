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

    vec3 normal = nNormal;

    //float illumination = 0.2 + max(0.0, -dot(lightDir, normal)) * 0.8;
    float illumination = 1.0;

    vec3 color = texture(tex, uvCoords).rgb;

    fragColor = vec4(illumination * color, 1.0);
}
