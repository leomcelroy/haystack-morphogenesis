import { FindContours } from "./findContours.js";
import { earcut } from "./earcut.js";
import { MarchVoxels } from "./marching-cubes.js";

const W = 128;

function canvas_to_bin(cnv,thresh=true){
  let A = [];
  let data = cnv.getContext('2d').getImageData(0,0,cnv.width,cnv.height).data;
  for (let i = 0; i < cnv.width*cnv.height*4; i+=4){
    if (thresh){
      A.push(data[i]>128?1:0);
    }else{
      A.push(data[i]/255);
    }
  }
  return A;
}

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

export function frames_to_stl(frames){
  console.log(frames);
  // let data = voxel2stl(frames.map(canvas_to_bin).flat(),W,W,frames.length);
  let bins = frames.map(a=>canvas_to_bin(a,false));
  bins.unshift(bins[0].map(x=>0));
  let data = to_stl_bin(MarchVoxels(bins.flat(),W,W,bins.length));

  let name = `model-${new Date().getTime()}.stl`;

  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  var blob = new Blob([data], {type: "model/stl"});
  var url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = name;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function frames_to_gcode(frames){
  let outlines = [];
  for (let i = 0; i < frames.length; i++){
    outlines.push([]);
    let f0 = []
    let g0 = trace_grouped(frames[i].getContext('2d'),0.5);
    for (let k in g0){
      outlines[i].push(...g0[k]);
    }
  }
  // for (let i = 0; i < outlines.length; i++){
  //   for (let j = 0; j < outlines[i].length; j++){
  //     for (let k = 0; k < outlines[i][j].length; k++){
  //       outlines[i][j][k][0]/=2;
  //       outlines[i][j][k][1]/=2;
  //     }
  //   }
  // }
  let data = makegcode(outlines);

  let name = `model-${new Date().getTime()}.gcode`;

  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  var blob = new Blob([data], {type: "text/plain"});
  var url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = name;
  a.click();
  window.URL.revokeObjectURL(url);
}

function to_stl_bin(faces){
  let nb = 84+faces.length*50;
  console.log(`writing stl (binary)... estimated ${~~(nb/1048576)} MB`);

  let o = new Uint8Array(nb);
  let a = new ArrayBuffer(4);
  let b = new Uint32Array(a);
  b[0] = faces.length;
  o.set(new Uint8Array(a),80);
  for (let i = 0; i < faces.length; i++){
    let d = [
      faces[i][0][0],faces[i][0][1],faces[i][0][2],
      faces[i][1][0],faces[i][1][1],faces[i][1][2],
      faces[i][2][0],faces[i][2][1],faces[i][2][2],
    ]
    let a = new ArrayBuffer(36);
    let b = new Float32Array(a);
    d.map((x,j)=>b[j]=x);
    o.set(new Uint8Array(a),84+i*50+12);
  }
  return o;
}


function makegcode(outlines){
  let gcode = `
M140 S60
M104 T0 S0
M190 S60
G28
`;
  let e;
  for (let i = 0; i < outlines.length; i++){
    let z = i*2;
    gcode += `
G92 E0
G1 F3600 E-1
G1 X${outlines[i][0][0][0]} Y${outlines[i][0][0][1]} F3600
G1 Z${z} F3600
G1 E0 F3600
`;
    
    for (let j = 0; j < outlines[i].length; j++){
      if (j){ // perimeter change
      gcode += `
G92 E0
G1 F3600 E-1
G1 X${outlines[i][j][0][0]} Y${outlines[i][j][0][1]} F3600
G1 Z${z} F3600
G1 E0 F3600
`;
      }
      e = 0;
      for (let k = 1; k < outlines[i][j].length; k++){
        let [x,y] = outlines[i][j][k];
        let [x0,y0] = outlines[i][j][k-1];
        let d = Math.hypot(x-x0,y-y0);
        e += d * 1.27;
        gcode += `G1 X${x} Y${y} Z${z} E${e} ${(k==1)?"F900":""}\n`;
      }
    }
  }
  gcode +=`
G28
M84
M140 S0
M104 T0 S0
`;
  return gcode;

}
