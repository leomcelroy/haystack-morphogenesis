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

function voxel2stl(V,w,h,d){
  function getvox(x,y,z){
    if (x < 0 || x >= w) return 0;
    if (y < 0 || y >= h) return 0;
    if (z < 0 || z >= d) return 0;

    return V[z*(w*h)+y*(w)+x];
  }

  // let stl = "solid\n";
  let faces = [];
  function addface(x,y,z,a,b,c,d){
    // console.log(x,y,z,a,b,c,d);
    // ;[a,b,c,d] = [d,c,b,a];
//     stl += `
// facet normal
//   outer loop
//     vertex ${x+a[0]} ${y+a[1]} ${z+a[2]}
//     vertex ${x+b[0]} ${y+b[1]} ${z+b[2]}
//     vertex ${x+c[0]} ${y+c[1]} ${z+c[2]}
//   endloop
// endfacet  
// facet normal
//   outer loop
//     vertex ${x+a[0]} ${y+a[1]} ${z+a[2]}
//     vertex ${x+c[0]} ${y+c[1]} ${z+c[2]}
//     vertex ${x+d[0]} ${y+d[1]} ${z+d[2]}
//   endloop
// endfacet  
// `;
    faces.push([
      [x+a[0],y+a[1],z+a[2]],
      [x+b[0],y+b[1],z+b[2]],
      [x+c[0],y+c[1],z+c[2]],
    ])
    faces.push([
      [x+a[0],y+a[1],z+a[2]],
      [x+c[0],y+c[1],z+c[2]],
      [x+d[0],y+d[1],z+d[2]],
    ])
  }
  for (let i = 0; i < d; i++){
    for (let j = 0; j < h; j++){
      for (let k = 0; k < w; k++){

        let a0 = getvox(k,j,i);
        let a1 = getvox(k-1,j,i);
        let a2 = getvox(k+1,j,i);
        let a3 = getvox(k,j-1,i);
        let a4 = getvox(k,j+1,i);
        let a5 = getvox(k,j,i-1);
        let a6 = getvox(k,j,i+1);
        if (!a0) continue;
        if (!a1) addface(k,j,i,[0,0,1],[0,1,1],[0,1,0],[0,0,0]);
        if (!a2) addface(k,j,i,[1,0,0],[1,1,0],[1,1,1],[1,0,1]);
        if (!a3) addface(k,j,i,[1,0,0],[1,0,1],[0,0,1],[0,0,0]);
        if (!a4) addface(k,j,i,[0,1,0],[0,1,1],[1,1,1],[1,1,0]);
        if (!a6) addface(k,j,i,[1,0,1],[1,1,1],[0,1,1],[0,0,1]);
        if (!a5) addface(k,j,i,[0,0,0],[0,1,0],[1,1,0],[1,0,0]);
        // if (!a0) continue;
        // addface(k,j,i,[0,0,1],[0,1,1],[0,1,0],[0,0,0]);
        // addface(k,j,i,[1,0,0],[1,1,0],[1,1,1],[1,0,1]);
        // addface(k,j,i,[1,0,0],[1,0,1],[0,0,1],[0,0,0]);
        // addface(k,j,i,[0,1,0],[0,1,1],[1,1,1],[1,1,0]);
        // addface(k,j,i,[1,0,1],[1,1,1],[0,1,1],[0,0,1]);
        // addface(k,j,i,[0,0,0],[0,1,0],[1,1,0],[1,0,0]);
      }
    }
  }
  // stl += "\nendsolid"
  // return stl;
  return to_stl_bin(faces);
}

// console.log(voxel2stl([1],1,1,1));
