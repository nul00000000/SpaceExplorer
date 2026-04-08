#version 300 es

precision lowp float;

in vec3 pNormal;
in vec2 uvCoords;
in vec3 fragPos;
in mat3 TBN;

out vec4 fragColor;

uniform vec3 lightPos;
uniform vec3 lightColor;
uniform sampler2D overlayTex;
uniform sampler2D tex;

uniform vec4 lightBlocker;

uniform int displayMode;

float calculateShadow() {
    vec3 lightToBlocker = lightPos - lightBlocker.xyz;
    float lightToBlockerDist = length(lightToBlocker);
    vec3 lightToBlockerDir = lightToBlocker / lightToBlockerDist;

    float thisDot = dot(lightToBlockerDir, fragPos - lightBlocker.xyz);

	float dist = distance(thisDot * lightToBlockerDir + lightBlocker.xyz, fragPos); 
	if(thisDot < 0.0) {
		if(dist < lightBlocker.w * 0.5) {
			return 0.0;
		} else if(dist < lightBlocker.w * 1.5) {
			return dist / lightBlocker.w - 0.5;
		} else {
			return 1.0;
		}
	} else {
		return 1.0;
	}
}

void main(void) {

    vec4 clouds = texture(overlayTex, uvCoords);
    vec4 baseColor = texture(tex, uvCoords);
    vec4 color = mix(baseColor, vec4(1.0), clouds.r);

    vec3 nNormal = normalize(pNormal);

    vec3 lightVec = fragPos - lightPos;
    vec3 illumination;
    if(displayMode == 0) {
        illumination = vec3(0.05) + max(0.0, -dot(normalize(lightVec), nNormal)) * 0.95 / dot(lightVec, lightVec)
            * lightColor * calculateShadow();
    } else {
        illumination = vec3(1.0);
    }

    fragColor = vec4(illumination * color.rgb, color.a);
}
