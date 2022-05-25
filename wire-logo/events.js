import { addPath, addPoint } from "./index.js";
import { simplify } from "./simplify.js";

const trigger = e => e.composedPath()[0];
const matchesTrigger = (e, selectorString) => trigger(e).matches(selectorString);
// create on listener
const createListener = (target) => (eventName, selectorString, event) => { // focus doesn't work with this, focus doesn't bubble, need focusin
  target.addEventListener(eventName, (e) => {
    e.trigger = trigger(e); // Do I need this? e.target seems to work in many (all?) cases
    if (selectorString === "" || matchesTrigger(e, selectorString)) event(e);
  })
}

function addCanvasDrawing(state, listener) {
  console.log("add canvas drawing")

  let mouseIsDown = false;
  let lastPt = null;

  listener('mousedown', ".drawing", function(e){
    mouseIsDown = true;
    addPath();

  })

  listener('mousemove', ".drawing", function(e) {

    const rect = e.target.getBoundingClientRect();
    let x = e.clientX - rect.left; //x position within the element.
    let y = e.clientY - rect.top;  //y position within the element.

    if (mouseIsDown) {
      lastPt = addPoint(x, y, lastPt === null);
    }
  })

  listener('mouseup', "", function(e){
    if (!mouseIsDown) return;
    mouseIsDown = false;

    if (!lastPt) return;
    lastPt.fixed = true;
    lastPt = null;

    const lastPath = state.paths.at(-1);
    const simplified = simplify(lastPath.map(x => x.cur));
    state.paths[state.paths.length - 1] = simplified.map((p, i) => {
      return {
        fixed: i === 0 || i === simplified.length - 1,
        cur: p,
        next: p
      }
    })
  });
}


export function addEvents(state) {
  const body = document.querySelector("body");
  const listenBody = createListener(body);
  addCanvasDrawing(state, listenBody);
}