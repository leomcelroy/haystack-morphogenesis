import { render, html, svg } from './uhtml.js';
import RBush from 'https://cdn.skypack.dev/rbush';
import KDBush from 'https://cdn.skypack.dev/kdbush';
import { addEvents } from "./events.js";
import { download } from "./download.js";
import { simplify } from "./simplify.js";
import { PolylineCurve3 } from "./PolylineCurve3.js";
import { makegcode } from "./makegcode.js";

const state = {
  attraction: 0.3,
  smoothness: 0.4,
  max_edge_length: 15,
  margin: 10,
  repel: 0.75,
  min_add_length: 5,
  brownian_kick: 1,
  paths: [
    [ 
      {fixed: true, cur: [ 100, 200 ], next: [ 100, 200 ] }, 
      {fixed: true, cur: [ 400, 200 ], next: [ 400, 200 ] },
      {fixed: true, cur: [ 400, 500 ], next: [ 400, 500 ] },
      {fixed: true, cur: [ 100, 500 ], next: [ 100, 500 ] },
      {fixed: true, cur: [ 100, 200 ], next: [ 100, 200 ] }, 
    ]
  ],
  steps: 100,
  pathHistory: [],
  meshes: [],
  text: "",
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
      <div class="menu-item" @click=${clearPaths}>clear</div>
      <div class="menu-item" @click=${run}>run</div>
      <div class="menu-item" @click=${downloadGcode}>gcode</div>
      <div class="menu-item dropdown-container">
        parameters
        <div class="dropdown-list">
          <span>
            attraction: <input type="number" @input=${(e) => state.attraction = Number(e.target.value)} .value=${state.attraction}/>
          </span>
          <span>
            smoothness: <input type="number" @input=${(e) => state.smoothness = Number(e.target.value)} .value=${state.smoothness}/>
          </span>
          <span>
            margin: <input type="number" @input=${(e) => state.margin = Number(e.target.value)} .value=${state.margin}/>
          </span>
          <span>
            repel: <input type="number" @input=${(e) => state.repel = Number(e.target.value)} .value=${state.repel}/>
          </span>
          <span>
            min_add_length: <input type="number" @input=${(e) => state.min_add_length = Number(e.target.value)}.value=${state.min_add_length}/>
          </span>
          <span>
            brownian_kick: <input type="number" @input=${(e) => state.brownian_kick = Number(e.target.value)} .value=${state.brownian_kick}/>
          </span>
        </div>
      </div>
      <a class="menu-item" href="https://github.com/leomcelroy/haystack-morphogenesis/tree/main/draw-n-grow" target="_blank">github</a>
      <span class="steps">
        steps:
        <input type="number" .value=${state.steps} @input=${(e) => { state.steps = Number(e.target.value)}}/>
      </span>
    </div>
    <div class="bottom-container">
      <canvas class="drawing"></canvas>
      <div class="model"></div>
    </div>
  </div>
`

const r = () => {
  render(document.body, view(state));
}

const clearPaths = () => {
  state.paths = [];
  if (state.meshes.length > 0) state.meshes.forEach(mesh => state.scene.remove(mesh));
  state.meshes = [];
  state.pathHistory = [];
}

function downloadGcode() {
  const text = makegcode(state.pathHistory);
  console.log(text);
  download("anon.gcode", text);
}

const animate = () => {
  state.renderer.render(state.scene, state.camera);
  const cnv = document.querySelector(".drawing");
  const rect = cnv.getBoundingClientRect();
  cnv.width = rect.width;
  cnv.height = rect.height;
  state.paths.map(drawPolyline);
}

function drawPath(path, ops) {
  const cnv = document.querySelector(".drawing");
  const ctx = cnv.getContext("2d");
  const stroke = ops.stroke ?? "none";
  const fill = ops.fill ?? "none";
  const width = ops.width ?? "0";

  ctx.strokeStyle = stroke;
  ctx.fillStyle = fill;
  ctx.lineWidth = width;

  if (stroke !== "none" && width !== 0) {
    ctx.stroke(path);
  }

  if (fill !== "none") {
    ctx.fill(path);
  } 

  return path;
}

const drawPolyline = path => {


  const newPath = new Path2D();
  const circles = new Path2D();

  for (let i = 0; i < path.length; i++) {
    const point = path[i].cur;

    if (i === 0) newPath.moveTo(...point);
    else newPath.lineTo(...point);

    circles.moveTo(...point);
    circles.arc(...point, 2, 0, 2 * Math.PI)
  }

  drawPath(newPath, { stroke: "black", width: 2 });
  // drawPath(circles, { fill: "red" });
}

r(document.body, view(state));


function dot(p0, p1) {
  return p0[0]*p1[0] + p0[1]*p1[1];
}

function minus(p0, p1) {
  return [p0[0] - p1[0], p0[1] - p1[1]];
}

function norm(point) {
  const mag = Math.sqrt(point[0]**2 + point[1]**2);
  // how to handle 0 magnitude?
  return Math.abs(mag) < 0.0001 ? [0, 0] : [ point[0]/mag, point[1]/mag ];
}

function midpoint(p0, p1) {
  return [(p0[0] + p1[0])/2, (p0[1] + p1[1])/2]
}

function length(point) {
  return Math.sqrt(point[0]**2 + point[1]**2);
}

function distance(p0, p1) {
  return Math.sqrt((p1[0]-p0[0])**2 + (p1[1]-p0[1])**2);
}

const step = () => {

  const {
    attraction: ATTRACTION,
    smoothness: SMOOTHNESS,
    max_edge_length: MAX_EDGE_LENGTH,
    margin: MARGIN,
    repel: REPEL,
    min_add_length: MIN_ADD_LENGTH,
    brownian_kick: BROWNIAN_KICK,
    paths: PATHS
  } = state;

  const paths = PATHS;

  const pathPts = paths.map(path => path.map(x => x.cur));
  
  // step through algorithm

  // [x] each node is attracted to neighbor
  // [x] each node is repelled by all other nodes
  // [x] each node is attracted to midpoint of neighbors

  // [x] if an edge is too long sub-divide it

  const allPts = pathPts.flat();

  // console.time();
  const kdBush = new KDBush(allPts);
  // console.timeEnd();

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];

    const toBeInserted = []; // [ [ index, point ], ... ]

    for (let j = 0; j < path.length; j++) {
      const last = j > 0 ? path[j-1].cur : null;
      const next = j < path.length - 1 ? path[j+1].cur : null;
      const me = path[j].cur;

      if (!path[j].fixed) {
        // -- attracted to neighbors --
        if (last !== null) {
          const attractionForce = norm(minus(me, last));
          path[j].next[0] -= attractionForce[0]*ATTRACTION;
          path[j].next[1] -= attractionForce[1]*ATTRACTION;
        } 

        if (next !== null) {
          const attractionForce = norm(minus(me, next));
          path[j].next[0] -= attractionForce[0]*ATTRACTION;
          path[j].next[1] -= attractionForce[1]*ATTRACTION;
        }

        // -- attracted to midpoint of neighbors --
        if (last !== null && next !== null) {
          const middle = midpoint(last, next);
          const attractionForce = norm(minus(me, middle));

          path[j].next[0] -= attractionForce[0]*SMOOTHNESS;
          path[j].next[1] -= attractionForce[1]*SMOOTHNESS;
        } 

        // -- repelled by all others --
        // shouldn't count self
        const nearbyPts = kdBush
          .within(...me, MARGIN)
          .map(i => allPts[i]);

        nearbyPts.forEach(neighbor => {
          const neighborForce = norm(minus(me, neighbor));

          path[j].next[0] += neighborForce[0]*REPEL;
          path[j].next[1] += neighborForce[1]*REPEL;
        })

        if (nearbyPts.length > 5)  path[j].fixed = true;

        // if (Math.random() > 0.99) {
        //   path[j].next[0] += (Math.random() - .5)*BROWNIAN_KICK;
        //   path[j].next[1] += (Math.random() - .5)*BROWNIAN_KICK;
        // }

      };
      
      // -- subdivide & grow --
      if (next !== null) {
        const edgeLength = distance(me, next);

        if (edgeLength > MAX_EDGE_LENGTH) { // subdivide, insert node in between
          const middle = midpoint(me, next);
          toBeInserted.push([ j+1, middle ]);
        } 

        else if (edgeLength > MIN_ADD_LENGTH && Math.random() > 0.99) { // grow
          const u = Math.random()*(.7 - .3) + .3;
          const pt = [
            (1-u)*me[0] + u*next[0] + BROWNIAN_KICK*(Math.random() - .5), 
            (1-u)*me[1] + u*next[1] + BROWNIAN_KICK*(Math.random() - .5)
          ];
          toBeInserted.push([ j+1, pt ]);
        }
      } 

    }

    // add nodes that must be inserted, should be sorted by index
    toBeInserted.forEach(([index, item], i) => {
      path.splice(index+i, 0, { fixed: false, cur: item, next: [ ...item ] } );
    });


  }

  paths.forEach(path => path.forEach(pt => {
    pt.cur[0] = pt.next[0];
    pt.cur[1] = pt.next[1];

    if (
      pt.cur[0] < 0 || 
      pt.cur[0] > innerWidth ||
      pt.cur[1] < 0 || 
      pt.cur[1] > innerHeight) pt.fixed = true;
  }));

  return paths;
  // window.requestAnimationFrame(() => draw(true));
}


function run() {
  console.log(state);
  state.meshes.forEach(mesh => state.scene.remove(mesh));
  state.meshes = [];
  const meshes = state.meshes;
  let bbox = null;
  for (let i = 0; i < state.steps; i++) {
    const data = step().map(x => x.map(y => y.cur));
    if (i % 10 === 0 || i === data.length-1) state.pathHistory.push(JSON.parse(JSON.stringify(data)));
  }

  state.pathHistory = state.pathHistory.map( x => x.map( y => simplify(y)));

  if (meshes.length > 0) meshes.forEach(mesh => state.scene.remove(mesh));
  for (let i = 0; i < state.pathHistory.length; i++) {
    const slice = state.pathHistory[i];
    for (let j = 0; j < slice.length; j++) {
      const pathData = slice[j].map(x => new THREE.Vector3(...x, i*5));
      const path = new PolylineCurve3(pathData);
      const geometry = new THREE.TubeGeometry(path, pathData.length*3, 2, 8, false);
      const material = new THREE.MeshNormalMaterial();
      const mesh = new THREE.Mesh(geometry, material);
      mesh.geometry.computeBoundingBox();
      const box = mesh.geometry.boundingBox.clone();
      if (!bbox) bbox = box;
      else bbox.union(box);

      meshes.push(mesh);
    }
  }
  
  meshes.forEach(mesh => {
    state.scene.add(mesh);
    if (!bbox) return;
    const target = new THREE.Vector3();
    bbox.getCenter(target)
    mesh.position.x -= target.x;
    mesh.position.y -= target.y;
    // mesh.position.z -= target.z;
  });

  state.meshes = meshes;

  console.log(state.pathHistory)
}

const init = state => {
  addEvents(state);
}

function setUpThree() {
  const scene = new THREE.Scene();
  state.scene = scene;
  const camera = new THREE.PerspectiveCamera( 75, 1, 0.0001, 10000 );
  state.camera = camera;
  // camera.position.z = 100;
  const renderer = new THREE.WebGLRenderer({});
  state.renderer = renderer;
  renderer.setSize( 512,512 );
  const container = document.querySelector(".model");
  container.appendChild( renderer.domElement );
  const material = new THREE.MeshNormalMaterial({side:THREE.DoubleSide});
  const controls = new THREE.OrbitControls( camera, renderer.domElement );


  camera.position.set(0,0,100);
  controls.update();

  function resizeCanvasToDisplaySize() {
    // look up the size the canvas is being displayed
    const container = document.querySelector(".model");
    let rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // update the size
    renderer.setSize(width, height);

    // update the camera
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth/canvas.clientHeight;
    camera.updateProjectionMatrix();

    camera.position.set(0,0,400);
    controls.update();
  }

  window.addEventListener("resize", resizeCanvasToDisplaySize); 

  // why?, idk
  setTimeout(resizeCanvasToDisplaySize, 10);
}
setUpThree();
init(state);
setInterval(animate, 1000/30);


