import { render, html, svg } from './uhtml.js';
import RBush from 'https://cdn.skypack.dev/rbush';
import KDBush from 'https://cdn.skypack.dev/kdbush';
import { addEvents } from "./events.js";
import { download } from "./download.js";
import { setUpThree } from "./setUpThree.js";
import { renderPolyline } from "./render.js";
import { Turtle } from "./Turtle.js";
import { run as evaluate } from "./run.js";
import { parse, to_js } from "./parser.js";

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
      <textarea class="text-editor">
forward 10
left 20 * 4
forward 30
setHeading 10, 20
if 1== 2 then 
  forward 40 
  forward 2
else 
  goTo 50, 60, 70
end
make a 3
forward a + 3
for 10 as i do
  forward i
  left 20
  if 1 <= 3 then 
    left 5
  end
end
      
      </textarea>
      <div class="model"></div>
    </div>
  </div>
`

const r = () => {
  render(document.body, view(state));
}

function downloadPaths() {
  download("turtle.csv",turtle.path.map(x=>x[0]+","+x[1],+","+[2]).join("\n"));
}

const animate = () => {
  state.renderer.render(state.scene, state.camera);
}

let turtle;

function run() {
  console.log("run");
  let txt = document.getElementsByClassName("text-editor")[0].value;
  let ast = parse(txt);
  let js = to_js(ast);
  console.log(js);
  turtle = new Turtle();
  eval(js);
  console.log(turtle);
  
  // let polyline = JSON.parse();
  // console.log(polyline);
  // renderPolyline(state,{path:polyline,angle_lr:Math.PI,angle_ud:0});
  renderPolyline(state,turtle);
}

const init = state => {
  r();
  addEvents(state);
  setUpThree(state);
  setInterval(animate, 1000/30);
}

init(state);


