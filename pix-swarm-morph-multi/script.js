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


function shape_sample_poisson(A,w,h,n){
  let k = 10;
  let pts = [];
  if (!A.includes(1)) return pts;
  for (let i = 0; i < n; i++){
    
    let maxd = 0;
    let p;
    
    for (let j = 0; j < k; j++){
      let x;
      let y;
      do {
        x = rand()*w;
        y = rand()*h;
      }while(!A[(~~y)*w+(~~x)]);
      
      let mind = Infinity;
      for (let t = 0; t < pts.length; t++){
        let d = Math.hypot(x-pts[t][0],y-pts[t][1]);
        if (d < mind){
          mind = d;
        }
      }
      if (mind > maxd){
        maxd = mind;
        p = [x,y]
      }
    }
    pts.push(p);
  }
  return pts;
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
  // console.log('>',pts.length==n)
  return pts;
}

function pix_count(A){
  return  A.reduce((a, b) => a + (b?1:0), 0);
}

// function shape_morph(A,B,w,h,n,k){
//   let nA = pix_count(A);
//   let nB = pix_count(B);
//   let kk = Math.max(nA,nB)*k;
  
//   let P = shape_sample_perpix(A,w,h,kk);
//   let Q = shape_sample_perpix(B,w,h,kk);
//   // console.log(P.length,Q.length)
//   let Ts = [];
//   for (let i = 0; i < n; i++){
//     let t = i/(n-1);
//     let T = new Array(w*h).fill(0);
//     for (let j = 0; j < Math.min(P.length,Q.length); j++){
//       let x = P[j][0]*(1-t) + Q[j][0]*t;
//       let y = P[j][1]*(1-t) + Q[j][1]*t;
//       T[(~~y)*w+(~~x)] = 1;
//     }
//     T = gauss_blur(T,w,h).map(x=>((x>0.5)?1:0));
//     Ts.push(T);
//   }
//   return Ts;
// }

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

function seg_isect(p0x, p0y, p1x, p1y, q0x, q0y, q1x, q1y, is_ray = false) {
  let d0x = p1x - p0x;
  let d0y = p1y - p0y;
  let d1x = q1x - q0x;
  let d1y = q1y - q0y;
  let vc = d0x * d1y - d0y * d1x;
  if (vc == 0) {
    return null;
  }
  let vcn = vc * vc;
  let q0x_p0x = q0x - p0x;
  let q0y_p0y = q0y - p0y;
  let vc_vcn = vc / vcn;
  let t = (q0x_p0x * d1y - q0y_p0y * d1x) * vc_vcn;
  let s = (q0x_p0x * d0y - q0y_p0y * d0x) * vc_vcn;
  if (0 <= t && (is_ray || t < 1) && 0 <= s && s < 1) {
    let ret = {t, s, side: null, other: null, xy: null};
    ret.xy = [p1x * t + p0x * (1 - t), p1y * t + p0y * (1 - t)];
    ret.side = pt_in_pl(p0x, p0y, p1x, p1y, q0x, q0y) < 0 ? 1 : -1;
    return ret;
  }
  return null;
}
function pt_in_pl(x, y, x0, y0, x1, y1) {
  let dx = x1 - x0;
  let dy = y1 - y0;
  let e = (x - x0) * dy - (y - y0) * dx;
  return e;
}

function pt_in_poly(p,poly){
  let n = 0;
  let q = [p[0]+Math.PI, p[1]+Math.E];
  for (let i = 0; i < poly.length; i++){
    let h = seg_isect(...p,...q,...poly[i],...poly[(i+1)%poly.length],true);
    // console.log(h);
    if (h){
      n++;
    }
  }
  // console.log(p,q,poly,n);
  return n % 2 == 1;
}

function centroid(poly){
  var cx = 0;
  var cy = 0;
  var n = poly.length;
  var a = 0;
  for (var i = 0; i < n; i++){
    var j = (i+1)%n;
    var c = (poly[i][0]*poly[j][1]-poly[j][0]*poly[i][1]);
    cx += (poly[i][0]+poly[j][0])*c;
    cy += (poly[i][1]+poly[j][1])*c;
    a += c;
  }
  cx /= 3*a;
  cy /= 3*a;
  return [cx,cy];
}

