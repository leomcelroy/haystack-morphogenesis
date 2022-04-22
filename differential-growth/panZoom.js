const trigger = e => e.composedPath()[0];
const matchesTrigger = (e, selectorString) => trigger(e).matches(selectorString);
// create on listener
const createListener = (target) => (eventName, selectorString, event) => { // focus doesn't work with this, focus doesn't bubble, need focusin
  target.addEventListener(eventName, (e) => {
    e.trigger = trigger(e); // Do I need this? e.target seems to work in many (all?) cases
    if (selectorString === "" || matchesTrigger(e, selectorString)) event(e);
  })
}


export function addPanZoom(el) {
  const listen = createListener(el);
  const transformGroup = el.querySelector(".transform-group");

  let mousedown = false;

  let scale = 1;
  let pointX = 0;
  let pointY = 0;
  let start = { x: 0, y: 0 };

  function setTransform(el) {
    el.style.transformOrigin = `${0}px ${0}px`;
    el.style.transform = "translate(" + pointX + "px, " + pointY + "px) scale(" + scale + ")";
    // if (state.gridSize > 0) dispatch("RENDER");
  }

  function svgPoint({ x, y }) {
      let newX = (x - pointX) / scale;
      let newY = (y - pointY) / scale;

      return { x: newX, y: newY };
  }

  listen("mousedown", "", (e) => {
    if (e.shiftKey) return;

    mousedown = true;

    start = { x: e.offsetX - pointX, y: e.offsetY - pointY };

    if (e.detail === 2) {
      console.log(e.offsetX, e.offsetY, svgPoint({x: e.offsetX, y: e.offsetY}));
    }
  })

  listen("mousemove", "", (e) => {
    if (!mousedown) return;
    // if (state.transforming) return;

    pointX = (e.offsetX - start.x);
    pointY = (e.offsetY - start.y);

    setTransform(transformGroup);
  })

  listen("mouseup", "", (evt) => {
    mousedown = false;
  })

  listen("wheel", "", (e) => {
    
    let xs = (e.offsetX - pointX) / scale;
    let ys = (e.offsetY - pointY) / scale;

    if (Math.sign(e.deltaY) < 0) scale *= 1.03;
    else scale /= 1.03;

    pointX = e.offsetX - xs * scale;
    pointY = e.offsetY - ys * scale;

    setTransform(transformGroup);

    e.preventDefault();
  })

  function setScaleXY(limits) {
    const bb = el.getBoundingClientRect();
    const xr = limits.x[1] - limits.x[0];
    const yr = limits.y[1] - limits.y[0];
    const xScalingFactor = bb.width/xr;
    const yScalingFactor = bb.height/yr;

    const scalingFactor = Math.min(xScalingFactor, yScalingFactor) * 0.9;

    scale = scalingFactor;

    const center = { 
      x: (limits.x[0] + limits.x[1])/2 * scalingFactor - bb.width/2,
      y: (limits.y[0] + limits.y[1])/2 * scalingFactor - bb.height/2
    }

    pointX = -center.x;
    pointY = -center.y;

    setTransform(transformGroup);
  }

  function corners() {
    if (el === null) return null;
    const { left, right, bottom, top, width, height} = el.getBoundingClientRect();
    // need rt, lt, rb, lb
    const rt = svgPoint({ x: width, y: height });
    // rt.y = -rt.y
    const lt = svgPoint({ x: 0, y: height });
    // lt.y = -lt.y
    const rb = svgPoint({ x: width, y: 0 });
    // rb.y = -rb.y
    const lb = svgPoint({ x: 0, y: 0 });
    // lb.y = -lb.y

    return { rt, lt, rb, lb }
  }

  return { 
    scale: () => scale,
    x: () => pointX,
    y: () => pointY,
    corners,
    svgPoint,
    setScaleXY
  }
}