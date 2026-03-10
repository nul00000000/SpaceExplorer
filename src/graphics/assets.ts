import { Model } from "./model";
import { vec3, mat3, vec2 } from "gl-matrix";

export let mercuryTexture: WebGLTexture;
export let mercuryTextureLow: WebGLTexture;
export let venusTexture: WebGLTexture;
export let venusTextureLow: WebGLTexture;
export let earthTexture: WebGLTexture;
export let earthTextureLow: WebGLTexture;
export let cloudTexture: WebGLTexture;

export let skyboxTexture: WebGLTexture;

export let testTexture: WebGLTexture;
export let emptyTexture: WebGLTexture;

export let icosphereModel: Model;
export let skyboxModel: Model;

export function initAssets(gl: WebGL2RenderingContext) {
    mercuryTexture = loadTexture("assests/planets/mercury/day8k.jpg", gl, true);
    mercuryTextureLow = loadTexture("assests/planets/mercury/day.jpg", gl, true);
    venusTexture = loadTexture("assests/planets/venus/day8k.jpg", gl, true);
    venusTextureLow = loadTexture("assests/planets/venus/day.jpg", gl, true);
    earthTexture = loadTexture("assests/planets/earth/day8k.jpg", gl, true);
    earthTextureLow = loadTexture("assests/planets/earth/day.jpg", gl, true);
    cloudTexture = loadTexture("assests/planets/earth/cloud.jpg", gl, true);
    
    skyboxTexture = loadTexture("assests/sky.jpg", gl, true);
    
    testTexture = loadTexture("assests/planets/test.png", gl, true);
    emptyTexture = loadTexture("assests/planets/empty.png", gl, true);

    let icoVerts: number[] = [];
    let icoUVs: number[] = [];
    let icoIndices: number[] = [];

    addIcosehedron(icoVerts, icoUVs, icoIndices, 0, 0, 0, 1, 4);

    icosphereModel = new Model(gl, icoVerts, icoUVs, icoIndices, false, icoVerts);

    // let skyVerts: number[] = [];
    // let skyUVs: number[] = [];
    let skyIndices: number[] = [];

    for(let i = 0; i < icoIndices.length / 3; i++) {
        skyIndices.push(icoIndices[i * 3], icoIndices[i * 3 + 2], icoIndices[i * 3 + 1]);
    }

    // addIcosehedron(skyVerts, skyUVs, skyIndices, 0, 0, 0, 1, 4, true);

    skyboxModel = new Model(gl, icoVerts, icoUVs, skyIndices, false, icoVerts);
}

function indexOfPoint(list: vec3[], point: vec3, minDist = 0.001): number {
    for(let i = 0; i < list.length; i++) {
        if(vec3.dist(point, list[i]) < minDist) {
            return i;
        }
    }
    return -1;
}