function blob_filter(A,w,h,p){
  let B = [];
  for (let i = 0; i < h; i++){
    for (let j = 0; j < w; j++){
      if (pt_in_poly([j,i],p)){
        B.push(A[i*w+j]);
      }else{
        B.push(0);
      }
    }
  }
  return B;
}
function merge_slices_or(Ts,Us){
  // console.log(Ts,Us);
  let Vs = [];
  for (let i = 0; i < Ts.length; i++){
    Vs.push([]);
    for (let j = 0; j < Ts[i].length; j++){
      Vs[Vs.length-1].push( Math.max(Ts[i][j],Us[i][j])  );
    }
  }
  return Vs;
}


function dilate5(im, w, h){
  let ret = new Array(w*h).fill(0);
  for (let i = w+w; i < w*h-w-w; i++){
    if (i%w<2){continue;}
    if (i%w>=w-2){continue;}
    if (im[i]){
                       ret[i-w-w-1] = 1; ret[i-w-w] = 1; ret[i-w-w+1] = 1;
      ret[i-w-2] = 1;  ret[i-w-1] = 1; ret[i-w] = 1; ret[i-w+1] = 1; ret[i-w+2] = 1;
      ret[i-2] = 1;    ret[i-1] = 1;   ret[i] = 1;   ret[i+1] = 1;   ret[i+2] = 1;
      ret[i+w-2] = 1;  ret[i+w-1] = 1; ret[i+w] = 1; ret[i+w+1] = 1; ret[i+w+2] = 1;
                      ret[i+w+w-1] = 1;   ret[i+w+w] = 1;   ret[i+w+w+1] = 1;
    }
  }
  return ret;
}

// function shape_morph_match_blobs(A,B,w,h,n,k){
//   function trace(A){
//     A = dilate5(dilate5(A.map(x=>(x>0.5?1:0)),w,h),w,h);
//     let contours = FindContours.findContours(A,w,h);
//     let c = [];
//     for (let i = 0; i < contours.length; i++){
//       if (! contours[i].parent){
//         c.push(FindContours.approxPolyDP(contours[i].points, 2));
//       }
//     }
//     return c;
//   }

//   let cA = trace(A);
//   let cB = trace(B);
//   if (cA.length != cB.length){
//     return shape_morph(A,B,w,h,n,k);
//   }

//   let pairs = [];
//   for (let i = 0; i < cA.length; i++ ){
//     let ca = centroid(cA[i]);
//     for (let j = 0; j < cB.length; j++){
//       let cb = centroid(cB[j]);
//       let d = Math.sqrt(Math.pow(ca[0] - cb[0],2) + Math.pow(ca[1] - cb[1],2));
//       pairs.push([d,i,j]);
//     }
//   }
//   pairs.sort((a,b)=>(a[0]-b[0]));
//   let mA = {};
//   let mB = {};
//   let mpairs = [];
//   for (let k = 0; k < pairs.length; k++){
//     let [d,i,j] = pairs[k];
//     if (mA[i] || mB[j]){
//       continue;
//     }
//     mA[i] = true;
//     mB[j] = true;
//     mpairs.push([cA[i],cB[j]]);
//   }
  
//   let TTs = null;
//   for (let i = 0; i < mpairs.length; i++){
//     let [a,b] = mpairs[i];
//     let fA = blob_filter(A,w,h,a);
//     let fB = blob_filter(B,w,h,b);
//     // console.log(pix_count(fA),pix_count(fB));
//     let Ts = shape_morph(fA,fB,w,h,n,k);
//     if (!TTs){
//       TTs = Ts;
//     }else{
//       TTs = merge_slices_or(TTs,Ts);
//     }
//   }
//   return TTs;
// }



