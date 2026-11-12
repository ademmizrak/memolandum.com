const GAME_CODES = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "KeyJ", "KeyK", "KeyP", "Escape", "KeyR", "ControlLeft", "ControlRight", "MetaLeft", "MetaRight"]);
const HOLD_180_MS = 340;
function radialDeadzone(x, y, dz = 0.18) {
  const m = Math.hypot(x, y);
  if (m < dz) return {
    x: 0,
    y: 0
  };
  const scale = (m - dz) / (1 - dz) / m;
  return {
    x: x * scale,
    y: y * scale
  };
}
export function createInput() {
  const keys = new Set();
  let injected = null;
  const touch = {
    left: false,
    right: false,
    forward: false,
    back: false,
    fire: false,
    pause: false
  };
  let stickX = 0;
  let stickY = 0;
  let queuedAbout = false;
  let prevFire = false;
  let prevPause = false;
  let prevAbout = false;
  let canvas = null;
  let holdTimer = null;
  let holdX = 0;
  let holdY = 0;
  function currentCodes() {
    if (injected) return new Set(injected);
    return keys;
  }
  function onKeyDown(e) {
    if (GAME_CODES.has(e.code)) {
      const modifier = e.code.startsWith("Control") || e.code.startsWith("Meta");
      if (!modifier) e.preventDefault();
    }
    if (e.repeat) return;
    keys.add(e.code);
  }
  function onKeyUp(e) {
    keys.delete(e.code);
  }
  function clear() {
    keys.clear();
    stickX = 0;
    stickY = 0;
    cancelHold();
  }
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", clear);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clear();
  });
  function cancelHold() {
    if (holdTimer != null) {
      window.clearTimeout(holdTimer);
      holdTimer = null;
    }
  }
  function onPointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    holdX = e.clientX;
    holdY = e.clientY;
    cancelHold();
    holdTimer = window.setTimeout(() => {
      holdTimer = null;
      queuedAbout = true;
    }, HOLD_180_MS);
  }
  function onPointerMove(e) {
    if (holdTimer == null) return;
    if (Math.hypot(e.clientX - holdX, e.clientY - holdY) > 20) cancelHold();
  }
  function attach(el) {
    detach();
    canvas = el;
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", cancelHold);
    el.addEventListener("pointercancel", cancelHold);
  }
  function detach() {
    if (!canvas) return;
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", cancelHold);
    canvas.removeEventListener("pointercancel", cancelHold);
    canvas = null;
    cancelHold();
  }
  function pollGamepad(codes, analog) {
    const pads = navigator.getGamepads?.() ?? [];
    for (const pad of pads) {
      if (!pad) continue;
      const b = pad.buttons;
      const raw = radialDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0, 0.2);
      analog.x += raw.x;
      analog.y += -raw.y;
      if (b[14]?.pressed) codes.add("ArrowLeft");
      if (b[15]?.pressed) codes.add("ArrowRight");
      if (b[12]?.pressed) codes.add("KeyW");
      if (b[13]?.pressed) codes.add("KeyS");
      if (b[0]?.pressed || b[7]?.pressed) codes.add("Space");
      if (b[1]?.pressed || b[4]?.pressed) codes.add("ControlLeft");
      if (b[9]?.pressed) codes.add("KeyP");
    }
  }
  function sample() {
    const codes = currentCodes();
    const analog = injected ? {
      x: 0,
      y: 0
    } : {
      x: stickX,
      y: stickY
    };
    if (!injected) pollGamepad(codes, analog);
    if (touch.left) analog.x -= 1;
    if (touch.right) analog.x += 1;
    if (touch.forward) analog.y += 1;
    if (touch.back) analog.y -= 1;
    if (codes.has("KeyA") || codes.has("ArrowLeft")) analog.x -= 1;
    if (codes.has("KeyD") || codes.has("ArrowRight")) analog.x += 1;
    if (codes.has("KeyW") || codes.has("ArrowUp")) analog.y += 1;
    if (codes.has("KeyS") || codes.has("ArrowDown")) analog.y -= 1;
    let moveX = analog.x;
    let moveY = analog.y;
    const mag = Math.hypot(moveX, moveY);
    if (mag > 1) {
      moveX /= mag;
      moveY /= mag;
    }
    const fire = codes.has("Space") || codes.has("KeyJ") || codes.has("KeyK") || touch.fire;
    const pauseHeld = codes.has("KeyP") || codes.has("Escape") || touch.pause;
    const aboutHeld = codes.has("ControlLeft") || codes.has("ControlRight") || codes.has("MetaLeft") || codes.has("MetaRight");
    const firePressed = fire && !prevFire;
    const pausePressed = pauseHeld && !prevPause;
    const aboutFace = aboutHeld && !prevAbout || queuedAbout;
    queuedAbout = false;
    prevFire = fire;
    prevPause = pauseHeld;
    prevAbout = aboutHeld;
    return {
      moveX,
      moveY,
      fire,
      firePressed,
      pausePressed,
      aboutFace
    };
  }
  function setKeys(codes) {
    injected = codes;
    queuedAbout = codes.some(c => c.startsWith("Control") || c.startsWith("Meta"));
  }
  function setTouch(partial) {
    Object.assign(touch, partial);
  }
  function setStick(x, y) {
    const v = radialDeadzone(x, y, 0.16);
    stickX = v.x;
    stickY = v.y;
  }
  function queueAboutFace() {
    queuedAbout = true;
  }
  function destroy() {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", clear);
    detach();
  }
  return {
    sample,
    setKeys,
    setTouch,
    setStick,
    queueAboutFace,
    attach,
    destroy,
    getInjected: () => injected
  };
}
export { HOLD_180_MS };