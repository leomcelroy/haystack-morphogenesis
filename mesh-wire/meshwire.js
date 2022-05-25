let LH = 20;
let SL = 32;

function dilate(ctx){
  let cnv2 = document.createElement("canvas");
  cnv2.width = ctx.canvas.width;
  cnv2.height = ctx.canvas.height;
  let ctx2 = cnv2.getContext('2d');

  ctx2.drawImage(ctx.canvas,0,0);
  ctx2.globalCompositeOperation = "lighter";
  ctx2.drawImage(ctx.canvas,-1,0);
  ctx2.drawImage(ctx.canvas,0,-1);
  ctx2.drawImage(ctx.canvas,0,1);
  ctx2.drawImage(ctx.canvas,1,0);
  ctx2.drawImage(ctx.canvas,-1,-1);
  ctx2.drawImage(ctx.canvas,-1,1);
  ctx2.drawImage(ctx.canvas,1,-1);
  ctx2.drawImage(ctx.canvas,1,1);
  return ctx2;
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
function trsl_poly(poly,x,y){
  return poly.map(xy=>[xy[0]+x,xy[1]+y]);
}

function slicer (geometry) {
  geometry.applyMatrix4(new THREE.Matrix4().makeScale(-1, 1, 1));

// geometry.computeFaceNormals();
// geometry.computeVertexNormals();

  // let material = new THREE.MeshNormalMaterial({color:0xffffff,side:THREE.BackSide});
  let material = new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.BackSide});
  let mesh = new THREE.Mesh(geometry,material);
  mesh.frustumCulled = false;
  mesh.geometry.computeBoundingBox();


  let material2 = new THREE.MeshBasicMaterial({color:0x000000,side:THREE.FrontSide, polygonOffset:true, polygonOffsetFactor :-0.5 ,polygonOffsetUnits: 4.0});
  let mesh2 = new THREE.Mesh(geometry,material2);
  mesh2.frustumCulled = false;

  mesh.rotation.z = Math.PI;
  mesh2.rotation.z = Math.PI;

  let box = mesh.geometry.boundingBox;
  console.log(box.getSize(new THREE.Vector3()));

  let w = Math.ceil(box.max.x-box.min.x);
  let h = Math.ceil(box.max.y-box.min.y);
  
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({});
  // const camera = new THREE.PerspectiveCamera( 75, 1, 0.0001, 10000 );
  const camera = new THREE.OrthographicCamera( box.min.x-1,  box.max.x+1, box.min.y-1, box.max.y+1 , 0, 100000 );
  camera.frustumCulled = false;
  // camera.position.set(0,0,1000)
  scene.add(mesh)
  scene.add(mesh2)
  renderer.setSize( w,h );
  // document.body.appendChild(renderer.domElement)
  let cnv = document.createElement("canvas");
  cnv.width = w;
  cnv.height = h;
  let ctx = cnv.getContext('2d');


  
  let outlines = []
  for (let i = Math.ceil(box.min.z); i < Math.ceil(box.max.z); i+=LH){

    outlines.push([]);
    // mesh.position.z = i;
    camera.near = i;
    // camera.far = i+1;
    camera.updateProjectionMatrix();
    renderer.render(scene,camera);
    ctx.drawImage(renderer.domElement,0,0);
    let groups = trace_grouped(dilate(ctx),0.5);
    for (let k in groups){
      outlines[outlines.length-1].push(trsl_poly(groups[k][0],-w/2,h/2));
    }
    // document.body.appendChild(cnv);
  }

  return outlines;
}

function poly_area(poly){
  var n = poly.length;
  var a = 0.0;
  for(var p=n-1,q=0; q<n; p=q++) {
    a += poly[p][0] * poly[q][1] - poly[q][0] * poly[p][1];
  }
  return a * 0.5;
}

function spiralize(outlines){
  let rings = [];
  for (let i = 0; i < outlines.length; i++){
    if (outlines[i].length){
      let p = outlines[i].slice().sort((a,b)=>(poly_area(b)-poly_area(a)))[0];
      // p = resample(p,SL);
      rings.push(p);
    }
  }
  let line = [];
  for (let i = 0; i < rings.length; i++){
    let j0 = 0;
    let n = rings[i].length;
    if (i){
      let p = line[line.length-1];
      let md = Infinity;
      for (let j = 0; j < n; j++){
        let d= Math.hypot(rings[i][j][0]-p[0], rings[i][j][1]-p[1]);
        if (d<md){
          j0 = j;
          md = d;
        }
      }
    }
    
    for (let j = 0; j < n; j++){
      let t = j/n;
      line.push([rings[i][(j0+j)%n][0],rings[i][(j0+j)%n][1],i*LH+t*LH]);
    }
  }
  line = getResampledBySpacing(line,SL);
  return line;
}



function calc_length(line){
  let s = 0;
  for (let i = 1; i < line.length; i++){
    let [x0,y0,z0] = line[i-1];
    let [x1,y1,z1] = line[i];
    s += Math.sqrt( (x1-x0)**2 + (y1-y0)**2 + (z1-z0)**2 );
  }
  return s;
}