function addIcosehedron(vertices: number[], uvs: number[], indices: number[], x: number, y: number, z: number, r: number, subs = 0, insideOut = false, along: vec3 = [0, 1, 0]) {
    //regular icosehedron time
    //did you know the vertices are the corners of three orthogonal 1xphi rectangles (but here we normalize it)

    let c = 1.618 / Math.sqrt(1.618 * 1.618 + 1 * 1) * r;
    let a = 1 / Math.sqrt(1.618 * 1.618 + 1 * 1) * r;

    let indicesBase = vertices.length / 3;

    let verts: vec3[] = [];
    let inds: vec3[] = [];
    let uv: vec2[] = [];

    //xz rectangle
    verts.push([ a,  0,  c]);
    verts.push([-a,  0,  c]);
    verts.push([-a,  0, -c]);
    verts.push([ a,  0, -c]);

    //yz rectangle
    verts.push([ 0,   c,  a]);
    verts.push([ 0,   c, -a]);
    verts.push([ 0,  -c, -a]);
    verts.push([ 0,  -c,  a]);

    //xy rectangle
    verts.push([ c,   a,  0]);
    verts.push([ c,  -a,  0]);
    verts.push([-c,  -a,  0]);
    verts.push([-c,   a,  0]);

    if(!insideOut) {
        //xz edge triangles
        inds.push([1, 0, 4]);
        inds.push([0, 1, 7]);

        inds.push([3, 2, 5]);
        inds.push([2, 3, 6]);

        //yz edge triangles
        inds.push([5, 4, 8]);
        inds.push([4, 5, 11]);

        inds.push([7, 6, 9]);
        inds.push([6, 7, 10]);

        //xy edge triangles
        inds.push([9, 8, 0]);
        inds.push([8, 9, 3]);

        inds.push([11, 10, 1]);
        inds.push([10, 11, 2]);

        //corner triangles (the other eight)
        inds.push([4, 0, 8]); //+x+y+z
        inds.push([3, 5, 8]); //+x+y-z
        inds.push([0, 7, 9]); //+x-y+z
        inds.push([1, 4, 11]); //-x+y+z
        
        inds.push([7, 1, 10]); //-x-y+z
        inds.push([5, 2, 11]); //-x+y-z
        inds.push([6, 3, 9]); //+x-y-z
        inds.push([2, 6, 10]); //-x-y-z
    } else {
        //xz edge triangles
        inds.push([1, 4, 0]);
        inds.push([0, 7, 1]);

        inds.push([3, 5, 2]);
        inds.push([2, 6, 3]);

        //yz edge triangles
        inds.push([5, 8, 4]);
        inds.push([4, 11, 5]);

        inds.push([7, 9, 6]);
        inds.push([6, 10, 7]);

        //xy edge triangles
        inds.push([9, 0, 8]);
        inds.push([8, 3, 9]);

        inds.push([11, 1, 10]);
        inds.push([10, 2, 11]);

        //corner triangles (the other eight)
        inds.push([4, 8, 0]); //+x+y+z
        inds.push([3, 8, 5]); //+x+y-z
        inds.push([0, 9, 7]); //+x-y+z
        inds.push([1, 11, 4]); //-x+y+z
        
        inds.push([7, 10, 1]); //-x-y+z
        inds.push([5, 11, 2]); //-x+y-z
        inds.push([6, 9, 3]); //+x-y-z
        inds.push([2, 10, 6]); //-x-y-z
    }

    for(let i = 0; i < subs; i++) {
        let newVerts: vec3[] = [];
        let newInds: vec3[] = [];
        
        for(let ind of inds) {
            let a = verts[ind[0]];
            let b = verts[ind[1]];
            let c = verts[ind[2]];
    
            let ab = [   (a[0] + b[0]) / 2,
                        (a[1] + b[1]) / 2,
                        (a[2] + b[2]) / 2];
            
            let bc = [   (c[0] + b[0]) / 2,
                        (c[1] + b[1]) / 2,
                        (c[2] + b[2]) / 2];
    
            let ca = [   (a[0] + c[0]) / 2,
                        (a[1] + c[1]) / 2,
                        (a[2] + c[2]) / 2];
            
            let i = newVerts.length;
            let indA = i + 0;
            let indB = i + 1;
            let indC = i + 2;
            let indAB = i + 3;
            let indBC = i + 4;
            let indCA = i + 5;
    
            let iop = indexOfPoint(newVerts, a);
            if(iop != -1) {
                indA = iop;
                indB = newVerts.length;
                indC = newVerts.length + 1;
                indAB = newVerts.length + 2;
                indBC = newVerts.length + 3;
                indCA = newVerts.length + 4;
            } else {
                newVerts.push(a);
            }
            iop = indexOfPoint(newVerts, b);
            if(iop != -1) {
                indB = iop;
                indC = newVerts.length;
                indAB = newVerts.length + 1;
                indBC = newVerts.length + 2;
                indCA = newVerts.length + 3;
            } else {
                newVerts.push(b);
            }
            iop = indexOfPoint(newVerts, c);
            if(iop != -1) {
                indC = iop;
                indAB = newVerts.length;
                indBC = newVerts.length + 1;
                indCA = newVerts.length + 2;
            } else {
                newVerts.push(c);
            }
            iop = indexOfPoint(newVerts, ab);
            if(iop != -1) {
                indAB = iop;
                indBC = newVerts.length;
                indCA = newVerts.length + 1;
            } else {
                newVerts.push(ab);
            }
            iop = indexOfPoint(newVerts, bc);
            if(iop != -1) {
                indBC = iop;
                indCA = newVerts.length;
            } else {
                newVerts.push(bc);
            }iop = indexOfPoint(newVerts, ca);
            if(iop != -1) {
                indCA = iop;
            } else {
                newVerts.push(ca);
            }
    
            newInds.push([indCA, indA, indAB]);
            newInds.push([indAB, indB, indBC]);
            newInds.push([indBC, indC, indCA]);
            newInds.push([indAB, indBC, indCA]);
        }
    
        verts = newVerts;
        inds = newInds;
    }

    for(let i = 0; i < verts.length; i++) {
        vec3.normalize(verts[i], verts[i]);
    }

    for(let i = 0; i < verts.length; i++) {
        uv.push([   (1 - (Math.atan2(verts[i][2], verts[i][0]) / Math.PI / 2 + 0.5)),
                    (1 - (Math.asin(verts[i][1]) / Math.PI + 0.5))]);
    }

    let trisToFix: number[] = [];

    for(let i = 0; i < inds.length; i++) {
        let a = verts[inds[i][0]];
        let b = verts[inds[i][1]];
        let c = verts[inds[i][2]];
        let uva = uv[inds[i][0]];
        let uvb = uv[inds[i][1]];
        let uvc = uv[inds[i][2]];

        let uvba = vec3.normalize([0, 0, 0], vec3.sub([0, 0, 0], b, a));
        let uvca = vec3.normalize([0, 0, 0], vec3.sub([0, 0, 0], c, a));

        let cross = ((uvb[0] - uva[0]) * (uvc[1] - uva[1])) 
                - ((uvb[1] - uva[1]) * (uvc[0] - uva[0]));

        console.log(cross);

        if(cross > 0) {
            trisToFix.push(i);
        }
    }

    let seamVerts: vec3[] = [];
    let seamUVs: vec2[] = [];

    for(let i = 0; i < trisToFix.length; i++) {
        for(let j = 0; j < 3; j++) {
            if(uv[inds[trisToFix[i]][j]][0] < 0.5) {
                let iof = indexOfPoint(seamVerts, verts[inds[trisToFix[i]][j]]);
                if(iof == -1) {
                    let newVert = Array.from(verts[inds[trisToFix[i]][j]]);
                    seamVerts.push(newVert);
                    seamUVs.push([uv[inds[trisToFix[i]][j]][0] + 1.0, uv[inds[trisToFix[i]][j]][1]]);
                    inds[trisToFix[i]][j] = verts.length + seamVerts.length - 1;
                } else {
                    inds[trisToFix[i]][j] = verts.length + iof;
                }
            }
        }
    }

    verts.push(...seamVerts);
    uv.push(...seamUVs);

    //show seams
    // for(let i = 0; i < inds.length; i++) {
    //     let a = verts[inds[i][0]];
    //     let b = verts[inds[i][1]];
    //     let c = verts[inds[i][2]];

    //     let center = [  (a[0] + b[0] + c[0]) / 3,
    //                     (a[1] + b[1] + c[1]) / 3,
    //                     (a[2] + b[2] + c[2]) / 3]
        
    //     vec3.add(a, a, vec3.scale([0, 0, 0], vec3.sub([0, 0, 0], center, a), 0.1));
    //     vec3.add(b, b, vec3.scale([0, 0, 0], vec3.sub([0, 0, 0], center, b), 0.1));
    //     vec3.add(c, c, vec3.scale([0, 0, 0], vec3.sub([0, 0, 0], center, c), 0.1));
    // }
    
    let tangent: vec3 = [-along[1], along[0], 0];
    vec3.normalize(tangent, tangent);
    let bitangent: vec3 = [0, 0, 0];
    vec3.cross(bitangent, tangent, along);

    let TBN: mat3 = [tangent[0], tangent[1], tangent[2], along[0], along[1], along[2],
        bitangent[0], bitangent[1], bitangent[2]];

    for(let i = 0; i < verts.length; i++) {
        vec3.transformMat3(verts[i], verts[i], TBN);
        vertices.push(verts[i][0] + x, verts[i][1] + y, verts[i][2] + z);
    }

    for(let u of uv) {
        uvs.push(u[0], u[1]);
    }

    for(let index of inds) {
        indices.push(index[0] + indicesBase, index[1] + indicesBase, index[2] + indicesBase);
    }
}

// function addCubeSphere(vertices: number[], uvs: number[], indices: number[], x: number, y: number, z: number, r: number, subs = 2) {
//     let indicesBase = vertices.length / 3;

//     let verts: vec3[] = [];
//     let inds: vec3[] = [];

//     //top

    
// }

function loadTexture(path: string, gl: WebGL2RenderingContext, wrap = false) {
    let tex = new Image();
    let glTex = gl.createTexture();
    tex.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, glTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap ? gl.REPEAT : gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap ? gl.REPEAT : gl.CLAMP_TO_EDGE);
        gl.generateMipmap(gl.TEXTURE_2D);
    }
    tex.src = path;
    return glTex;
}

function loadNormalTexture(path: string, gl: WebGL2RenderingContext) {
    let tex = new Image();
    let glTex = gl.createTexture();
    tex.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, glTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex);
        gl.generateMipmap(gl.TEXTURE_2D);
    }
    tex.src = path;
    return glTex;
}