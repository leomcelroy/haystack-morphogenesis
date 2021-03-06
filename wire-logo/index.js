import { render, html, svg } from './uhtml.js';
import RBush from 'https://cdn.skypack.dev/rbush';
import KDBush from 'https://cdn.skypack.dev/kdbush';
import { addEvents } from "./events.js";
import { download } from "./download.js";
import { setUpThree } from "./setUpThree.js";
import { renderPolyline } from "./render.js";
import { Turtle } from "./Turtle.js";
import "./codemirror-js.js";
// import { evaluate } from "./parse.js"; 
// import { run as evaluate } from "./run.js";

// import { run as evaluate } from "./run.js";
import { parse, to_js } from "./parser.js";


/*
forward 10
left 20 * 4
forward 30
setHeading 10, 20
if 1 == 2 then 
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


make sides 5

for 2 as j do


  for sides as i do
    right 360/sides
    forward 90
  end

  up 90


end

make size 30

for 100 as i do
  forward Math.sin(i/10)*size + size
  right 70
  up 10
end
*/


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
      <codemirror-js class="text-editor"></codemirror-js>
      <div class="model"></div>
    </div>
  </div>
`

const r = () => {
  render(document.body, view(state));
}

function downloadPaths() {
  download("turtle.csv",turtle.path.map(x=>x[0]+","+x[1]+","+x[2]).join("\n"));
}

const animate = () => {
  state.renderer.render(state.scene, state.camera);
}

let turtle;

function run() {
  console.log("run");
  let txt = document.querySelector(".text-editor").view.state.doc.toString();
  console.log(txt);
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

const defaultTxt = `make size 30

for 100 as i do
  forward Math.sin(i/10)*size + size
  right 70
  up 10
end
`

const setCm = prog => {
  const cm = document.querySelector(".text-editor")
  const string = cm.view.state.doc.toString();
  cm.view.dispatch({
    changes: { from: 0, to: string.length, insert: prog },
  });
}

const init = state => {
  r();
  addEvents(state);
  setUpThree(state);
  setInterval(animate, 1000/30);

  setCm(defaultTxt);
}

init(state);