function isect_circ_line(cx,cy,r,x0,y0,x1,y1){
  //https://stackoverflow.com/a/1084899
  let dx = x1-x0;
  let dy = y1-y0;
  let fx = x0-cx;
  let fy = y0-cy;
  let a = dx*dx+dy*dy;
  let b = 2*(fx*dx+fy*dy);
  let c = (fx*fx+fy*fy)-r*r;
  let discriminant = b*b-4*a*c;
  if (discriminant<0){
    return null;
  }
  discriminant = Math.sqrt(discriminant);
  let t0 = (-b - discriminant)/(2*a);
  if (0 <= t0 && t0 <= 1){
    return t0;
  }
  let t = (-b + discriminant)/(2*a);
  if (t > 1 || t < 0){
    return null;
  }
  return t;
}

function resample(polyline,step){
  if (polyline.length < 2){
    return polyline.slice();
  }
  polyline = polyline.slice();
  let out = [polyline[0].slice()];
  let next = null;
  let i = 0;
  while(i < polyline.length-1){
    let a = polyline[i];
    let b = polyline[i+1];
    let dx = b[0]-a[0];
    let dy = b[1]-a[1];
    let d = Math.sqrt(dx*dx+dy*dy);
    if (d == 0){
      i++;
      continue;
    }
    let n = ~~(d/step);
    let rest = (n*step)/d;
    let rpx = a[0] * (1-rest) + b[0] * rest;
    let rpy = a[1] * (1-rest) + b[1] * rest;
    for (let j = 1; j <= n; j++){
      let t = j/n;
      let x = a[0]*(1-t) + rpx*t;
      let y = a[1]*(1-t) + rpy*t;
      let xy = [x,y];
      for (let k = 2; k < a.length; k++){
        xy.push(a[k]*(1-t) + (a[k] * (1-rest) + b[k] * rest)*t);
      }
      out.push(xy);
    }

    next = null;
    for (let j = i+2; j < polyline.length; j++){
      let b = polyline[j-1];
      let c = polyline[j];
      if (b[0] == c[0] && b[1] == c[1]){
        continue;
      }
      let t = isect_circ_line(rpx,rpy,step,b[0],b[1],c[0],c[1]);
      if (t == null){
        continue;
      }
 
      let q = [
        b[0]*(1-t)+c[0]*t,
        b[1]*(1-t)+c[1]*t,
      ];
      for (let k = 2; k < b.length; k++){
        q.push(b[k]*(1-t)+c[k]*t);
      }
      out.push(q);
      polyline[j-1] = q;
      next = j-1;
      break;
    }
    if (next == null){
      break;
    }
    i = next;

  }

  if (out.length > 1){
    let lx = out[out.length-1][0];
    let ly = out[out.length-1][1];
    let mx = polyline[polyline.length-1][0];
    let my = polyline[polyline.length-1][1];
    let d = Math.sqrt((mx-lx)**2+(my-ly)**2);
    if (d < step*0.5){
      out.pop(); 
    }
  }
  out.push(polyline[polyline.length-1].slice());
  return out;
}



function make_scene(outlines){

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera( 75, 1, 0.0001, 10000 );
  // camera.position.z = 100;
  const renderer = new THREE.WebGLRenderer({});
  renderer.setSize( 512,512 );
  renderer.setClearColor( "floralwhite", 1);
  renderer.domElement.style.display="inline-block";

  document.body.appendChild( renderer.domElement );

  const material = new THREE.LineBasicMaterial( { color: 0x000000 } );

  for (let i = 0; i < outlines.length; i++){
    for (let j = 0; j < outlines[i].length; j++){
      {
        const points = [];
        for (let k = 0; k < outlines[i][j].length+1; k++){
          points.push( new THREE.Vector3( ...outlines[i][j][k%outlines[i][j].length], i*LH) );
        }

        const geometry = new THREE.BufferGeometry().setFromPoints( points );
        const line = new THREE.Line( geometry, material );
        scene.add( line );
      }

      {
        const shape = new THREE.Shape();

        for (let k = 0; k < outlines[i][j].length; k++){
          shape[k?'lineTo':'moveTo'](...outlines[i][j][k%outlines[i][j].length]);
        }
        const geometry = new THREE.ShapeGeometry( shape );
        const material = new THREE.MeshBasicMaterial( { color: 0x7efc50, side:THREE.DoubleSide, polygonOffset:true, polygonOffsetFactor :-1.0 ,polygonOffsetUnits: 3.0 } );
        const mesh = new THREE.Mesh( geometry, material ) ;
        mesh.position.z = i*LH;
        scene.add( mesh );
      }

    }
  }

  const controls = new THREE.OrbitControls( camera, renderer.domElement );
  camera.position.set(0,0,outlines.length*LH+200);

  controls.update();

  function loop(){
    requestAnimationFrame(loop);

    controls.update();
    renderer.render( scene, camera );
  }

  loop();
}





function make_scene2(polyline){

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera( 75, 1, 0.0001, 10000 );
  // camera.position.z = 100;
  const renderer = new THREE.WebGLRenderer({});
  renderer.setSize( 512,512 );
  renderer.setClearColor( "floralwhite", 1);
  renderer.domElement.style.display="inline-block";

  document.body.appendChild( renderer.domElement );

  const material = new THREE.LineBasicMaterial( { color: 0x000000 } );
  
  const points = [];
  for (let k = 0; k < polyline.length; k++){
    points.push( new THREE.Vector3( ...polyline[k] ));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints( points );
  const line = new THREE.Line( geometry, material );
  scene.add( line );

  const controls = new THREE.OrbitControls( camera, renderer.domElement );
  camera.position.set(0,0,polyline[polyline.length-1][2]+200);

  controls.update();

  function loop(){
    requestAnimationFrame(loop);

    controls.update();
    renderer.render( scene, camera );
  }

  loop();
}