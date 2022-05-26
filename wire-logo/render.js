
class PolylineCurve3 extends THREE.Curve {

  constructor( vs ) {

    super();

    this.type = 'PolylineCurve3';
    this.isPolylineCurve3 = true;

    this.vs = vs;
    this.ls = [0];
    this.l = 0;
    for (let i = 1; i < vs.length; i++){
      this.l += vs[i].distanceTo(vs[i-1]);
      this.ls.push(this.l);
    }
    for (let i = 0; i < this.ls.length; i++){
      this.ls[i]/=this.l;
    }

  }
  getPoint( t, optionalTarget = new THREE.Vector3() ) {

    const point = optionalTarget;
    t = Math.min(Math.max(t,0),1);


    if ( t === 1 ) {

      point.copy( this.vs[this.vs.length-1] );

    } else {

      for (let i = this.ls.length-2; i >= 0; i--){
        if (t >= this.ls[i]){
          let a = this.vs[i];
          let b = this.vs[i+1];
          let frac = (t - this.ls[i]) / (this.ls[i+1]-this.ls[i]);
          point.copy( a.clone().multiplyScalar(1-frac).add(b.clone().multiplyScalar(frac)) );

          // console.log(t,i,a,b,frac,point);
          break;
        }
      }

    }
    

    return point;

  }

  getPointAt( t, optionalTarget = new THREE.Vector3() ) {

    const point = optionalTarget;
    t = Math.min(Math.max(t,0),1);


    if ( t === 1 ) {

      point.copy( this.vs[this.vs.length-1] );

    } else {

      for (let i = this.ls.length-2; i >= 0; i--){
        if (t >= this.ls[i]){
          let a = this.vs[i];
          let b = this.vs[i+1];
          let frac = (t - this.ls[i]) / (this.ls[i+1]-this.ls[i]);
          point.copy( a.clone().multiplyScalar(1-frac).add(b.clone().multiplyScalar(frac)) );

          // console.log(t,i,a,b,frac,point);
          break;
        }
      }

    }
    

    return point;

  }
}

function addball(parent,x,y,z){
  const geometry = new THREE.SphereGeometry( 2, 16, 16 );
  // const material = new THREE.MeshNormalMaterial({polygonOffset:true, polygonOffsetFactor :-0.5 ,polygonOffsetUnits: 4.0});
  const material = new THREE.MeshBasicMaterial({color:0});
  const sphere = new THREE.Mesh( geometry, material );
  sphere.position.set(x,y,z)
  parent.add( sphere );
}

// export function renderPolyline(state, polyline){
//   const path = new PolylineCurve3(polyline.map(x=>new THREE.Vector3(...x)));
//   const geometry = new THREE.TubeGeometry(path, polyline.length*3, 3, 8, false);
//   const material = new THREE.MeshNormalMaterial();

//   const mesh = new THREE.Object3D();

//   const tube = new THREE.Mesh(geometry, material);
//   mesh.add(tube);
//   addball(mesh, ...polyline[0]);
//   addball(mesh, ...polyline[polyline.length-1]);
  
//   if (state.mesh) state.scene.remove(state.mesh);
//   state.mesh = mesh;
//   state.scene.add(mesh);
// }


export function renderPolyline(state, turtle){
  let polyline = turtle.path;

  const material = new THREE.MeshBasicMaterial({color:0});

  const mesh = new THREE.Object3D();

  addball(mesh, ...polyline[0]);
  for (let i = 1; i < polyline.length; i++){
    let [x0,y0,z0] = polyline[i-1];
    let [x1,y1,z1] = polyline[i];

    let ref = new THREE.Object3D();
    ref.position.set(x0,y0,z0);
    ref.lookAt(x1,y1,z1);
    let len = Math.hypot(x1-x0,y1-y0,z1-z0);
    let geometry = new THREE.CylinderGeometry( 2, 2, len, 16);
    const tube = new THREE.Mesh(geometry, material);
    tube.rotation.x = Math.PI/2;
    tube.position.set(0,0,len/2);
    ref.add(tube);

    mesh.add(ref);
    addball(mesh, ...polyline[i]);
    
  }
  
  let geometry = new THREE.SphereGeometry(5, 10, 20);
  let arrm = new THREE.Mesh(geometry, material);
  let arrr = new THREE.Object3D();
  arrr.add(arrm);
  // arrm.rotation.z = Math.PI/2;
  mesh.add(arrr);
  // arrr.rotation.y = turtle.angle_ud;
  // arrr.rotation.z = turtle.angle_lr;
  arrr.position.set(...polyline[polyline.length-1])
  
  
  if (state.mesh) state.scene.remove(state.mesh);
  state.mesh = mesh;
  state.scene.add(mesh);
}