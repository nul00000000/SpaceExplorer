#version 300 es

in vec3 position;
in vec3 normal;
in vec2 uvs;
in vec3 tangent;
in vec3 bitangent;

out vec2 uvCoords;
out vec3 pNormal;

out vec3 fragPos;

out mat3 TBN;

uniform mat4 transform;
uniform mat4 camera;
uniform mat4 projection;
// uniform bool guiMode;

void main(void) {
	fragPos = vec3(transform * vec4(position, 1.0));
	gl_Position = projection * vec4((camera * vec4(fragPos, 0.0)).xyz, 1.0);
	//gl_Position = projection * vec4((vec4(fragPos, 0.0)).xyz, 1.0);
    uvCoords = uvs;
	pNormal = vec3(transform * vec4(normal, 0.0));
	TBN = mat3(vec3(transform * vec4(tangent, 0.0)), vec3(transform * vec4(bitangent, 0.0)), pNormal);
}
