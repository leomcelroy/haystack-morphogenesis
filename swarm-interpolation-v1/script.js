let jsr = 0x5EED;
let {PI,sin,cos} = Math;
function rand(){
  jsr^=(jsr<<17);
  jsr^=(jsr>>13);
  jsr^=(jsr<<5);
  return (jsr>>>0)/4294967295;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function shape_sample_perpix(A,w,h,n){
  let pts = [];
  if (!A.includes(1)) return pts;
  
  let np = Math.ceil(n/pix_count(A));
  
  for (let i = 0; i < h; i++){
    for (let j = 0; j < w; j++){
      if (A[i*w+j]){
        for (let k = 0; k < np; k++){
          pts.push([j+rand(),i+rand()]);
        }
      }
    }
  }
  shuffle(pts);
  pts = pts.slice(0,n);
  return pts;
}

function pix_count(A){
  return  A.reduce((a, b) => a + b, 0);
}

function shape_morph(A,B,w,h,n,k){
  let nA = pix_count(A);
  let nB = pix_count(B);
  let kk = Math.max(nA,nB)*k;
  
  let P = shape_sample_perpix(A,w,h,kk);
  let Q = shape_sample_perpix(B,w,h,kk);
  // console.log(P.length,Q.length)
  let Ts = [];
  for (let i = 0; i < n; i++){
    let t = i/(n-1);
    let T = new Array(w*h).fill(0);
    for (let j = 0; j < Math.min(P.length,Q.length); j++){
      let x = P[j][0]*(1-t) + Q[j][0]*t;
      let y = P[j][1]*(1-t) + Q[j][1]*t;
      T[(~~y)*w+(~~x)] = 1;
    }
    T = gauss_blur(T,w,h).map(x=>((x>0.5)?1:0));
    Ts.push(T);
  }
  return Ts;
}

function v_add(x0,y0,z0,x1,y1,z1){
  return [x0+x1,y0+y1,z0+z1]
}
function v_scale(x0,y0,z0,s){
  return [x0*s,y0*s,z0*s];
}

function catmull(positions,num,alpha){
  const EPSILON = 0.001;
  function get_t(t, p0, p1, alpha){
    let a = Math.pow((p1[0]-p0[0]), 2.0) + Math.pow((p1[1]-p0[1]), 2.0) + Math.pow((p1[2]-p0[2]),2.0);
    let b = Math.pow(a, alpha * 0.5);
    return (b + t);
  }
  function spline(p0, p1, p2, p3, num, alpha){
    //https://en.wikipedia.org/wiki/Centripetal_Catmull-Rom_spline
    let pts = [];
    if (p0[0] == p1[0] && p0[1] == p1[1] && p0[2] == p1[2]) {
      p0[0] += EPSILON;
    }
    if (p1[0] == p2[0] && p1[1] == p2[1] && p1[2] == p2[2]) {
      p1[0] += EPSILON;
    }
    if (p2[0] == p3[0] && p2[1] == p3[1] && p2[2] == p3[2]) {
      p2[0] += EPSILON;
    }
    let t0 = 0.0;
    let t1 = get_t(t0, p0, p1,alpha);
    let t2 = get_t(t1, p1, p2,alpha);
    let t3 = get_t(t2, p2, p3,alpha);


    for (let t=t1; t<t2; t+=((t2-t1)/num)){
      let A1 = v_add(...v_scale(...p0,(t1-t)/(t1-t0)) , ...v_scale(...p1,(t-t0)/(t1-t0)) );
      let A2 = v_add(...v_scale(...p1,(t2-t)/(t2-t1)) , ...v_scale(...p2,(t-t1)/(t2-t1)) );
      let A3 = v_add(...v_scale(...p2,(t3-t)/(t3-t2)) , ...v_scale(...p3,(t-t2)/(t3-t2)) );
      let B1 = v_add(...v_scale(...A1,(t2-t)/(t2-t0)) , ...v_scale(...A2,(t-t0)/(t2-t0)) );
      let B2 = v_add(...v_scale(...A2,(t3-t)/(t3-t1)) , ...v_scale(...A3,(t-t1)/(t3-t1)) );
      let C  = v_add(...v_scale(...B1,(t2-t)/(t2-t1)) , ...v_scale(...B2,(t-t1)/(t2-t1)) );
      // console.log(p0,p1,p2,t0,t1,t2,A1,A2,A3,B1,B2,C)
      pts.push(C);
    }
    pts.push(p2.slice());
    return pts;
  }
  let curves = [];
  for (let i = 0; i < positions.length-1; i++){
    let p0 = positions[Math.max(i-1,0)];
    let p1 = positions[i];
    let p2 = positions[i+1];
    let p3 = positions[Math.min(i+2,positions.length-1)];
    let pts = spline(p0.slice(),p1.slice(),p2.slice(),p3.slice(),num,alpha);
    curves.push(pts);
  }
  return curves;

}

function straights(ps){
  let pp = [];
  for (let i = 0; i < ps.length-1; i++){
    pp.push([ps[i],ps[i+1]])
  }
  return pp;
}

// console.log(catmull([[0,0,0],[0,10,10],[10,-10,20]],10,0.5));


function shape_morph_multi(As,w,h,n,k){
  let nA = 0;
  for (let i = 0; i < As.length; i++){
    nA = Math.max(pix_count(As[i]),nA);
  }
  let kk = nA*k;
  let Ps = [];
  for (let i = 0; i < As.length; i++){
    Ps.push(shape_sample_perpix(As[i],w,h,kk));
  }
  let Ts = [];
  for (let i = 0; i < n*(As.length-1); i++){
    let T = new Array(w*h).fill(0);
    Ts.push(T);
  }

  for (let i = 0; i < kk; i++){
    // console.log('A',i,'/',kk)
    let ps = [];
    for (let j = 0; j < Ps.length; j++){
      ps.push( [...Ps[j][i],j] );
    }
    let crs = catmull(ps,8,0.5);
   // let crs = straights(ps);
    // console.log(straights(ps),crs);

    for (let j = 0; j < crs.length; j++){
      for (let t = 0; t < n; t++){
        let z = t / n + j;
        for (let u = crs[j].length-2; u >= 0; u--){
          if (z >= crs[j][u][2]){
            let p0 = crs[j][u];
            let p1 = crs[j][u+1];
            let dz = z - p0[2];
            let zz = p1[2]-p0[2];
            let zt = dz/zz;
            let x = p0[0] * (1-zt) + p1[0] * zt;
            let y = p0[1] * (1-zt) + p1[1] * zt;
            Ts[j*n+t][(~~y)*w+(~~x)]=1;
            
            break;
          }
        }
      }
    }
    
  }

  for (let i = 0; i < Ts.length; i++){
    // console.log('B',i,'/',Ts.length)
    Ts[i] = gauss_blur(Ts[i],w,h).map(x=>((x>0.5)?1:0));
  }
  return Ts;
}


function gauss_blur(A,w,h){
  let B = new Array(A.length).fill(0);
  let C = new Array(A.length).fill(0);
  for (let d = 0; d < 2; d++){
    
    for (let i = 0; i < A.length; i++){
      let dd = 1 + d*(w-1);
      let a = 0;
      a += A[i-dd*7]*0.05213175;
      a += A[i-dd*6]*0.05462943;
      a += A[i-dd*5]*0.05922148;
      a += A[i-dd*4]*0.06509423;
      a += A[i-dd*3]*0.07124907;
      a += A[i-dd*2]*0.07662014;
      a += A[i-dd*1]*0.08027167;
      a += A[i     ]*0.08156447;
      a += A[i+dd*1]*0.08027167;
      a += A[i+dd*2]*0.07662014;
      a += A[i+dd*3]*0.07124907;
      a += A[i+dd*4]*0.06509423;
      a += A[i+dd*5]*0.05922148;
      a += A[i+dd*6]*0.05462943;
      a += A[i+dd*7]*0.05213175;
      
      B[i] = a;
    }
    A = B;
    B = C;
  }
  return B;
}



// let Ts = shape_morph([
//   0,0,0,0,0,0,0,
//   0,1,1,1,1,1,0,
//   0,1,1,1,1,1,0,
//   0,1,1,1,1,1,0,
//   0,1,1,1,1,1,0,
//   0,1,1,1,1,1,0,
//   0,0,0,0,0,0,0,
// ],[
//   0,0,0,0,0,0,0,
//   0,0,0,1,0,0,0,
//   0,0,1,1,1,0,0,
//   0,1,1,1,1,1,0,
//   0,0,1,1,1,0,0,
//   0,0,0,1,0,0,0,
//   0,0,0,0,0,0,0,
// ],7,7,10,100);

// for (let i = 0; i < Ts.length; i++){
//   for (let j = 0; j < 7; j++){
//     console.log(Ts[i].slice(j*7,j*7+7).join(''));
//   }
//   console.log('')
// }