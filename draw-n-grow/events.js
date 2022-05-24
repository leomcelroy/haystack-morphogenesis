const trigger = e => e.composedPath()[0];
const matchesTrigger = (e, selectorString) => trigger(e).matches(selectorString);
// create on listener
const createListener = (target) => (eventName, selectorString, event) => { // focus doesn't work with this, focus doesn't bubble, need focusin
  target.addEventListener(eventName, (e) => {
    e.trigger = trigger(e); // Do I need this? e.target seems to work in many (all?) cases
    if (selectorString === "" || matchesTrigger(e, selectorString)) event(e);
  })
}

function addSliderBar(state, listener) {
  let cnv = null;
  let ctx = null;

  let mouseX = 0;
  let mouseY = 0;

  listener('mousedown', ".slider-bar", function(e){
    const slider = e.target;
    let rect = slider.getBoundingClientRect();
    let x = e.clientX - rect.left; //x position within the element.
    let y = e.clientY - rect.top;  //y position within the element.

    const perc = ~~(y/rect.height*100);

    state.slices.push([ 
      perc, 
      new Uint8ClampedArray(state.image_width * state.image_height * 4) 
    ]);

    state.slices.sort((a, b) => a[0] - b[0]);

    state.selectedSlice = state.slices.findIndex(x => x[0] > perc) - 1;

    RENDER();
  })
}

function addCanvasDrawing(state, listener) {
  let cnv = null;
  let ctx = null;

  let mouseIsDown = false;

  listener('mousedown', ".editable-canvas", function(e){
    mouseIsDown = true;
    cnv = e.target;
    ctx = cnv.getContext('2d');
  })


  listener('mousemove', ".editable-canvas", function(e){
    if (!ctx) return;

    ctx.fillStyle="white";

    const rect = e.target.getBoundingClientRect();
    let x = e.clientX - rect.left; //x position within the element.
    let y = e.clientY - rect.top;  //y position within the element.

    let mouseX = x;
    let mouseY = y;

    if (mouseIsDown){
      ctx.fillRect(mouseX-8,mouseY-8,16,16);
    }
  })

  listener('mouseup', ".editable-canvas", function(e){
    mouseIsDown = false;
    // set slice data
    state.slices.forEach((slice, i) => {
      const [ depth, data ] = slice;
      if (i === state.selectedSlice) {
        slice[1] = ctx.getImageData(0, 0, state.image_width, state.image_height).data;
      } 
    })
  });
}

function addNodeDragging(state, listener) {

  let draggingSlice = false;

  listener("mousedown", ".slice-node", (e) => {
    const i = state.selectedSlice;
    if (i === 0 || i === state.slices.length - 1) return;
    draggingSlice = true;
  })


  listener("mousemove", "", (e) => {
    if (!draggingSlice) return;
    const slider = document.querySelector(".slider-bar");
    let rect = slider.getBoundingClientRect();
    let x = e.clientX - rect.left; //x position within the element.
    let y = e.clientY - rect.top;  //y position within the element.

    // bound
    y = Math.min(Math.max(y, 1), rect.height-1);

    state.slices[state.selectedSlice][0] = ~~(y/rect.height*100);
    RENDER();
    
  })

  listener("mouseup", "", () => {
    if (!draggingSlice) return;
    draggingSlice = false;
    const selectedHeight = state.slices[state.selectedSlice][0];
    state.slices.sort((a, b) => a[0] - b[0]);
    state.selectedSlice = state.slices.findIndex(x => x[0] > selectedHeight) - 1;

    RENDER();
  })
}


export function addEvents(state) {
  // const svg = document.querySelector("svg");
  // svg.panZoomParams = addPanZoom(svg);
  // state.panZoomParams = svg.panZoomParams;

  const body = document.querySelector("body");
  const listenBody = createListener(body);
  addCanvasDrawing(state, listenBody);
  addSliderBar(state, listenBody);
  addNodeDragging(state, listenBody);
}