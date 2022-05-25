import { render, html, svg } from './uhtml.js';
import RBush from 'https://cdn.skypack.dev/rbush';
import KDBush from 'https://cdn.skypack.dev/kdbush';
import { addEvents } from "./events.js";
import { download } from "./download.js";
import { setUpThree } from "./setUpThree.js";
import { Turtle } from "./Turtle.js";
import { run as evaluate } from "./run.js";

// forward 90
// left 90
// right 90
// up 90
// down 90
// for count 10 [

// ]

const t = new Turtle();

console.log(t.path);

const prog = `
  forward 90
  right 90
  left 90
`
const result = evaluate(prog, t);

console.log(t);

const state = {
  turtle: new Turtle(),
  scene: null,
  camera: null,
  renderer: null,
}

export const addPath = () => {
  state.paths.push([]);
}

export const addPoint = (x, y, fixed = false) => {

  const pt = {
    fixed,
    cur: [x, y],
    next: [x, y]
  };

  state.paths.at(-1).push(pt);

  return pt;
}

const view = state => html`
  <div class="root">
    <div class="menu">
      <div class="menu-item" @click=${run}>run</div>
      <div class="menu-item" @click=${downloadPaths}>download</div>
      <a class="menu-item" href="https://github.com/leomcelroy/haystack-morphogenesis/tree/main/wire-logo" target="_blank">github</a>
    </div>
    <div class="bottom-container">
      <textarea class="text-editor"></textarea>
      <div class="model"></div>
    </div>
  </div>
`

const r = () => {
  render(document.body, view(state));
}

function downloadPaths() {
  console.log("TODO")
}

const animate = () => {
  state.renderer.render(state.scene, state.camera);
}

function run() {
  console.log("run");
  
}

const init = state => {
  r();
  addEvents(state);
  setUpThree(state);
  setInterval(animate, 1000/30);
}

init(state);


