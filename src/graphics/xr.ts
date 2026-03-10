let xrSession: XRSession;

export let xrStarted = false;
export let xrRefSpace: XRReferenceSpace;

export function hasXR(): boolean {
    return "xr" in navigator;
}

function onVisibilityChange(event: XRSessionEvent) {
    switch(event.session.visibilityState) {
        case "hidden":
            //fps = 10
            break;
        case "visible-blurred":
            //fps = 30
            break;
        case "visible":
            //fps = 90
            break;
    }
}

export function initXR(gl: WebGL2RenderingContext, drawCall: (timestamp: number, frame: XRFrame) => void, endCallback: () => void = () => {}) {
    if(!xrSession) {
        navigator.xr.isSessionSupported("immersive-vr").then((isSupported) => {
            if(isSupported) {
                navigator.xr.requestSession("immersive-vr").then((session) => {
                    xrSession = session;
                    xrSession.onvisibilitychange = onVisibilityChange;

                    xrStarted = true;

                    xrSession.updateRenderState({
                        baseLayer: new XRWebGLLayer(xrSession, gl)
                    });
                    xrSession.requestReferenceSpace("local").then((space) => {
                        xrRefSpace = space;
                        xrSession.requestAnimationFrame(drawCall);
                    }, (resp: any) => {
                        alert(resp);
                    });
                    endCallback();
                }, (reason: any) => {
                    alert(reason);
                });
            } else {
                alert("immersive vr not supported");
            }
        });
    }
}

export function exitVR() {
    if(xrSession) {
        xrSession.end();
    }
}