function shape_sample_multi_match_blobs(As,w,h,k,sampler=shape_sample_perpix){
  
  function trace(A){
    A = dilate5(dilate5(A.map(x=>(x>0.5?1:0)),w,h),w,h);
    // console.log(A);
    let contours = FindContours.findContours(A,w,h);
    let c = [];
    for (let i = 0; i < contours.length; i++){
      if (! contours[i].parent){
        c.push(FindContours.approxPolyDP(contours[i].points, 2));
      }
    }
    return c;
  }

  function match_next(cA,sA,B){

    let cB = trace(B);
    if (cA.length != cB.length){
      return sampler(B,w,h,sA.length);
    }
    let pairs = [];
    for (let i = 0; i < cA.length; i++ ){
      let ca = centroid(cA[i]);
      for (let j = 0; j < cB.length; j++){
        let cb = centroid(cB[j]);
        let d = Math.sqrt(Math.pow(ca[0] - cb[0],2) + Math.pow(ca[1] - cb[1],2));
        pairs.push([d,i,j]);
      }
    }
    pairs.sort((a,b)=>(a[0]-b[0]));
    let mA = {};
    let mB = {};
    let mpairs = [];
    for (let k = 0; k < pairs.length; k++){
      let [d,i,j] = pairs[k];
      if (mA[i] || mB[j]){
        continue;
      }
      mA[i] = true;
      mB[j] = true;
      mpairs.push([cA[i],cB[j]]);
    }
    
    let S = sampler(B,w,h,sA.length);

    for (let i = 0; i < mpairs.length; i++){
      let [a,b] = mpairs[i];
      let fA = sA.map((x,i)=>[i,x]).filter(x=>pt_in_poly(x[1],a));
      let fB = blob_filter(B,w,h,b);
      let s = sampler(fB,w,h,fA.length);

      for (let j = 0; j < s.length; j++){
        let idx = fA[j][0];
        S[idx] = s[j];
      }
    }
    for (let i = 0; i < S.length; i++){
      if (!S[i]) console.log(i,S[i],'!!!');
    }
    return S;
  }


  let nA = 0;
  for (let i = 0; i < As.length; i++){
    nA = Math.max(pix_count(As[i]),nA);
  }
  let kk = Math.ceil(nA*k);
  let Ps = [];
  let cC;
  for (let i = 0; i < As.length; i++){
    let c = trace(As[i].slice());
    if (!i){
      Ps.push(sampler(As[i],w,h,kk));
    }else{
      Ps.push(match_next(cC,Ps[i-1],As[i]));
    }
    cC = c;
  }
  return Ps;
}


function shape_morph_multi_match_blobs(As,Zs,w,h,k){
  let Ps = shape_sample_multi_match_blobs(As,w,h,k,shape_sample_perpix);

  let Ts = [];
  for (let i = 0; i < Zs[Zs.length-1]; i++){
    let T = new Array(w*h).fill(0);
    Ts.push(T);
  }

  for (let i = 0; i < Ps[0].length; i++){
    // console.log('A',i,'/',kk)
    let ps = [];
    for (let j = 0; j < Ps.length; j++){
      // console.log(Ps[j][i],i,j,Ps[j]);
      ps.push( [...Ps[j][i],Zs[j]] );
    }
    let crs = catmull(ps,8,0.5);
   // let crs = straights(ps);
    // console.log(straights(ps),crs);

    for (let j = 0; j < crs.length; j++){
      for (let z = Zs[j]; z < Zs[j+1]; z++){
        let t = (z-Zs[j])/(Zs[j+1]-Zs[j]);
        for (let u = crs[j].length-2; u >= 0; u--){
          if (z >= crs[j][u][2]){
            let p0 = crs[j][u];
            let p1 = crs[j][u+1];
            let dz = z - p0[2];
            let zz = p1[2]-p0[2];
            let zt = dz/zz;
            let x = p0[0] * (1-zt) + p1[0] * zt;
            let y = p0[1] * (1-zt) + p1[1] * zt;
            Ts[z][(~~y)*w+(~~x)]=1;
            break;
          }
        }
      }
    }
    
  }
  function f(x){
    if (isNaN(x)){
      return 0;
    }
    let y = ((-Math.cos(Math.PI*x)+1)/2);
    // console.log(x,y);
    return y;
  }
  for (let i = 0; i < Ts.length; i++){
    // console.log('B',i,'/',Ts.length)
    // Ts[i] = gauss_blur(Ts[i],w,h).map(x=>((x>0.5)?1:0));
    Ts[i] = gauss_blur(Ts[i],w,h).map(x=>f(f(f(x))));
    // console.log(Ts[i])
  }
  return Ts;

}

