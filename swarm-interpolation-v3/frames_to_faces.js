import { FindContours } from "./findContours.js";
import { earcut } from "./earcut.js";

const W = 128;
const H = 128;

export function frames_to_faces(frames){
  let faces = [];
  for (let i = 0; i < frames.length; i++){
    let f0 = []
    let g0 = trace_grouped(frames[i].getContext('2d'),0.5);
    for (let k in g0){
      f0.push(...extrude(g0[k],1));
    }
    f0 = trsl_mesh(f0,-W/2,W/2,1*i-frames.length/2);
    faces.push(...f0);
  }
  return faces;
}

function trsl_mesh(mesh,x,y,z){
  return mesh.map(xys=>xys.map(xy=>[xy[0]+x,xy[1]+y,xy[2]+z]));
}

function trace_grouped(ctx,epsilon=1){
  let cnv = ctx.canvas;
  let dat = ctx.getImageData(0,0,cnv.width,cnv.height).data;
  let im = [];
  for (let i = 0; i < dat.length; i+=4){
    im.push(dat[i]>128?1:0);
  }
  let contours = FindContours.findContours(im,cnv.width,cnv.height);
  let groups = {};
  for (let i = 0; i < contours.length; i++){
    let p = FindContours.approxPolyDP(contours[i].points,epsilon).map(x=>[x[0],-x[1]]);
    if (p.length < 3){
      continue;
    }
    if (contours[i].isHole){

      if (groups[contours[i].parent]){
        p.reverse();
        groups[contours[i].parent].push(p);
      }
    }else{
      groups[i+2] = [p];
    }
  }
  return groups;
}
    
function clone(p){
  return JSON.parse(JSON.stringify(p));
}

function triangulate(p){
  p = clone(p);
  let poly = p[0];
  let holes = p.slice(1);
  let idx = [];
  let q = poly;
  while (holes.length){
    idx.push(q.length);
    q.push(...holes.pop());
  }
  let trigs = earcut(q.flat(),idx.length?idx:null);

  let faces = [];
  for (let i = 0; i < trigs.length; i+=3){
    let a = trigs[i];
    let b = trigs[i+1];
    let c = trigs[i+2];
    faces.push([q[a],q[b],q[c]]);
  }
  return faces;
}

function extrude(p,d){
  let ft = triangulate(p);
  let f1 = ft.map(xys=>xys.map(xy=>[xy[0],xy[1],0]).reverse());
  let f2 = ft.map(xys=>xys.map(xy=>[xy[0],xy[1],d]));

  // let ff = []//[...f1,...f2]
  let ff = [];
  for (let k = 0; k < p.length; k++){
    let vs = p[k];
    for (let i = 0; i < vs.length; i++){
      let j = (i+1)%vs.length;
      let a = [...vs[i],0]
      let b = [...vs[j],0]
      let c = [...vs[i],d]
      let e = [...vs[j],d]
      if (!k){
        ff.push([a,b,e],[a,e,c]);
      }else{
        ff.push([a,e,b],[a,c,e]);
      }

    }
  }
  return ff;
}





