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