function shape_vines_multi_match_blobs(As,Zs,w,h,k){
  let Ps = shape_sample_multi_match_blobs(As,w,h,k,shape_sample_poisson);
  let Ts = [];
  for (let i = 0; i < Zs[Zs.length-1]; i++){
    let T = new Array(w*h).fill(0);
    Ts.push(T);
  }


  function circ(z,i){

    if (i%w<2){return;}
    if (i%w>=w-2){return;}
    if (i<w*2){return;}
    if (i>=w*(h-2)){return;}
                       Ts[z][i-w-w-1] = 1; Ts[z][i-w-w] = 1; Ts[z][i-w-w+1] = 1;
    Ts[z][i-w-2] = 1;  Ts[z][i-w-1] = 1;   Ts[z][i-w] = 1;   Ts[z][i-w+1] = 1;   Ts[z][i-w+2] = 1;
    Ts[z][i-2] = 1;    Ts[z][i-1] = 1;     Ts[z][i] = 1;     Ts[z][i+1] = 1;     Ts[z][i+2] = 1;
    Ts[z][i+w-2] = 1;  Ts[z][i+w-1] = 1;   Ts[z][i+w] = 1;   Ts[z][i+w+1] = 1;   Ts[z][i+w+2] = 1;
                       Ts[z][i+w+w-1] = 1; Ts[z][i+w+w] = 1; Ts[z][i+w+w+1] = 1;
  
  }

  for (let i = 0; i < Ps[0].length; i++){
    // console.log('A',i,'/',kk)
    let ps = [];
    for (let j = 0; j < Ps.length; j++){
      // console.log(Ps[j][i],i,j,Ps[j]);
      ps.push( [...Ps[j][i],Zs[j]] );
    }
    let crs = catmull(ps,8,0.5);
   // let crs = straights(ps);
    // console.log(straights(ps),crs);

    for (let j = 0; j < crs.length; j++){
      for (let z = Zs[j]; z < Zs[j+1]; z++){
        let t = (z-Zs[j])/(Zs[j+1]-Zs[j]);
        for (let u = crs[j].length-2; u >= 0; u--){
          if (z >= crs[j][u][2]){
            let p0 = crs[j][u];
            let p1 = crs[j][u+1];
            let dz = z - p0[2];
            let zz = p1[2]-p0[2];
            let zt = dz/zz;
            let x = p0[0] * (1-zt) + p1[0] * zt;
            let y = p0[1] * (1-zt) + p1[1] * zt;
            // Ts[z][(~~y)*w+(~~x)]=1;
            circ(z,(~~y)*w+(~~x));
            break;
          }
        }
      }
    }
    
  }
  function f(x){
    if (isNaN(x)){
      return 0;
    }
    let y = ((-Math.cos(Math.PI*x)+1)/2);
    // console.log(x,y);
    return y;
  }
  for (let i = 0; i < Ts.length; i++){
    // console.log('B',i,'/',Ts.length)
    // Ts[i] = gauss_blur(Ts[i],w,h).map(x=>((x>0.5)?1:0));
    // Ts[i] = gauss_blur(Ts[i],w,h).map(x=>f(f(f(x))));
    // console.log(Ts[i])
  }
  return Ts;
}

// function shape_morph_multi(As,Zs,w,h,k){
  
//   let nA = 0;
//   for (let i = 0; i < As.length; i++){
//     nA = Math.max(pix_count(As[i]),nA);
//   }
//   let kk = nA*k;
//   let Ps = [];
//   for (let i = 0; i < As.length; i++){
//     Ps.push(shape_sample_perpix(As[i],w,h,kk));
//   }
//   let Ts = [];
//   for (let i = 0; i < Zs[Zs.length-1]; i++){
//     let T = new Array(w*h).fill(0);
//     Ts.push(T);
//   }

//   for (let i = 0; i < kk; i++){
//     // console.log('A',i,'/',kk)
//     let ps = [];
//     for (let j = 0; j < Ps.length; j++){
//       ps.push( [...Ps[j][i],Zs[j]] );
//     }
//     let crs = catmull(ps,8,0.5);
//    // let crs = straights(ps);
//     // console.log(straights(ps),crs);

//     for (let j = 0; j < crs.length; j++){
//       for (let z = Zs[j]; z < Zs[j+1]; z++){
//         let t = (z-Zs[j])/(Zs[j+1]-Zs[j]);
//         for (let u = crs[j].length-2; u >= 0; u--){
//           if (z >= crs[j][u][2]){
//             let p0 = crs[j][u];
//             let p1 = crs[j][u+1];
//             let dz = z - p0[2];
//             let zz = p1[2]-p0[2];
//             let zt = dz/zz;
//             let x = p0[0] * (1-zt) + p1[0] * zt;
//             let y = p0[1] * (1-zt) + p1[1] * zt;
//             Ts[z][(~~y)*w+(~~x)]=1;
//             break;
//           }
//         }
//       }
//     }
    
//   }

//   for (let i = 0; i < Ts.length; i++){
//     // console.log('B',i,'/',Ts.length)
//     Ts[i] = gauss_blur(Ts[i],w,h).map(x=>((x>0.5)?1:0));
//   }
//   return Ts;
// }


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