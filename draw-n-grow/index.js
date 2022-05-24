import { render, html, svg } from './uhtml.js';
import RBush from 'https://cdn.skypack.dev/rbush';
import KDBush from 'https://cdn.skypack.dev/kdbush';

import { download } from "./download.js";

const state = {}

const view = state => html`
  <style>
    .toolbox {
      position: absolute;
      right: 25px;
      bottom: 25px;
    }
  </style>
  <div class="root">
    
    <svg class="drawing-svg">
      <circle cx="100" cy="100" r="100"/>
    </svg>
    <canvas class="drawing-canvas"></canvas>
    <div class="toolbox">
      <button @click=${() => download("paths.json", text)}>download</button>
    </div>
  </div>
`

const r = () => {
  render(document.body, view(state));
}

r(document.body, view(state));
const canvas = document.querySelector(".drawing-canvas");
const ctx = canvas.getContext("2d");

function drawPath(path, ops) {
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
    const point = path[i];

    if (i === 0) newPath.moveTo(...point);
    else newPath.lineTo(...point);

    circles.moveTo(...point);
    circles.arc(...point, 2, 0, 2 * Math.PI)
  }

  drawPath(newPath, { stroke: "black", width: 2 });
  // drawPath(circles, { fill: "red" });
}

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

const ATTRACTION = 0.3;
const SMOOTHNESS = 0.35;
const MAX_EDGE_LENGTH = 15;
const MARGIN = 10;
const REPEL = 0.8;
const MIN_ADD_LENGTH = 5;
const BROWNIAN_KICK = 3;

const PATHS = [
  [ 
    {fixed: true, cur: [ 100, 200 ], next: [ 100, 200 ] }, 
    {fixed: true, cur: [ 400, 200 ], next: [ 400, 200 ] },
    {fixed: true, cur: [ 400, 500 ], next: [ 400, 500 ] },
    {fixed: true, cur: [ 100, 500 ], next: [ 100, 500 ] },
    {fixed: true, cur: [ 100, 200 ], next: [ 100, 200 ] }, 
  ]
]

const pathHistory = [];
let text = "";


// const rBush = new RBush()
// state.paths.forEach(path => rBush.load(path));

// const boundingBox = {
//   minX: 0, 
//   minY: 0, 
//   maxX: 1000, 
//   maxY: 1000,
// };

// // why is search failing?
// console.log("all", rBush.all());
// const nearbyPts = rBush.search(boundingBox);

// console.log("pts in", boundingBox, "are\n", nearbyPts);


// const kb = new KDBush(state.paths.flat());
// console.log(kb.within(0, 0, 1000));

const draw = (drawPaths = false) => {

  const paths = PATHS;

  ctx.fillStyle = "white";
  ctx.lineJoin = "round";
  ctx.fillRect(0, 0, innerWidth, innerHeight);

  const pathPts = paths.map(path => path.map(x => x.cur));
  
  if (drawPaths) pathPts.forEach(drawPolyline);

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


  // window.requestAnimationFrame(() => draw(true));
}

const init = state => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // ctx.translate(0.5, 0.5);


  // window.requestAnimationFrame(() => draw(true));

  console.time();
  for (let i = 0; i < 600; i++) {
    pathHistory.push(JSON.parse(JSON.stringify(PATHS)));
    draw(false);
  }
  console.timeEnd();
  draw(true);
  text = JSON.stringify(pathHistory.map(x => x[0].map(x => x.cur)));
}

init(state);